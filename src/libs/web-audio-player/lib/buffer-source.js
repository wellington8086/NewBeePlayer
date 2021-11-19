import canPlaySrc from './can-play-src'
import createAudioContext from './audio-context'
import xhrAudio from './xhr-audio'
import { EventEmitter } from 'events'
import rightNow from 'right-now'
import resume from './resume-context'

export default function createBufferSource(src, opt) {
  opt = opt || {}
  const emitter = new EventEmitter()
  const audioContext = opt.context || createAudioContext()

  // a pass-through node so user just needs to
  // connect() once
  let bufferNode, buffer, duration
  const node = audioContext.createGain()
  let audioStartTime = null
  let audioPauseTime = null
  let audioCurrentTime = 0
  let playing = false
  const loop = opt.loop

  emitter.play = function() {
    if (playing) return
    playing = true

    if (opt.autoResume !== false) resume(emitter.context)
    disposeBuffer()
    bufferNode = audioContext.createBufferSource()
    bufferNode.connect(emitter.node)
    bufferNode.onended = ended
    if (buffer) {
      // Might be null undefined if we are still loading
      bufferNode.buffer = buffer
    }
    if (loop) {
      bufferNode.loop = true
      if (typeof opt.loopStart === 'number') bufferNode.loopStart = opt.loopStart
      if (typeof opt.loopEnd === 'number') bufferNode.loopEnd = opt.loopEnd
    }

    if (duration && audioCurrentTime > duration) {
      // for when it loops...
      audioCurrentTime = audioCurrentTime % duration
    }
    const nextTime = audioCurrentTime

    bufferNode.start(0, nextTime)
    audioStartTime = rightNow()
  }

  emitter.pause = function() {
    if (!playing) return
    playing = false
    // Don't let the "end" event
    // get triggered on manual pause.
    bufferNode.onended = null
    bufferNode.stop(0)
    audioPauseTime = rightNow()
    audioCurrentTime += (audioPauseTime - audioStartTime) / 1000
  }

  emitter.stop = function() {
    emitter.pause()
    ended()
  }

  emitter.dispose = function() {
    disposeBuffer()
    buffer = null
  }

  emitter.node = node
  emitter.context = audioContext

  emitter.bufferNode = bufferNode

  Object.defineProperties(emitter, {
    duration: {
      enumerable: true,
      configurable: true,
      get: function() {
        return duration
      }
    },
    playing: {
      enumerable: true,
      configurable: true,
      get: function() {
        return playing
      }
    },
    buffer: {
      enumerable: true,
      configurable: true,
      get: function() {
        return buffer
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

  // set initial volume
  if (typeof opt.volume === 'number') {
    emitter.volume = opt.volume
  }

  // filter down to a list of playable sources
  let sources = Array.isArray(src) ? src : [src]
  sources = sources.filter(Boolean)
  const playable = sources.some(canPlaySrc)
  if (playable) {
    let source = sources.filter(canPlaySrc)[0]
    // Support the same source types as in
    // MediaElement mode...
    if (typeof source.getAttribute === 'function') {
      source = source.getAttribute('src')
    } else if (typeof source.src === 'string') {
      source = source.src
    }
    // We have at least one playable source.
    // For now just play the first,
    // ideally this module could attempt each one.
    startLoad(source)
  } else {
    // no sources can be played...
    process.nextTick(function() {
      emitter.emit('error', canPlaySrc.createError(sources))
    })
  }
  return emitter

  function startLoad(src) {
    xhrAudio(audioContext, src, function audioDecoded(err, decoded) {
      if (err) return emitter.emit('error', err)
      buffer = decoded // store for later use
      if (bufferNode) {
        // if play() was called early
        bufferNode.buffer = buffer
      }
      duration = buffer.duration
      node.buffer = buffer
      emitter.emit('load', bufferNode)
    }, function audioProgress(amount, total) {
      emitter.emit('progress', amount, total)
    }, function audioDecoding() {
      emitter.emit('decoding')
    })
  }

  function ended() {
    emitter.emit('end')
    playing = false
    audioCurrentTime = 0
  }

  function disposeBuffer() {
    if (bufferNode) bufferNode.disconnect()
  }
}
