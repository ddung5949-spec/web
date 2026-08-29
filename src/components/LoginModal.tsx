import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  User,
  UserPlus,
  Users,
  ShieldCheck,
  X,
} from 'lucide-react';
import { supabase, supabaseAuth } from '../utils/supabase';
import { User as UserType } from '../types';
import { UnitLogo } from './UnitLogo';

interface LoginModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'register';
  onClose: () => void;
  onSuccess?: (user: UserType) => void;
  showToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  initialTab = 'login',
  onClose,
  onSuccess,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Tab 1: Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Tab 2: Register States
  const [regFullName, setRegFullName] = useState('');
  const [regUnit, setRegUnit] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'login');
      setLoginError(null);
      setRegError(null);
      setRegSuccess(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Xử lý chuẩn hóa Email/Tên tài khoản cho Supabase
  const formatAuthEmail = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.includes('@')) {
      return trimmed;
    }
    // Nếu nhập tên tài khoản không có @, định dạng theo domain hệ thống
    const cleanUser = trimmed.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    return `${cleanUser}@doanmangyang95.vn`;
  };

  // 1. XỬ LÝ ĐĂNG NHẬP SUPABASE AUTH
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const identifier = loginEmail.trim();
    const password = loginPassword;

    if (!identifier || !password) {
      setLoginError('Vui lòng nhập đầy đủ Email/Tên tài khoản và Mật khẩu!');
      return;
    }

    setIsLoggingIn(true);

    try {
      // Thử đăng nhập với chuỗi trực tiếp
      const emailToAuth = formatAuthEmail(identifier);
      let { data, error } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password: password,
      });

      // Nếu không thành công và ban đầu người dùng nhập chuỗi gốc khác emailToAuth, thử lại với chuỗi gốc
      if (error && identifier !== emailToAuth) {
        const retryResult = await supabase.auth.signInWithPassword({
          email: identifier,
          password: password,
        });
        if (!retryResult.error && retryResult.data?.user) {
          data = retryResult.data;
          error = null;
        }
      }

      if (error) {
        console.warn('[LoginModal] Supabase Auth Error:', error.message);
        setLoginError('Email/Tên tài khoản hoặc mật khẩu không chính xác!');
        if (showToast) {
          showToast('error', 'Đăng nhập thất bại', 'Email hoặc mật khẩu không chính xác!');
        }
        setIsLoggingIn(false);
        return;
      }

      if (data && data.user) {
        const loggedUser = supabaseAuth.mapSupabaseUserToAdmin(data.user);

        if (showToast) {
          showToast(
            'success',
            'Đăng nhập thành công',
            `Chào mừng ${loggedUser.fullName}!`
          );
        }

        if (onSuccess) {
          onSuccess(loggedUser);
        }

        // Reset & Đóng modal
        setLoginEmail('');
        setLoginPassword('');
        setLoginError(null);
        onClose();
      }
    } catch (err: any) {
      console.error('[LoginModal] Unexpected error:', err);
      setLoginError('Email hoặc mật khẩu không đúng!');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. XỬ LÝ ĐĂNG KÝ HỒ SƠ MỚI QUA SUPABASE AUTH
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    const fullName = regFullName.trim();
    const unit = regUnit.trim();
    const emailRaw = regEmail.trim();
    const password = regPassword;
    const confirmPass = regConfirmPassword;

    if (!fullName) {
      setRegError('Vui lòng nhập Họ và tên!');
      return;
    }
    if (!unit) {
      setRegError('Vui lòng nhập Đơn vị / Bộ phận!');
      return;
    }
    if (!emailRaw) {
      setRegError('Vui lòng nhập Email hoặc tên tài khoản!');
      return;
    }
    if (!password) {
      setRegError('Vui lòng nhập Mật khẩu!');
      return;
    }
    if (password.length < 6) {
      setRegError('Mật khẩu phải có tối thiểu 6 ký tự!');
      return;
    }
    if (password !== confirmPass) {
      setRegError('Xác nhận mật khẩu không trùng khớp!');
      return;
    }

    setIsRegistering(true);

    try {
      const emailToSignUp = formatAuthEmail(emailRaw);

      const { data, error } = await supabase.auth.signUp({
        email: emailToSignUp,
        password: password,
        options: {
          data: {
            full_name: fullName,
            unit: unit,
            role: 'admin',
          },
        },
      });

      if (error) {
        console.warn('[LoginModal] Supabase SignUp Error:', error.message);
        setRegError(error.message || 'Không thể tạo tài khoản, vui lòng thử lại!');
        setIsRegistering(false);
        return;
      }

      setRegSuccess('Đăng ký hồ sơ thành công! Đang tự động đăng nhập...');

      // Tự động đăng nhập sau khi tạo thành công
      setTimeout(async () => {
        try {
          const loginResult = await supabase.auth.signInWithPassword({
            email: emailToSignUp,
            password: password,
          });

          if (loginResult.data?.user) {
            const loggedUser = supabaseAuth.mapSupabaseUserToAdmin(loginResult.data.user);
            if (onSuccess) {
              onSuccess(loggedUser);
            }
            if (showToast) {
              showToast(
                'success',
                'Đăng ký & Đăng nhập thành công',
                `Chào mừng đồng chí ${fullName}!`
              );
            }
          }
        } catch {
          // ignore
        }

        // Reset form
        setRegFullName('');
        setRegUnit('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
        setRegError(null);
        setRegSuccess(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('[LoginModal] Register Exception:', err);
      setRegError(err?.message || 'Có lỗi xảy ra khi tạo tài khoản!');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div
      id="auth-login-modal"
      className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* 1. Header Modal (Nền xanh quân đội) */}
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

        {/* 2. Thanh 2 Tab chuyển đổi nằm ngay dưới header xanh */}
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
              setRegError(null);
              setRegSuccess(null);
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

        {/* 3. Nội dung Modal (2 Tab) */}
        <div className="p-5 sm:p-6">
          {activeTab === 'login' ? (
            /* TAB 1: FORM ĐĂNG NHẬP */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div
                  id="login-error-alert"
                  className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Ô Email hoặc Tên tài khoản */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span>Email hoặc tên tài khoản (*):</span>
                </label>
                <input
                  type="text"
                  id="login-email-input"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (loginError) setLoginError(null);
                  }}
                  placeholder="Nhập email hoặc tên tài khoản..."
                  className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all placeholder:text-gray-400"
                  required
                  autoFocus
                  disabled={isLoggingIn}
                />
              </div>

              {/* Ô Mật khẩu */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-500" />
                  <span>Mật khẩu (*):</span>
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    id="login-password-input"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="Nhập mật khẩu..."
                    className="w-full text-xs p-2.5 pr-10 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all placeholder:text-gray-400"
                    required
                    disabled={isLoggingIn}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nút Đăng nhập */}
              <button
                type="submit"
                id="btn-submit-supabase-login"
                disabled={isLoggingIn}
                className="w-full bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer mt-4"
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
              {regError && (
                <div
                  id="register-error-alert"
                  className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div
                  id="register-success-alert"
                  className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{regSuccess}</span>
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
                    if (regError) setRegError(null);
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
                    if (regError) setRegError(null);
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
                  <span>Email hoặc tên tài khoản (*):</span>
                </label>
                <input
                  type="text"
                  id="register-email-input"
                  value={regEmail}
                  onChange={(e) => {
                    setRegEmail(e.target.value);
                    if (regError) setRegError(null);
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
                    type={showRegPassword ? 'text' : 'password'}
                    id="register-password-input"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (regError) setRegError(null);
                    }}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
                    className="w-full text-xs p-2.5 pr-10 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all"
                    required
                    disabled={isRegistering}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Xác nhận lại mật khẩu */}
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
                      if (regError) setRegError(null);
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
                    tabIndex={-1}
                  >
                    {showRegConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nút Đăng ký */}
              <button
                type="submit"
                id="btn-submit-register"
                disabled={isRegistering}
                className="w-full bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer mt-3"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>ĐANG TẠO HỒ SƠ...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
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

export default LoginModal;
