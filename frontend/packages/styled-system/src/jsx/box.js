import { createElement, forwardRef } from 'react';
import { box } from '../patterns/box';
import { splitProps } from '../helpers';
import { styled } from './factory';
import { mergeCss } from '../css/css';

export const Box = /* @__PURE__ */ forwardRef(function Box(props, ref) {
  const [patternProps, restProps] = splitProps(props, box.propKeys)
  const styleProps = box.raw(patternProps)
  const mergedProps = { ref, ...restProps, css: mergeCss(styleProps, props.css) }
  return createElement(styled["div"], mergedProps)
})