import { createElement, forwardRef } from 'react';
import { circle } from '../patterns/circle';
import { splitProps } from '../helpers';
import { styled } from './factory';
import { mergeCss } from '../css/css';

export const Circle = /* @__PURE__ */ forwardRef(function Circle(props, ref) {
  const [patternProps, restProps] = splitProps(props, circle.propKeys)
  const styleProps = circle.raw(patternProps)
  const mergedProps = { ref, ...restProps, css: mergeCss(styleProps, props.css) }
  return createElement(styled["div"], mergedProps)
})