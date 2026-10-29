/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CodegenPrepareArtifact, CodegenPrepareFile, CodegenPrepareHookArgs, PandaPlugin } from "@pandacss/types";

const supportedJsxFrameworks = ["react"];

export const forwardCssPropPlugin = (): PandaPlugin => {
  return {
    name: "forward-css-prop",
    hooks: {
      "config:resolved": (args) => {
        const jsxFramework = args.config.jsxFramework;
        if (!supportedJsxFrameworks.includes(jsxFramework as string)) {
          throw new Error(
            `[plugin:forward-css-prop]: Unsupported jsxFramework: ${jsxFramework}. This Panda plugin only supports: ${supportedJsxFrameworks.join(", ")}`,
          );
        }
      },
      "codegen:prepare": (args) => {
        return transformStyledFn(args);
      },
    },
  };
};

const findFile = (artifacts: CodegenPrepareArtifact[], id: string, path: RegExp): CodegenPrepareFile => {
  const file = artifacts.find((artifact) => artifact.id === id)?.files.find((f) => path.test(f.path));
  if (!file) {
    throw new Error(
      `[plugin:forward-css-prop]: Could not find a file matching ${path} in the "${id}" codegen artifact. Panda has changed its codegen output, and forwardCssPropPlugin needs to be updated.`,
    );
  }
  return file;
};

const replaceOnce = (file: CodegenPrepareFile, search: string, replacement: string) => {
  const index = file.code.indexOf(search);
  if (index === -1 || file.code.indexOf(search, index + 1) !== -1) {
    throw new Error(
      `[plugin:forward-css-prop]: Expected exactly one occurrence of the following code in ${file.path}, but found ${index === -1 ? "none" : "several"}. Panda has changed its codegen output, and forwardCssPropPlugin needs to be updated.\n\n${search}`,
    );
  }
  file.code = file.code.slice(0, index) + replacement + file.code.slice(index + search.length);
};

export const transformStyledFn = (args: CodegenPrepareHookArgs) => {
  const factoryJs = findFile(args.artifacts, "jsx-factory", /^jsx\/factory\.m?js$/);
  const jsxTypes = findFile(args.artifacts, "types", /^types\/jsx\.d\.m?ts$/);
  const systemTypes = findFile(args.artifacts, "types", /^types\/system\.d\.m?ts$/);
  const jsxIndex = findFile(args.artifacts, "jsx-index", /^jsx\/index\.d\.m?ts$/);

  replaceOnce(factoryJs, "import { cx, cva } from", "import { css, cx, cva } from");

  const styledFnCode = "function styledFn(";

  replaceOnce(
    factoryJs,
    styledFnCode,
    `const unforwardedKeys = new Set(["className", "as", "unstyled", "children", "htmlWidth", "htmlHeight", "htmlTranslate", "htmlContent"])

${styledFnCode}`,
  );

  const baseCode = "const DefaultElement = BaseComponent.__base__ || BaseComponent";

  replaceOnce(
    factoryJs,
    baseCode,
    `${baseCode}
  const baseComponent = options.baseComponent || BaseComponent.__baseComponent__
  const contextConsume = options.baseComponent || BaseComponent.__base__ || typeof BaseComponent === "string"`,
  );

  replaceOnce(
    factoryJs,
    "forwardRef(function StyledComponent(props, ref) {",
    `forwardRef(function StyledComponent({ consumeCss, ...props }, ref) {
    const consume = props.asChild ? consumeCss && baseComponent : consumeCss || contextConsume`,
  );

  // Panda v2 ignores props that are explicitly undefined. Keep the v1 behavior, where they override default props
  // and are passed on to the underlying component.
  replaceOnce(
    factoryJs,
    "combinedProps = mergeDefaultProps(defaultProps, restProps)",
    "combinedProps = Object.assign({}, defaultProps, restProps)",
  );

  const hasStylesCode = "const hasStyles = propStyles || cssStyles !== void 0";

  replaceOnce(
    factoryJs,
    hasStylesCode,
    `const clearedProps = {}
    for (const key in combinedProps) {
      if (combinedProps[key] === void 0 && !unforwardedKeys.has(key) && shouldForward(key)) clearedProps[key] = void 0
    }
    ${hasStylesCode}`,
  );

  const unstyledCode = "if (unstyled) {";

  replaceOnce(
    factoryJs,
    unstyledCode,
    `let forwardedCssProps
    if (!consume && (unstyled || !recipeOrConfig.__recipe__)) {
      forwardedCssProps = { css: unstyled ? css.raw(propStyles, cssStyles) : css.raw(getRaw(variantProps), propStyles, cssStyles) }
      if (combinedProps.className !== void 0) forwardedCssProps.className = combinedProps.className
      if (consumeCss !== void 0) forwardedCssProps.consumeCss = consumeCss
    } else ${unstyledCode}`,
  );

  replaceOnce(
    factoryJs,
    `...forwardedProps,
      ...elementProps,
      ...htmlProps,
      className,`,
    `...clearedProps,
      ...forwardedProps,
      ...elementProps,
      ...htmlProps,
      ...(forwardedCssProps ?? { className }),`,
  );

  const styledComponentForwardPropDeclaration = "StyledComponent.__shouldForwardProps__ = shouldForwardProp";

  replaceOnce(
    factoryJs,
    styledComponentForwardPropDeclaration,
    `${styledComponentForwardPropDeclaration}
  StyledComponent.__baseComponent__ = baseComponent`,
  );

  const shouldForwardPropCode = "shouldForwardProp?: (prop: string, variantKeys: string[]) => boolean";

  replaceOnce(
    jsxTypes,
    shouldForwardPropCode,
    `${shouldForwardPropCode}
  /**
   * Used when creating styled components from React components that do not support the css prop. If true, the css prop will be consumed and converted to \`className\`
   * @example
   * import { ark } from "@ark-ui/react/factory"
   * import { styled } from "@ndla/styled-system/jsx"
   * const Button = styled(ark.button, {}, { baseComponent: true })
   */
  baseComponent?: boolean`,
  );

  const htmlStyledPropsCode = "export type HTMLStyledProps<T extends ElementType>";

  replaceOnce(
    jsxTypes,
    htmlStyledPropsCode,
    `export interface StyledProps extends UnstyledProps, AsProps, JsxStyleProps {}

${htmlStyledPropsCode}`,
  );

  replaceOnce(jsxIndex, "export { HTMLStyledProps, ", "export { HTMLStyledProps, StyledProps, ");

  const jsxStylePropsCode = "export type JsxStyleProps =";

  replaceOnce(
    systemTypes,
    jsxStylePropsCode,
    `${jsxStylePropsCode} {
  /**
   * Tells a component to consume the \`css\` prop and turn it into a \`className\` prop. This is only used in conjunction with the \`baseComponent\` option in the \`styled\` function to ensure that components that are \`asChild\`-ed onto non-panda components can consume their css before being merged with their child.
   * @example
   * import { ark } from "@ark-ui/react/factory"
   * import { styled } from "@ndla/styled-system/jsx"
   * const Button = styled(ark.button, {}, { baseComponent: true })
   *
   * return (
   *   <Button asChild consumeCss>
   *     <div>Click me</div>
   *   </Button>
   * )
   */
  consumeCss?: boolean
} &`,
  );

  return args.artifacts;
};
