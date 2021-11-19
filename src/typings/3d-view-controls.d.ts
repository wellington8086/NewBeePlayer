/**
 * Basic typings for
 * https://github.com/mikolalysenko/3d-view-controls
 */
declare module '3d-view-controls' {
  export interface Options {
    eye: ArrayLike<number> = [0, 0, 10]
    center: ArrayLike<number> = [0, 0, 0]
    up: ArrayLike<number> = [0, 1, 0]
    mode: string = 'orbit'
    delay: number = 16
    rotateSpeed: number = 1
    zoomSpeed: number = 1
    translateSpeed: number = 1
    flipX: boolean = false
    flipY: boolean = false
    zoomMin: number = 0.01
    zoomMax: number = Infinity
  }

  export interface Camera {
    tick: () => void
    lookAt: (center: Options['center'], eye: Options['eye'], up: Options['up']) => void
    rotate: (yaw: number, pitch: number, roll: number) => void
    pan: (dx: number, dy: number, dz: number) => void
    translate: (dx: number, dy: number, dz: number) => void
    matrix: number[]
    mode: Options['mode']
    eye: Options['eye']
    up: Options['up']
    center: Options['center']
    distance: number,
    _camera: Camera
  }

  export default function createOrbitControls(
    canvas: HTMLCanvasElement,
    options?: Partial<Options>,
  ): Camera
}
