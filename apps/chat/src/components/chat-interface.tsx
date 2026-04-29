import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isTextUIPart,
  type ChatStatus,
  type UIMessage,
} from "ai";
import { useMutation } from "@tanstack/react-query";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { generateSentenceFn } from "@/server/functions/generateSentence";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ONLY_SENTENCE_AGENT } from "@/server/functions/consts";
import { PlayAudioButton } from "./PlayAudioButton";

export function ChatInterface() {
  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const generateSentenceMutation = useMutation({
    mutationFn: () => generateSentenceFn(),
    onSuccess: (result) => {
      console.log({result});
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          parts: [{ type: "text", text: result.sentence, metadata: { agent: ONLY_SENTENCE_AGENT, usedWords: result.usedWords } }],
        },
      ]);
    },
  });

  const handleSubmit = async (message: string) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || status === "submitted" || status === "streaming") {
      return;
    }

    await sendMessage({ text: trimmedMessage });
  };

  const generateSentence = async () => {
    if (
      generateSentenceMutation.isPending ||
      status === "submitted" ||
      status === "streaming"
    )
      return;
    generateSentenceMutation.mutate();
  };

  const generating = generateSentenceMutation.isPending;
  const isBusy = generating || status === "submitted" || status === "streaming";
  const displayError = error ?? generateSentenceMutation.error ?? undefined;

  return (
    <main className="flex h-full flex-col gap-4 p-6">
      <MessageRenderingSection
        messages={messages}
        status={status}
        error={displayError}
        generating={generating}
      />
      <MessageComposer
        onSubmit={handleSubmit}
        onGenerate={generateSentence}
        isBusy={isBusy}
      />
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
                message.role === "user"
                  ? "self-end items-end"
                  : "self-start items-start"
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
                    <p
                      key={`${message.id}-${index}`}
                      className="m-0 [&+p]:mt-2.5"
                    >
                      {part.text}
                    </p>
                  ) : null,
                )}
              </div>
              {(() => {
                const sentencePart = message.parts.find(
                  (part) =>
                    isTextUIPart(part) &&
                    (part.metadata as Record<string, unknown> | undefined)
                      ?.agent === ONLY_SENTENCE_AGENT,
                );
                return sentencePart && isTextUIPart(sentencePart) ? (
                  <PlayAudioButton jyutping={sentencePart.text} />
                ) : null;
              })()}
            </li>
          ))}
        </ol>
      )}

      {status === "submitted" || generating ? (
        <p className="mt-3.5 text-sm text-muted-foreground">
          {generating ? "Generating sentence..." : "Thinking..."}
        </p>
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
