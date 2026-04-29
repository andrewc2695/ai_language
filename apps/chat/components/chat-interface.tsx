"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isTextUIPart,
  type ChatStatus,
  type UIMessage,
} from "ai";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ChatInterface() {
  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [generating, setGenerating] = useState(false);

  const handleSubmit = async (message: string) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || status === "submitted" || status === "streaming") {
      return;
    }

    await sendMessage({ text: trimmedMessage });
  };

  const generateSentence = async () => {
    if (generating || status === "submitted" || status === "streaming") return;
    setGenerating(true);

    try {
      const res = await fetch("/api/sentence", { method: "POST" });
      if (!res.ok || !res.body) {
        throw new Error("Failed to generate sentence");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }

      text += decoder.decode();

      if (text.trim()) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            parts: [{ type: "text", text: text.trim() }],
          },
        ]);
      }
    } finally {
      setGenerating(false);
    }
  };

  const isBusy = generating || status === "submitted" || status === "streaming";

  return (
    <main className="flex h-full flex-col gap-4 p-6">
      <MessageRenderingSection messages={messages} status={status} error={error} generating={generating} />
      <MessageComposer onSubmit={handleSubmit} onGenerate={generateSentence} isBusy={isBusy} />
    </main>
  );
}

function MessageRenderingSection({
  messages,
  status,
  error,
  generating,
}: {
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
  generating: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

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

      {status === "submitted" || generating ? (
        <p className="mt-3.5 text-sm text-muted-foreground">{generating ? "Generating sentence..." : "Thinking..."}</p>
      ) : null}
      {error ? (
        <p className="mt-3.5 text-sm text-destructive">{error.message}</p>
      ) : null}
      <div ref={bottomRef} />
    </section>
  );
}

function MessageComposer({
  onSubmit,
  onGenerate,
  isBusy,
}: {
  onSubmit: (message: string) => Promise<void>;
  onGenerate: () => Promise<void>;
  isBusy: boolean;
}) {
  const [message, setMessage] = useState("");

  const send = async () => {
    if (!message.trim() || isBusy) return;
    setMessage("");
    await onSubmit(message);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <Card className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-end gap-2.5 rounded-2xl p-2.5">
        <textarea
          placeholder="Type your translation..."
          rows={1}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[44px] max-h-[160px] resize-none border-0 bg-transparent p-3 text-foreground outline-none placeholder:text-muted-foreground"
        />
        <Button
          size="icon-lg"
          disabled={!message.trim() || isBusy}
          onClick={send}
          className="rounded-xl text-xl"
        >
          ↑
        </Button>
      </Card>
      <Button
        variant="secondary"
        disabled={isBusy}
        onClick={onGenerate}
        className="w-full rounded-xl"
      >
        Generate Sentence
      </Button>
    </div>
  );
}
