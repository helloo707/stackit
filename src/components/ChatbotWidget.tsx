"use client";
import { useState } from "react";
import ChatbotModal from "./ChatbotModal";
import { MessageSquare } from "lucide-react";

export default function ChatbotWidget() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-all duration-200"
        aria-label="Open Chatbot"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {chatOpen && (
        <ChatbotModal open={chatOpen} onClose={() => setChatOpen(false)} />
      )}
    </>
  );
}