"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isTextUIPart,
  type ChatStatus,
  type UIMessage,
} from "ai";
import { type KeyboardEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ChatInterface() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const handleSubmit = async (message: string) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || status === "submitted" || status === "streaming") {
      return;
    }

    await sendMessage({ text: trimmedMessage });
  };

  return (
    <main className="flex h-full flex-col gap-4 p-6">
      <MessageRenderingSection messages={messages} status={status} error={error} />
      <MessageComposer onSubmit={handleSubmit} status={status} />
    </main>
  );
}

function MessageRenderingSection({
  messages,
  status,
  error,
}: {
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
}) {
  return (
    <section className="flex-1 overflow-y-auto p-4" aria-label="Messages">
      {messages.length === 0 ? (
        <div className="grid min-h-full place-items-center text-center text-muted-foreground">
          <p>Ask for a Cantonese practice sentence to get started.</p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3 list-none m-0 p-0">
          {messages.map((message) => (
            <li
              className={`flex flex-col max-w-[75%] gap-1 ${
                message.role === "user" ? "self-end items-end" : "self-start items-start"
              }`}
              key={message.id}
            >
              <span className="text-xs font-semibold tracking-wide text-muted-foreground">
                {message.role === "user" ? "You" : "Teacher"}
              </span>
              <div
                className={`rounded-2xl px-4 py-2.5 leading-relaxed whitespace-pre-wrap ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {message.parts.map((part, index) =>
                  isTextUIPart(part) ? (
                    <p key={`${message.id}-${index}`} className="m-0 [&+p]:mt-2.5">
                      {part.text}
                    </p>
                  ) : null,
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {status === "submitted" ? (
        <p className="mt-3.5 text-sm text-muted-foreground">Thinking...</p>
      ) : null}
      {error ? (
        <p className="mt-3.5 text-sm text-destructive">{error.message}</p>
      ) : null}
    </section>
  );
}

function MessageComposer({
  onSubmit,
  status,
}: {
  onSubmit: (message: string) => Promise<void>;
  status: ChatStatus;
}) {
  const [message, setMessage] = useState("");
  const isSending = status === "submitted" || status === "streaming";

  const send = async () => {
    if (!message.trim() || isSending) return;
    await onSubmit(message);
    setMessage("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <Card className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-end gap-2.5 rounded-2xl p-2.5">
      <textarea
        placeholder="Type a message..."
        rows={1}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[44px] max-h-[160px] resize-none border-0 bg-transparent p-3 text-foreground outline-none placeholder:text-muted-foreground"
      />
      <Button
        size="icon-lg"
        disabled={!message.trim() || isSending}
        onClick={send}
        className="rounded-xl text-xl"
      >
        ↑
      </Button>
    </Card>
  );
}
