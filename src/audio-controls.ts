import css from 'dom-css'

export default function createAudioControls(audio, tracks) {
  tracks = tracks.map(t => Object.assign({}, t))
  const controlsContainer = document.querySelector<HTMLDivElement>('.controls-container')
  const trackSelector = document.querySelector<HTMLDivElement>('.track-selector')
  const titleEl = document.querySelector<HTMLDivElement>('.title')
  const artistEl = document.querySelector<HTMLDivElement>('.artist')
  const timeEl = document.querySelector<HTMLDivElement>('.elapsed-time')
  const seekerEl = document.querySelector<HTMLDivElement>('.seeker')
  const progressEl = document.querySelector<HTMLDivElement>('.progress')
  const width = 290 // must match .controls-container width

  tracks.forEach((track, i) => {
    const trackEl = trackSelector.appendChild(document.createElement('li'))
    trackEl.classList.add('track')
    trackEl.addEventListener('click', () => {
      setTrack(tracks[i])
      audio.play()
    })
    trackEl.innerHTML = '<span>0' + (1 + i) + '.</span> ' + track.title
    track.el = trackEl
  })

  function setTrack(track) {
    audio.src = track.path
    tracks.forEach(t => t.el.classList.remove('selected'))
    track.el.classList.add('selected')
    titleEl.innerText = track.title
    artistEl.innerText = track.artist
  }

  setTrack(tracks[0])

  let lastTime
  function tick() {
    if (audio.currentTime !== lastTime) {
      const t = audio.currentTime / audio.duration
      css(progressEl, {
        width: `${t * 100}%`
      })
      timeEl.innerText = formatSeconds(audio.currentTime)
    }
    lastTime = audio.currentTime
  }

  seekerEl.addEventListener('click', e => {
    const { left } = seekerEl.getBoundingClientRect()
    const t = (e.clientX - left) / width
    audio.currentTime = t * audio.duration
  })

  window.addEventListener('keypress', (e) => {
    if (e.key === ' ') {
      togglePlay()
    }
  })

  return {
    el: controlsContainer,
    tick: tick
  }

  function togglePlay() {
    if (audio.paused) {
      audio.play()
    } else {
      audio.pause()
    }
  }
}

function formatSeconds(seconds) {
  const minutes = seconds / 60 | 0
  seconds = '' + (seconds % 60 | 0)
  if (seconds.length === 1) {
    seconds = `0${seconds}`
  }
  return `${minutes}:${seconds}`
}
