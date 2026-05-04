import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface DashboardState {
  currentChat: Chat | null;
  chats: Chat[];
  user: User | null;
  isAgentTyping: boolean; // ← NUEVO: el agente está "escribiendo"

  setCurrentChat: (chat: Chat | null) => void;
  addChat: (chat: Chat) => void;
  updateChat: (id: string, chat: Partial<Chat>) => void;
  deleteChat: (id: string) => void;
  setUser: (user: User | null) => void;
  createChat: (message: string) => string;
  addAgentMessage: (chatId: string, content: string) => void; // ← NUEVO
  setAgentTyping: (value: boolean) => void; // ← NUEVO
}

export const useDashboardStore = create<DashboardState>((set) => ({
  currentChat: null,
  chats: [],
  user: null,
  isAgentTyping: false,

  setCurrentChat: (chat) => set({ currentChat: chat }),

  addChat: (chat) =>
    set((state) => ({
      chats: [chat, ...state.chats],
    })),

  updateChat: (id, updatedChat) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === id ? { ...chat, ...updatedChat } : chat
      ),
      currentChat:
        state.currentChat?.id === id
          ? { ...state.currentChat, ...updatedChat }
          : state.currentChat,
    })),

  deleteChat: (id) =>
    set((state) => ({
      chats: state.chats.filter((chat) => chat.id !== id),
      currentChat: state.currentChat?.id === id ? null : state.currentChat,
    })),

  setUser: (user) => set({ user }),

  setAgentTyping: (value) => set({ isAgentTyping: value }),

  // Agrega la respuesta del agente al chat correspondiente
  addAgentMessage: (chatId, content) =>
    set((state) => {
      const agentMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content,
        timestamp: new Date(),
      };

      return {
        isAgentTyping: false,
        chats: state.chats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, agentMessage],
                updatedAt: new Date(),
              }
            : chat
        ),
        currentChat:
          state.currentChat?.id === chatId
            ? {
                ...state.currentChat,
                messages: [...state.currentChat.messages, agentMessage],
                updatedAt: new Date(),
              }
            : state.currentChat,
      };
    }),

  createChat: (message: string) => {
    const id = Date.now().toString();

    const newChat: Chat = {
      id,
      title: message.slice(0, 40),
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [
        {
          id: Date.now().toString(),
          role: "user",
          content: message,
          timestamp: new Date(),
        },
      ],
    };

    set((state) => ({
      chats: [newChat, ...state.chats],
      currentChat: newChat,
    }));

    return id;
  },
}));
