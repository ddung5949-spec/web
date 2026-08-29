import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  ShieldCheck,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { UnitLogo } from '../UnitLogo';
import { supabase } from '../../utils/supabase';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'register';
  onClose: () => void;
  onLogin: (usernameOrEmail: string, password: string) => boolean | Promise<boolean>;
  onRegister?: (data: {
    username: string;
    password: string;
    fullName: string;
    rankUnit?: string;
    birthDate?: string;
    rank?: string;
    position?: string;
  }) => boolean | Promise<boolean>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'login',
  onClose,
  onLogin,
  onRegister,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login States
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register States
  const [regFullName, setRegFullName] = useState('');
  const [regUnit, setRegUnit] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  // Sync initial tab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'login');
      setLoginError(null);
      setRegisterError(null);
      setRegisterSuccess(null);
    }
  }, [isOpen, initialTab]);

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);

    const fullName = regFullName.trim();
    const unit = regUnit.trim();
    const username = regUsername.trim();
    const password = regPassword;
    const confirmPass = regConfirmPassword;

    if (!fullName) {
      setRegisterError('Vui lòng nhập Họ và tên!');
      return;
    }
    if (!unit) {
      setRegisterError('Vui lòng nhập Đơn vị / Bộ phận!');
      return;
    }
    if (!username) {
      setRegisterError('Vui lòng nhập Email hoặc Tên tài khoản!');
      return;
    }
    if (!password) {
      setRegisterError('Vui lòng nhập Mật khẩu!');
      return;
    }
    if (password.length < 6) {
      setRegisterError('Mật khẩu phải có tối thiểu 6 ký tự!');
      return;
    }
    if (password !== confirmPass) {
      setRegisterError('Xác nhận mật khẩu không trùng khớp!');
      return;
    }

    setIsRegistering(true);

    try {
      if (onRegister) {
        const success = await Promise.resolve(
          onRegister({
            fullName,
            rankUnit: unit,
            username,
            password,
          })
        );

        if (!success) {
          setRegisterError('Tên tài khoản hoặc Email này đã tồn tại trên hệ thống!');
          setIsRegistering(false);
          return;
        }

        // Auto login immediately
        setRegisterSuccess('Đăng ký tài khoản thành công!');
        setTimeout(async () => {
          await Promise.resolve(onLogin(username, password));
          setRegFullName('');
          setRegUnit('');
          setRegUsername('');
          setRegPassword('');
          setRegConfirmPassword('');
          setRegisterError(null);
          setRegisterSuccess(null);
          onClose();
        }, 800);
      } else {
        setRegisterError('Chức năng đăng ký tạm thời không khả dụng.');
      }
    } catch (err: any) {
      console.error('[AuthModal] Register error:', err);
      setRegisterError(err?.message || 'Có lỗi xảy ra khi tạo tài khoản!');
    } finally {
      setIsRegistering(false);
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

        {/* 2 Navigation Tabs */}
        <div className="grid grid-cols-2 border-b border-gray-200 bg-gray-50/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'login'
                ? 'border-red-600 text-red-700 bg-white shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>ĐĂNG NHẬP</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setRegisterError(null);
              setRegisterSuccess(null);
            }}
            className={`py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'register'
                ? 'border-red-600 text-red-700 bg-white shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>ĐĂNG KÝ HỒ SƠ MỚI</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6">
          {activeTab === 'login' ? (
            /* TAB 1: FORM ĐĂNG NHẬP */
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
                    <span>ĐANG XÁC THỰC...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>ĐĂNG NHẬP HỆ THỐNG</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs text-red-700 hover:text-red-800 font-semibold hover:underline cursor-pointer"
                >
                  Chưa có tài khoản? Nhấn để Đăng ký hồ sơ mới
                </button>
              </div>
            </form>
          ) : (
            /* TAB 2: FORM ĐĂNG KÝ HỒ SƠ MỚI */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {registerError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{registerError}</span>
                </div>
              )}

              {registerSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{registerSuccess}</span>
                </div>
              )}

              {/* Họ và tên */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span>Họ và tên (*):</span>
                </label>
                <input
                  type="text"
                  id="register-fullname-input"
                  value={regFullName}
                  onChange={(e) => {
                    setRegFullName(e.target.value);
                    if (registerError) setRegisterError(null);
                  }}
                  placeholder="Nhập họ và tên..."
                  className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all"
                  required
                  disabled={isRegistering}
                  autoFocus
                />
              </div>

              {/* Đơn vị / Bộ phận */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  <span>Đơn vị / Bộ phận (*):</span>
                </label>
                <input
                  type="text"
                  id="register-unit-input"
                  value={regUnit}
                  onChange={(e) => {
                    setRegUnit(e.target.value);
                    if (registerError) setRegisterError(null);
                  }}
                  placeholder="Nhập đơn vị (Đại đội, Tiểu đoàn...)"
                  className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all"
                  required
                  disabled={isRegistering}
                />
              </div>

              {/* Email / Tên tài khoản */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
                  <span>Email / Tên tài khoản (*):</span>
                </label>
                <input
                  type="text"
                  id="register-username-input"
                  value={regUsername}
                  onChange={(e) => {
                    setRegUsername(e.target.value);
                    if (registerError) setRegisterError(null);
                  }}
                  placeholder="Nhập email hoặc tên tài khoản..."
                  className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all"
                  required
                  disabled={isRegistering}
                />
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-500" />
                  <span>Mật khẩu (*):</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    id="register-password-input"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (registerError) setRegisterError(null);
                    }}
                    placeholder="Nhập mật khẩu..."
                    className="w-full text-xs p-2.5 pr-10 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all"
                    required
                    disabled={isRegistering}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                  >
                    {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-500" />
                  <span>Nhập lại mật khẩu (*):</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegConfirmPass ? 'text' : 'password'}
                    id="register-confirm-password-input"
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      if (registerError) setRegisterError(null);
                    }}
                    placeholder="Xác nhận lại mật khẩu..."
                    className="w-full text-xs p-2.5 pr-10 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all"
                    required
                    disabled={isRegistering}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPass(!showRegConfirmPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                  >
                    {showRegConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-register"
                disabled={isRegistering}
                className="w-full bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-800 hover:to-amber-800 disabled:opacity-60 text-white font-extrabold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer mt-3 uppercase tracking-wide border border-amber-400/50"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>ĐANG TẠO HỒ SƠ...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-amber-300" />
                    <span>ĐĂNG KÝ TÀI KHOẢN</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-red-700 hover:text-red-800 font-semibold hover:underline cursor-pointer"
                >
                  Đã có tài khoản? Nhấn để Đăng nhập
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

