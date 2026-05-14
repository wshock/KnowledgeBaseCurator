const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export interface GlobalDocument {
  id: number;
  filename: string;
  chunks_indexed: number;
  description?: string;
  uploaded_at: string;
  size_bytes?: number;
  scope: "global";
}

export interface LocalDocument {
  id: number;
  filename: string;
  chunks_indexed: number;
  description?: string;
  uploaded_at: string;
  size_bytes?: number;
  chat_id: number;
  scope: "local";
}

export type AnyDocument = GlobalDocument | LocalDocument;

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function authJsonHeaders(token: string) {
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

export async function apiGetGlobalDocuments(token: string): Promise<GlobalDocument[]> {
  const res = await fetch(`${API_BASE_URL}/documents/`, {
    headers: authHeaders(token),
  });
  return handleResponse<GlobalDocument[]>(res);
}

export async function apiUploadGlobalDocument(
  token: string,
  file: File,
  description?: string
): Promise<GlobalDocument> {
  const formData = new FormData();
  formData.append("file", file);
  if (description) formData.append("description", description);

  const res = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  return handleResponse<GlobalDocument>(res);
}

export async function apiDeleteGlobalDocument(token: string, docId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${docId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Error ${res.status}`);
  }
}

export async function apiGetLocalDocuments(token: string, chatId: number): Promise<LocalDocument[]> {
  const res = await fetch(`${API_BASE_URL}/chats/${chatId}/documents/`, {
    headers: authHeaders(token),
  });
  return handleResponse<LocalDocument[]>(res);
}

export async function apiUploadLocalDocument(
  token: string,
  chatId: number,
  file: File
): Promise<LocalDocument> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/chats/${chatId}/documents/upload`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  return handleResponse<LocalDocument>(res);
}

export async function apiDeleteLocalDocument(
  token: string,
  chatId: number,
  docId: number
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/chats/${chatId}/documents/${docId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Error ${res.status}`);
  }
}

export interface ActiveSources {
  global_doc_ids: number[];
  local_doc_ids: number[];
}

export async function apiSetActiveSources(
  token: string,
  chatId: number,
  sources: ActiveSources
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/chats/${chatId}/sources`, {
    method: "PUT",
    headers: authJsonHeaders(token),
    body: JSON.stringify(sources),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Error ${res.status}`);
  }
}

export async function apiGetActiveSources(
  token: string,
  chatId: number
): Promise<ActiveSources> {
  const res = await fetch(`${API_BASE_URL}/chats/${chatId}/sources`, {
    headers: authHeaders(token),
  });
  return handleResponse<ActiveSources>(res);
}
