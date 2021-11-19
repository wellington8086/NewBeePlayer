import { EventEmitter } from 'events'
import { audio as createAudio } from 'simple-media-element'
import assign from 'object-assign'

import resume from './resume-context'
import createAudioContext from './audio-context'
import canPlaySrc, { createError } from './can-play-src'
import addOnce from './event-add-once'

export default function createMediaSource(src, opt) {
  opt = assign({}, opt)
  const emitter = new EventEmitter()

  // Default to Audio instead of HTMLAudioElement
  // There is not much difference except in the following:
  //    x instanceof Audio
  //    x instanceof HTMLAudioElement
  // And in my experience Audio has better support on various
  // platforms like CocoonJS.
  // Please open an issue if there is a concern with this.
  if (!opt.element) opt.element = new window.Audio()

  const desiredVolume = opt.volume
  delete opt.volume // make sure <audio> tag receives full volume
  const audio = createAudio(src, opt)
  const audioContext = opt.context || createAudioContext()
  const node = audioContext.createGain()
  const mediaNode = audioContext.createMediaElementSource(audio)

  audio.addEventListener('ended', function() {
    emitter.emit('end')
  })

  const loopStart = opt.loopStart
  const loopEnd = opt.loopEnd
  const hasLoopStart = typeof loopStart === 'number' && isFinite(loopStart)
  const hasLoopEnd = typeof loopEnd === 'number' && isFinite(loopEnd)
  let isLoopReady = false
  if (hasLoopStart || hasLoopEnd) {
    window.requestAnimationFrame(function update() {
      // audio hasn't been loaded yet...
      if (typeof audio.duration !== 'number') return
      const currentTime = audio.currentTime

      // where to end the buffer
      const endTime = hasLoopEnd ? Math.min(audio.duration, loopEnd) : audio.duration

      if (currentTime > (loopStart || 0)) {
        isLoopReady = true
      }

      // jump ahead to loop start point
      if (hasLoopStart && isLoopReady && currentTime < loopStart) {
        audio.currentTime = loopStart
      }

      // if we've hit the end of the buffer
      if (currentTime >= endTime) {
        // if there is no loop end point, let native looping take over
        // if we have a loop end point, jump back to start point or zero
        if (hasLoopEnd) {
          audio.currentTime = hasLoopStart ? loopStart : 0
        }
      }
      window.requestAnimationFrame(update)
    })
  }

  emitter.element = audio
  emitter.context = audioContext
  emitter.node = node
  emitter.mediaNode = mediaNode
  emitter.pause = audio.pause.bind(audio)
  emitter.play = function() {
    if (opt.autoResume !== false) resume(emitter.context)
    return audio.play()
  }

  // This exists currently for parity with Buffer source
  // Open to suggestions for what this should dispose...
  emitter.dispose = function() {}

  emitter.stop = function() {
    const wasPlaying = emitter.playing
    audio.pause()
    audio.currentTime = 0
    isLoopReady = false
    if (wasPlaying) {
      emitter.emit('end')
    }
  }

  Object.defineProperties(emitter, {
    duration: {
      enumerable: true,
      configurable: true,
      get: function() {
        return audio.duration
      }
    },
    currentTime: {
      enumerable: true,
      configurable: true,
      get: function() {
        return audio.currentTime
      }
    },
    playing: {
      enumerable: true,
      configurable: true,
      get: function() {
        return !audio.paused
      }
    },
    volume: {
      enumerable: true,
      configurable: true,
      get: function() {
        return node.gain.value
      },
      set: function(n) {
        node.gain.value = n
      }
    }
  })

  // Set initial volume
  if (typeof desiredVolume === 'number') {
    emitter.volume = desiredVolume
  }

  // Check if all sources are unplayable,
  // if so we emit an error since the browser
  // might not.
  let sources = Array.isArray(src) ? src : [src]
  sources = sources.filter(Boolean)
  const playable = sources.some(canPlaySrc)
  if (playable) {
    // At least one source is probably/maybe playable
    startLoad()
  } else {
    // emit error on next tick so user can catch it
    process.nextTick(function() {
      emitter.emit('error', createError(sources))
    })
  }

  return emitter

  function startLoad() {
    // The file errors (like decoding / 404s) appear on <source>
    const srcElements = Array.prototype.slice.call(audio.children)
    let remainingSrcErrors = srcElements.length
    let hasErrored = false
    const sourceError = function(err, el) {
      if (hasErrored || err) return
      remainingSrcErrors--
      console.warn('Error loading source: ' + el.getAttribute('src'))
      if (remainingSrcErrors <= 0) {
        hasErrored = true
        srcElements.forEach(function(el) {
          el.removeEventListener('error', sourceError, false)
        })
        emitter.emit('error', new Error('Could not play any of the supplied sources'))
      }
    }

    const done = function() {
      emitter.emit('load')
    }

    if (audio.readyState >= audio.HAVE_ENOUGH_DATA) {
      process.nextTick(done)
    } else {
      addOnce(audio, 'canplay', done)
      addOnce(audio, 'error', function(ev) {
        emitter.emit(new Error('Unknown error while loading <audio>'))
      })
      srcElements.forEach(function(el) {
        addOnce(el, 'error', sourceError)
      })
    }

    // On most browsers the loading begins
    // immediately. However, on iOS 9.2 Safari,
    // you need to call load() for events
    // to be triggered.
    audio.load()
  }
}
