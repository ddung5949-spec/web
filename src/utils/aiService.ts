// Client-side AI Service for calling secure backend API endpoints
// This file does NOT contain or expose any secret API keys. All calls are proxied through /api/* endpoints.

export interface AIChatResponse {
  success: boolean;
  reply?: string;
  error?: string;
}

export interface AISummarizeResponse {
  success: boolean;
  summary?: string;
  error?: string;
}

export interface AIMeetingDraftResponse {
  success: boolean;
  draftResolution?: string;
  error?: string;
}

export interface AIHealthResponse {
  status: string;
  service?: string;
  aiAvailable?: boolean;
  timestamp?: string;
}

export async function checkAIServiceHealth(): Promise<AIHealthResponse> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return { status: 'error', aiAvailable: false };
    }
    return await res.json();
  } catch (error) {
    return { status: 'offline', aiAvailable: false };
  }
}

export async function askMilitaryAI(message: string, context?: string): Promise<AIChatResponse> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, context }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `Lỗi máy chủ (${res.status})`,
      };
    }
    return data;
  } catch (err: any) {
    console.error('Error contacting backend AI endpoint:', err);
    return {
      success: false,
      error: 'Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại đường truyền mạng.',
    };
  }
}

export async function summarizeWithAI(
  title: string,
  content: string,
  type: 'article' | 'document' = 'article'
): Promise<AISummarizeResponse> {
  try {
    const res = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content, type }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `Lỗi máy chủ (${res.status})`,
      };
    }
    return data;
  } catch (err: any) {
    console.error('Error summarizing with AI:', err);
    return {
      success: false,
      error: 'Không thể kết nối đến máy chủ Backend để tóm tắt văn bản.',
    };
  }
}

export async function assistMeetingResolutionWithAI(
  meetingTitle: string,
  meetingCode?: string,
  discussions?: string[],
  existingResolution?: string
): Promise<AIMeetingDraftResponse> {
  try {
    const res = await fetch('/api/ai/meeting-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meetingTitle,
        meetingCode,
        discussions: discussions || [],
        existingResolution: existingResolution || '',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `Lỗi máy chủ (${res.status})`,
      };
    }
    return data;
  } catch (err: any) {
    console.error('Error assisting meeting resolution with AI:', err);
    return {
      success: false,
      error: 'Không thể kết nối đến máy chủ Backend để dự thảo nghị quyết.',
    };
  }
}
