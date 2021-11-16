/// <reference types="vite/client" />

import type REGL from 'regl'

type PropType<Props, Key> = Key extends `${infer K1}.${infer K2}`
  ? PropType<PropType<Props, K1>, K2>
  : Props[Key];

declare module 'regl' {
  export interface Regl {
    prop<Context extends REGL.DefaultContext, Props, K extends string>(
      key: K,
    ): REGL.MaybeDynamic<PropType<Props, K>, Context, Props>;
  }
}
