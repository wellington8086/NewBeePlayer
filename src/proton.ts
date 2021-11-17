import Proton from 'three.proton.js'
import * as THREE from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

export function startProtonLoop(canvas: HTMLCanvasElement, aspect = canvas.width / canvas.height) {
  const camera = new THREE.PerspectiveCamera(70, aspect, 1, 1000)
  camera.position.z = 500
  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xffffff, 1, 10000)

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true
  })
  renderer.setSize(canvas.width, canvas.height)
  document.body.appendChild(renderer.domElement)

  addControls(camera, canvas)

  addLights(scene)

  addStars(scene)

  const proton = new Proton()

  const R = 70

  const emitter1 = createEmitter(R, 0, '#4F1500', '#0029FF', camera, renderer)
  const emitter2 = createEmitter(-R, 0, '#004CFE', '#6600FF', camera, renderer)

  proton.addEmitter(emitter1)
  proton.addEmitter(emitter2)
  proton.addRender(new Proton.SpriteRender(scene))

  function animate() {
    requestAnimationFrame(animate)
    animateEmitter()
    render()
  }

  let ctha = 0
  function render() {
    proton.update()
    renderer.render(scene, camera)
    // controls.update();

    camera.lookAt(scene.position)
    ctha += 0.02
    camera.position.x = Math.sin(ctha) * 500
    camera.position.z = Math.cos(ctha) * 500
    camera.position.y = Math.sin(ctha) * 500

    if (import.meta.env.DEV) {
      Proton.Debug.renderInfo(proton, 3)
    }
  }

  let tha = 0

  function animateEmitter() {
    tha += 0.13
    emitter1.p.x = R * Math.cos(tha)
    emitter1.p.y = R * Math.sin(tha)

    emitter2.p.x = R * Math.cos(tha + Math.PI / 2)
    emitter2.p.y = R * Math.sin(tha + Math.PI / 2)
  }

  animate()
}

function addControls(camera: THREE.Camera, canvas: HTMLCanvasElement) {
  const controls = new TrackballControls(camera, canvas)
  controls.rotateSpeed = 1.0
  controls.zoomSpeed = 1.2
  controls.panSpeed = 0.8
  controls.noZoom = false
  controls.noPan = false
  controls.staticMoving = true
  controls.dynamicDampingFactor = 0.3
}

function addLights(scene: THREE.Scene) {
  const ambientLight = new THREE.AmbientLight(0x101010)
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0xffffff, 2, 1000, 1)
  pointLight.position.set(0, 200, 200)
  scene.add(pointLight)
}

function addStars(scene: THREE.Scene) {
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

function createSprite() {
  const map = new THREE.TextureLoader().load('/dot.png')
  const material = new THREE.SpriteMaterial({
    map: map,
    color: 0xff0000,
    blending: THREE.AdditiveBlending,
    fog: true
  })
  return new THREE.Sprite(material)
}

function createEmitter(x, y, color1, color2, camera, renderer) {
  const emitter = new Proton.Emitter()
  emitter.rate = new Proton.Rate(new Proton.Span(5, 7), new Proton.Span(0.01, 0.02))
  emitter.addInitialize(new Proton.Mass(1))
  emitter.addInitialize(new Proton.Life(2))
  emitter.addInitialize(new Proton.Body(createSprite()))
  emitter.addInitialize(new Proton.Radius(80))
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
