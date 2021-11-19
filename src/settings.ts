import { GUI } from 'dat.gui'
import css from 'dom-css'
import { color255 } from './utils'

export const settings = {
  seed: 0,

  points: 2500,
  // fabric
  dampening: 1,
  stiffness: 0.6,
  freqPow: 1.7,
  connectedNeighbors: 5,
  neighborWeight: 0.99,
  connectedBinsStride: 1,
  blurAngle: 0.25,
  blurMag: 7,

  // bloom
  blurRadius: 18,
  blurWeight: 1.85,
  originalWeight: 2,

  // gird
  gridLines: 180,
  linesDampening: 0.02,
  linesStiffness: 0.9,
  linesAnimationOffset: 57,
  gridMaxHeight: 0.8,
  gridColorOffset: [45, 136, 233, 1],
  gridBasicOpacity: 0.02,
  segments: 12,

  // particles
  motionBlur: true,
  motionBlurAmount: 0.45,

  // style
  background: color255([0.18, 0.18, 0.18, 1])
}

export const initGUI = (setup: () => void) => {
  const gui = new GUI()

  css(gui.domElement.parentElement, {
    zIndex: 11,
    opacity: 0
  })

  const fabricGUI = gui.addFolder('fabric')
  fabricGUI.add(settings, 'dampening', 0.01, 1).step(0.01).onChange(setup)
  fabricGUI.add(settings, 'stiffness', 0.01, 1).step(0.01).onChange(setup)
  fabricGUI.add(settings, 'freqPow', 0.01, 10).step(0.01).onChange(setup)
  fabricGUI.add(settings, 'connectedNeighbors', 0, 7).step(1).onChange(setup)
  fabricGUI.add(settings, 'neighborWeight', 0.8, 1).step(0.01)
  fabricGUI.add(settings, 'connectedBinsStride', 1, 10).step(1).onChange(setup)
  fabricGUI.add(settings, 'blurAngle', 0.01, 10).step(0.01)
  fabricGUI.add(settings, 'blurMag', 0.01, 100).step(0.01)

  const bloomGUI = gui.addFolder('bloom')
  bloomGUI.add(settings, 'blurRadius', 0, 20).step(1)
  bloomGUI.add(settings, 'blurWeight', 0, 2).step(0.01)
  bloomGUI.add(settings, 'originalWeight', 0, 2).step(0.01)
  const gridGUI = gui.addFolder('grid')
  gridGUI.add(settings, 'gridLines', 10, 300).step(1).onChange(setup)
  gridGUI.add(settings, 'linesAnimationOffset', 0, 100).step(1)
  gridGUI.add(settings, 'gridMaxHeight', 0.01, 0.8).step(0.01)
  gridGUI.addColor(settings, 'gridColorOffset')
  gridGUI.add(settings, 'gridBasicOpacity', -1.0, 1.0).step(0.01)
  gridGUI.add(settings, 'segments', 1, 100).step(1)

  const blurGUI = gui.addFolder('blur')
  blurGUI.add(settings, 'motionBlur')
  blurGUI.add(settings, 'motionBlurAmount', 0.01, 1).step(0.01)

  const styleGUI = gui.addFolder('style')
  styleGUI.addColor(settings, 'background')
}
