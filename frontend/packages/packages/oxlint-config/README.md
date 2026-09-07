# @ndla/oxlint-config

An opinionated OXLint config for NDLA projects.

## Installing

```bash
pnpm add -D @ndla/oxlint-config oxlint
```

If you want to use type-aware linting, you also need to install tsgolint

```bash
pnpm add -D oxlint-tsgolint
```

## Usage

### Configs

Prefer `oxlint.config.ts` wherever possible.

Example:

```typescript
import { defineConfig } from "oxlint";
import baseConfig from "@ndla/oxlint-config";

export default defineConfig({
  extends: [baseConfig],
  // if you want type aware linting
  options: {
    typeAware: true,
  },
});
```

### Named exports

`rules`, `options` and `overrides` are inherited through `extends`, but `ignorePatterns` is not — a
project that sets its own replaces the inherited list, so spread `sharedIgnorePatterns` into it.

| Export                       | Purpose                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `sharedIgnorePatterns`       | Build output no project should lint. Spread into your own `ignorePatterns`.        |
| `restrictedImports(...)`     | `no-restricted-imports` banning the given paths on top of the `@ndla/*` internals. |
| `lodashImportPath`           | Restricted path for `lodash`, for use with `restrictedImports`.                    |
| `arkUiImportPath`            | Restricted path for `@ark-ui/react`, for use with `restrictedImports`.             |
| `ndlaInternalImportPatterns` | The restricted `@ndla/*` deep-import patterns.                                     |
| `testFileOverride`           | Already part of `baseConfig`; lets test files import `devDependencies`.            |
| `playwrightOverride`         | Opt-in override for an `e2e/` Playwright suite.                                    |

### Setup

#### Neovim

Use the following configuration when setting up the language server

```lua
{
    settings = {
        fixKind = "all",
    },
}

```

#### VSCode

Add this to your `settings.json`:

```json
{
  "oxc.fixKind": "all"
}
```

#### Zed

Add this to your `settings.json`:

```json
{
  "lsp": {
    "oxlint": {
      "initialization_options": {
        "settings": {
          "fixKind": "all"
        }
      }
    }
  }
}
```
