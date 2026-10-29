import { createElement, forwardRef } from 'react';
import { linkOverlay } from '../patterns/link-overlay';
import { splitProps } from '../helpers';
import { styled } from './factory';
import { mergeCss } from '../css/css';

export const LinkOverlay = /* @__PURE__ */ forwardRef(function LinkOverlay(props, ref) {
  const [patternProps, restProps] = splitProps(props, linkOverlay.propKeys)
  const styleProps = linkOverlay.raw(patternProps)
  const mergedProps = { ref, ...restProps, css: mergeCss(styleProps, props.css) }
  return createElement(styled["a"], mergedProps)
})