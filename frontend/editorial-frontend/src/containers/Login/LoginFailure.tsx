/**
 * Copyright (c) 2017-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Heading, PageContainer, Text } from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { routes } from "../../util/routeHelpers";
import { useSession } from "../Session/SessionProvider";

const StyledPageContainer = styled(PageContainer, {
  base: {
    gap: "xsmall",
  },
});

export const LoginFailure = () => {
  const { t } = useTranslation();
  const { userNotRegistered } = useSession();
  return (
    <StyledPageContainer asChild consumeCss>
      <main>
        <Heading textStyle="heading.medium">{t("loginFailure.errorMessage")}</Heading>
        {!!userNotRegistered && <Text>{t("loginFailure.userNotRegistered")}</Text>}
        <Text>
          <SafeLink to={routes.login} asAnchor>
            {t("loginFailure.loginLink")}
          </SafeLink>
        </Text>
      </main>
    </StyledPageContainer>
  );
};

export const Component = LoginFailure;
