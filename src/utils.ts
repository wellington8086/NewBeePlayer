type Vec4 = [number, number, number, number]

export const color255 = (color: Vec4): Vec4 => {
  const [r, g, b, a] = color
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a]
}

export const color1 = (color: Vec4): Vec4 => {
  const [r, g, b, a] = color
  return [r / 255, g / 255, b / 255, a]
}

export const tracks = [
  { title: 'R u s h e s', artist: 'Frank Ocean', path: '/audio/FRANK OCEAN - R U S H E S.m4a' },
  { title: 'Rushes', artist: 'Frank Ocean', path: '/audio/Frank Ocean - Rushes.mp3' }
]
