import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../../lib/db'

export const getPracticeWord = createServerFn({ method: 'GET' }).handler(
  () => {
    const db = getDb()

    const focusWord = db
      .prepare(
        `
      SELECT * FROM words
      ORDER BY proficiency_level ASC, date_last_practiced ASC NULLS FIRST
      LIMIT 1
    `
      )
      .get() as { id: number } | undefined

    if (!focusWord) {
      throw new Error('No words in database')
    }

    const supportingWords = db
      .prepare(
        `
      SELECT * FROM words
      WHERE id != ?
      ORDER BY RANDOM()
      LIMIT 30
    `
      )
      .all(focusWord.id)

    return { focusWord, supportingWords }
  }
)
