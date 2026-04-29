import { OnlySentenceAgent } from '../agents/OnlySentenceAgent'

export async function handleSentence(): Promise<Response> {
  try {
    const agent = OnlySentenceAgent()

    console.log("processing sentence")
    const result = await agent.generate({
      messages: [{ role: 'user', content: 'Generate a sentence.' }],
    })
    console.log(result.text)
    return Response.json({ sentence: result.text })
  } catch (error) {
    console.error('Sentence API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
