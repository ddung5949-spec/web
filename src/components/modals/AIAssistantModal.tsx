import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { askMilitaryAI, checkAIServiceHealth } from '../../utils/aiService';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  contextText?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const SAMPLE_QUESTIONS = [
  'Truyền thống vẻ vang của Sư đoàn 10 (Đoàn Mang Yang Anh hùng)?',
  '10 Lời thề danh dự của quân nhân QĐND Việt Nam?',
  '12 Điều kỷ luật khi quan hệ với nhân dân?',
  'Hướng dẫn học tập và làm theo tư tưởng, phong cách Hồ Chí Minh?',
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
  contextText = '',
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào đồng chí! Tôi là Trợ lý AI Chính trị & Pháp luật của Sư đoàn 10 Anh hùng. Đồng chí cần tra cứu thông tin, chỉ thị, điều lệnh hoặc tìm hiểu về truyền thống Sư đoàn?',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'no-key' | 'offline'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      checkAIServiceHealth().then((res) => {
        if (res.status === 'ok') {
          setBackendStatus(res.aiAvailable ? 'online' : 'no-key');
        } else {
          setBackendStatus('offline');
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      setInput(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const response = await askMilitaryAI(query, contextText);

    if (response.success && response.reply) {
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } else {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text:
          response.error ||
          'Không thể xử lý yêu cầu lúc này. Vui lòng kiểm tra lại cấu hình GEMINI_API_KEY ở biến môi trường máy chủ.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setIsLoading(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-200 flex flex-col h-[85vh] max-h-[750px]">
        {/* Header */}
        <div className="p-4 bg-linear-to-r from-red-950 via-red-900 to-amber-950 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 rounded-xl border border-amber-300/30 text-amber-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wide">
                  Trợ lý AI Chính trị & Pháp luật Quân sự
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400 text-red-950">
                  Backend Secure API
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                Sư đoàn 10 - Đoàn Mang Yang Anh hùng (Bảo mật Server-side qua Gemini 3.7)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        {backendStatus === 'no-key' && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span>
              ℹ️ Máy chủ đang chạy nhưng chưa cấu hình <strong>GEMINI_API_KEY</strong> trong file .env server.
            </span>
          </div>
        )}

        {/* Message Conversation Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    isUser
                      ? 'bg-red-800 text-white'
                      : 'bg-linear-to-br from-amber-600 to-red-900 text-amber-200'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs whitespace-pre-wrap ${
                      isUser
                        ? 'bg-red-800 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>

                  <div className={`flex items-center gap-2 px-1 text-[10px] text-gray-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="hover:text-gray-700 cursor-pointer flex items-center gap-0.5"
                        title="Sao chép câu trả lời"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Chép</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 max-w-[80%] mr-auto items-center">
              <div className="w-7 h-7 rounded-xl bg-linear-to-br from-amber-600 to-red-900 text-amber-200 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white text-gray-600 border border-gray-200 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 shadow-2xs">
                <Loader2 className="w-4 h-4 animate-spin text-red-700" />
                <span>Trợ lý AI đang tra cứu & suy luận dữ liệu...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
          <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap pl-1">
            Gợi ý:
          </span>
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-gray-100 hover:bg-red-50 hover:text-red-800 text-gray-700 rounded-full text-[11px] whitespace-nowrap border border-gray-200 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi, chỉ thị hoặc nội dung cần tra cứu..."
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:bg-white focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 bg-red-800 hover:bg-red-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gửi</span>
          </button>
        </form>
      </div>
    </div>
  );
};
