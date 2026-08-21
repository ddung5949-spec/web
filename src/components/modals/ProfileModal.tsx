import React, { useRef, useState, useEffect } from 'react';
import { Camera, Calendar, IdCard, Medal, Save, Shield, User, X } from 'lucide-react';
import { User as UserType } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  currentUser: UserType | null;
  onClose: () => void;
  onSaveProfile: (updatedUser: Partial<UserType>) => void;
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

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSaveProfile,
}) => {
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [rank, setRank] = useState('Binh nhất');
  const [position, setPosition] = useState('Chiến sĩ');
  const [rankUnit, setRankUnit] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setBirthDate(currentUser.birthDate || '');
      setRank(currentUser.rank || 'Binh nhất');
      setPosition(currentUser.position || 'Chiến sĩ');
      setRankUnit(currentUser.rankUnit || '');
      setAvatarPreview(
        currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
      );
      setNewPassword('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Không được để trống họ và tên!');
      return;
    }

    const calculatedRankUnit = rank && position ? `${rank} - ${position}` : rankUnit.trim();

    const updates: Partial<UserType> = {
      fullName: fullName.trim(),
      birthDate: birthDate,
      rank: rank,
      position: position,
      rankUnit: calculatedRankUnit || 'Chiến sĩ',
      avatar: avatarPreview,
    };

    if (newPassword.trim()) {
      updates.password = newPassword.trim();
    }

    onSaveProfile(updates);
    onClose();
    alert('Đã cập nhật hồ sơ quân nhân thành công!');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#143d2b] text-white p-3.5 px-5 flex items-center justify-between border-b-2 border-[#fbbf24]">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            <IdCard className="w-4 h-4 text-amber-300" />
            <span>HỒ SƠ QUÂN NHÂN & ẢNH ĐẠI DIỆN</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {/* Avatar Upload */}
          <div className="text-center space-y-1.5 pb-1">
            <div className="relative inline-block">
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-amber-400 mx-auto shadow-xs"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-gray-800 hover:bg-gray-900 text-white p-1.5 rounded-full border border-white shadow-xs cursor-pointer"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarFile}
              className="hidden"
            />
            <div className="text-[11px] text-gray-500">
              Nhấn biểu tượng máy ảnh để tải ảnh chân dung
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>Họ và tên quân nhân (*):</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ngày tháng năm sinh:</span>
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:outline-hidden text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cấp bậc:</span>
              </label>
              <select
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full text-xs p-2 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:outline-hidden font-medium"
              >
                {MILITARY_RANKS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <span>Chức vụ:</span>
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full text-xs p-2 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:outline-hidden font-medium"
              >
                {MILITARY_POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Đổi mật khẩu (Để trống nếu giữ nguyên):
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>LƯU HỒ SƠ QUÂN NHÂN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
