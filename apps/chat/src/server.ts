import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'

// Import API route handlers
import { handleChat } from './server/api/chat'
import { handleSentence } from './server/api/sentence'

const startHandler = createStartHandler(defaultStreamHandler)

// API route mapping
const apiRoutes: Record<string, (request: Request) => Promise<Response>> = {
  '/api/chat': handleChat,
  '/api/sentence': handleSentence,
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url)

    // Check if this is an API route
    const handler = apiRoutes[url.pathname]
    if (handler) {
      return handler(request)
    }

    // Otherwise delegate to TanStack Start
    return startHandler(request)
  },
}
