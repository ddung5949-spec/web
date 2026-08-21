import React, { useState, useEffect } from 'react';
import { Check, Shield, User, UserCheck, UserPlus, X } from 'lucide-react';
import { RoleDefinition, UserRole, User as UserType } from '../../types';

interface UserEditModalProps {
  isOpen: boolean;
  userToEdit: UserType | null;
  roles?: RoleDefinition[];
  onClose: () => void;
  onSaveUser: (userData: Partial<UserType> & { id?: number }) => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  userToEdit,
  roles = [],
  onClose,
  onSaveUser,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rankUnit, setRankUnit] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [avatar, setAvatar] = useState('');
  const [canViewDoc, setCanViewDoc] = useState(false);
  const [canUploadDoc, setCanUploadDoc] = useState(false);
  const [canJoinPartyMeeting, setCanJoinPartyMeeting] = useState(false);
  const [canUploadMeetingDoc, setCanUploadMeetingDoc] = useState(false);
  const [canDeleteMeetingDoc, setCanDeleteMeetingDoc] = useState(false);
  const [canViewCollaborativeEdits, setCanViewCollaborativeEdits] = useState(false);
  const [canCreateMeeting, setCanCreateMeeting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username);
      setPassword(userToEdit.password || '');
      setFullName(userToEdit.fullName);
      setRankUnit(userToEdit.rankUnit || '');
      setBirthDate(userToEdit.birthDate || '');
      setRole(userToEdit.role);
      setAvatar(userToEdit.avatar || '');
      setCanViewDoc(!!userToEdit.canViewDoc);
      setCanUploadDoc(!!userToEdit.canUploadDoc);
      setCanJoinPartyMeeting(!!userToEdit.canJoinPartyMeeting);
      setCanUploadMeetingDoc(!!userToEdit.canUploadMeetingDoc);
      setCanDeleteMeetingDoc(!!userToEdit.canDeleteMeetingDoc);
      setCanViewCollaborativeEdits(!!userToEdit.canViewCollaborativeEdits);
      setCanCreateMeeting(!!userToEdit.canCreateMeeting);
    } else {
      setUsername('');
      setPassword('123456');
      setFullName('');
      setRankUnit('');
      setBirthDate('');
      setRole('user');
      setAvatar('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');
      setCanViewDoc(true);
      setCanUploadDoc(false);
      setCanJoinPartyMeeting(false);
      setCanUploadMeetingDoc(false);
      setCanDeleteMeetingDoc(false);
      setCanViewCollaborativeEdits(false);
      setCanCreateMeeting(false);
    }
    setError('');
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên quân nhân.');
      return;
    }
    if (!userToEdit && !password.trim()) {
      setError('Vui lòng nhập mật khẩu khởi tạo.');
      return;
    }

    const userData: Partial<UserType> & { id?: number } = {
      ...(userToEdit ? { id: userToEdit.id } : {}),
      username: username.trim().toLowerCase(),
      fullName: fullName.trim(),
      rankUnit: rankUnit.trim() || 'Quân nhân Sư đoàn 10',
      birthDate: birthDate || undefined,
      role,
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      canViewDoc: role === 'admin' ? true : canViewDoc,
      canUploadDoc: role === 'admin' ? true : canUploadDoc,
      canJoinPartyMeeting: role === 'admin' ? true : canJoinPartyMeeting,
      canUploadMeetingDoc: role === 'admin' ? true : canUploadMeetingDoc,
      canDeleteMeetingDoc: role === 'admin' ? true : canDeleteMeetingDoc,
      canViewCollaborativeEdits: role === 'admin' ? true : canViewCollaborativeEdits,
      canCreateMeeting: role === 'admin' ? true : canCreateMeeting,
    };

    if (password.trim()) {
      userData.password = password.trim();
    }

    onSaveUser(userData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-linear-to-r from-red-950 via-red-900 to-amber-950 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              {userToEdit ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {userToEdit ? 'Chỉnh sửa thông tin quân nhân & vai trò' : 'Thêm tài khoản quân nhân mới'}
              </h3>
              <p className="text-[11px] text-amber-200/80">Quản lý phân quyền & thông tin định danh</p>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tên đăng nhập <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="VD: nguyenvanan"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {userToEdit ? 'Đổi mật khẩu (bỏ trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo *'}
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={userToEdit ? 'Giữ nguyên mật khẩu cũ' : 'Nhập mật khẩu...'}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 font-mono outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Họ và tên quân nhân <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Thiếu tá Nguyễn Văn An"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Cấp bậc - Chức vụ - Đơn vị
                </label>
                <input
                  type="text"
                  value={rankUnit}
                  onChange={(e) => setRankUnit(e.target.value)}
                  placeholder="VD: Đại úy - Trợ lý Tuyên huấn"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ngày sinh</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Vai trò hệ thống <span className="text-red-600">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setRole(newRole);
                    const matchedRole = roles.find((r) => r.id === newRole);
                    if (matchedRole?.defaultPermissions && !userToEdit) {
                      setCanViewDoc(matchedRole.defaultPermissions.canViewDoc ?? true);
                      setCanUploadDoc(matchedRole.defaultPermissions.canUploadDoc ?? false);
                      setCanJoinPartyMeeting(matchedRole.defaultPermissions.canJoinPartyMeeting ?? false);
                      setCanUploadMeetingDoc(matchedRole.defaultPermissions.canUploadMeetingDoc ?? false);
                      setCanDeleteMeetingDoc(matchedRole.defaultPermissions.canDeleteMeetingDoc ?? false);
                      setCanViewCollaborativeEdits(matchedRole.defaultPermissions.canViewCollaborativeEdits ?? false);
                      setCanCreateMeeting(matchedRole.defaultPermissions.canCreateMeeting ?? false);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 font-bold text-gray-800 bg-gray-50 outline-hidden cursor-pointer"
                >
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id === 'admin' ? `★ ${r.name.toUpperCase()} (Toàn quyền)` : r.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="admin">★ QUẢN TRỊ VIÊN (ADMIN - Toàn quyền)</option>
                      <option value="commander">CHỈ HUY / ĐẢNG ỦY VIÊN (Commander)</option>
                      <option value="editor">BIÊN TẬP VIÊN (Editor)</option>
                      <option value="user">QUÂN NHÂN / THÀNH VIÊN (User)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* RBAC specific checkboxes */}
            <div className="pt-2 border-t border-gray-200 space-y-2">
              <h4 className="text-xs font-bold uppercase text-gray-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>Phân quyền chi tiết (RBAC)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role === 'admin' ? true : canViewDoc}
                    disabled={role === 'admin'}
                    onChange={(e) => setCanViewDoc(e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <span>Xem văn bản mật trong kho</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role === 'admin' ? true : canUploadDoc}
                    disabled={role === 'admin'}
                    onChange={(e) => setCanUploadDoc(e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <span>Đăng văn bản vào kho tài liệu</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role === 'admin' ? true : canJoinPartyMeeting}
                    disabled={role === 'admin'}
                    onChange={(e) => setCanJoinPartyMeeting(e.target.checked)}
                    className="rounded text-pink-600 w-4 h-4"
                  />
                  <span>Tham gia phòng họp Đảng ủy</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role === 'admin' ? true : canCreateMeeting}
                    disabled={role === 'admin'}
                    onChange={(e) => setCanCreateMeeting(e.target.checked)}
                    className="rounded text-pink-700 w-4 h-4"
                  />
                  <span className="font-semibold text-pink-900">Tạo phòng họp Đảng ủy mới</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role === 'admin' ? true : canUploadMeetingDoc}
                    disabled={role === 'admin'}
                    onChange={(e) => setCanUploadMeetingDoc(e.target.checked)}
                    className="rounded text-pink-600 w-4 h-4"
                  />
                  <span>Tải tài liệu vào phòng họp</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role === 'admin' ? true : canDeleteMeetingDoc}
                    disabled={role === 'admin'}
                    onChange={(e) => setCanDeleteMeetingDoc(e.target.checked)}
                    className="rounded text-pink-600 w-4 h-4"
                  />
                  <span>Xóa tài liệu phòng họp</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role === 'admin' ? true : canViewCollaborativeEdits}
                    disabled={role === 'admin'}
                    onChange={(e) => setCanViewCollaborativeEdits(e.target.checked)}
                    className="rounded text-amber-600 w-4 h-4"
                  />
                  <span>Xem chỉnh sửa cộng tác</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions - Sticky Bottom */}
          <div className="shrink-0 bg-gray-50 border-t border-gray-200 px-5 py-3.5 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-linear-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{userToEdit ? 'Lưu thay đổi' : 'Thêm tài khoản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
