import React, { useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  X,
} from 'lucide-react';
import { supabase, supabaseAuth } from '../utils/supabase';
import { User as UserType } from '../types';
import { UnitLogo } from './UnitLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserType) => void;
  showToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = emailInput.trim();
    const password = passwordInput;

    if (!email || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email/Tên đăng nhập và Mật khẩu!');
      return;
    }

    setIsLoading(true);

    try {
      // Direct 100% Supabase Auth signInWithPassword call
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.warn('[LoginModal] Supabase Auth Error:', error.message);
        setErrorMessage('Email hoặc mật khẩu không đúng!');
        if (showToast) {
          showToast('error', 'Đăng nhập thất bại', 'Email hoặc mật khẩu không đúng!');
        }
        setIsLoading(false);
        return;
      }

      if (data && data.user) {
        // Map to Admin user with permissions
        const adminUser = supabaseAuth.mapSupabaseUserToAdmin(data.user);

        if (showToast) {
          showToast(
            'success',
            'Đăng nhập thành công',
            `Chào mừng ${adminUser.fullName} (Quyền Quản trị viên).`
          );
        }

        if (onSuccess) {
          onSuccess(adminUser);
        }

        // Reset & Close
        setEmailInput('');
        setPasswordInput('');
        setErrorMessage(null);
        onClose();
      }
    } catch (err: any) {
      console.error('[LoginModal] Unexpected error:', err);
      setErrorMessage('Email hoặc mật khẩu không đúng!');
      if (showToast) {
        showToast('error', 'Đăng nhập thất bại', 'Email hoặc mật khẩu không đúng!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#143d2b] text-white p-3.5 px-5 flex items-center justify-between border-b-2 border-[#fbbf24]">
          <div className="flex items-center gap-3 font-bold text-amber-300 text-sm tracking-wide">
            <UnitLogo size="sm" withGlow withRotatingBeam />
            <span className="uppercase">TRUYỀN THÔNG ĐOÀN MANG YANG</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-700 mb-2 border border-red-200 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-tight">
              Xác thực Quản trị viên
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Đồng bộ tài khoản an toàn qua Supabase Authentication
            </p>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                <span>Email hoặc tên tài khoản (*):</span>
              </label>
              <input
                type="text"
                id="login-email-input"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Nhập email hoặc tên tài khoản..."
                className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all placeholder:text-gray-400"
                required
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-gray-500" />
                <span>Mật khẩu (*):</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password-input"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Nhập mật khẩu tài khoản..."
                  className="w-full text-xs p-2.5 pr-10 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all placeholder:text-gray-400"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-submit-supabase-login"
              disabled={isLoading}
              className="w-full bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>ĐANG XÁC THỰC SUPABASE...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>ĐĂNG NHẬP QUẢN TRỊ VIÊN</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Notice */}
          <div className="pt-2 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Phiên đăng nhập được mã hóa và duy trì tự động qua Supabase Auth</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
