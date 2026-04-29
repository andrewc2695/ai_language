import { convertToModelMessages } from 'ai'
import { GradingAgent } from '../agents/GradingAgent'

export async function handleChat(request: Request): Promise<Response> {
  try {
    const { messages } = await request.json()
    console.log('messages', messages[0].parts)

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages must be an array', { status: 400 })
    }

    const modelMessages = await convertToModelMessages(messages)

    const agent = GradingAgent()

    const result = await agent.stream({
      messages: modelMessages,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
