export default function createAudioContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext
  return new AudioCtor()
}
