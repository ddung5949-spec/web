import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  Lock,
  LogIn,
  Medal,
  Shield,
  User,
  UserCheck,
  UserPlus,
  X,
  AlertCircle,
} from 'lucide-react';
import { UnitLogo } from '../UnitLogo';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'register';
  onClose: () => void;
  onLogin: (username: string, password: string) => boolean;
  onRegister: (data: {
    username: string;
    password: string;
    fullName: string;
    birthDate?: string;
    rank?: string;
    position?: string;
    rankUnit?: string;
  }) => boolean;
}

const MILITARY_RANKS = [
  'Binh nhì',
  'Binh nhất',
  'Hạ sĩ',
  'Trung sĩ',
  'Thượng sĩ',
  'Thiếu úy QNCN',
  'Trung úy QNCN',
  'Thượng úy QNCN',
  'Đại úy QNCN',
  'Thiếu tá QNCN',
  'Trung tá QNCN',
  'Thượng tá QNCN',
  'Thiếu úy',
  'Trung úy',
  'Thượng úy',
  'Đại úy',
  'Thiếu tá',
  'Trung tá',
  'Thượng tá',
  'Đại tá',
];

const MILITARY_POSITIONS = [
  'Chiến sĩ',
  'Tiểu đội trưởng',
  'Trung đội phó',
  'Trung đội trưởng',
  'Chính trị viên phó Đại đội',
  'Đại đội trưởng',
  'Chính trị viên Đại đội',
  'Phó Tiểu đoàn trưởng',
  'Tiểu đoàn trưởng',
  'Chính trị viên Tiểu đoàn',
  'Trợ lý Ban Chính trị',
  'Trợ lý Ban Tham mưu',
  'Trợ lý Ban Hậu cần - Kỹ thuật',
  'Phó Trưởng ban',
  'Trưởng ban',
  'Phó Trung đoàn trưởng',
  'Phó Chính ủy Trung đoàn',
  'Trung đoàn trưởng',
  'Chính ủy Trung đoàn',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'login',
  onClose,
  onLogin,
  onRegister,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);

  // Login States
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register States: Tên tài khoản, Mật khẩu, Nhập lại mật khẩu, Họ và tên, Ngày sinh, Cấp bậc, Chức vụ
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const [regFullName, setRegFullName] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regRank, setRegRank] = useState('Binh nhất');
  const [regPosition, setRegPosition] = useState('Chiến sĩ');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser.trim() || !loginPass.trim()) {
      alert('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
      return;
    }
    const success = onLogin(loginUser.trim(), loginPass.trim());
    if (success) {
      setLoginUser('');
      setLoginPass('');
      onClose();
    } else {
      alert(
        'Tên đăng nhập hoặc mật khẩu chưa chính xác! (Tài khoản mẫu: admin / 123 hoặc canbo24 / 123)'
      );
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Username
    const cleanUsername = regUsername.trim().toLowerCase();
    if (!cleanUsername) {
      alert('Vui lòng nhập tên tài khoản đăng nhập!');
      return;
    }
    if (cleanUsername.includes(' ')) {
      alert('Tên tài khoản không được chứa khoảng trắng!');
      return;
    }

    // Validate Passwords
    if (!regPassword) {
      alert('Vui lòng nhập mật khẩu!');
      return;
    }
    if (regPassword.length < 3) {
      alert('Mật khẩu phải có ít nhất 3 ký tự!');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert('Mật khẩu và xác nhận mật khẩu không khớp nhau!');
      return;
    }

    // Validate Full Name
    if (!regFullName.trim()) {
      alert('Vui lòng nhập đầy đủ họ và tên quân nhân!');
      return;
    }

    // Validate Birth Date
    if (!regBirthDate) {
      alert('Vui lòng chọn ngày tháng năm sinh!');
      return;
    }

    const rankUnitString = `${regRank} - ${regPosition}`;

    const success = onRegister({
      username: cleanUsername,
      password: regPassword.trim(),
      fullName: regFullName.trim(),
      birthDate: regBirthDate,
      rank: regRank,
      position: regPosition,
      rankUnit: rankUnitString,
    });

    if (success) {
      // Reset form
      setRegUsername('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegFullName('');
      setRegBirthDate('');
      setRegRank('Binh nhất');
      setRegPosition('Chiến sĩ');
      setTab('login');
      alert('Đăng ký tài khoản quân nhân thành công! Vui lòng đăng nhập để bắt đầu.');
    } else {
      alert('Tên tài khoản này đã tồn tại trên hệ thống, vui lòng chọn tên tài khoản khác!');
    }
  };

  const fillQuickAccount = (u: string, p: string) => {
    setLoginUser(u);
    setLoginPass(p);
  };

  const isPasswordMatched =
    regPassword.length > 0 &&
    regConfirmPassword.length > 0 &&
    regPassword === regConfirmPassword;

  const isPasswordMismatch =
    regConfirmPassword.length > 0 && regPassword !== regConfirmPassword;

  return (
    <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#143d2b] text-white p-3.5 px-5 flex items-center justify-between border-b-2 border-[#fbbf24]">
          <div className="flex items-center gap-3 font-bold text-amber-300 text-sm tracking-wide">
            <UnitLogo size="sm" withGlow withRotatingBeam />
            <span>XÁC THỰC QUÂN NHÂN - SƯ ĐOÀN 10</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200 bg-gray-50/80">
          <button
            type="button"
            id="tab-btn-login"
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'login'
                ? 'text-red-700 border-b-2 border-red-700 bg-white shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>ĐĂNG NHẬP</span>
          </button>
          <button
            type="button"
            id="tab-btn-register"
            onClick={() => setTab('register')}
            className={`flex-1 py-3 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'register'
                ? 'text-emerald-800 border-b-2 border-emerald-800 bg-white shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ĐĂNG KÝ HỒ SƠ MỚI</span>
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {tab === 'login' ? (
            /* =========================================================================
               TAB: ĐĂNG NHẬP
               ========================================================================= */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span>Tên đăng nhập / Tài khoản (*):</span>
                </label>
                <input
                  type="text"
                  id="login-username-input"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="Nhập tên tài khoản (ví dụ: admin hoặc canbo24)..."
                  className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all"
                  required
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
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full text-xs p-2.5 pr-10 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-hidden transition-all"
                    required
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

              {/* Quick Login Helpers */}
              <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-lg text-[11px] text-amber-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1 text-amber-900">
                  <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Đăng nhập nhanh tài khoản mẫu:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('admin', '123')}
                    className="bg-white border border-amber-300 text-amber-900 px-2.5 py-1 rounded text-[11px] hover:bg-amber-100 font-semibold cursor-pointer shadow-2xs"
                  >
                    Admin (Ban Chính trị)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('canbo24', '123')}
                    className="bg-white border border-amber-300 text-amber-900 px-2.5 py-1 rounded text-[11px] hover:bg-amber-100 font-semibold cursor-pointer shadow-2xs"
                  >
                    Đảng ủy viên Trung đoàn
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('chiensi66', '123')}
                    className="bg-white border border-amber-300 text-amber-900 px-2.5 py-1 rounded text-[11px] hover:bg-amber-100 font-semibold cursor-pointer shadow-2xs"
                  >
                    Chiến sĩ Tiểu đoàn 1
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer mt-3"
              >
                <LogIn className="w-4 h-4" />
                <span>ĐĂNG NHẬP HỆ THỐNG</span>
              </button>
            </form>
          ) : (
            /* =========================================================================
               TAB: ĐĂNG KÝ QUÂN NHÂN (7 TRƯỜNG CHUẨN QUÂN ĐỘI)
               ========================================================================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[11px] text-emerald-900 flex items-center gap-2">
                <IdCard className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Vui lòng khai báo đầy đủ hồ sơ quân nhân để quản trị viên phê duyệt phân quyền.</span>
              </div>

              {/* 1. Họ và tên */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Họ và tên (*):</span>
                </label>
                <input
                  type="text"
                  id="reg-fullname-input"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Hưng"
                  className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 focus:outline-hidden transition-all"
                  required
                />
              </div>

              {/* 2. Ngày tháng năm sinh */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Ngày tháng năm sinh (*):</span>
                </label>
                <input
                  type="date"
                  id="reg-birthdate-input"
                  value={regBirthDate}
                  onChange={(e) => setRegBirthDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 focus:outline-hidden transition-all text-gray-800"
                  required
                />
              </div>

              {/* 3 & 4. Cấp bậc & Chức vụ (Grid 2 cột) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cấp bậc */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Medal className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Cấp bậc (*):</span>
                  </label>
                  <select
                    id="reg-rank-select"
                    value={regRank}
                    onChange={(e) => setRegRank(e.target.value)}
                    className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 focus:outline-hidden transition-all text-gray-800 font-medium"
                    required
                  >
                    {MILITARY_RANKS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chức vụ */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Chức vụ (*):</span>
                  </label>
                  <select
                    id="reg-position-select"
                    value={regPosition}
                    onChange={(e) => setRegPosition(e.target.value)}
                    className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 focus:outline-hidden transition-all text-gray-800 font-medium"
                    required
                  >
                    {MILITARY_POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-3">
                {/* 5. Tên tài khoản */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Tên tài khoản (*):</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">viết liền, không dấu</span>
                  </label>
                  <input
                    type="text"
                    id="reg-username-input"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Ví dụ: vanhung95, nguyenvanhung..."
                    className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 focus:outline-hidden transition-all font-mono"
                    required
                  />
                </div>

                {/* 6. Mật khẩu */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Mật khẩu (*):</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      id="reg-password-input"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Tối thiểu 3 ký tự..."
                      className="w-full text-xs p-2.5 pr-10 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 focus:outline-hidden transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 7. Nhập lại mật khẩu */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Nhập lại mật khẩu (*):</span>
                    </span>
                    {isPasswordMatched && (
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Khớp mật khẩu
                      </span>
                    )}
                    {isPasswordMismatch && (
                      <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Chưa trùng khớp
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      id="reg-confirm-password-input"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu đã nhập ở trên..."
                      className={`w-full text-xs p-2.5 pr-10 bg-gray-50/50 border rounded-lg focus:bg-white focus:outline-hidden transition-all ${
                        isPasswordMismatch
                          ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                          : isPasswordMatched
                          ? 'border-emerald-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                          : 'border-gray-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                    >
                      {showRegConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-register"
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer mt-4"
              >
                <UserPlus className="w-4 h-4" />
                <span>ĐĂNG KÝ HỒ SƠ QUÂN NHÂN</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
