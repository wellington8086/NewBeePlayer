declare module 'mouse-change' {
  type Callback = (
    /**
     * 0: not pressing
     * 1: mouse left pressing
     * 2: mouse right pressing
     */
    buttons: number,
    x: number,
    y: number,
    { shift: boolean, alt: boolean, control: boolean, meta: boolean }
  ) => void

  function mouseChange(canvas: HTMLCanvasElement, cb: Callback): void

  export default mouseChange
}
