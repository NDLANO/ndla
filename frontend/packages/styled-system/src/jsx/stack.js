import { createElement, forwardRef } from 'react';
import { stack } from '../patterns/stack';
import { splitProps } from '../helpers';
import { styled } from './factory';
import { mergeCss } from '../css/css';

export const Stack = /* @__PURE__ */ forwardRef(function Stack(props, ref) {
  const [patternProps, restProps] = splitProps(props, stack.propKeys)
  const styleProps = stack.raw(patternProps)
  const mergedProps = { ref, ...restProps, css: mergeCss(styleProps, props.css) }
  return createElement(styled["div"], mergedProps)
})