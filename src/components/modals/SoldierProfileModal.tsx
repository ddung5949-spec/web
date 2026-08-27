import React, { useState } from 'react';
import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle2,
  FileText,
  KeyRound,
  Link,
  Mail,
  Phone,
  Save,
  Shield,
  Unlink,
  User,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { MilitaryProfile, RoleDefinition, User as UserType } from '../../types';

interface SoldierProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MilitaryProfile | null;
  onSave: (profile: MilitaryProfile, syncUser?: { createAccount?: boolean; selectedUserId?: number | null }) => void;
  allUsers: UserType[];
  roles: RoleDefinition[];
  defaultUnit?: string;
}

export const SoldierProfileModal: React.FC<SoldierProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  allUsers,
  roles,
  defaultUnit = 'Ban Tuyên huấn - Phòng Chính trị Sư đoàn 10',
}) => {
  const isEditing = !!profile;

  const [formData, setFormData] = useState<MilitaryProfile>(() => {
    if (profile) {
      return { ...profile };
    }
    return {
      id: Date.now(),
      militaryCode: `SQ-${Math.floor(10000 + Math.random() * 90000)}`,
      fullName: '',
      birthDate: '1995-01-01',
      rank: 'Thượng úy',
      position: 'Trợ lý',
      unit: defaultUnit,
      hometown: 'Gia Lai',
      enlistmentDate: '2014-09-01',
      partyJoinDate: '',
      phoneNumber: '',
      avatar: '',
      notes: '',
      status: 'active',
      userId: null,
      username: '',
      totalActiveMinutes: 0,
      sessionCount: 0,
      isOnline: false,
    };
  });

  const [linkMode, setLinkMode] = useState<'existing' | 'create_new' | 'none'>(
    profile?.userId ? 'existing' : 'none'
  );
  const [selectedUserId, setSelectedUserId] = useState<number | null>(profile?.userId || null);
  const [newAccountUsername, setNewAccountUsername] = useState(
    profile?.username || (formData.militaryCode ? formData.militaryCode.toLowerCase().replace(/[^a-z0-9]/g, '') : '')
  );
  const [newAccountPassword, setNewAccountPassword] = useState('123456');
  const [newAccountRole, setNewAccountRole] = useState<string>('user');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Available users not yet linked to other soldiers (or currently linked to this soldier)
  const availableUsers = allUsers.filter(
    (u) => !u.profileId || (profile && u.profileId === profile.id) || (profile && profile.userId === u.id)
  );

  const linkedUser = allUsers.find((u) => u.id === formData.userId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên quân nhân.');
      return;
    }
    if (!formData.militaryCode.trim()) {
      setError('Vui lòng nhập số hiệu quân nhân.');
      return;
    }

    const updatedProfile: MilitaryProfile = {
      ...formData,
      userId: linkMode === 'existing' ? selectedUserId : linkMode === 'none' ? null : formData.userId,
      username:
        linkMode === 'existing'
          ? allUsers.find((u) => u.id === selectedUserId)?.username || ''
          : linkMode === 'none'
          ? ''
          : formData.username,
    };

    onSave(updatedProfile, {
      createAccount: linkMode === 'create_new',
      selectedUserId: linkMode === 'existing' ? selectedUserId : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Modal Header - Fixed */}
        <div className="shrink-0 px-5 sm:px-6 py-4 bg-linear-to-r from-red-950 via-red-900 to-amber-950 text-white flex items-center justify-between border-b border-amber-500/30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center border border-amber-400/30 shrink-0 shadow-xs">
              <UserCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                {isEditing ? 'Cập nhật Hồ sơ Quân nhân' : 'Thêm mới Hồ sơ Quân nhân'}
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-200/90 font-medium">
                Sư đoàn 10 • Đồng bộ trực tiếp với dữ liệu tài khoản và phân quyền
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form - Cleanly Scrollable with Card Sections */}
        <form
          id="soldier-profile-form"
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/70"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Card 1: Thông tin Quân chính & Nhân sự */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="w-2 h-4 bg-red-700 rounded-full inline-block" />
              <h3 className="text-xs font-black uppercase tracking-wider text-red-950">
                1. Thông tin Quân chính & Nhân sự
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Số hiệu quân nhân / Số quân <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.militaryCode}
                  onChange={(e) => setFormData({ ...formData, militaryCode: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: SQ-10248"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Họ và tên quân nhân <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ví dụ: Hoàng Quốc Việt"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cấp bậc</label>
                <select
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden cursor-pointer"
                >
                  <option value="Binh nhì">Binh nhì</option>
                  <option value="Binh nhất">Binh nhất</option>
                  <option value="Hạ sĩ">Hạ sĩ</option>
                  <option value="Trung sĩ">Trung sĩ</option>
                  <option value="Thượng sĩ">Thượng sĩ</option>
                  <option value="Thiếu úy QNCN">Thiếu úy QNCN</option>
                  <option value="Trung úy QNCN">Trung úy QNCN</option>
                  <option value="Thượng úy QNCN">Thượng úy QNCN</option>
                  <option value="Đại úy QNCN">Đại úy QNCN</option>
                  <option value="Thiếu tá QNCN">Thiếu tá QNCN</option>
                  <option value="Thiếu úy">Thiếu úy</option>
                  <option value="Trung úy">Trung úy</option>
                  <option value="Thượng úy">Thượng úy</option>
                  <option value="Đại úy">Đại úy</option>
                  <option value="Thiếu tá">Thiếu tá</option>
                  <option value="Trung tá">Trung tá</option>
                  <option value="Thượng tá">Thượng tá</option>
                  <option value="Đại tá">Đại tá</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Chức vụ</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Ví dụ: Tiểu đội trưởng, Trợ lý..."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Trạng thái công tác</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as MilitaryProfile['status'] })
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden cursor-pointer"
                >
                  <option value="active">Đang công tác (Sẵn sàng chiến đấu)</option>
                  <option value="leave">Nghỉ phép / Nghỉ chế độ</option>
                  <option value="study">Đang đào tạo / Đi học</option>
                  <option value="transferred">Chuyển đơn vị / Xuất ngũ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Đơn vị trực thuộc / Ban ngành
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Ví dụ: Tiểu đoàn 1 - Trung đoàn 24..."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Quê quán, Lịch sử Quân ngũ & Liên lạc */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="w-2 h-4 bg-amber-600 rounded-full inline-block" />
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                2. Quê quán, Lịch sử Quân ngũ & Liên lạc
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ngày sinh</label>
                <input
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Quê quán</label>
                <input
                  type="text"
                  value={formData.hometown || ''}
                  onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                  placeholder="Ví dụ: Huyện Kbang, Tỉnh Gia Lai"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ngày nhập ngũ</label>
                <input
                  type="date"
                  value={formData.enlistmentDate || ''}
                  onChange={(e) => setFormData({ ...formData, enlistmentDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ngày vào Đảng (nếu có)</label>
                <input
                  type="date"
                  value={formData.partyJoinDate || ''}
                  onChange={(e) => setFormData({ ...formData, partyJoinDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại liên lạc</label>
                <input
                  type="text"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Ví dụ: 0964.241.108"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Link Ảnh đại diện (Avatar)</label>
                <input
                  type="text"
                  value={formData.avatar || ''}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://images.unsplash..."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Ghi chú khen thưởng / Quá trình</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Khen thưởng, quá trình công tác, đảng viên dự bị, thành tích tiêu biểu..."
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden resize-y"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Liên kết Tài khoản Người dùng & Phân quyền */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-4 bg-emerald-600 rounded-full inline-block" />
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                  3. Liên kết Tài khoản Người dùng Hệ thống
                </h3>
              </div>
              {linkedUser && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Đã liên kết với @{linkedUser.username}</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Liên kết hồ sơ này với tài khoản đăng nhập để tự động cập nhật họ tên, cấp bậc, chức vụ và theo dõi thực tế thời gian hoạt động.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setLinkMode('existing')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  linkMode === 'existing'
                    ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-gray-800">
                  <User className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Chọn tài khoản có sẵn</span>
                </div>
                <span className="text-[10px] text-gray-500 mt-1">Liên kết với tài khoản đã được tạo trước</span>
              </button>

              <button
                type="button"
                onClick={() => setLinkMode('create_new')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  linkMode === 'create_new'
                    ? 'border-red-500 bg-red-50/70 ring-2 ring-red-500/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-gray-800">
                  <UserPlus className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Tạo mới tài khoản</span>
                </div>
                <span className="text-[10px] text-gray-500 mt-1">Tự động tạo tài khoản đăng nhập ngay</span>
              </button>

              <button
                type="button"
                onClick={() => setLinkMode('none')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  linkMode === 'none'
                    ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-gray-800">
                  <Unlink className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Không liên kết</span>
                </div>
                <span className="text-[10px] text-gray-500 mt-1">Chỉ lưu trữ hồ sơ nhân sự</span>
              </button>
            </div>

            {/* If Link Mode is Existing */}
            {linkMode === 'existing' && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-emerald-200 space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  Chọn tài khoản người dùng để liên kết:
                </label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-emerald-600 outline-hidden cursor-pointer"
                >
                  <option value="">-- Chọn tài khoản người dùng --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      @{u.username} - {u.fullName} ({u.rankUnit})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* If Link Mode is Create New */}
            {linkMode === 'create_new' && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-red-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tên đăng nhập (Username)</label>
                    <input
                      type="text"
                      value={newAccountUsername}
                      onChange={(e) => setNewAccountUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="ví dụ: nvn10248"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 outline-hidden focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu ban đầu</label>
                    <input
                      type="text"
                      value={newAccountPassword}
                      onChange={(e) => setNewAccountPassword(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 outline-hidden focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Vai trò hệ thống</label>
                    <select
                      value={newAccountRole}
                      onChange={(e) => setNewAccountRole(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-hidden cursor-pointer focus:ring-2 focus:ring-red-600"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer Actions - Always Pinned & Visible at Bottom */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-5 sm:px-6 py-3.5 flex items-center justify-end gap-3 shadow-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="submit"
            form="soldier-profile-form"
            className="px-5 sm:px-6 py-2 rounded-xl bg-linear-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white text-xs font-bold shadow-md shadow-red-900/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Lưu cập nhật hồ sơ' : 'Thêm hồ sơ quân nhân'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
