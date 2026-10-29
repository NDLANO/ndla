import { createElement, forwardRef } from 'react';
import { divider } from '../patterns/divider';
import { splitProps } from '../helpers';
import { styled } from './factory';
import { mergeCss } from '../css/css';

export const Divider = /* @__PURE__ */ forwardRef(function Divider(props, ref) {
  const [patternProps, restProps] = splitProps(props, divider.propKeys)
  const styleProps = divider.raw(patternProps)
  const mergedProps = { ref, ...restProps, css: mergeCss(styleProps, props.css) }
  return createElement(styled["div"], mergedProps)
})