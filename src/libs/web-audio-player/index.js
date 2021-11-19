import buffer from './lib/buffer-source'
import media from './lib/media-source'

export default function webAudioPlayer(src, opt) {
  if (!src) throw new TypeError('must specify a src parameter')
  opt = opt || {}
  if (opt.buffer) return buffer(src, opt)
  else return media(src, opt)
}
