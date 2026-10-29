import { createElement, forwardRef } from 'react';
import { float } from '../patterns/float';
import { splitProps } from '../helpers';
import { styled } from './factory';
import { mergeCss } from '../css/css';

export const Float = /* @__PURE__ */ forwardRef(function Float(props, ref) {
  const [patternProps, restProps] = splitProps(props, float.propKeys)
  const styleProps = float.raw(patternProps)
  const mergedProps = { ref, ...restProps, css: mergeCss(styleProps, props.css) }
  return createElement(styled["div"], mergedProps)
})