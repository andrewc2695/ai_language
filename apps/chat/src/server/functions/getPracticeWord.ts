import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../../lib/db'
import type { WordRow } from '../../lib/db'

export const getPracticeWord = createServerFn({ method: 'GET' }).handler(
 async () => {
  const { focusWord, supportingWords } = await getPracticeWordQuery()
  return { focusWord, supportingWords }
}
)

export const getPracticeWordQuery = async () => {
  const db = getDb()

    const focusWord = db
      .prepare(
        `
      SELECT * FROM words
      ORDER BY proficiency_level ASC, date_last_practiced ASC NULLS FIRST
      LIMIT 1
    `
      )
      .get() as WordRow | undefined

    if (!focusWord) {
      throw new Error('No words in database')
    }

    const supportingWords = db
      .prepare(
        `
      SELECT * FROM words
      WHERE id != ?
      ORDER BY RANDOM()
      LIMIT 100
    `
      )
      .all(focusWord.id) as WordRow[]

    return { focusWord, supportingWords }
}
