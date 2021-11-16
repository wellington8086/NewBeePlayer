declare module 'web-audio-analyser' {
  export type Analyser = {
    analyser: AnalyserNode,
    waveform: (output?: Uint8Array, channel?: number) => Uint8Array
    frequencies: (output?: Uint8Array, channel?: number) => Uint8Array
  }

  export type Options = {
    stereo: boolean
    audible: boolean
  }

  function createAnalyser(node: AudioNode, context: AudioContext, opt?: Options): Analyser

  export default createAnalyser
}
