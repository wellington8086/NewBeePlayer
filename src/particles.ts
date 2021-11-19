import * as THREE from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import { GUI } from 'dat.gui'
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js'
import { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FollowEffect } from './effects'

export class Particles {
  private running = true
  private ctha = 0
  private renderer: THREE.WebGLRenderer
  private camera: THREE.Camera
  private scene: THREE.Scene
  private emitters = []
  private canvas: HTMLCanvasElement
  private state = {}
  private text = 'HELLO World'
  private font: Font
  private follow: FollowEffect

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

    this.#addControls(this.camera, canvas)

    this.#addLights(this.scene)

    this.#addStars(this.scene)

    this.#addText()

    this.#addFollow()
  }

  animate = () => {
    if (this.running) {
      requestAnimationFrame(this.animate)
    }
    this.#render()
    this.follow.render()
  }

  resize() {
    this.renderer.setSize(this.canvas.width, this.canvas.height)
  }

  setupGUI(gui: GUI) {
    const a = 'emitter1'
    const b = 'emitter2'
    const curColor = this.#getEmitterColor(this.follow.emitter)
    if (!this.state[a]) {
      this.state[a] = curColor.a
    }
    if (!this.state[b]) {
      this.state[b] = curColor.b
    }
    gui.addColor(this.state, a).onChange(color => {
      this.#setEmitterColor(this.follow.emitter, 'a', color)
    })
    gui.addColor(this.state, b).onChange(color => {
      this.#setEmitterColor(this.follow.emitter, 'b', color)
    })
  }

  move(x: number, y: number) {
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
    this.ctha += 0.02
    this.camera.position.x = Math.sin(this.ctha) * 500
    this.camera.position.y = Math.sin(this.ctha) * 500
    this.camera.position.z = Math.cos(this.ctha) * 500
    this.camera.lookAt(this.scene.position)

    this.renderer.render(this.scene, this.camera)
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

    const sprite = new THREE.TextureLoader().load('/disc.png')

    const particles = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: 0x888888,
      map: sprite,
      alphaTest: 0.5,
      transparent: true
    }))
    scene.add(particles)
  }

  #addText() {
    const loader = new TTFLoader()
    loader.load('/fonts/OpenSans-Regular.ttf', (json) => {
      this.font = new Font(json)
      this.#createText()
    })
  }

  #createText() {
    const height = 20
    const size = 10
    const hover = 30
    const curveSegments = 4
    const bevelThickness = 0.1
    const bevelSize = 1.5
    const textGeo = new TextGeometry(this.text, {
      font: this.font,
      size: size,
      height: height,
      curveSegments: curveSegments,

      bevelThickness: bevelThickness,
      bevelSize: bevelSize,
      bevelEnabled: true
    })

    textGeo.computeBoundingBox()
    textGeo.computeVertexNormals()

    const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x)

    const material = new THREE.MeshPhongMaterial({ color: 0xffffff })
    const textMesh1 = new THREE.Mesh(textGeo, material)

    textMesh1.position.x = centerOffset
    textMesh1.position.y = hover
    textMesh1.position.z = 0

    textMesh1.rotation.x = 0
    textMesh1.rotation.y = Math.PI * 2

    this.scene.add(textMesh1)
  }

  #addFollow() {
    this.follow = new FollowEffect({
      camera: this.camera,
      texture: '/dot.png',
      renderer: this.renderer,
      scene: this.scene
    })
  }
}
