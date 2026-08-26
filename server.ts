import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Simple in-memory rate limiter for API endpoints (60 req/min per IP)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 80;

app.use('/api', (req, res, next) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();
  const clientData = ipRequestCounts.get(ip);

  if (!clientData || now > clientData.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    clientData.count++;
    if (clientData.count > MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({
        success: false,
        error: 'Quá nhiều yêu cầu từ địa chỉ IP của đồng chí. Vui lòng thử lại sau giây lát.',
      });
    }
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy initialization of Google Gemini AI client (server-side only)
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// System prompt for Military Political & Legal Assistant
const MILITARY_SYSTEM_INSTRUCTION = `Bạn là Trợ lý AI Thông minh của Trang thông tin Truyền thông & Giáo dục Chính trị - Trung đoàn 95 (Đoàn Mang Yang Anh hùng), Sư đoàn 2, Quân đoàn 3.
Nhiệm vụ của bạn:
1. Cung cấp thông tin chính xác, chuẩn mực về đường lối, chủ trương của Đảng, chính sách, pháp luật của Nhà nước và kỷ luật Quân đội nhân dân Việt Nam.
2. Tuyên truyền truyền thống vẻ vang của Trung đoàn 95 - Đoàn Mang Yang Anh hùng, các tấm gương anh hùng liệt sĩ, chiến sĩ tiêu biểu và phong trào thi đua Quyết thắng.
3. Hỗ trợ cán bộ, chiến sĩ tra cứu văn bản, chỉ thị, nghị quyết, quy định quân sự và hướng dẫn học tập theo tư tưởng, đạo đức, phong cách Hồ Chí Minh.
4. Hỗ trợ tóm tắt bài báo, dự thảo nghị quyết chi bộ, văn kiện sinh hoạt Đảng với tác phong chính quy, ngôn phong chuẩn mực, súc tích và trang trọng.
5. Giữ vững tính bảo mật quân sự: Tuyệt đối không tiết lộ tài liệu mật, phương án tác chiến, biên chế bí mật hoặc thông tin nhạy cảm chưa được phép công khai.`;

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY);
  res.json({
    status: 'ok',
    service: 'Military Media Portal API - Trung đoàn 95',
    aiAvailable: hasKey,
    timestamp: new Date().toISOString(),
  });
});

// 2. Chat / Q&A Endpoint with AI
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Nội dung tin nhắn không hợp lệ.',
      });
    }

    if (message.length > 30000) {
      return res.status(400).json({
        error: 'Độ dài tin nhắn vượt quá giới hạn cho phép (30,000 ký tự).',
      });
    }

    const ai = getGeminiClient();

    let fullPrompt = message.trim();
    if (context && typeof context === 'string') {
      const cleanContext = context.slice(0, 30000);
      fullPrompt = `[BỐI CẢNH NỘI DUNG]:\n${cleanContext}\n\n[CÂU HỎI / YÊU CẦU CỦA ĐỒNG CHÍ]:\n${fullPrompt}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: MILITARY_SYSTEM_INSTRUCTION,
        temperature: 0.4,
      },
    });

    const replyText = response.text || 'Không nhận được phản hồi từ mô hình AI.';
    res.json({
      success: true,
      reply: replyText,
    });
  } catch (error: any) {
    console.error('Server Gemini Chat Error:', error);
    const isKeyMissing = error?.message?.includes('GEMINI_API_KEY');
    res.status(500).json({
      success: false,
      error: isKeyMissing
        ? 'Chưa cấu hình GEMINI_API_KEY trong biến môi trường server.'
        : 'Có lỗi xảy ra khi xử lý yêu cầu qua Gemini API: ' + (error?.message || 'Lỗi không xác định'),
    });
  }
});

// 3. Summarization Endpoint for Articles and Documents
app.post('/api/ai/summarize', async (req, res) => {
  try {
    const { title, content, type = 'article' } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Nội dung cần tóm tắt không được để trống.',
      });
    }

    if (content.length > 50000) {
      return res.status(400).json({
        error: 'Nội dung văn bản quá dài (vượt quá 50,000 ký tự). Vui lòng rút gọn trước khi tóm tắt.',
      });
    }

    const ai = getGeminiClient();

    const cleanTitle = typeof title === 'string' ? title.slice(0, 500) : 'Không có tiêu đề';
    const cleanContent = content.slice(0, 50000);

    const prompt = `Hãy tóm tắt văn bản sau đây một cách súc tích, cô đọng, làm nổi bật các ý chính, thông điệp tư tưởng, chỉ đạo quan trọng và nhiệm vụ trọng tâm:
Tiêu đề: ${cleanTitle}
Loại tài liệu: ${type === 'document' ? 'Văn bản / Chỉ thị / Quy định quân sự' : 'Bài báo / Bản tin truyền thông'}

Nội dung chi tiết:
${cleanContent}

Yêu cầu định dạng phản hồi:
- **Tóm tắt cốt lõi** (1-2 câu súc tích nhất)
- **Các nội dung / chỉ đạo trọng tâm** (3-5 gạch đầu dòng rõ ràng)
- **Ý nghĩa & Hành động đối với cán bộ, chiến sĩ** (1-2 câu ngắn gọn)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: MILITARY_SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
    });

    res.json({
      success: true,
      summary: response.text || 'Không thể tạo bản tóm tắt.',
    });
  } catch (error: any) {
    console.error('Server Gemini Summarize Error:', error);
    const isKeyMissing = error?.message?.includes('GEMINI_API_KEY');
    res.status(500).json({
      success: false,
      error: isKeyMissing
        ? 'Chưa cấu hình GEMINI_API_KEY trong biến môi trường server.'
        : 'Lỗi tóm tắt nội dung: ' + (error?.message || 'Lỗi không xác định'),
    });
  }
});

// 4. Meeting Resolution & Conclusion Assistant for Party Cells
app.post('/api/ai/meeting-assistant', async (req, res) => {
  try {
    const { meetingTitle, meetingCode, discussions, existingResolution } = req.body;

    if (!meetingTitle || typeof meetingTitle !== 'string') {
      return res.status(400).json({
        error: 'Tiêu đề phiên họp là bắt buộc.',
      });
    }

    const ai = getGeminiClient();

    const prompt = `Bạn đang hỗ trợ Thư ký / Chủ trì phiên họp Đảng ủy / Chi bộ Quân sự - Trung đoàn 95, Sư đoàn 2.
Phiên họp: ${meetingTitle.slice(0, 300)} (Mã phòng: ${meetingCode ? String(meetingCode).slice(0, 50) : 'N/A'})

Ý kiến thảo luận và các nội dung đã ghi nhận:
${Array.isArray(discussions) ? discussions.slice(0, 50).join('\n- ') : typeof discussions === 'string' ? discussions.slice(0, 20000) : 'Chưa có ý kiến phát biểu bổ sung'}

Dự thảo nghị quyết hiện tại (nếu có):
${typeof existingResolution === 'string' ? existingResolution.slice(0, 20000) : 'Chưa có dự thảo'}

Hãy dự thảo hoặc hoàn thiện:
1. **Đánh giá tình hình & Kết luận của Chủ trì**: Tóm lược sự đồng thuận và các vấn đề cần lưu ý.
2. **Dự thảo Nghị quyết / Kết luận phiên họp**: Gồm phương hướng, mục tiêu và các chỉ tiêu, biện pháp thực hiện cụ thể.
3. **Phân công tổ chức thực hiện**: Trách nhiệm của các bộ phận, chi ủy và đảng viên.

Định dạng văn bản chuẩn quy cách văn kiện Đảng trong Quân đội nhân dân Việt Nam.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: MILITARY_SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
    });

    res.json({
      success: true,
      draftResolution: response.text || 'Không thể tạo dự thảo nghị quyết.',
    });
  } catch (error: any) {
    console.error('Server Gemini Meeting Assistant Error:', error);
    const isKeyMissing = error?.message?.includes('GEMINI_API_KEY');
    res.status(500).json({
      success: false,
      error: isKeyMissing
        ? 'Chưa cấu hình GEMINI_API_KEY trong biến môi trường server.'
        : 'Lỗi trợ lý soạn thảo nghị quyết: ' + (error?.message || 'Lỗi không xác định'),
    });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Military Portal Full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

