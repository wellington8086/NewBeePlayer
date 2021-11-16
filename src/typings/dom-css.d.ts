/**
 * Basic typings for
 * https://github.com/mattdesl/dom-css
 * use csstype for more CSSProperties typings
 */
declare module 'dom-css' {
  import type { Properties } from 'csstype'
  export default function css(el: HTMLElement, properties: Properties)
}
