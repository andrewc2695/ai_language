import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../../lib/db'

export const getRandomWords = createServerFn({ method: 'GET' })
  .inputValidator((input: { limit?: number; exclude?: string }) => input)
  .handler(({ data }) => {
    const limit = Math.min(Number(data.limit) || 30, 50)
    const exclude = data.exclude
    const db = getDb()

    if (exclude) {
      const ids = exclude.split(',').map(Number).filter(Boolean)
      const placeholders = ids.map(() => '?').join(',')
      const words = db
        .prepare(
          `
        SELECT * FROM words
        WHERE id NOT IN (${placeholders})
        ORDER BY RANDOM()
        LIMIT ?
      `
        )
        .all(...ids, limit)
      return words
    }

    const words = db
      .prepare(
        `
      SELECT * FROM words
      ORDER BY RANDOM()
      LIMIT ?
    `
      )
      .all(limit)
    return words
  })
