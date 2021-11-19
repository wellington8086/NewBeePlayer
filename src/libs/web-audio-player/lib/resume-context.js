export default function(audioContext) {
  if (audioContext.state === 'suspended' &&
      typeof audioContext.resume === 'function') {
    audioContext.resume()
  }
}
