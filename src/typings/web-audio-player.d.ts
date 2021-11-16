declare module 'web-audio-player' {
  export type Source = string | { src: string, type: string }

  export type Options = {
    volume: number
    buffer: boolean = false
    loop: boolean = false
    loopStart: number = 0
    loopEnd: number
    crossOrigin: string
    context: AudioContext
    element: HTMLAudioElement
    autoResume: boolean = true
  }

  export type Event = 'load' | 'ended' | 'error' | 'progress' | 'decoding'

  export type Player = {
    on: (event: Event, callback: (...args: any[]) => void) => void;
    play: () => void
    pause: () => void
    stop: () => void
    readonly node: AudioNode
    readonly context: AudioContext
    readonly element: HTMLAudioElement
    readonly buffer: AudioBuffer
    readonly playing: boolean
    readonly volume: number
  }

  function createPlayer(src: Source, opt?: Options): Player;

  export default createPlayer
}
