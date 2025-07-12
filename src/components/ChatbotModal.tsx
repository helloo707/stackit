"use client";
import { useState, useRef, useEffect } from "react";
import { X, Bot, User } from "lucide-react";
import { Button } from "./ui/button";

export default function ChatbotModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMessages([
        {
          role: "bot",
          content: "Hello! 👋 I'm StackIt, your helpful assistant. How can I help you today?",
        },
      ]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: { role: "user" | "bot"; content: string } = { role: "user", content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { role: "bot", content: data.reply }]);
    } catch (e) {
      setMessages((msgs) => [...msgs, { role: "bot", content: "Sorry, something went wrong." }]);
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-md mx-2 sm:mx-0 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 font-semibold">
            <Bot className="w-5 h-5" /> StackIt Chatbot
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 300, maxHeight: 400 }}>
          {messages.length === 0 && (
            <div className="text-zinc-500 text-center">How can I help you today?</div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`rounded-lg px-3 py-2 max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form
          className="flex gap-2 p-4 border-t border-zinc-200 dark:border-zinc-700"
          onSubmit={e => {
            e.preventDefault();
            if (!loading) sendMessage();
          }}
        >
          <input
            className="flex-1 rounded border px-3 py-2 bg-zinc-50 dark:bg-zinc-800"
            placeholder="Type your question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? "..." : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}
