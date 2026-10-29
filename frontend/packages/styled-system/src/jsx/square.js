import { createElement, forwardRef } from 'react';
import { square } from '../patterns/square';
import { splitProps } from '../helpers';
import { styled } from './factory';
import { mergeCss } from '../css/css';

export const Square = /* @__PURE__ */ forwardRef(function Square(props, ref) {
  const [patternProps, restProps] = splitProps(props, square.propKeys)
  const styleProps = square.raw(patternProps)
  const mergedProps = { ref, ...restProps, css: mergeCss(styleProps, props.css) }
  return createElement(styled["div"], mergedProps)
})