import Proton from 'three.proton.js'
import * as THREE from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import { GUI } from 'dat-gui'
export class ProtonLoop {
  private R = 70
  private running = true
  private ctha = 0
  private tha = 0
  private proton: Proton
  private renderer: THREE.WebGLRenderer
  private camera: THREE.Camera
  private scene: THREE.Scene
  private emitters = []
  private canvas: HTMLCanvasElement
  private state = {}

  constructor(canvas: HTMLCanvasElement, aspect = canvas.width / canvas.height) {
    this.canvas = canvas
    this.camera = new THREE.PerspectiveCamera(70, aspect, 1, 1000)
    this.camera.position.z = 500
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0xffffff, 1, 10000)

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true
    })
    this.renderer.setSize(canvas.width, canvas.height)
    document.body.appendChild(this.renderer.domElement)

    this.#addControls(this.camera, canvas)

    this.#addLights(this.scene)

    this.#addStars(this.scene)

    this.proton = new Proton()

    this.R = 70

    this.emitters.push(
      this.#createEmitter(this.R, 0, '#4F1500', '#0029FF', this.camera, this.renderer),
      this.#createEmitter(-this.R, 0, '#004CFE', '#6600FF', this.camera, this.renderer),
    )

    this.emitters.forEach(emitter => {
      this.proton.addEmitter(emitter)
    })

    this.proton.addRender(new Proton.SpriteRender(this.scene))
  }

  animate() {
    if (this.running) {
      requestAnimationFrame(() => this.animate())
    }
    this.#animateEmitter()
    this.#render()
  }

  resize() {
    this.renderer.setSize(this.canvas.width, this.canvas.height)
  }

  setupGUI(gui: GUI) {
    this.emitters.forEach((emitter, i) => {
      const a = `emitter${i + 1}.a`
      const b = `emitter${i + 1}.b`
      const curColor = this.#getEmitterColor(emitter)
      if (!this.state[a]) {
        this.state[a] = curColor.a
      }
      if (!this.state[b]) {
        this.state[b] = curColor.b
      }
      gui.addColor(this.state, a).onChange(color => {
        this.#setEmitterColor(emitter, 'a', color)
      })
      gui.addColor(this.state, b).onChange(color => {
        this.#setEmitterColor(emitter, 'b', color)
      })
    })
  }

  #getEmitterColor(emitter): { a: string, b: string } {
    let res
    emitter.behaviours.forEach(behaviour => {
      if (behaviour.name === 'Color') {
        res = {
          a: behaviour.a._arr[0],
          b: behaviour.b._arr[0]
        }
      }
    })
    return res
  }

  #setEmitterColor(emitter, key, val) {
    emitter.behaviours.forEach(behaviour => {
      if (behaviour.name === 'Color') {
        behaviour[key]._arr = [val]
      }
    })
  }

  #render() {
    this.proton.update()
    this.renderer.render(this.scene, this.camera)

    this.camera.lookAt(this.scene.position)
    this.ctha += 0.02
    this.camera.position.x = Math.sin(this.ctha) * 500
    this.camera.position.y = Math.sin(this.ctha) * 500
    this.camera.position.z = Math.cos(this.ctha) * 500

    if (import.meta.env.DEV) {
      Proton.Debug.renderInfo(this.proton, 3)
    }
  }

  #animateEmitter() {
    this.tha += 0.13
    this.emitters.forEach((emitter, i) => {
      emitter.p.x = this.R * Math.cos(this.tha + (i * Math.PI / 2))
      emitter.p.y = this.R * Math.sin(this.tha + (i * Math.PI / 2)) - 300
    })
  }

  #addControls(camera: THREE.Camera, canvas: HTMLCanvasElement) {
    const controls = new TrackballControls(camera, canvas)
    controls.rotateSpeed = 1.0
    controls.zoomSpeed = 1.2
    controls.panSpeed = 0.8
    controls.noZoom = false
    controls.noPan = false
    controls.staticMoving = true
    controls.dynamicDampingFactor = 0.3
  }

  #addLights(scene: THREE.Scene) {
    const ambientLight = new THREE.AmbientLight(0x101010)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 2, 1000, 1)
    pointLight.position.set(0, 200, 200)
    scene.add(pointLight)
  }

  #addStars(scene: THREE.Scene) {
    const geometry = new THREE.BufferGeometry()
    const vertices = []
    for (let i = 0; i < 10000; i++) {
      const vertex = new THREE.Vector3()
      vertex.x = THREE.MathUtils.randFloatSpread(2000)
      vertex.y = THREE.MathUtils.randFloatSpread(2000)
      vertex.z = THREE.MathUtils.randFloatSpread(2000)
      vertices.push(vertex)
    }
    geometry.setFromPoints(vertices)

    const particles = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: 0x888888
    }))
    scene.add(particles)
  }

  #createSprite() {
    const map = new THREE.TextureLoader().load('/dot.png')
    const material = new THREE.SpriteMaterial({
      map: map,
      color: 0xff0000,
      blending: THREE.AdditiveBlending,
      fog: true
    })
    return new THREE.Sprite(material)
  }

  #createEmitter(x, y, color1, color2, camera, renderer) {
    const emitter = new Proton.Emitter()
    emitter.rate = new Proton.Rate(new Proton.Span(5, 7), new Proton.Span(0.01, 0.02))
    emitter.addInitialize(new Proton.Mass(1))
    emitter.addInitialize(new Proton.Life(2))
    emitter.addInitialize(new Proton.Body(this.#createSprite()))
    emitter.addInitialize(new Proton.Radius(40))
    emitter.addInitialize(new Proton.V(200, new Proton.Vector3D(0, 0, -1), 0))

    emitter.addBehaviour(new Proton.Alpha(1, 0))
    emitter.addBehaviour(new Proton.Color(color1, color2))
    emitter.addBehaviour(new Proton.Scale(1, 0.5))
    emitter.addBehaviour(new Proton.CrossZone(new Proton.ScreenZone(camera, renderer), 'dead'))

    emitter.addBehaviour(new Proton.Force(0, 0, -20))
    emitter.addBehaviour(new Proton.Attraction({
      x: 0,
      y: 0,
      z: 0
    }, 5, 250))

    emitter.p.x = x
    emitter.p.y = y
    emitter.emit()

    return emitter
  }
}
