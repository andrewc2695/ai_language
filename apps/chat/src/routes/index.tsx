import { createFileRoute } from '@tanstack/react-router'
import { ChatInterface } from '../components/chat-interface'
import { Dictionary } from '../components/dictionary'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="flex h-screen">
      <div className="flex-[3] overflow-hidden">
        <ChatInterface />
      </div>
      <aside className="flex-1 min-w-[300px] max-w-[400px] border-l border-border overflow-y-auto">
        <Dictionary />
      </aside>
    </div>
  )
}
