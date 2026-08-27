import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  KeyRound,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MilitaryProfile, RoleDefinition, User as UserType } from '../../types';

interface BatchAccountCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  militaryProfiles: MilitaryProfile[];
  roles: RoleDefinition[];
  existingUsers: UserType[];
  onBatchCreate: (
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
}

// Convert Vietnamese string to slug without accents
function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export const BatchAccountCreateModal: React.FC<BatchAccountCreateModalProps> = ({
  isOpen,
  onClose,
  militaryProfiles,
  roles,
  existingUsers,
  onBatchCreate,
}) => {
  // Unlinked profiles (do not have a userId yet)
  const unlinkedProfiles = useMemo(
    () => militaryProfiles.filter((p) => !p.userId),
    [militaryProfiles]
  );

  const [selectedProfileIds, setSelectedProfileIds] = useState<number[]>(() =>
    unlinkedProfiles.map((p) => p.id)
  );

  const [usernameRule, setUsernameRule] = useState<'code' | 'name' | 'prefix'>('code');
  const [customPrefix, setCustomPrefix] = useState<string>('cb');
  const [defaultPassword, setDefaultPassword] = useState<string>('123456');
  const [defaultRole, setDefaultRole] = useState<string>('user');
  const [exportExcelAfterCreate, setExportExcelAfterCreate] = useState<boolean>(true);

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedProfileIds.length === unlinkedProfiles.length) {
      setSelectedProfileIds([]);
    } else {
      setSelectedProfileIds(unlinkedProfiles.map((p) => p.id));
    }
  };

  const handleToggleProfile = (id: number) => {
    if (selectedProfileIds.includes(id)) {
      setSelectedProfileIds(selectedProfileIds.filter((pId) => pId !== id));
    } else {
      setSelectedProfileIds([...selectedProfileIds, id]);
    }
  };

  // Preview generated accounts
  const previewAccounts = useMemo(() => {
    const existingUsernames = new Set(existingUsers.map((u) => u.username.toLowerCase()));

    return unlinkedProfiles
      .filter((p) => selectedProfileIds.includes(p.id))
      .map((p, idx) => {
        let baseUsername = '';
        if (usernameRule === 'code') {
          baseUsername = p.militaryCode.toLowerCase().replace(/[^a-z0-9]/g, '');
        } else if (usernameRule === 'name') {
          baseUsername = removeVietnameseTones(p.fullName);
        } else {
          baseUsername = `${customPrefix}_${idx + 1}`;
        }

        let finalUsername = baseUsername;
        let counter = 1;
        while (existingUsernames.has(finalUsername.toLowerCase())) {
          finalUsername = `${baseUsername}${counter}`;
          counter++;
        }
        existingUsernames.add(finalUsername.toLowerCase());

        return {
          profileId: p.id,
          militaryCode: p.militaryCode,
          fullName: p.fullName,
          rankUnit: `${p.rank} - ${p.unit}`,
          username: finalUsername,
          password: defaultPassword,
          role: defaultRole,
        };
      });
  }, [unlinkedProfiles, selectedProfileIds, usernameRule, customPrefix, defaultPassword, defaultRole, existingUsers]);

  if (!isOpen) return null;

  // Execute Batch Creation
  const handleConfirm = () => {
    if (previewAccounts.length === 0) return;

    if (exportExcelAfterCreate) {
      const exportData = previewAccounts.map((acc, idx) => ({
        'STT': idx + 1,
        'Số hiệu quân nhân': acc.militaryCode,
        'Họ và tên': acc.fullName,
        'Cấp bậc - Đơn vị': acc.rankUnit,
        'Tên đăng nhập (Username)': acc.username,
        'Mật khẩu ban đầu': acc.password,
        'Vai trò hệ thống': roles.find((r) => r.id === acc.role)?.name || acc.role,
        'Ngày cấp tài khoản': new Date().toLocaleDateString('vi-VN'),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 26 },
        { wch: 35 },
        { wch: 22 },
        { wch: 18 },
        { wch: 24 },
        { wch: 18 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'TaiKhoanQuanNhan');
      XLSX.writeFile(wb, `Danh_Sach_Tai_Khoan_Cap_Moi_${Date.now()}.xlsx`);
    }

    onBatchCreate(previewAccounts, exportExcelAfterCreate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 bg-linear-to-r from-red-950 via-red-900 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <UserPlus className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                Tạo Hàng loạt Tài khoản Đăng nhập
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-200">
                Tự động sinh tài khoản, liên kết hồ sơ và xuất file tài khoản bàn giao cho quân nhân
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 sm:p-6 space-y-6 overflow-y-auto">
          {unlinkedProfiles.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-gray-900">
                Tất cả quân nhân hiện tại đều đã có tài khoản người dùng!
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Nếu muốn thêm quân nhân mới, hãy dùng tính năng "Tải file Excel" hoặc "Thêm Hồ sơ Quân nhân".
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Account Generation Rules */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-red-700" />
                  <span>Quy tắc Sinh Tên đăng nhập & Mật khẩu</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Quy tắc đặt Username:
                    </label>
                    <select
                      value={usernameRule}
                      onChange={(e) => setUsernameRule(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-hidden cursor-pointer"
                    >
                      <option value="code">Theo Số hiệu quân nhân (vd: sq10492)</option>
                      <option value="name">Theo Họ tên không dấu (vd: lethithuhuong)</option>
                      <option value="prefix">Theo Tiền tố tự đặt (vd: cb_1, cb_2)</option>
                    </select>
                  </div>

                  {usernameRule === 'prefix' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Tiền tố:</label>
                      <input
                        type="text"
                        value={customPrefix}
                        onChange={(e) => setCustomPrefix(e.target.value)}
                        placeholder="cb, e10, qn..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 outline-hidden"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu ban đầu:</label>
                    <input
                      type="text"
                      value={defaultPassword}
                      onChange={(e) => setDefaultPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Vai trò hệ thống gán:</label>
                    <select
                      value={defaultRole}
                      onChange={(e) => setDefaultRole(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-hidden cursor-pointer"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportExcelAfterCreate}
                      onChange={(e) => setExportExcelAfterCreate(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-700 border-gray-300 focus:ring-emerald-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-emerald-800">
                      Tự động xuất File Excel danh sách tài khoản vừa tạo để in / bàn giao cho quân nhân
                    </span>
                  </label>
                </div>
              </div>

              {/* Step 2: Select Soldiers */}
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-700 inline-block" />
                    <h4 className="text-xs font-black uppercase text-gray-900">
                      Chọn Quân nhân cần cấp tài khoản ({selectedProfileIds.length} / {unlinkedProfiles.length})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs font-bold text-red-700 hover:text-red-900 cursor-pointer hover:underline"
                  >
                    {selectedProfileIds.length === unlinkedProfiles.length
                      ? 'Bỏ chọn tất cả'
                      : 'Chọn tất cả quân nhân chưa có tài khoản'}
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-2 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedProfileIds.length === unlinkedProfiles.length}
                            onChange={handleToggleSelectAll}
                            className="w-3.5 h-3.5 rounded text-red-700 border-gray-300 focus:ring-red-600 cursor-pointer"
                          />
                        </th>
                        <th className="p-2">Số hiệu</th>
                        <th className="p-2">Họ và tên</th>
                        <th className="p-2">Cấp bậc</th>
                        <th className="p-2">Chức vụ</th>
                        <th className="p-2">Đơn vị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {unlinkedProfiles.map((p) => {
                        const isSelected = selectedProfileIds.includes(p.id);
                        return (
                          <tr
                            key={p.id}
                            onClick={() => handleToggleProfile(p.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleProfile(p.id)}
                                className="w-3.5 h-3.5 rounded text-red-700 border-gray-300 focus:ring-red-600 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 font-mono font-bold text-red-950">{p.militaryCode}</td>
                            <td className="p-2 font-bold text-gray-900">{p.fullName}</td>
                            <td className="p-2 text-gray-700">{p.rank}</td>
                            <td className="p-2 text-gray-700">{p.position}</td>
                            <td className="p-2 text-gray-600 truncate max-w-[200px]">{p.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 3: Generated Preview Table */}
              {previewAccounts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                      <h4 className="text-xs font-black uppercase text-gray-900">
                        Danh sách tài khoản sẽ được khởi tạo ({previewAccounts.length} tài khoản)
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Sẵn sàng khởi tạo
                    </span>
                  </div>

                  <div className="border border-emerald-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-emerald-50/20">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-emerald-100/70 text-emerald-950 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">STT</th>
                          <th className="p-2">Họ và tên</th>
                          <th className="p-2">Username</th>
                          <th className="p-2">Mật khẩu</th>
                          <th className="p-2">Vai trò</th>
                          <th className="p-2">Cấp bậc - Đơn vị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100">
                        {previewAccounts.map((acc, idx) => (
                          <tr key={idx} className="hover:bg-emerald-50/50">
                            <td className="p-2 text-gray-400 font-mono">{idx + 1}</td>
                            <td className="p-2 font-bold text-gray-900">{acc.fullName}</td>
                            <td className="p-2 font-mono font-bold text-red-700 bg-white/60 px-1 rounded">
                              @{acc.username}
                            </td>
                            <td className="p-2 font-mono text-gray-700">{acc.password}</td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                {roles.find((r) => r.id === acc.role)?.name || acc.role}
                              </span>
                            </td>
                            <td className="p-2 text-gray-600 truncate max-w-[200px]">{acc.rankUnit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions - Sticky Bottom */}
        <div className="shrink-0 bg-gray-50 border-t border-gray-200 px-5 sm:px-6 py-3.5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          {unlinkedProfiles.length > 0 && (
            <button
              type="button"
              disabled={previewAccounts.length === 0}
              onClick={handleConfirm}
              className="px-5 sm:px-6 py-2.5 rounded-xl bg-linear-to-r from-red-700 to-amber-700 hover:from-red-800 hover:to-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-red-950/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Khởi tạo {previewAccounts.length} Tài khoản</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
