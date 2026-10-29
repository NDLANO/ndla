import { createElement, forwardRef } from 'react';
import { grid } from '../patterns/grid';
import { splitProps } from '../helpers';
import { styled } from './factory';
import { mergeCss } from '../css/css';

export const Grid = /* @__PURE__ */ forwardRef(function Grid(props, ref) {
  const [patternProps, restProps] = splitProps(props, grid.propKeys)
  const styleProps = grid.raw(patternProps)
  const mergedProps = { ref, ...restProps, css: mergeCss(styleProps, props.css) }
  return createElement(styled["div"], mergedProps)
})