/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.web.context.WebServerApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class TaxonomyApplication {
    public static void main(String[] args) throws Exception {
        if (Arrays.asList(args).contains("--generate-openapi")) {
            generateOpenApi();
            return;
        }
        SpringApplication.run(TaxonomyApplication.class, args);
    }

    private static final String[] OPENAPI_PROPERTIES = {
        "--spring.profiles.active=typescript",
        "--server.port=0",
        "--management.server.port=0",
        "--ndla.environment=",
        "--auth0.issuer=https://ndla.eu.auth0.com/",
    };

    private static void generateOpenApi() throws Exception {
        SpringApplication app = new SpringApplication(TaxonomyApplication.class);
        try (ConfigurableApplicationContext ctx = app.run(OPENAPI_PROPERTIES)) {
            int port = ((WebServerApplicationContext) ctx).getWebServer().getPort();
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:" + port + "/api-docs"))
                    .GET()
                    .build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                throw new RuntimeException("Failed to fetch OpenAPI spec: HTTP " + resp.statusCode());
            }
            Files.writeString(Path.of("taxonomy-api.json"), resp.body());
        }
    }
}
