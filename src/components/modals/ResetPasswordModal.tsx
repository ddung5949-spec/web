import React, { useState } from 'react';
import { Check, Copy, Eye, EyeOff, Key, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { User } from '../../types';

interface ResetPasswordModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSavePassword: (userId: number, newPass: string) => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  user,
  onClose,
  onSavePassword,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !user) return null;

  const handleGenerateRandom = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz@#$';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
    setError('');
  };

  const handleCopy = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setError('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPassword.length < 3) {
      setError('Mật khẩu tối thiểu từ 3 ký tự trở lên.');
      return;
    }
    onSavePassword(user.id, newPassword.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-red-900 to-amber-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Đặt lại mật khẩu quân nhân</h3>
              <p className="text-[11px] text-amber-200/80">Khôi phục quyền truy cập cho người dùng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* User Info Card */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center gap-3">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={user.fullName}
              className="w-10 h-10 rounded-full object-cover border border-gray-300"
            />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-gray-900 truncate">{user.fullName}</div>
              <div className="text-[11px] text-gray-500 truncate">{user.rankUnit}</div>
              <div className="text-[11px] text-red-700 font-semibold">Tên đăng nhập: {user.username}</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              Mật khẩu mới cho tài khoản <span className="text-red-700 font-black">{user.username}</span>:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                placeholder="Nhập mật khẩu mới..."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:border-red-600 pr-20 font-mono"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {newPassword && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 text-gray-400 hover:text-red-700 rounded cursor-pointer"
                    title="Sao chép mật khẩu"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateRandom}
              className="text-xs text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Tạo mật khẩu ngẫu nhiên</span>
            </button>
            <button
              type="button"
              onClick={() => setNewPassword('123456')}
              className="text-xs text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-2.5 py-1.5 rounded-md font-bold transition-colors cursor-pointer"
            >
              Đặt mặc định "123456"
            </button>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              Sau khi đặt lại, thông tin mật khẩu mới sẽ được lưu ngay lập tức và đồng bộ toàn hệ thống. Hãy gửi mật khẩu mới cho quân nhân để đăng nhập lại.
            </p>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-linear-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Xác nhận đổi mật khẩu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
