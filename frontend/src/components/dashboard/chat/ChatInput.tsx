"use client";
import { useState, useRef, useEffect } from "react";
import { FiPaperclip, FiSend } from "react-icons/fi";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  placeholder = "Pregunta a ShcoolAI sobre plan de estudio...",
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  useEffect(() => {
    autoResize();
  }, [message]);

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSend(message);
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto ">
      <div className="relative flex items-center gap-2 bg-white border border-gray-300 rounded-2xl p-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-950 focus-within:border-transparent">
        <FiPaperclip className="m-1"/>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none text-gray-800 placeholder-gray-500 min-h-[24px] max-h-[200px] overflow-y-auto "
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="p-2 rounded-lg bg-blue-950 text-white hover:bg-blue-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <FiSend className="h-5 w-5" />
        </button>
      </div>
      
    </div>
  );
}
