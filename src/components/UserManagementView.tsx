import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  Download,
  Edit2,
  Eye,
  FilePlus,
  FileSpreadsheet,
  FolderLock,
  Heart,
  Home,
  Key,
  KeyRound,
  Laptop,
  Link,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Sliders,
  Trash2,
  Unlink,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { MilitaryProfile, PageView, RoleDefinition, UserRole, User as UserType } from '../types';
import { ResetPasswordModal } from './modals/ResetPasswordModal';
import { UserEditModal } from './modals/UserEditModal';
import { RoleManagerModal } from './modals/RoleManagerModal';
import { SoldierProfileModal } from './modals/SoldierProfileModal';
import { ExcelSoldierImportModal } from './modals/ExcelSoldierImportModal';
import { BatchAccountCreateModal } from './modals/BatchAccountCreateModal';
import { formatActiveTime, SoldierActivityStats } from './SoldierActivityStats';

interface UserManagementViewProps {
  users: UserType[];
  currentUser: UserType | null;
  roles?: RoleDefinition[];
  militaryProfiles?: MilitaryProfile[];
  onSaveSoldierProfile?: (
    profile: MilitaryProfile,
    syncUser?: { createAccount?: boolean; selectedUserId?: number | null }
  ) => void;
  onDeleteSoldierProfile?: (profileId: number) => void;
  onImportSoldiersExcel?: (
    profiles: MilitaryProfile[],
    options: {
      autoCreateAccounts: boolean;
      defaultPassword: string;
      defaultRole: string;
      overwriteExisting: boolean;
    }
  ) => void;
  onBatchCreateAccounts?: (
    newUsers: Array<{
      username: string;
      password?: string;
      fullName: string;
      rankUnit: string;
      role: string;
      militaryCode: string;
      profileId: number;
    }>,
    exportExcel?: boolean
  ) => void;
  onTogglePermission: (
    userId: number,
    field:
      | 'canViewDoc'
      | 'canUploadDoc'
      | 'canJoinPartyMeeting'
      | 'canCreateMeeting'
      | 'canUploadMeetingDoc'
      | 'canDeleteMeetingDoc'
      | 'canViewCollaborativeEdits',
    checked: boolean
  ) => void;
  onUpdateUser?: (updatedUser: UserType) => void;
  onChangeUserRole?: (userId: number, newRole: UserRole) => void;
  onChangeUserPassword?: (userId: number, newPass: string) => void;
  onCreateUser?: (newUser: UserType) => void;
  onDeleteUser: (userId: number) => void;
  onSelectSection?: (section: PageView) => void;
  onGoHome?: () => void;
  onSaveRole?: (role: RoleDefinition) => void;
  onDeleteRole?: (roleId: string) => void;
}

export type SubTabType = 'accounts' | 'profiles' | 'stats';

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  roles = [],
  militaryProfiles = [],
  onSaveSoldierProfile,
  onDeleteSoldierProfile,
  onImportSoldiersExcel,
  onBatchCreateAccounts,
  onTogglePermission,
  onUpdateUser,
  onChangeUserRole,
  onChangeUserPassword,
  onCreateUser,
  onDeleteUser,
  onSelectSection,
  onGoHome,
  onSaveRole,
  onDeleteRole,
}) => {
  // Main Sub-Tab selection
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('profiles');

  // Accounts Tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | string>('all');

  // Soldier Profiles Tab state
  const [profileSearch, setProfileSearch] = useState('');
  const [profileUnitFilter, setProfileUnitFilter] = useState('all');
  const [profileAccountFilter, setProfileAccountFilter] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [profileStatusFilter, setProfileStatusFilter] = useState<'all' | 'active' | 'leave' | 'study' | 'transferred'>('all');

  // Modals state
  const [resetPassUser, setResetPassUser] = useState<UserType | null>(null);
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);

  // Military Profile Modals
  const [editingProfile, setEditingProfile] = useState<MilitaryProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isBatchAccountModalOpen, setIsBatchAccountModalOpen] = useState(false);

  // Distinct new registrations count
  const newRegistrations = useMemo(() => {
    return users.filter((u) => u.isNewRegistration || u.registrationStatus === 'pending');
  }, [users]);

  const handleApproveRegistration = (targetUser: UserType) => {
    if (onUpdateUser) {
      onUpdateUser({
        ...targetUser,
        isNewRegistration: false,
        registrationStatus: 'approved',
      });
      showToast(`Đã xác nhận & phê duyệt tài khoản cho đồng chí "${targetUser.fullName}"!`);
    }
  };

  const handleApproveAllNew = () => {
    if (onUpdateUser) {
      newRegistrations.forEach((u) => {
        onUpdateUser({
          ...u,
          isNewRegistration: false,
          registrationStatus: 'approved',
        });
      });
      showToast(`Đã phê duyệt tất cả ${newRegistrations.length} tài khoản mới đăng ký!`);
    }
  };

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRoleSelectChange = (userId: number, newRole: UserRole) => {
    if (onChangeUserRole) {
      onChangeUserRole(userId, newRole);
    } else if (onUpdateUser) {
      const target = users.find((u) => u.id === userId);
      if (target) {
        onUpdateUser({ ...target, role: newRole });
      }
    }
    showToast('Đã cập nhật vai trò người dùng thành công!');
  };

  const handleSavePassword = (userId: number, newPass: string) => {
    if (onChangeUserPassword) {
      onChangeUserPassword(userId, newPass);
    } else if (onUpdateUser) {
      const target = users.find((u) => u.id === userId);
      if (target) {
        onUpdateUser({ ...target, password: newPass });
      }
    }
    showToast('Đã đặt lại mật khẩu mới cho người dùng thành công!');
  };

  const handleSaveUserData = (userData: Partial<UserType> & { id?: number }) => {
    if (userData.id) {
      // Editing existing user
      const existing = users.find((u) => u.id === userData.id);
      if (existing && onUpdateUser) {
        onUpdateUser({ ...existing, ...userData } as UserType);
        showToast(`Đã cập nhật thông tin quân nhân "${userData.fullName}"!`);
      }
    } else {
      // Creating new user
      const newUser: UserType = {
        id: Date.now(),
        username: userData.username || `user_${Date.now()}`,
        password: userData.password || '123456',
        fullName: userData.fullName || 'Quân nhân mới',
        rankUnit: userData.rankUnit || 'Trung đoàn 95, Sư đoàn 2',
        birthDate: userData.birthDate,
        role: userData.role || 'user',
        avatar: userData.avatar || '',
        totalActiveMinutes: 0,
        sessionCount: 0,
        isOnline: false,
        canViewDoc: userData.canViewDoc ?? true,
        canUploadDoc: userData.canUploadDoc ?? false,
        canJoinPartyMeeting: userData.canJoinPartyMeeting ?? false,
        canUploadMeetingDoc: userData.canUploadMeetingDoc ?? false,
        canDeleteMeetingDoc: userData.canDeleteMeetingDoc ?? false,
        canViewCollaborativeEdits: userData.canViewCollaborativeEdits ?? false,
      };

      if (onCreateUser) {
        onCreateUser(newUser);
      } else if (onUpdateUser) {
        onUpdateUser(newUser);
      }
      showToast(`Đã tạo mới tài khoản cho đồng chí "${newUser.fullName}"!`);
    }
  };

  // Filtered Users for Accounts tab
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.rankUnit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.militaryCode && u.militaryCode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Filtered Military Profiles for Profiles tab
  const filteredProfiles = useMemo(() => {
    return militaryProfiles.filter((p) => {
      const matchesSearch =
        p.fullName.toLowerCase().includes(profileSearch.toLowerCase()) ||
        p.militaryCode.toLowerCase().includes(profileSearch.toLowerCase()) ||
        p.unit.toLowerCase().includes(profileSearch.toLowerCase()) ||
        (p.hometown && p.hometown.toLowerCase().includes(profileSearch.toLowerCase())) ||
        (p.username && p.username.toLowerCase().includes(profileSearch.toLowerCase()));

      const matchesUnit =
        profileUnitFilter === 'all' || p.unit.toLowerCase().includes(profileUnitFilter.toLowerCase());

      const matchesAccount =
        profileAccountFilter === 'all' ||
        (profileAccountFilter === 'linked' && !!p.userId) ||
        (profileAccountFilter === 'unlinked' && !p.userId);

      const matchesStatus = profileStatusFilter === 'all' || p.status === profileStatusFilter;

      return matchesSearch && matchesUnit && matchesAccount && matchesStatus;
    });
  }, [militaryProfiles, profileSearch, profileUnitFilter, profileAccountFilter, profileStatusFilter]);

  // Units list for filter dropdown
  const distinctUnits = useMemo(() => {
    const set = new Set<string>();
    militaryProfiles.forEach((p) => {
      if (p.unit.includes('28')) set.add('Trung đoàn 28');
      else if (p.unit.includes('24')) set.add('Trung đoàn 24');
      else if (p.unit.includes('66')) set.add('Trung đoàn 66');
      else if (p.unit.includes('Chính trị')) set.add('Phòng Chính trị');
      else if (p.unit.includes('Tham mưu')) set.add('Phòng Tham mưu');
      else if (p.unit.includes('Hậu cần') || p.unit.includes('Kỹ thuật')) set.add('Hậu cần - Kỹ thuật');
      else set.add(p.unit);
    });
    return Array.from(set);
  }, [militaryProfiles]);

  const existingCodes = useMemo(() => militaryProfiles.map((p) => p.militaryCode), [militaryProfiles]);

  return (
    <div className="space-y-4">
      {/* 1. Clickable Breadcrumb */}
      <nav className="flex items-center justify-between gap-1.5 text-xs text-gray-500 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onGoHome}
            className="hover:text-amber-800 flex items-center gap-1 cursor-pointer font-medium"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </button>
          <span>/</span>
          <span className="text-gray-900 font-bold">Quản trị Nhân sự & Phân quyền</span>
        </div>

        {toastMessage && (
          <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[11px] font-bold animate-in fade-in shadow-xs flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}
      </nav>

      {/* 2. Admin Module Top Switcher Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-full text-xs font-black shrink-0 bg-red-800 text-white shadow-xs flex items-center gap-1.5"
        >
          <Shield className="w-3.5 h-3.5 text-amber-300" />
          <span>QUẢN TRỊ NHÂN SỰ & HỆ THỐNG</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection && onSelectSection('approvals')}
          className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0 bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
          <span>Duyệt tin bài</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection && onSelectSection('doc')}
          className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <FolderLock className="w-3.5 h-3.5 text-blue-600" />
          <span>Kho Văn bản</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSection && onSelectSection('meeting')}
          className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0 bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-700 border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-pink-600" />
          <span>Phòng Họp Đảng ủy</span>
        </button>
      </div>

      {/* 3. Sub-Navigation Tabs (Hồ sơ Quân nhân | Phân quyền & Tài khoản | Thống kê Hoạt động) */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('profiles')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'profiles'
                ? 'bg-linear-to-r from-red-800 to-amber-900 text-white shadow-md shadow-red-950/20'
                : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Hồ sơ Quân nhân ({militaryProfiles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('accounts')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer relative ${
              activeSubTab === 'accounts'
                ? 'bg-linear-to-r from-red-800 to-amber-900 text-white shadow-md shadow-red-950/20'
                : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Tài khoản & Phân quyền ({users.length})</span>
            {newRegistrations.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                +{newRegistrations.length} mới
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'stats'
                ? 'bg-linear-to-r from-red-800 to-amber-900 text-white shadow-md shadow-red-950/20'
                : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Thống kê Thực số & Thời gian Hoạt động</span>
          </button>
        </div>

        {/* Global Quick Action: Role Manager */}
        <button
          type="button"
          onClick={() => setIsRoleManagerOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          <span>Quản lý Vai trò ({roles.length})</span>
        </button>
      </div>

      {/* NEW REGISTRATIONS NOTIFICATION BANNER */}
      {newRegistrations.length > 0 && (
        <div className="p-3.5 bg-linear-to-r from-red-50 via-amber-50 to-orange-50 rounded-2xl border-2 border-red-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <UserPlus className="w-5 h-5 text-amber-300 animate-bounce" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-red-950 flex items-center gap-2">
                <span>THÔNG BÁO: CÓ {newRegistrations.length} TÀI KHOẢN MỚI ĐĂNG KÝ VỪA GỬI ĐẾN</span>
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
                  Chờ phân quyền
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Các đồng chí mới đăng ký ({newRegistrations.map((u) => u.fullName).join(', ')}) đang chờ quản trị viên xác nhận vai trò và cấp quyền truy cập.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('accounts');
                setRoleFilter('all');
              }}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl border border-gray-300 transition-colors cursor-pointer"
            >
              Xem danh sách
            </button>
            <button
              type="button"
              onClick={handleApproveAllNew}
              className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Duyệt tất cả</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: HỒ SƠ QUÂN NHÂN & LIÊN KẾT TÀI KHOẢN */}
      {/* ========================================================================= */}
      {activeSubTab === 'profiles' && (
        <div className="space-y-4">
          {/* Header & Quick Action Buttons */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-sm md:text-base font-black uppercase text-gray-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-red-700" />
                  <span>Quản lý Hồ sơ Quân nhân & Liên kết Tài khoản</span>
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Nhập danh sách từ Excel, tạo tài khoản hàng loạt và đồng bộ thông tin quân nhân trực tiếp với hệ thống.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* Upload Excel */}
                <button
                  type="button"
                  onClick={() => setIsExcelImportOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Tải lên File Excel (.xlsx)</span>
                </button>

                {/* Batch Account Creation */}
                <button
                  type="button"
                  onClick={() => setIsBatchAccountModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-linear-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-amber-200" />
                  <span>Tạo tài khoản hàng loạt</span>
                </button>

                {/* Add Single Soldier Profile */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(null);
                    setIsProfileModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-linear-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Hồ sơ mới</span>
                </button>
              </div>
            </div>

            {/* Search & Multi-Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  placeholder="Tìm số hiệu, họ tên, quê quán..."
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 bg-gray-50/50 text-gray-900 font-medium"
                />
              </div>

              {/* Unit Filter */}
              <select
                value={profileUnitFilter}
                onChange={(e) => setProfileUnitFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-600 bg-white text-gray-800 font-medium outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả đơn vị ({militaryProfiles.length})</option>
                {distinctUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>

              {/* Account Status Filter */}
              <select
                value={profileAccountFilter}
                onChange={(e) => setProfileAccountFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-600 bg-white text-gray-800 font-medium outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả tài khoản ({militaryProfiles.length})</option>
                <option value="linked">
                  Đã cấp tài khoản ({militaryProfiles.filter((p) => p.userId).length})
                </option>
                <option value="unlinked">
                  Chưa có tài khoản ({militaryProfiles.filter((p) => !p.userId).length})
                </option>
              </select>

              {/* Work Status Filter */}
              <select
                value={profileStatusFilter}
                onChange={(e) => setProfileStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-600 bg-white text-gray-800 font-medium outline-hidden cursor-pointer"
              >
                <option value="all">Mọi trạng thái công tác</option>
                <option value="active">Đang công tác</option>
                <option value="leave">Nghỉ phép / Chế độ</option>
                <option value="study">Đang đào tạo / Đi học</option>
                <option value="transferred">Chuyển đơn vị / Xuất ngũ</option>
              </select>
            </div>
          </div>

          {/* Military Profiles Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 uppercase text-[11px] border-b border-gray-200">
                    <th className="py-3 px-3 w-10 text-center">STT</th>
                    <th className="py-3 px-3 font-bold">Số hiệu QN</th>
                    <th className="py-3 px-3.5 font-bold">Họ và tên quân nhân</th>
                    <th className="py-3 px-3 font-bold">Cấp bậc - Chức vụ</th>
                    <th className="py-3 px-3.5 font-bold">Đơn vị</th>
                    <th className="py-3 px-3 font-bold text-center bg-slate-100/80 text-slate-900">
                      Tài khoản liên kết
                    </th>
                    <th className="py-3 px-3 font-bold text-center bg-amber-50/70 text-amber-900">
                      Thời gian hoạt động
                    </th>
                    <th className="py-3 px-3 font-bold text-center">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProfiles.length > 0 ? (
                    filteredProfiles.map((p, idx) => {
                      const linkedUser = users.find((u) => u.id === p.userId);
                      const isLinked = !!linkedUser;
                      const totalMinutes = (p.totalActiveMinutes || 0) + (linkedUser?.totalActiveMinutes || 0);
                      const isOnline = !!(p.isOnline || linkedUser?.isOnline);

                      return (
                        <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-3 text-center text-gray-400 font-mono">{idx + 1}</td>

                          {/* Military Code */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-mono font-black text-red-950 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md text-xs">
                              {p.militaryCode}
                            </span>
                          </td>

                          {/* Soldier Name & Details */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  p.avatar ||
                                  linkedUser?.avatar ||
                                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                                }
                                alt={p.fullName}
                                className="w-8 h-8 rounded-full object-cover border border-gray-300 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-gray-900">{p.fullName}</div>
                                <div className="text-[10px] text-gray-500">
                                  {p.birthDate ? `Sinh: ${p.birthDate.split('-').reverse().join('/')}` : ''}
                                  {p.hometown ? ` • Quê: ${p.hometown}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Rank & Position */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-bold text-gray-800">{p.rank}</div>
                            <div className="text-[11px] text-gray-500">{p.position}</div>
                          </td>

                          {/* Unit */}
                          <td className="py-3 px-3.5">
                            <div className="text-gray-800 font-medium text-xs truncate max-w-[200px]" title={p.unit}>
                              {p.unit}
                            </div>
                          </td>

                          {/* Linked User Account */}
                          <td className="py-3 px-3 text-center bg-slate-50/50 whitespace-nowrap">
                            {isLinked ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="font-mono font-bold text-emerald-800 text-[11px] flex items-center gap-1">
                                  <Link className="w-3 h-3 text-emerald-600" />
                                  <span>@{linkedUser.username}</span>
                                </span>
                                <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded mt-0.5">
                                  {roles.find((r) => r.id === linkedUser.role)?.name || linkedUser.role}
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProfile(p);
                                  setIsProfileModalOpen(true);
                                }}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                              >
                                <Unlink className="w-2.5 h-2.5 text-amber-600" />
                                <span>Chưa cấp TK (Bấm tạo)</span>
                              </button>
                            )}
                          </td>

                          {/* Total Active Time */}
                          <td className="py-3 px-3 text-center bg-amber-50/20 whitespace-nowrap">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-xs text-amber-950 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>{formatActiveTime(totalMinutes)}</span>
                              </span>
                              {isOnline ? (
                                <span className="text-[9px] font-black text-emerald-700 flex items-center gap-0.5 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                  <span>Đang Online</span>
                                </span>
                              ) : (
                                <span className="text-[9px] text-gray-400 mt-0.5">
                                  {p.lastActiveAt ? `Lần cuối: ${p.lastActiveAt.split(' ')[0]}` : 'Chưa online'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'leave'
                                  ? 'bg-amber-100 text-amber-800'
                                  : p.status === 'study'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {p.status === 'active'
                                ? 'Đang công tác'
                                : p.status === 'leave'
                                ? 'Nghỉ phép'
                                : p.status === 'study'
                                ? 'Đi học'
                                : 'Chuyển đơn vị'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProfile(p);
                                  setIsProfileModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-red-800 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Chỉnh sửa hồ sơ và liên kết tài khoản"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {onDeleteSoldierProfile && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Đồng chí có chắc chắn muốn xóa hồ sơ của quân nhân "${p.fullName}"?`)) {
                                      onDeleteSoldierProfile(p.id);
                                      showToast(`Đã xóa hồ sơ quân nhân "${p.fullName}"`);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Xóa hồ sơ quân nhân"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs text-gray-500 italic">
                        Không tìm thấy hồ sơ quân nhân nào phù hợp với điều kiện tìm kiếm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TÀI KHOẢN & PHÂN QUYỀN VAI TRÒ (RBAC) */}
      {/* ========================================================================= */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-sm md:text-base font-black uppercase text-amber-950 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  <span>Quản trị Tài khoản & Phân quyền Vai trò (RBAC)</span>
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Thay đổi vai trò, cấp quyền truy cập, chỉnh sửa thông tin và đặt lại mật khẩu cho quân nhân.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setEditUser(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="bg-linear-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm tài khoản mới</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo họ tên, tên đăng nhập, đơn vị..."
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-amber-700 bg-gray-50/50 text-gray-900 font-medium"
                />
              </div>

              {/* Role Filter Tabs (Dynamic) */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => setRoleFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                    roleFilter === 'all'
                      ? 'bg-amber-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tất cả ({users.length})
                </button>
                {roles.map((r) => {
                  const count = users.filter((u) => u.role === r.id).length;
                  const isSelected = roleFilter === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRoleFilter(r.id)}
                      style={
                        isSelected ? { backgroundColor: r.color, color: '#ffffff' } : {}
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                        !isSelected
                          ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                          : 'shadow-2xs'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: isSelected ? '#ffffff' : r.color }}
                        className="w-2 h-2 rounded-full inline-block shrink-0"
                      />
                      <span>
                        {r.name} ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 uppercase text-[11px] border-b border-gray-200">
                    <th className="py-3 px-3.5 font-bold">Quân nhân</th>
                    <th className="py-3 px-3.5 font-bold">Tài khoản & Đơn vị</th>
                    <th className="py-3 px-3.5 font-bold text-center bg-amber-50/70 text-amber-900">
                      Vai trò (Admin đổi trực tiếp)
                    </th>
                    <th className="py-3 px-3.5 font-bold text-center">Mật khẩu</th>
                    <th className="py-3 px-3.5 font-bold text-center">Xem VB Mật</th>
                    <th className="py-3 px-3.5 font-bold text-center">Đăng VB Kho</th>
                    <th className="py-3 px-3.5 font-bold text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const isAdmin = u.role === 'admin';
                      const isSelf = currentUser && currentUser.id === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                                alt={u.fullName}
                                className="w-8 h-8 rounded-full object-cover border border-gray-300"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-gray-900">{u.fullName}</span>
                                  {u.isNewRegistration && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                                      MỚI ĐĂNG KÝ
                                    </span>
                                  )}
                                </div>
                                {u.birthDate && (
                                  <div className="text-[10px] text-gray-500">
                                    Sinh: {u.birthDate.split('-').reverse().join('/')}
                                  </div>
                                )}
                                {isSelf && (
                                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1 rounded border border-amber-200">
                                    (Đang đăng nhập)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3.5">
                            <div className="font-bold text-[#7f1d1d] font-mono">@{u.username}</div>
                            <div className="text-gray-500 text-[11px]">{u.rankUnit}</div>
                          </td>

                          {/* Role Selector (Admin can change role for any user) */}
                          <td className="py-2.5 px-3 text-center bg-amber-50/30 whitespace-nowrap">
                            {(() => {
                              const currentRoleObj = roles.find((r) => r.id === u.role);
                              const roleColor = currentRoleObj?.color || (isAdmin ? '#b91c1c' : '#0f766e');
                              return (
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleSelectChange(u.id, e.target.value)}
                                  disabled={isSelf}
                                  style={{
                                    borderColor: roleColor,
                                  }}
                                  className={`text-[11px] font-bold rounded-lg px-2 py-1 border cursor-pointer focus:outline-hidden transition-colors bg-white text-gray-800 ${
                                    isSelf ? 'opacity-80 cursor-not-allowed' : 'hover:shadow-xs'
                                  }`}
                                  title={
                                    isSelf
                                      ? 'Không thể tự đổi vai trò của chính mình'
                                      : 'Admin chọn để đổi vai trò người dùng'
                                  }
                                >
                                  {roles.length > 0 ? (
                                    roles.map((r) => (
                                      <option key={r.id} value={r.id}>
                                        {r.id === 'admin' ? `★ ${r.name}` : r.name}
                                      </option>
                                    ))
                                  ) : (
                                    <>
                                      <option value="admin">★ Quản trị viên (Admin)</option>
                                      <option value="commander">Chỉ huy / ĐUV (Commander)</option>
                                      <option value="editor">Biên tập viên (Editor)</option>
                                      <option value="user">Quân nhân (User)</option>
                                    </>
                                  )}
                                </select>
                              );
                            })()}
                          </td>

                          {/* Password Reset Action */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setResetPassUser(u)}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
                              title="Đặt lại mật khẩu cho người dùng khi quên mật khẩu"
                            >
                              <Key className="w-3 h-3 text-amber-700" />
                              <span>Đổi MK</span>
                            </button>
                          </td>

                          {/* Checkbox Xem Văn Bản Mật */}
                          <td className="py-3 px-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={u.canViewDoc || isAdmin}
                              disabled={isAdmin}
                              onChange={(e) => onTogglePermission(u.id, 'canViewDoc', e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600 disabled:opacity-50"
                              title="Quyền xem tài liệu, văn bản mật"
                            />
                          </td>

                          {/* Checkbox Đăng Văn Bản Kho */}
                          <td className="py-3 px-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={u.canUploadDoc || isAdmin}
                              disabled={isAdmin}
                              onChange={(e) => onTogglePermission(u.id, 'canUploadDoc', e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600 disabled:opacity-50"
                              title="Quyền đăng tải văn bản vào Kho văn bản"
                            />
                          </td>

                          {/* Edit Info & Delete Actions */}
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {(u.isNewRegistration || u.registrationStatus === 'pending') && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveRegistration(u)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                                  title="Phê duyệt tài khoản mới này"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Duyệt</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setEditUser(u)}
                                className="p-1 rounded text-gray-500 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Chỉnh sửa thông tin tài khoản"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {!isAdmin && !isSelf ? (
                                <button
                                  type="button"
                                  onClick={() => onDeleteUser(u.id)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Xóa tài khoản quân nhân"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-gray-300 px-1">--</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-xs text-gray-500 italic">
                        Không tìm thấy tài khoản nào phù hợp với điều kiện tìm kiếm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: THỐNG KÊ THỰC SỐ & THỜI GIAN HOẠT ĐỘNG */}
      {/* ========================================================================= */}
      {activeSubTab === 'stats' && (
        <SoldierActivityStats
          profiles={militaryProfiles}
          users={users}
          onOpenProfile={(p) => {
            setEditingProfile(p);
            setIsProfileModalOpen(true);
          }}
        />
      )}

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={!!resetPassUser}
        user={resetPassUser}
        onClose={() => setResetPassUser(null)}
        onSavePassword={handleSavePassword}
      />

      {/* User Edit / Create Modal */}
      <UserEditModal
        isOpen={!!editUser || isCreateModalOpen}
        userToEdit={editUser}
        roles={roles}
        onClose={() => {
          setEditUser(null);
          setIsCreateModalOpen(false);
        }}
        onSaveUser={handleSaveUserData}
      />

      {/* Role Manager Modal */}
      <RoleManagerModal
        isOpen={isRoleManagerOpen}
        roles={roles}
        onClose={() => setIsRoleManagerOpen(false)}
        onSaveRole={(savedRole) => {
          if (onSaveRole) {
            onSaveRole(savedRole);
          }
          showToast(`Đã lưu cấu hình vai trò "${savedRole.name}"!`);
        }}
        onDeleteRole={(roleId) => {
          if (onDeleteRole) {
            onDeleteRole(roleId);
          }
          showToast('Đã xóa vai trò thành công!');
        }}
      />

      {/* Soldier Profile Edit / Create Modal */}
      <SoldierProfileModal
        isOpen={isProfileModalOpen}
        profile={editingProfile}
        allUsers={users}
        roles={roles}
        onClose={() => {
          setIsProfileModalOpen(false);
          setEditingProfile(null);
        }}
        onSave={(savedProfile, syncUser) => {
          if (onSaveSoldierProfile) {
            onSaveSoldierProfile(savedProfile, syncUser);
          }
          showToast(`Đã lưu hồ sơ quân nhân "${savedProfile.fullName}"!`);
        }}
      />

      {/* Excel Soldier Import Modal */}
      <ExcelSoldierImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        roles={roles}
        existingCodes={existingCodes}
        onImportSuccess={(importedProfiles, options) => {
          if (onImportSoldiersExcel) {
            onImportSoldiersExcel(importedProfiles, options);
          }
          showToast(`Đã nhập thành công ${importedProfiles.length} hồ sơ quân nhân từ Excel!`);
        }}
      />

      {/* Batch Account Create Modal */}
      <BatchAccountCreateModal
        isOpen={isBatchAccountModalOpen}
        onClose={() => setIsBatchAccountModalOpen(false)}
        militaryProfiles={militaryProfiles}
        roles={roles}
        existingUsers={users}
        onBatchCreate={(newUsersList, exportExcel) => {
          if (onBatchCreateAccounts) {
            onBatchCreateAccounts(newUsersList, exportExcel);
          }
          showToast(`Đã khởi tạo thành công ${newUsersList.length} tài khoản người dùng!`);
        }}
      />
    </div>
  );
};
