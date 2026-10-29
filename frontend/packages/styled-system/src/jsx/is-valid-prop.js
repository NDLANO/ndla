import { splitProps } from '../helpers';

const cssPropertySet = new Set(["css"])
const cssPropertySelectorRe = /&|@/

export function isCssProperty(value) {
  return cssPropertySet.has(value) || value.startsWith("--") || cssPropertySelectorRe.test(value)
}

export function splitCssProps(props) {
  return splitProps(props, isCssProperty)
}