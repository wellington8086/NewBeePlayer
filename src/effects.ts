import { Camera } from '3d-view-controls'
import { Player } from './libs/web-audio-player'

// eslint-disable-next-line no-undef
const DEFAULT_PANNER_OPTIONS: PannerOptions = {
  coneInnerAngle: 60,
  coneOuterAngle: 90,
  coneOuterGain: 0.5,
  distanceModel: 'linear',
  maxDistance: 36,
  refDistance: 1,
  rolloffFactor: 10,
  orientationX: 0,
  orientationY: 0,
  orientationZ: -1
}

export class Spatial {
  #camera: Camera
  #panner: PannerNode

  constructor(player: Player, camera: Camera) {
    const ctx = player.context

    this.#camera = camera

    ctx.listener.positionZ.value = camera.distance
    ctx.listener.forwardZ.value = camera.eye[2] * 5

    const panner = new PannerNode(ctx, {
      panningModel: 'HRTF',
      positionZ: camera.distance,
      ...DEFAULT_PANNER_OPTIONS
    })

    const gainNode = ctx.createGain()
    const pannerOptions = { pan: 0 }
    const stereoPanner = new StereoPannerNode(ctx, pannerOptions)

    gainNode.gain.value = 2

    player.mediaNode
      .connect(gainNode)
      .connect(stereoPanner)
      .connect(panner)
      .connect(ctx.destination)

    this.#panner = panner
  }

  tick() {
    this.#panner.positionZ.value = this.#camera.distance
    this.#panner.orientationZ.value = this.#camera.eye[2] * 5
    this.#panner.positionX.value = this.#camera.center[0] * 5
    this.#panner.positionY.value = this.#camera.center[1] * 5
    this.#panner.orientationX.value = this.#camera.eye[0] * 5
    this.#panner.orientationY.value = this.#camera.eye[1] * 5
  }
}
