import React from 'react';
import { ShieldAlert, LogIn, Home, X, Lock, KeyRound, AlertTriangle } from 'lucide-react';

interface AccessDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  requiredRole?: string;
  onOpenLogin: () => void;
  onGoHome?: () => void;
}

export const AccessDeniedModal: React.FC<AccessDeniedModalProps> = ({
  isOpen,
  onClose,
  title = 'BẠN CHƯA CÓ QUYỀN TRUY CẬP TÍNH NĂNG NÀY',
  message = 'Đồng chí chưa được cấp quyền truy cập tính năng/khu vực này. Vui lòng liên hệ Quản trị viên (Ban Biên tập - Sư đoàn 10) hoặc Đăng nhập tài khoản Quản trị viên có thẩm quyền!',
  requiredRole = 'Quản trị viên (Admin)',
  onOpenLogin,
  onGoHome,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-500/40 w-full max-w-md overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Warning Banner */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-950 text-white p-4 px-5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-red-950 rounded-xl font-black">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-200">
                CẢNH BÁO PHÂN QUYỀN TRUY CẬP
              </h3>
              <p className="text-[10px] text-white/80">Khu vực bảo mật nội bộ đơn vị</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto shadow-inner border border-red-200">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h4 className="text-sm sm:text-base font-black text-gray-900 uppercase leading-snug">
              {title}
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed px-1">
              {message}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 font-medium flex items-center justify-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Yêu cầu quyền hạn: <strong className="text-red-700">{requiredRole}</strong></span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 justify-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="w-full sm:w-auto flex-1 bg-red-800 hover:bg-red-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>ĐĂNG NHẬP NGAY</span>
            </button>

            {onGoHome && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoHome();
                }}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-gray-300"
              >
                <Home className="w-4 h-4 text-gray-600" />
                <span>VỀ TRANG CHỦ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
