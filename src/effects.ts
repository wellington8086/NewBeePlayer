import { Camera } from '3d-view-controls'
import { Player } from './libs/web-audio-player'
import * as THREE from 'three'
import Proton from 'three.proton.js'

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

export class FollowEffect {
  proton: Proton
  emitter: any

  constructor(conf: { texture: string; camera: THREE.Camera; renderer: THREE.WebGLRenderer, scene: THREE.Scene }) {
    this.init(conf)
  }

  init({ texture, camera, renderer, scene }) {
    const proton = new Proton()
    const emitter = new Proton.FollowEmitter()
    emitter.ease = 1
    emitter.rate = new Proton.Rate(
      new Proton.Span(4, 5),
      new Proton.Span(0.01, 0.02)
    )
    emitter.addInitialize(new Proton.Mass(1))
    emitter.addInitialize(new Proton.Life(0.7))
    emitter.addInitialize(new Proton.Body(this.createSprite(texture)))
    emitter.addInitialize(new Proton.Radius(20))
    emitter.addInitialize(new Proton.V(200, new Proton.Vector3D(0, 0, -1), 15))

    emitter.addBehaviour(new Proton.Alpha(0.8, 0))
    emitter.addBehaviour(new Proton.Color('#61e3bc', '#0029FF'))
    emitter.addBehaviour(new Proton.Scale(1, 0.5))
    emitter.addBehaviour(
      new Proton.CrossZone(new Proton.ScreenZone(camera, renderer), 'dead')
    )

    emitter.setCameraAndRenderer(camera, renderer)

    emitter.emit()

    proton.addEmitter(emitter)
    proton.addRender(new Proton.SpriteRender(scene))

    this.emitter = emitter

    this.proton = proton
  }

  createSprite(texture) {
    const map = new THREE.TextureLoader().load(texture)
    const material = new THREE.SpriteMaterial({
      map: map,
      color: 0xff0000,
      blending: THREE.AdditiveBlending,
      fog: true
    })
    return new THREE.Sprite(material)
  }

  render() {
    const { proton } = this
    proton.update()
  }
}
