import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  FolderLock,
  Lock,
  Plus,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  UsersRound,
  X,
  Edit2,
} from 'lucide-react';
import { RoleDefinition } from '../../types';

interface RoleManagerModalProps {
  isOpen: boolean;
  roles: RoleDefinition[];
  onClose: () => void;
  onSaveRole: (role: RoleDefinition) => void;
  onDeleteRole: (roleId: string) => void;
}

const PRESET_COLORS = [
  '#b91c1c', // Đỏ Quân đội
  '#065f46', // Xanh lục Đậm
  '#1e40af', // Xanh lam
  '#b45309', // Hổ phách / Nâu vàng
  '#0f766e', // Xanh mòng két
  '#7c3aed', // Tím
  '#be123c', // Hồng cánh sen / Đỏ thắm
  '#374151', // Xám than
  '#0284c7', // Xanh da trời
  '#ca8a04', // Vàng đồng
];

export const RoleManagerModal: React.FC<RoleManagerModalProps> = ({
  isOpen,
  roles,
  onClose,
  onSaveRole,
  onDeleteRole,
}) => {
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states
  const [roleId, setRoleId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [roleColor, setRoleColor] = useState('#065f46');
  const [permissions, setPermissions] = useState({
    canViewDoc: true,
    canUploadDoc: false,
    canJoinPartyMeeting: false,
    canUploadMeetingDoc: false,
    canDeleteMeetingDoc: false,
    canViewCollaborativeEdits: false,
    canCreateMeeting: false,
  });
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingRole(null);
    setRoleId(`role_${Date.now().toString().slice(-4)}`);
    setRoleName('');
    setDescription('');
    setRoleColor('#065f46');
    setPermissions({
      canViewDoc: true,
      canUploadDoc: false,
      canJoinPartyMeeting: false,
      canUploadMeetingDoc: false,
      canDeleteMeetingDoc: false,
      canViewCollaborativeEdits: false,
      canCreateMeeting: false,
    });
    setErrorMessage('');
  };

  const handleStartEdit = (role: RoleDefinition) => {
    setIsCreatingNew(false);
    setEditingRole(role);
    setRoleId(role.id);
    setRoleName(role.name);
    setDescription(role.description || '');
    setRoleColor(role.color || '#065f46');
    setPermissions({
      canViewDoc: role.defaultPermissions?.canViewDoc ?? true,
      canUploadDoc: role.defaultPermissions?.canUploadDoc ?? false,
      canJoinPartyMeeting: role.defaultPermissions?.canJoinPartyMeeting ?? false,
      canUploadMeetingDoc: role.defaultPermissions?.canUploadMeetingDoc ?? false,
      canDeleteMeetingDoc: role.defaultPermissions?.canDeleteMeetingDoc ?? false,
      canViewCollaborativeEdits: role.defaultPermissions?.canViewCollaborativeEdits ?? false,
      canCreateMeeting: role.defaultPermissions?.canCreateMeeting ?? false,
    });
    setErrorMessage('');
  };

  const handleCancelForm = () => {
    setIsCreatingNew(false);
    setEditingRole(null);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setErrorMessage('Vui lòng nhập tên vai trò.');
      return;
    }
    const cleanId = roleId.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanId) {
      setErrorMessage('Vui lòng nhập mã định danh vai trò.');
      return;
    }

    // Check duplicate ID when creating new
    if (isCreatingNew && roles.some((r) => r.id === cleanId)) {
      setErrorMessage(`Mã vai trò "${cleanId}" đã tồn tại trên hệ thống.`);
      return;
    }

    const savedRole: RoleDefinition = {
      id: cleanId,
      name: roleName.trim(),
      description: description.trim(),
      color: roleColor,
      textColor: '#ffffff',
      isSystem: editingRole?.isSystem ?? false,
      defaultPermissions: permissions,
    };

    onSaveRole(savedRole);
    handleCancelForm();
  };

  const handleDelete = (role: RoleDefinition) => {
    if (role.isSystem) {
      alert('Không thể xóa vai trò mặc định của hệ thống!');
      return;
    }
    if (window.confirm(`Đồng chí có chắc chắn muốn xóa vai trò "${role.name}" không?`)) {
      onDeleteRole(role.id);
      if (editingRole?.id === role.id) {
        handleCancelForm();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-red-900 via-amber-900 to-red-950 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">QUẢN LÝ DANH MỤC VAI TRÒ NGƯỜI DÙNG</h3>
              <p className="text-[11px] text-amber-200/90">
                Thêm mới, cấu hình màu sắc và phân quyền mặc định cho từng vai trò
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Top Bar: Add Role Button */}
          {!isCreatingNew && !editingRole && (
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="text-xs text-gray-500 font-semibold">
                Hiện có <span className="text-red-700 font-bold">{roles.length}</span> vai trò trong hệ thống
              </div>
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm vai trò mới</span>
              </button>
            </div>
          )}

          {/* Form for Creating or Editing Role */}
          {(isCreatingNew || editingRole) && (
            <form
              onSubmit={handleSubmit}
              className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                <h4 className="text-xs font-bold uppercase text-amber-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-700" />
                  <span>{isCreatingNew ? 'Thêm vai trò người dùng mới' : `Chỉnh sửa: ${editingRole?.name}`}</span>
                </h4>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-gray-500 hover:text-gray-800 font-bold cursor-pointer"
                >
                  Đóng biểu mẫu
                </button>
              </div>

              {errorMessage && (
                <div className="p-2 bg-red-100 border border-red-300 text-red-800 text-xs rounded font-semibold">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tên vai trò hiển thị <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="VD: Trợ lý Tuyên huấn, Bí thư Chi bộ..."
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mã vai trò (ID) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={roleId}
                    disabled={!isCreatingNew}
                    onChange={(e) => setRoleId(e.target.value)}
                    placeholder="VD: tro_ly_tuyen_huan"
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-600 focus:border-amber-600 font-mono disabled:bg-gray-100 disabled:text-gray-500"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Mô tả chức trách & nhiệm vụ
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả quyền hạn và phạm vi công tác của vai trò này..."
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
                />
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Màu sắc huy hiệu nhận diện
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setRoleColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        roleColor === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-900' : 'hover:scale-110'
                      }`}
                    >
                      {roleColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={roleColor}
                    onChange={(e) => setRoleColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-gray-300 p-0 ml-2"
                    title="Chọn màu tùy biến khác"
                  />
                  {/* Live preview */}
                  <span
                    style={{ backgroundColor: roleColor }}
                    className="ml-auto text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs"
                  >
                    {roleName || 'Xem trước nhãn vai trò'}
                  </span>
                </div>
              </div>

              {/* Default Permissions */}
              <div className="pt-2 border-t border-amber-200">
                <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Quyền hạn mặc định khi gán vai trò này:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canViewDoc}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canViewDoc: e.target.checked })
                      }
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span>Xem văn bản mật</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canUploadDoc}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canUploadDoc: e.target.checked })
                      }
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <span>Đăng tải vào kho tài liệu</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canJoinPartyMeeting}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canJoinPartyMeeting: e.target.checked })
                      }
                      className="rounded text-pink-600 w-4 h-4"
                    />
                    <span>Vào phòng họp Đảng ủy</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canUploadMeetingDoc}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canUploadMeetingDoc: e.target.checked })
                      }
                      className="rounded text-pink-600 w-4 h-4"
                    />
                    <span>Tải tài liệu vào phòng họp</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canDeleteMeetingDoc}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canDeleteMeetingDoc: e.target.checked })
                      }
                      className="rounded text-pink-600 w-4 h-4"
                    />
                    <span>Xóa tài liệu phòng họp</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canViewCollaborativeEdits}
                      onChange={(e) =>
                        setPermissions({
                          ...permissions,
                          canViewCollaborativeEdits: e.target.checked,
                        })
                      }
                      className="rounded text-amber-600 w-4 h-4"
                    />
                    <span>Xem chỉnh sửa cộng tác</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canCreateMeeting}
                      onChange={(e) =>
                        setPermissions({
                          ...permissions,
                          canCreateMeeting: e.target.checked,
                        })
                      }
                      className="rounded text-pink-700 w-4 h-4"
                    />
                    <span className="font-semibold text-pink-900">Tạo phòng họp Đảng ủy</span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-linear-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>{isCreatingNew ? 'Lưu vai trò mới' : 'Cập nhật vai trò'}</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Existing Roles */}
          <div className="space-y-2.5">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white p-3 sm:p-3.5 rounded-xl border border-gray-200 shadow-2xs hover:border-gray-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    style={{ backgroundColor: role.color }}
                    className="w-3.5 h-3.5 rounded-full shrink-0 mt-1 shadow-xs ring-2 ring-white"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        style={{ backgroundColor: role.color }}
                        className="text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-2xs"
                      >
                        {role.name}
                      </span>
                      <span className="text-gray-400 text-[11px] font-mono">
                        ({role.id})
                      </span>
                      {role.isSystem && (
                        <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.2 rounded font-semibold border border-gray-200">
                          Hệ thống
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-xs text-gray-600 mt-1 leading-snug">
                        {role.description}
                      </p>
                    )}
                    {/* Permissions summary */}
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1.5 flex-wrap">
                      <span className="font-semibold text-gray-700">Quyền:</span>
                      {role.defaultPermissions?.canViewDoc && (
                        <span className="text-blue-700 font-medium">✓ Xem VB mật</span>
                      )}
                      {role.defaultPermissions?.canUploadDoc && (
                        <span className="text-blue-700 font-medium">✓ Đăng VB</span>
                      )}
                      {role.defaultPermissions?.canJoinPartyMeeting && (
                        <span className="text-pink-700 font-medium">✓ Họp Đảng ủy</span>
                      )}
                      {role.defaultPermissions?.canCreateMeeting && (
                        <span className="text-pink-900 font-bold bg-pink-50 px-1 rounded">✓ Tạo phòng họp</span>
                      )}
                      {role.defaultPermissions?.canUploadMeetingDoc && (
                        <span className="text-pink-700 font-medium">✓ Tải TL họp</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(role)}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-emerald-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Chỉnh sửa vai trò"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {!role.isSystem && (
                    <button
                      type="button"
                      onClick={() => handleDelete(role)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Xóa vai trò này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>* Vai trò được đồng bộ ngay tức thì đến bảng phân quyền quân nhân</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-900 text-white font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
