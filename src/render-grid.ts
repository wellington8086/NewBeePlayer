import { createSpring } from 'spring-animator'
import type { Regl } from 'regl'

let linesOffsetsLoopToken
let lines = []

export default function createRenderGrid(regl: Regl, settings) {
  lines = []

  for (let j = 1; j < settings.gridLines; j++) {
    lines.push({
      axis: 'x',
      offset: createSpring(settings.linesDampening, settings.linesStiffness, j / settings.gridLines * 2 - 1)
    })
    lines.push({
      axis: 'y',
      offset: createSpring(settings.linesDampening, settings.linesStiffness, j / settings.gridLines * 2 - 1)
    })
  }

  function getLinesPositions(linesPositions, lines) {
    const granularity = 50 // settings.gridLines
    linesPositions = linesPositions || new Float32Array(lines.length * granularity * 2)
    let k = 0
    for (const line of lines) {
      const nextOffset = line.offset.tick(1, false)
      for (let q = 0; q < granularity; q++) {
        const t = q / granularity * 2 - 1
        const nextT = (q + 1) / granularity * 2 - 1
        linesPositions[k++] = line.axis === 'x' ? nextOffset : t
        linesPositions[k++] = line.axis === 'y' ? nextOffset : t

        linesPositions[k++] = line.axis === 'x' ? nextOffset : nextT
        linesPositions[k++] = line.axis === 'y' ? nextOffset : nextT
      }
    }
    return linesPositions
  }

  const linesPositions = getLinesPositions([], lines)
  const linesBuffer = regl.buffer(linesPositions)

  const render = regl({
    vert: `
      precision lowp float;

      attribute vec2 position;

      varying vec4 fragColor;

      uniform sampler2D frequencyVals;
      uniform vec2 resolution;
      uniform mat4 projection;
      uniform mat4 view;
      uniform float gridMaxHeight;
      uniform float multiplier;
      uniform vec4 colorOffset;
      uniform float basicOpacity;
      uniform int segments;

      #define PI 3.14
      #define TWO_PI 6.28

      float polygon(vec2 coord, int num) {
        coord = coord;
        
        float a = atan(coord.x, coord.y) + PI;
        float r = TWO_PI/float(num);
          
        float d = cos(floor(0.5+a/r)*r-a) * length(coord);
      
        return 1.0 - smoothstep(0.5, 1.0, d);
      }

      void main() {
        vec2 lookup = (position + 1.0) / 2.0;
        float frequencyVal = texture2D(frequencyVals, lookup).x;
        vec3 rgb = clamp(sin((vec3(frequencyVal) + vec3(colorOffset)) * 1.9), 0.0, 0.95);
        float opacity = clamp(pow(frequencyVal * 1.5, 2.0), 0.0, 0.95) * multiplier + basicOpacity;
        if (polygon(position, segments) > 0.0) {
          fragColor = vec4(rgb, opacity);
        } else {
          fragColor = vec4(0.0);
        }
        gl_Position = (projection * view * vec4(position.xy, frequencyVal * gridMaxHeight * multiplier, 1));
      }
    `,
    frag: `
      precision lowp float;
      varying vec4 fragColor;
      void main() {
        gl_FragColor = fragColor;
      }
    `,
    uniforms: {
      frequencyVals: regl.prop('frequencyVals'),
      gridMaxHeight: regl.prop('gridMaxHeight'),
      multiplier: regl.prop('multiplier'),
      colorOffset: regl.prop('colorOffset'),
      basicOpacity: regl.prop('basicOpacity'),
      segments: regl.prop('segments')
    },
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
    attributes: {
      position: linesBuffer
    },
    count: linesPositions.length / 2,
    primitive: 'lines'
  })

  clearTimeout(linesOffsetsLoopToken)
  linesOffsetsLoopToken = setTimeout(setLinesOffsetsLoop, 15000)

  let calls = 0
  function setLinesOffsets() {
    let xVal = 1
    let yVal = 1
    calls += 1
    calls = calls % 2
    // lines.sort((a, b) => {
    //   return a.offset.tick(1, false) > b.offset.tick(1, false) ? 1 : -1
    // })
    const randomGranularity = ((Math.random() * 10 | 0) + 1) / 5
    lines.forEach((line, i) => {
      let nextVal
      if (calls === 0) {
        nextVal = ((line.axis === 'x' ? xVal++ : yVal++) / settings.gridLines * 2 - 1) * randomGranularity
      } else if (calls === 1) {
        nextVal = Math.random() * 2 - 1
      } else {
        nextVal = (line.axis === 'x' ? xVal++ : yVal++) / settings.gridLines * 2 - 1
      }

      setTimeout(() => {
        line.offset.updateValue(nextVal)
      }, i * settings.linesAnimationOffset)
    })
  }

  function setLinesOffsetsLoop() {
    setTimeout(() => {
      clearTimeout(linesOffsetsLoopToken)
      setLinesOffsets()
      linesOffsetsLoopToken = setLinesOffsetsLoop()
    }, 9500)
  }

  return function({
    frequencyVals, gridMaxHeight,
    multiplier, colorOffset, basicOpacity,
    segments
  }) {
    getLinesPositions(linesPositions, lines)
    linesBuffer(linesPositions)
    for (const line of lines) {
      line.offset.tick()
    }
    render({ frequencyVals, gridMaxHeight, multiplier, colorOffset, basicOpacity, segments })
  }
}
