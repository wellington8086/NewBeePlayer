import xhr from 'xhr'
import xhrProgress from 'xhr-progress'

export default function xhrAudio(audioContext, src, cb, progress, decoding) {
  const xhrObject = xhr({
    uri: src,
    responseType: 'arraybuffer'
  }, function(err, resp, arrayBuf) {
    if (!/^2/.test(resp.statusCode)) {
      err = new Error('status code ' + resp.statusCode + ' requesting ' + src)
    }
    if (err) return cb(err)
    decode(arrayBuf)
  })

  xhrProgress(xhrObject)
    .on('data', function(amount, total) {
      progress(amount, total)
    })

  function decode(arrayBuf) {
    decoding()
    audioContext.decodeAudioData(arrayBuf, function(decoded) {
      cb(null, decoded)
    }, function() {
      const err = new Error('Error decoding audio data')
      err.type = 'DECODE_AUDIO_DATA'
      cb(err)
    })
  }
}
