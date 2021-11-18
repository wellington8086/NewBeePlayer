import createRegl from 'regl'
import glsl from 'glslify'
import perspective from 'gl-mat4/perspective'
import css from 'dom-css'
import fit from 'canvas-fit'
import { GUI } from 'dat-gui'
import shuffle from 'lodash.shuffle'
import Alea from 'alea'
import { createSpring } from 'spring-animator'
import Delaunator from 'delaunator'
import createPlayer from 'web-audio-player'
import createAnalyser, { Analyser } from 'web-audio-analyser'
import createCamera from './camera'
import createTitleCard from './title-card'
import createAudioControls from './audio-controls'
import createRenderBloom from './render-bloom'
import createRenderBlur from './render-blur'
import createRenderGrid from './render-grid'
import { Particles } from './particles'
import { color255, color1, tracks } from './utils'
import mouseChange from 'mouse-change'

const titleCard = createTitleCard()
const canvas = document.querySelector<HTMLCanvasElement>('canvas.viz')
const particlesCanvas = document.querySelector<HTMLCanvasElement>('canvas.particles')

const resize = fit(canvas)
const resizeProton = fit(particlesCanvas)

const particles = new Particles(particlesCanvas)

window.addEventListener('resize', (ev) => {
  resize(ev)
  resizeProton(ev)
  particles.resize()
  if (hasSetUp) setup()
  titleCard.resize(ev)
}, false)

const camera = createCamera(canvas, [2.5, 2.5, 1], [0, 0, 0])
const regl = createRegl(canvas)

let analyser: Analyser, delaunay, points, positions, positionsBuffer, renderFrequencies,
  renderGrid, blurredFbo: createRegl.Framebuffer2D, renderToBlurredFBO

const getFrameBuffer = (width, height) => (
  regl.framebuffer({
    color: regl.texture({
      shape: [width, height, 4]
    }),
    depth: false,
    stencil: false
  })
)

const fbo = getFrameBuffer(512, 512)
const freqMapFBO = getFrameBuffer(512, 512)

const renderToFBO = regl({ framebuffer: fbo })
const renderToFreqMapFBO = regl({ framebuffer: freqMapFBO })

const renderBloom = createRenderBloom(regl, canvas)
const renderBlur = createRenderBlur(regl)

const audio = createPlayer(tracks[0].path)
audio.on('load', function () {
  (window as any).audio = audio
  analyser = createAnalyser(audio.node, audio.context, { audible: true, stereo: false })
  const audioControls = createAudioControls(audio.element, tracks)

  function loop() {
    window.requestAnimationFrame(loop)
    audioControls.tick()
  }

  analyser.analyser.fftSize = 1024 * 2
  analyser.analyser.minDecibels = -75
  analyser.analyser.maxDecibels = -30
  analyser.analyser.smoothingTimeConstant = 0.5

  setup()

  // stupid hack: the first render causes a flash of black on the page,
  // this just forces it to happen at the start of the app, instead of when
  // the music starts, which is jarring
  const renderLoop = startLoop()
  setTimeout(renderLoop.cancel.bind(renderLoop), 1000)

  titleCard.show()
    .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
    .then(() => {
      css(audioControls.el, {
        transition: 'opacity 1s linear',
        opacity: 1
      })
      css(gui.domElement.parentElement, {
        transition: 'opacity 1s linear',
        opacity: 1
      })
      window.requestAnimationFrame(loop)
      audio.play()
      camera.start()
      startLoop()

      particles.animate()
      mouseChange(canvas, (buttons, x, y) => {
        if (buttons === 0) {
          particles.move(x, y)
        }
      })
    })
})

const settings = {
  seed: 0,

  points: 2500,
  dampening: 1,
  stiffness: 0.71,
  freqPow: 1.7,
  connectedNeighbors: 5,
  neighborWeight: 0.99,
  connectedBinsStride: 1,
  blurAngle: 0.25,
  blurMag: 7,

  blurRadius: 18,
  blurWeight: 1.85,
  originalWeight: 2,

  gridLines: 300,
  linesDampening: 0.02,
  linesStiffness: 0.9,
  linesAnimationOffset: 57,
  gridMaxHeight: 0.8,

  motionBlur: true,
  motionBlurAmount: 0.45,

  background: color255([0, 0, 0, 1])
}

const gui = new GUI()
if (import.meta.env.PROD) {
  gui.closed = true
}
css(gui.domElement.parentElement, {
  zIndex: 11,
  opacity: 0
})
const fabricGUI = gui.addFolder('fabric')
fabricGUI.add(settings, 'dampening', 0.01, 1).step(0.01).onChange(setup)
fabricGUI.add(settings, 'stiffness', 0.01, 1).step(0.01).onChange(setup)
fabricGUI.add(settings, 'connectedNeighbors', 0, 7).step(1).onChange(setup)
fabricGUI.add(settings, 'neighborWeight', 0.8, 1).step(0.01)
const bloomGUI = gui.addFolder('bloom')
bloomGUI.add(settings, 'blurRadius', 0, 20).step(1)
bloomGUI.add(settings, 'blurWeight', 0, 2).step(0.01)
bloomGUI.add(settings, 'originalWeight', 0, 2).step(0.01)
const gridGUI = gui.addFolder('grid')
gridGUI.add(settings, 'gridLines', 10, 300).step(1).onChange(setup)
gridGUI.add(settings, 'linesAnimationOffset', 0, 100).step(1)
gridGUI.add(settings, 'gridMaxHeight', 0.01, 0.8).step(0.01)
gui.add(settings, 'motionBlur')
gui.add(settings, 'motionBlurAmount', 0.01, 1).step(0.01)

const styleGUI = gui.addFolder('style')
styleGUI.addColor(settings, 'background')

particles.setupGUI(styleGUI)

let hasSetUp = false
function setup() {
  hasSetUp = true
  const rand = Alea(settings.seed)
  points = []

  blurredFbo = getFrameBuffer(canvas.width, canvas.height)
  renderToBlurredFBO = regl({ framebuffer: blurredFbo })

  renderGrid = createRenderGrid(regl, settings)

  // fill up the points list with the freqency-tracking nodes
  const frequenciesCount = analyser.frequencies().length // 1024
  for (let q = 0; q < frequenciesCount; q += settings.connectedBinsStride) {
    const mag = Math.pow(rand(), 1 - q / frequenciesCount) * 0.9
    const rads = rand() * Math.PI * 2
    const position = [
      Math.cos(rads) * mag,
      Math.sin(rads) * mag
    ]
    const id = points.length
    const point = createPoint(id, position);
    (point as any).frequencyBin = q
    points.push(point)
  }

  Array(Math.max(0, settings.points - points.length)).fill(0).forEach(() => {
    const id = points.length
    points.push(createPoint(id, [rand() * 2 - 1, rand() * 2 - 1]))
  })

  function createPoint(id, position) {
    return {
      position: position,
      id: id,
      neighbors: new Set(), // gonna fill this up with the results of delaunay
      spring: createSpring(settings.dampening * settings.stiffness, settings.stiffness, 0)
    }
  }

  delaunay = new Delaunator(points.map((pt) => pt.position))
  for (let j = 0; j < delaunay.triangles.length; j += 3) {
    const pt1 = delaunay.triangles[j]
    const pt2 = delaunay.triangles[j + 1]
    const pt3 = delaunay.triangles[j + 2]

    points[pt1].neighbors.add(pt2)
    points[pt1].neighbors.add(pt3)
    points[pt2].neighbors.add(pt1)
    points[pt2].neighbors.add(pt3)
    points[pt3].neighbors.add(pt1)
    points[pt3].neighbors.add(pt2)
  }

  points.forEach(pt => {
    pt.neighbors = shuffle(Array.from(pt.neighbors)).slice(0, settings.connectedNeighbors)
  })

  positions = new Float32Array(delaunay.triangles.length * 3)
  positionsBuffer = regl.buffer(positions)

  renderFrequencies = regl({
    vert: glsl`
      attribute vec3 position;

      varying vec4 fragColor;

      void main() {
        float actualIntensity = position.z * 1.2;
        fragColor = vec4(vec3(actualIntensity), 1);
        gl_Position = vec4(position.xy, 0, 1);
      }
    `,
    frag: glsl`
      precision highp float;
      varying vec4 fragColor;
      void main() {
        gl_FragColor = fragColor;
      }
    `,
    attributes: {
      position: positionsBuffer
    },
    count: delaunay.triangles.length,
    primitive: 'triangles'
  })
}

function update() {
  const frequencies = analyser.frequencies()
  points.forEach(pt => {
    let value = 0
    if (pt.frequencyBin || pt.frequencyBin === 0) {
      value = Math.pow(frequencies[pt.frequencyBin] / 255, settings.freqPow) // max bin value
    }
    const neighbors = pt.neighbors
    const neighborSum = neighbors.reduce((total, ptID) => {
      return total + points[ptID].spring.tick(1, false)
    }, 0)
    const neighborAverage = neighbors.length ? neighborSum / neighbors.length : 0
    value = Math.max(value, neighborAverage * settings.neighborWeight)

    pt.spring.updateValue(value)
    pt.spring.tick()
  })

  for (let j = 0; j < delaunay.triangles.length; j++) {
    const ptIndex = delaunay.triangles[j]
    const point = points[ptIndex]
    positions[j * 3] = point.position[0]
    positions[j * 3 + 1] = point.position[1]
    positions[j * 3 + 2] = point.spring.tick(1, false)
  }

  positionsBuffer(positions)
}

const renderGlobals = regl({
  uniforms: {
    projection: ({ viewportWidth, viewportHeight }) => perspective(
      [],
      Math.PI / 4,
      viewportWidth / viewportHeight,
      0.01,
      1000
    ),
    view: () => camera.getMatrix(),
    time: ({ time }) => time
  }
})

const renderColoredQuad = regl({
  vert: glsl`
    precision highp float;
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0, 1);
    }
  `,
  frag: glsl`
    precision highp float;
    uniform vec4 color;
    void main () {
      gl_FragColor = color;
    }
  `,
  blend: {
    enable: true,
    func: {
      srcRGB: 'src alpha',
      srcAlpha: 1,
      dstRGB: 'one minus src alpha',
      dstAlpha: 1
    },
    equation: {
      rgb: 'add',
      alpha: 'add'
    }
  },
  uniforms: {
    color: regl.prop('color')
  },
  attributes: {
    position: [
      -1, -1,
      -1, 4,
      4, -1
    ]
  },
  count: 3,
  primitive: 'triangles'
})

function startLoop() {
  return regl.frame(() => {
    camera.tick()
    update()
    renderToFBO(() => {
      renderFrequencies()
    })
    renderToFreqMapFBO(() => {
      const rads = settings.blurAngle * Math.PI
      const direction = [
        Math.cos(rads) * settings.blurMag,
        Math.sin(rads) * settings.blurMag
      ]
      renderBlur({
        iChannel0: fbo,
        direction: direction
      })
    })
    renderToBlurredFBO(() => {
      const rgba = color1(settings.background)
      if (settings.motionBlur) {
        renderColoredQuad({ color: [...rgba.slice(0, 3), settings.motionBlurAmount] })
      } else {
        regl.clear({
          color: rgba,
          depth: 1
        })
      }
      renderGlobals(() => {
        renderGrid({
          frequencyVals: freqMapFBO,
          gridMaxHeight: settings.gridMaxHeight,
          multiplier: 1
        })
      })
    })

    renderBloom({
      iChannel0: blurredFbo,
      blurMag: settings.blurRadius,
      blurWeight: settings.blurWeight,
      originalWeight: settings.originalWeight
    })
  })
}
