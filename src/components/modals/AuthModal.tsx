import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  User,
  X,
  AlertCircle,
} from 'lucide-react';
import { UnitLogo } from '../UnitLogo';
import { supabase } from '../../utils/supabase';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'register';
  onClose: () => void;
  onLogin: (usernameOrEmail: string, password: string) => boolean | Promise<boolean>;
  onRegister?: (data: any) => boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  // Login States
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const identifier = loginUser.trim();
    const password = loginPass;

    if (!identifier || !password) {
      setLoginError('Vui lòng nhập đầy đủ Email/Tên tài khoản và Mật khẩu!');
      return;
    }

    setIsLoggingIn(true);

    try {
      // 1. Try Supabase Auth if input looks like an email or direct call
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password,
      });

      if (!error && data?.user) {
        setLoginUser('');
        setLoginPass('');
        setLoginError(null);
        onClose();
        setIsLoggingIn(false);
        return;
      }

      // 2. Call onLogin prop (which also attempts fallback authentication)
      const success = await Promise.resolve(onLogin(identifier, password));
      if (success) {
        setLoginUser('');
        setLoginPass('');
        setLoginError(null);
        onClose();
      } else {
        setLoginError('Email hoặc mật khẩu không chính xác!');
      }
    } catch (err) {
      console.warn('[AuthModal] login error:', err);
      setLoginError('Email hoặc mật khẩu không chính xác!');
    } finally {
      setIsLoggingIn(false);
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

        <div className="p-5 sm:p-6">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-500" />
                <span>Email hoặc tên tài khoản (*):</span>
              </label>
              <input
                type="text"
                id="login-username-input"
                value={loginUser}
                onChange={(e) => {
                  setLoginUser(e.target.value);
                  if (loginError) setLoginError(null);
                }}
                placeholder="Nhập email hoặc tên tài khoản..."
                className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all"
                required
                disabled={isLoggingIn}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-gray-500" />
                <span>Mật khẩu (*):</span>
              </label>
              <div className="relative">
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  id="login-password-input"
                  value={loginPass}
                  onChange={(e) => {
                    setLoginPass(e.target.value);
                    if (loginError) setLoginError(null);
                  }}
                  placeholder="Nhập mật khẩu..."
                  className="w-full text-xs p-2.5 pr-10 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all"
                  required
                  disabled={isLoggingIn}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                >
                  {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-login"
              disabled={isLoggingIn}
              className="w-full bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer mt-3"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>ĐANG XÁC THỰC SUPABASE...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>ĐĂNG NHẬP HỆ THỐNG</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
