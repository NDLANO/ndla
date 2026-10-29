import { createElement, forwardRef } from 'react';
import { flex } from '../patterns/flex';
import { splitProps } from '../helpers';
import { styled } from './factory';
import { mergeCss } from '../css/css';

export const Flex = /* @__PURE__ */ forwardRef(function Flex(props, ref) {
  const [patternProps, restProps] = splitProps(props, flex.propKeys)
  const styleProps = flex.raw(patternProps)
  const mergedProps = { ref, ...restProps, css: mergeCss(styleProps, props.css) }
  return createElement(styled["div"], mergedProps)
})