import { createElement, forwardRef } from 'react';
import { wrap } from '../patterns/wrap';
import { splitProps } from '../helpers';
import { styled } from './factory';
import { mergeCss } from '../css/css';

export const Wrap = /* @__PURE__ */ forwardRef(function Wrap(props, ref) {
  const [patternProps, restProps] = splitProps(props, wrap.propKeys)
  const styleProps = wrap.raw(patternProps)
  const mergedProps = { ref, ...restProps, css: mergeCss(styleProps, props.css) }
  return createElement(styled["div"], mergedProps)
})