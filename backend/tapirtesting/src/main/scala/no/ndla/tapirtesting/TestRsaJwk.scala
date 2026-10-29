/*
 * Part of NDLA tapirtesting
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.tapirtesting

import com.nimbusds.jose.jwk.RSAKey
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator

object TestRsaJwk {
  val NdlaAuthKey: RSAKey  = new RSAKeyGenerator(2048).keyID("ndla-auth-test-key").nn.generate().nn
  val FeideAuthKey: RSAKey = new RSAKeyGenerator(2048).keyID("feide-auth-test-key").nn.generate().nn
}
