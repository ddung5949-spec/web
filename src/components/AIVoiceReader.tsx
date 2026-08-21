import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  FastForward,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { aiSpeech, VIETNAMESE_VOICE_PROFILES, VoiceProfile } from '../utils/aiSpeech';

interface AIVoiceReaderProps {
  title?: string;
  textToRead: string;
  sourceType?: 'article' | 'meeting' | 'document';
  compact?: boolean;
  className?: string;
}

export const AIVoiceReader: React.FC<AIVoiceReaderProps> = ({
  title = 'AI Đọc văn bản / tin bài',
  textToRead,
  sourceType = 'article',
  compact = false,
  className = '',
}) => {
  const [status, setStatus] = useState(aiSpeech.getStatus());
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('vn-female-north');
  const [speedRate, setSpeedRate] = useState<number>(1.0);
  const [progress, setProgress] = useState<number>(0);
  const [currentSentence, setCurrentSentence] = useState<string>('');
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);

  useEffect(() => {
    const unsubStatus = aiSpeech.subscribe(() => {
      setStatus(aiSpeech.getStatus());
    });
    const unsubProgress = aiSpeech.subscribeProgress((prog, sentence) => {
      setProgress(prog);
      setCurrentSentence(sentence);
    });

    return () => {
      unsubStatus();
      unsubProgress();
    };
  }, []);

  const handlePlay = () => {
    if (status.isPaused) {
      aiSpeech.resume();
    } else {
      aiSpeech.speak(textToRead, selectedVoiceId, speedRate);
    }
  };

  const handlePause = () => {
    aiSpeech.pause();
  };

  const handleStop = () => {
    aiSpeech.stop();
  };

  const handleReplay = () => {
    aiSpeech.stop();
    setTimeout(() => {
      aiSpeech.speak(textToRead, selectedVoiceId, speedRate);
    }, 100);
  };

  const currentVoice =
    VIETNAMESE_VOICE_PROFILES.find((v) => v.id === selectedVoiceId) ||
    VIETNAMESE_VOICE_PROFILES[0];

  if (!status.isSupported) {
    return null;
  }

  // Compact Mode (e.g., in a toolbar)
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 p-1 rounded-xl bg-red-50 border border-red-200 ${className}`}>
        <button
          type="button"
          onClick={status.isSpeaking && !status.isPaused ? handlePause : handlePlay}
          className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          title="AI Đọc tài liệu"
        >
          {status.isSpeaking && !status.isPaused ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Tạm dừng</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Đọc</span>
            </>
          )}
        </button>

        {status.isSpeaking && (
          <button
            type="button"
            onClick={handleStop}
            className="p-1 text-gray-500 hover:text-red-700 rounded transition-colors cursor-pointer"
            title="Dừng đọc"
          >
            <Square className="w-3.5 h-3.5 fill-current text-red-600" />
          </button>
        )}
      </div>
    );
  }

  // Full Rich Player Banner
  return (
    <div
      className={`rounded-2xl border border-red-200/80 bg-linear-to-r from-red-950 via-red-900 to-amber-950 text-white p-3.5 sm:p-4 shadow-sm space-y-3 ${className}`}
    >
      {/* Top Header with AI badge & Voice Profile Picker */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-xs sm:text-sm tracking-wide text-white uppercase">
                {title}
              </h4>
              <span className="bg-amber-400 text-red-950 font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                AI Voice
              </span>
            </div>
            <p className="text-[10px] text-amber-200/80">
              Trợ lý âm thanh giọng đọc tiếng Việt trôi chảy (Nam / Nữ)
            </p>
          </div>
        </div>

        {/* Controls: Voice Select & Speed Select */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Voice Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsVoiceMenuOpen(!isVoiceMenuOpen);
                setIsSpeedMenuOpen(false);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Mic className="w-3 h-3 text-amber-300" />
              <span className="max-w-[130px] truncate">{currentVoice.name}</span>
              <ChevronDown className="w-3 h-3 text-white/70" />
            </button>

            {isVoiceMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-gray-900 border border-amber-500/40 rounded-xl shadow-xl z-30 p-1.5 space-y-1 text-white">
                <div className="text-[10px] font-bold text-amber-300 px-2 py-1 uppercase tracking-wider border-b border-gray-800">
                  Chọn giọng đọc Tiếng Việt
                </div>
                {VIETNAMESE_VOICE_PROFILES.map((vp) => (
                  <button
                    key={vp.id}
                    type="button"
                    onClick={() => {
                      setSelectedVoiceId(vp.id);
                      setIsVoiceMenuOpen(false);
                      if (status.isSpeaking) {
                        aiSpeech.stop();
                        setTimeout(() => {
                          aiSpeech.speak(textToRead, vp.id, speedRate);
                        }, 100);
                      }
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                      selectedVoiceId === vp.id
                        ? 'bg-red-800/80 text-amber-200 font-bold'
                        : 'hover:bg-gray-800 text-gray-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{vp.name}</span>
                        <span className="text-[9px] px-1 bg-black/40 rounded text-gray-300">
                          {vp.gender === 'female' ? 'Nữ' : 'Nam'}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{vp.description}</div>
                    </div>
                    {selectedVoiceId === vp.id && (
                      <Check className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Speed Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsSpeedMenuOpen(!isSpeedMenuOpen);
                setIsVoiceMenuOpen(false);
              }}
              className="px-2 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Tốc độ đọc"
            >
              <FastForward className="w-3 h-3 text-amber-300" />
              <span>{speedRate}x</span>
              <ChevronDown className="w-3 h-3 text-white/70" />
            </button>

            {isSpeedMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-28 bg-gray-900 border border-amber-500/40 rounded-xl shadow-xl z-30 p-1 space-y-0.5 text-white text-xs">
                {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => {
                      setSpeedRate(rate);
                      setIsSpeedMenuOpen(false);
                      if (status.isSpeaking) {
                        aiSpeech.stop();
                        setTimeout(() => {
                          aiSpeech.speak(textToRead, selectedVoiceId, rate);
                        }, 100);
                      }
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer ${
                      speedRate === rate
                        ? 'bg-red-800 text-amber-200'
                        : 'hover:bg-gray-800 text-gray-200'
                    }`}
                  >
                    <span>{rate}x {rate === 1.0 ? '(Chuẩn)' : ''}</span>
                    {speedRate === rate && <Check className="w-3.5 h-3.5 text-amber-300" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Sound Wave & Playback Progress Bar */}
      <div className="space-y-1.5 bg-black/30 p-2.5 rounded-xl border border-white/10">
        <div className="flex items-center justify-between text-[11px] text-amber-200/90 font-medium">
          <div className="flex items-center gap-2 truncate">
            {status.isSpeaking && !status.isPaused ? (
              <span className="flex items-center gap-1 text-emerald-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Đang phát giọng đọc...</span>
              </span>
            ) : status.isPaused ? (
              <span className="text-amber-300 font-bold">Đang tạm dừng</span>
            ) : (
              <span>Sẵn sàng phát âm thanh</span>
            )}
          </div>

          {/* Sound Wave Animation when speaking */}
          {status.isSpeaking && !status.isPaused && (
            <div className="flex items-end gap-0.5 h-3.5 px-2">
              <span className="w-1 bg-amber-300 h-2 animate-bounce rounded-full" />
              <span className="w-1 bg-amber-300 h-3.5 animate-pulse rounded-full" />
              <span className="w-1 bg-amber-300 h-2.5 animate-bounce rounded-full" />
              <span className="w-1 bg-amber-300 h-1 animate-pulse rounded-full" />
              <span className="w-1 bg-amber-300 h-3 animate-bounce rounded-full" />
            </div>
          )}

          <span className="font-mono text-[10px] text-white/70">{progress}%</span>
        </div>

        {/* Progress bar line */}
        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-linear-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current sentence preview if speaking */}
        {currentSentence && status.isSpeaking && (
          <p className="text-[11px] text-white/90 italic truncate max-w-full pt-1 border-t border-white/5">
            "{currentSentence}"
          </p>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {/* Main Play / Pause Button */}
          {status.isSpeaking && !status.isPaused ? (
            <button
              type="button"
              onClick={handlePause}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-red-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Tạm dừng</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlay}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-red-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{status.isPaused ? 'Tiếp tục nghe' : 'Nghe AI Đọc'}</span>
            </button>
          )}

          {/* Stop Button */}
          {status.isSpeaking && (
            <button
              type="button"
              onClick={handleStop}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer border border-white/20"
            >
              <Square className="w-3.5 h-3.5 fill-current text-rose-300" />
              <span>Dừng</span>
            </button>
          )}

          {/* Replay Button */}
          <button
            type="button"
            onClick={handleReplay}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white/90 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Đọc lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[10px] text-amber-200/70 hidden sm:block">
          Tối ưu cho văn bản Quân sự, Báo chí & Nghị quyết
        </div>
      </div>
    </div>
  );
};
