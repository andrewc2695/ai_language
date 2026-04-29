import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../../lib/db'
import type { WordRow } from '../../lib/db'

export const searchWords = createServerFn({ method: 'GET' })
  .inputValidator((input: { query: string }) => input)
  .handler(({ data }) => {
    const query = data.query?.trim()

    if (!query) {
      throw new Error('Missing query parameter')
    }

    const db = getDb()
    const pattern = `%${query}%`

    const words = db
      .prepare(
        `
    SELECT * FROM words
    WHERE english LIKE ? OR jyutping LIKE ?
    ORDER BY
      CASE
        WHEN english LIKE ? OR jyutping LIKE ? THEN 0
        WHEN english LIKE ? OR jyutping LIKE ? THEN 1
        ELSE 2
      END,
      proficiency_level ASC
    LIMIT 20
  `
      )
      .all(pattern, pattern, query, query, `${query}%`, `${query}%`) as WordRow[]

    return words
  })
