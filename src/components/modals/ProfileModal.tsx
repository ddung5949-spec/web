import React, { useRef, useState, useEffect } from 'react';
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  Loader2,
  Lock,
  Medal,
  Save,
  Shield,
  User as UserIcon,
  X,
} from 'lucide-react';
import { User as UserType } from '../../types';
import { supabase } from '../../utils/supabase';
import { toast } from '../Toast';

interface ProfileModalProps {
  isOpen: boolean;
  currentUser: UserType | null;
  onClose: () => void;
  onSaveProfile?: (updatedUser: Partial<UserType>) => void;
  showToast?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const MILITARY_RANKS = [
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
  'Thiếu tướng',
  'Trung tướng',
  'Thượng tướng',
  'Đại tướng',
];

export const MILITARY_POSITIONS = [
  'Chiến sĩ',
  'Tiểu đội trưởng',
  'Trung đội phó',
  'Trung đội trưởng',
  'Phó Đại đội trưởng',
  'Chính trị viên phó Đại đội',
  'Đại đội trưởng',
  'Chính trị viên Đại đội',
  'Phó Tiểu đoàn trưởng',
  'Chính trị viên phó Tiểu đoàn',
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

/**
 * Nén ảnh tự động thành hình vuông 300x300px, JPEG chất lượng 0.7 để dung lượng nhẹ (< 50KB)
 */
export const compressAvatarImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Kiểm tra định dạng tệp
    if (!file.type.startsWith('image/')) {
      reject(new Error('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP...)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Không thể xử lý hình ảnh này'));
      img.onload = () => {
        const targetSize = 300;
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Bật làm mịn ảnh
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Tính toán cắt vuông từ giữa tâm ảnh (Center-crop)
        const minDimension = Math.min(img.width, img.height);
        const startX = (img.width - minDimension) / 2;
        const startY = (img.height - minDimension) / 2;

        ctx.drawImage(
          img,
          startX,
          startY,
          minDimension,
          minDimension,
          0,
          0,
          targetSize,
          targetSize
        );

        // Xuất ảnh nén JPEG 0.7 chất lượng cao nhưng dung lượng siêu nhẹ (< 50KB)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSaveProfile,
  showToast,
}) => {
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [rank, setRank] = useState('Binh nhất');
  const [position, setPosition] = useState('Chiến sĩ');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. NẠP DỮ LIỆU CŨ KHI MỞ MODAL
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setNewPassword('');
    setConfirmPassword('');

    // Đọc trước từ cache localStorage nếu có
    let cached: any = null;
    try {
      const raw = localStorage.getItem('user_profile_cache');
      if (raw) cached = JSON.parse(raw);
    } catch {
      // ignore
    }

    const initialFullName =
      (cached && (cached.id === currentUser.id || cached.email === currentUser.email) && cached.fullName) ||
      currentUser.fullName ||
      '';
    const initialBirthDate =
      (cached && (cached.id === currentUser.id || cached.email === currentUser.email) && cached.birthDate) ||
      currentUser.birthDate ||
      '';
    const initialRank =
      (cached && (cached.id === currentUser.id || cached.email === currentUser.email) && cached.rank) ||
      currentUser.rank ||
      'Binh nhất';
    const initialPosition =
      (cached && (cached.id === currentUser.id || cached.email === currentUser.email) && cached.position) ||
      currentUser.position ||
      'Chiến sĩ';
    const initialAvatar =
      (cached && (cached.id === currentUser.id || cached.email === currentUser.email) && cached.avatar) ||
      currentUser.avatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

    setFullName(initialFullName);
    setBirthDate(initialBirthDate);
    setRank(initialRank);
    setPosition(initialPosition);
    setAvatarPreview(initialAvatar);

    // Truy vấn dữ liệu mới nhất từ bảng profiles trên Supabase
    const fetchProfileFromSupabase = async () => {
      const targetProfileId = currentUser.authId || currentUser.id;
      if (!targetProfileId) return;
      setIsLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetProfileId)
          .maybeSingle();

        if (!error && data) {
          if (data.full_name) setFullName(data.full_name);
          if (data.birth_date) setBirthDate(data.birth_date);
          if (data.rank) setRank(data.rank);
          if (data.position) setPosition(data.position);
          if (data.avatar_url) setAvatarPreview(data.avatar_url);
        }
      } catch (err) {
        console.warn('[ProfileModal] fetch profile from Supabase error:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfileFromSupabase();
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  // 2. XỬ LÝ TẢI VÀ NÉN ẢNH ĐẠI DIỆN
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsCompressing(true);

    try {
      const compressedDataUrl = await compressAvatarImage(file);
      setAvatarPreview(compressedDataUrl);
    } catch (err: any) {
      console.error('[ProfileModal] compress avatar error:', err);
      setErrorMsg(err?.message || 'Không thể xử lý ảnh, vui lòng thử lại!');
    } finally {
      setIsCompressing(false);
      // Reset input để người dùng có thể chọn lại cùng 1 file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 3. LƯU THÔNG TIN ĐỒNG BỘ VÀO SUPABASE (DATABASE & AUTH)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      setErrorMsg('Họ và tên quân nhân không được để trống!');
      return;
    }

    if (newPassword.trim() && newPassword.trim().length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }

    if (newPassword.trim() && newPassword.trim() !== confirmPassword.trim()) {
      setErrorMsg('Xác nhận mật khẩu mới không trùng khớp!');
      return;
    }

    setIsSaving(true);

    try {
      const avatarBase64 = avatarPreview;
      const militaryRank = rank;
      const militaryPosition = position;
      const calculatedRankUnit = `${militaryRank} - ${militaryPosition}`;
      const nowIso = new Date().toISOString();

      // 1. Cập nhật vào bảng `profiles` trên Supabase:
      try {
        const targetId = currentUser.authId || currentUser.id;
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: targetId,
          email: currentUser.email || '',
          full_name: trimmedFullName,
          avatar_url: avatarBase64,
          birth_date: birthDate,
          rank: militaryRank,
          position: militaryPosition,
          updated_at: nowIso,
        });

        if (profileError) {
          console.warn('[ProfileModal] Supabase profiles table upsert notice:', profileError.message);
        }
      } catch (dbErr) {
        console.warn('[ProfileModal] DB profiles notice:', dbErr);
      }

      // 2. Cập nhật User Metadata của Supabase Auth:
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: trimmedFullName,
            avatar_url: avatarBase64,
            rank: militaryRank,
            position: militaryPosition,
            birth_date: birthDate,
            rank_unit: calculatedRankUnit,
          },
        });
      } catch (authMetaErr) {
        console.warn('[ProfileModal] Supabase auth updateUser metadata notice:', authMetaErr);
      }

      // 3. Nếu người dùng có nhập "Đổi mật khẩu mới":
      if (newPassword && newPassword.trim().length >= 6) {
        const { error: pwdErr } = await supabase.auth.updateUser({
          password: newPassword.trim(),
        });
        if (pwdErr) {
          throw new Error(`Đổi mật khẩu thất bại: ${pwdErr.message}`);
        }
      }

      // 4. Lưu vào localStorage cache để khi F5 không bị mất
      const updatedProfileCache = {
        id: currentUser.id,
        email: currentUser.email,
        fullName: trimmedFullName,
        avatar: avatarBase64,
        rank: militaryRank,
        position: militaryPosition,
        birthDate: birthDate,
        rankUnit: calculatedRankUnit,
        updated_at: nowIso,
      };

      try {
        localStorage.setItem('user_profile_cache', JSON.stringify(updatedProfileCache));
      } catch {
        // ignore
      }

      // 5. Cập nhật tức thì lên State người dùng của toàn ứng dụng (Header thay đổi ngay)
      const updatedUserData: Partial<UserType> = {
        fullName: trimmedFullName,
        avatar: avatarBase64,
        rank: militaryRank,
        position: militaryPosition,
        birthDate: birthDate,
        rankUnit: calculatedRankUnit,
      };

      if (onSaveProfile) {
        onSaveProfile(updatedUserData);
      }

      // 6. Hiển thị thông báo Toast xanh
      toast.success('Đã cập nhật hồ sơ quân nhân!', 'Thông tin cá nhân và ảnh đại diện đã được lưu thành công.');
      if (showToast) {
        showToast('success', 'Đã cập nhật hồ sơ quân nhân!', 'Thông tin cá nhân và ảnh đại diện đã được lưu thành công.');
      }

      setSuccessMsg('✅ Đã cập nhật hồ sơ quân nhân!');

      // 7. Tự động đóng modal sau chốc lát
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      console.error('[ProfileModal] Save error:', err);
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi lưu hồ sơ quân nhân!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="soldier-profile-modal"
      className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* 1. Header Modal */}
        <div className="bg-[#143d2b] text-white p-3.5 px-5 flex items-center justify-between border-b-2 border-[#fbbf24]">
          <div className="flex items-center gap-2.5 font-bold text-amber-300 text-sm">
            <IdCard className="w-4 h-4 text-amber-300" />
            <span className="uppercase">HỒ SƠ QUÂN NHÂN & ẢNH ĐẠI DIỆN</span>
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

        {/* 2. Form Nội dung Modal */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Thông báo lỗi nếu có */}
          {errorMsg && (
            <div
              id="profile-error-alert"
              className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Thông báo thành công */}
          {successMsg && (
            <div
              id="profile-success-alert"
              className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Khung Tải & Nén Ảnh đại diện Avatar */}
          <div className="text-center space-y-2 pb-1 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            <div className="relative inline-block group">
              <img
                src={avatarPreview || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt="Avatar quân nhân"
                className="w-24 h-24 rounded-full object-cover border-3 border-amber-400 mx-auto shadow-md bg-stone-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                }}
              />

              {/* Nút bấm chọn ảnh icon máy ảnh */}
              <button
                type="button"
                id="btn-upload-avatar"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing || isSaving}
                className="absolute bottom-0 right-0 bg-[#143d2b] hover:bg-emerald-800 text-amber-300 hover:text-amber-200 p-2 rounded-full border-2 border-white shadow-md cursor-pointer transition-all active:scale-95"
                title="Bấm để chọn ảnh đại diện từ máy tính / điện thoại"
              >
                {isCompressing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Input file ẩn */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleAvatarFile}
              className="hidden"
            />

            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:underline cursor-pointer"
              >
                {isCompressing ? 'Đang nén ảnh 300x300px...' : 'Thay đổi ảnh chân dung'}
              </button>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Hệ thống tự động nén vuông 300x300px chuẩn & dung lượng siêu nhẹ
              </p>
            </div>
          </div>

          {/* Họ và tên quân nhân */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>Họ và tên quân nhân (*):</span>
            </label>
            <input
              type="text"
              id="profile-fullname-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên..."
              className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 focus:outline-hidden font-semibold text-gray-900"
              required
              disabled={isSaving}
            />
          </div>

          {/* Ngày tháng năm sinh */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ngày tháng năm sinh:</span>
            </label>
            <input
              type="date"
              id="profile-birthdate-input"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full text-xs p-2.5 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 focus:outline-hidden text-gray-800"
              disabled={isSaving}
            />
          </div>

          {/* Cấp bậc & Chức vụ */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cấp bậc:</span>
              </label>
              <select
                id="profile-rank-select"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full text-xs p-2 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 focus:outline-hidden font-medium text-gray-800"
                disabled={isSaving}
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
                id="profile-position-select"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full text-xs p-2 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 focus:outline-hidden font-medium text-gray-800"
                disabled={isSaving}
              >
                {MILITARY_POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Khung Đổi Mật Khẩu Mới */}
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-gray-500" />
              <span>Đổi mật khẩu mới (để trống nếu giữ nguyên):</span>
            </div>

            <div className="space-y-2.5">
              {/* Mật khẩu mới */}
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="profile-new-password-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                  className="w-full text-xs p-2.5 pr-10 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 focus:outline-hidden"
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Nhập lại mật khẩu mới */}
              {newPassword.trim().length > 0 && (
                <div className="relative animate-in fade-in">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="profile-confirm-password-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận lại mật khẩu mới..."
                    className="w-full text-xs p-2.5 pr-10 bg-gray-50/50 border border-gray-300 rounded-lg focus:bg-white focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 focus:outline-hidden"
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Nút Submit Lưu hồ sơ quân nhân */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-save-soldier-profile"
              disabled={isSaving || isCompressing}
              className="w-full bg-[#143d2b] hover:bg-emerald-900 disabled:bg-emerald-600 text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>ĐANG ĐỒNG BỘ LÊN CƠ SỞ DỮ LIỆU...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>LƯU HỒ SƠ QUÂN NHÂN</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
