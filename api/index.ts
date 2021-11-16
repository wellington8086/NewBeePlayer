import { VercelRequest, VercelResponse } from '@vercel/node'
import redis from './_redis'

export default async function(req: VercelRequest, res: VercelResponse) {
  const features = (await redis.hvals('features'))
    .map((entry) => JSON.parse(entry))
    .sort((a, b) => b.score - a.score)

  res.status(200).json({ features })
}
