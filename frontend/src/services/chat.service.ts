const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface BackendChat {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface BackendMessage {
  id: number;
  chat_id: number;
  user_id: number;
  content: string;
  timestamp: string;
  sender: "user" | "assistant";
}

export interface MessagePairResponse {
  user_message: BackendMessage;
  assistant_message: BackendMessage;
}

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function apiGetChats(token: string): Promise<BackendChat[]> {
  const res = await fetch(`${API_BASE_URL}/chats/`, {
    headers: authHeaders(token),
  });
  return handleResponse<BackendChat[]>(res);
}

export async function apiCreateChat(token: string, title: string): Promise<BackendChat> {
  const res = await fetch(`${API_BASE_URL}/chats/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ title }),
  });
  return handleResponse<BackendChat>(res);
}

export async function apiUpdateChat(token: string, chatId: number, title: string): Promise<BackendChat> {
  const res = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ title }),
  });
  return handleResponse<BackendChat>(res);
}

export async function apiDeleteChat(token: string, chatId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Error ${res.status}`);
  }
}

export async function apiGetMessages(token: string, chatId: number): Promise<BackendMessage[]> {
  const res = await fetch(`${API_BASE_URL}/chats/${chatId}/messages/`, {
    headers: authHeaders(token),
  });
  return handleResponse<BackendMessage[]>(res);
}

export async function apiSendMessage(
  token: string,
  chatId: number,
  content: string
): Promise<MessagePairResponse> {
  const res = await fetch(`${API_BASE_URL}/chats/${chatId}/messages/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ content, sender: "user" }),
  });
  return handleResponse<MessagePairResponse>(res);
}
