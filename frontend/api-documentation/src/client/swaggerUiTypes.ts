/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ComponentType } from "react";

export interface SwaggerSystem {
  preauthorizeApiKey(schemeName: string, value: string): void;
  initOAuth(options: Record<string, unknown>): void;
}

export interface SecurityScheme {
  get(key: "description" | "name" | "in"): string;
}

export interface DefinitionsMap {
  get(key: string): SecurityScheme | undefined;
  delete(key: string): DefinitionsMap;
}

export interface AuthActions {
  logout(schemeNames: string[]): void;
  showDefinitions(show: boolean): void;
}

export interface AuthsProps {
  definitions?: DefinitionsMap;
  getComponent(name: string, container?: boolean): ComponentType<Record<string, unknown>>;
  authSelectors: { authorized(): { get(schemeName: string): unknown } };
  authActions: AuthActions;
}
