import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  HelpCircle,
  KeyRound,
  Shield,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MilitaryProfile, RoleDefinition } from '../../types';

interface ExcelSoldierImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (
    profiles: MilitaryProfile[],
    options: {
      autoCreateAccounts: boolean;
      defaultPassword: string;
      defaultRole: string;
      overwriteExisting: boolean;
    }
  ) => void;
  roles: RoleDefinition[];
  existingCodes: string[];
}

export const ExcelSoldierImportModal: React.FC<ExcelSoldierImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  roles,
  existingCodes,
}) => {
  if (!isOpen) return null;

  const [parsedRows, setParsedRows] = useState<Partial<MilitaryProfile>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [autoCreateAccounts, setAutoCreateAccounts] = useState<boolean>(true);
  const [defaultPassword, setDefaultPassword] = useState<string>('123456');
  const [defaultRole, setDefaultRole] = useState<string>('user');
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 1. Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'Số hiệu quân nhân (*)': 'SQ-10821',
        'Họ và tên (*)': 'Đoàn Văn Hùng',
        'Cấp bậc': 'Đại úy',
        'Chức vụ': 'Chính trị viên Đại đội',
        'Đơn vị': 'Đại đội 1 - Tiểu đoàn 1 - Trung đoàn 28',
        'Ngày sinh (YYYY-MM-DD)': '1992-06-15',
        'Quê quán': 'Huyện Chư Sê, Tỉnh Gia Lai',
        'Ngày nhập ngũ': '2010-09-01',
        'Ngày vào Đảng': '2013-05-19',
        'Số điện thoại': '0981.234.567',
        'Ghi chú': 'Cán bộ tiêu biểu cấp Sư đoàn năm 2025',
      },
      {
        'Số hiệu quân nhân (*)': 'SQ-10822',
        'Họ và tên (*)': 'Lê Minh Tuấn',
        'Cấp bậc': 'Thượng úy',
        'Chức vụ': 'Đại đội trưởng',
        'Đơn vị': 'Đại đội 2 - Tiểu đoàn 1 - Trung đoàn 28',
        'Ngày sinh (YYYY-MM-DD)': '1994-11-20',
        'Quê quán': 'Thành phố Pleiku, Gia Lai',
        'Ngày nhập ngũ': '2012-09-01',
        'Ngày vào Đảng': '2015-12-22',
        'Số điện thoại': '0972.345.678',
        'Ghi chú': '',
      },
      {
        'Số hiệu quân nhân (*)': 'CS-66304',
        'Họ và tên (*)': 'Nguyễn Hoàng Long',
        'Cấp bậc': 'Binh nhất',
        'Chức vụ': 'Chiến sĩ Trinh sát',
        'Đơn vị': 'Đại đội Trinh sát 20 - Trung đoàn 66',
        'Ngày sinh (YYYY-MM-DD)': '2005-02-10',
        'Quê quán': 'Huyện Đắk Đoa, Gia Lai',
        'Ngày nhập ngũ': '2024-02-20',
        'Ngày vào Đảng': '',
        'Số điện thoại': '0918.456.789',
        'Ghi chú': 'Chiến sĩ thi đua cấp cơ sở',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = [
      { wch: 22 }, // Số hiệu
      { wch: 24 }, // Họ tên
      { wch: 15 }, // Cấp bậc
      { wch: 24 }, // Chức vụ
      { wch: 36 }, // Đơn vị
      { wch: 20 }, // Ngày sinh
      { wch: 26 }, // Quê quán
      { wch: 16 }, // Ngày nhập ngũ
      { wch: 16 }, // Ngày vào Đảng
      { wch: 18 }, // SĐT
      { wch: 30 }, // Ghi chú
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachQuanNhan');
    XLSX.writeFile(wb, 'Mau_Nhap_Ho_So_Quan_Nhan_SuDoan10.xlsx');
  };

  // 2. Handle File Upload and Parse
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawData || rawData.length === 0) {
          setErrorMsg('File Excel không có dữ liệu hoặc không đúng định dạng.');
          setIsProcessing(false);
          return;
        }

        const validRows: Partial<MilitaryProfile>[] = [];

        rawData.forEach((row, idx) => {
          // Normalize column names
          const militaryCode = (
            row['Số hiệu quân nhân (*)'] ||
            row['Số hiệu quân nhân'] ||
            row['Số hiệu'] ||
            row['Mã quân nhân'] ||
            row['SoHieu'] ||
            row['militaryCode'] ||
            `QN-${Date.now() + idx}`
          )
            .toString()
            .trim();

          const fullName = (
            row['Họ và tên (*)'] ||
            row['Họ và tên'] ||
            row['Họ tên'] ||
            row['HoTen'] ||
            row['fullName'] ||
            ''
          )
            .toString()
            .trim();

          if (!fullName) return; // Skip empty rows

          const rank = (row['Cấp bậc'] || row['CapBac'] || row['rank'] || 'Quân nhân').toString().trim();
          const position = (row['Chức vụ'] || row['ChucVu'] || row['position'] || 'Cán bộ - Chiến sĩ')
            .toString()
            .trim();
          const unit = (
            row['Đơn vị'] ||
            row['DonVi'] ||
            row['unit'] ||
            'Trung đoàn 95, Sư đoàn 2'
          )
            .toString()
            .trim();
          const birthDate = (row['Ngày sinh (YYYY-MM-DD)'] || row['Ngày sinh'] || row['NgaySinh'] || row['birthDate'] || '')
            .toString()
            .trim();
          const hometown = (row['Quê quán'] || row['QueQuan'] || row['hometown'] || '').toString().trim();
          const enlistmentDate = (row['Ngày nhập ngũ'] || row['NgayNhapNgu'] || row['enlistmentDate'] || '')
            .toString()
            .trim();
          const partyJoinDate = (row['Ngày vào Đảng'] || row['NgayVaoDang'] || row['partyJoinDate'] || '')
            .toString()
            .trim();
          const phoneNumber = (row['Số điện thoại'] || row['SoDienThoai'] || row['phoneNumber'] || '')
            .toString()
            .trim();
          const notes = (row['Ghi chú'] || row['GhiChu'] || row['notes'] || '').toString().trim();

          validRows.push({
            militaryCode,
            fullName,
            rank,
            position,
            unit,
            birthDate,
            hometown,
            enlistmentDate,
            partyJoinDate,
            phoneNumber,
            notes,
            status: 'active',
            totalActiveMinutes: 0,
            sessionCount: 0,
            isOnline: false,
          });
        });

        if (validRows.length === 0) {
          setErrorMsg('Không tìm thấy dòng dữ liệu quân nhân hợp lệ trong file.');
        } else {
          setParsedRows(validRows);
        }
      } catch (err: any) {
        setErrorMsg('Lỗi khi đọc file: ' + (err?.message || 'Định dạng file không được hỗ trợ.'));
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // 3. Confirm Import
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    const fullProfiles: MilitaryProfile[] = parsedRows.map((row, idx) => ({
      id: Date.now() + idx,
      militaryCode: row.militaryCode || `QN-${Math.floor(10000 + Math.random() * 90000)}`,
      fullName: row.fullName || 'Quân nhân',
      birthDate: row.birthDate || '',
      rank: row.rank || 'Binh nhất',
      position: row.position || 'Chiến sĩ',
      unit: row.unit || 'Trung đoàn 95, Sư đoàn 2',
      hometown: row.hometown || '',
      enlistmentDate: row.enlistmentDate || '',
      partyJoinDate: row.partyJoinDate || '',
      phoneNumber: row.phoneNumber || '',
      notes: row.notes || '',
      status: 'active',
      totalActiveMinutes: 0,
      sessionCount: 0,
      isOnline: false,
      userId: null,
    }));

    onImportSuccess(fullProfiles, {
      autoCreateAccounts,
      defaultPassword,
      defaultRole,
      overwriteExisting,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 bg-linear-to-r from-emerald-950 via-emerald-900 to-green-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                Tải lên File Excel Hồ sơ Quân nhân
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-200">
                Thêm hàng loạt quân nhân và tùy chọn tự động cấp tài khoản đăng nhập
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

        {/* Body */}
        <div className="flex-1 p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Action Row: Download Template & File Select */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Download Template */}
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase">
                  <Download className="w-4 h-4 text-amber-700" />
                  <span>Bước 1: Tải file mẫu Excel chuẩn</span>
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  File mẫu đã được thiết lập sẵn các cột: Số hiệu quân nhân, Họ tên, Cấp bậc, Chức vụ, Đơn vị, Ngày sinh, Quê quán...
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer w-full"
              >
                <Download className="w-4 h-4" />
                <span>Tải File Excel Mẫu (.xlsx)</span>
              </button>
            </div>

            {/* Step 2: Upload Excel File */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-emerald-900 uppercase">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>Bước 2: Chọn hoặc kéo thả File Excel</span>
                </div>
                <p className="text-xs text-emerald-800 mt-1">
                  Hỗ trợ định dạng <b>.xlsx, .xls, .csv</b> từ máy tính
                </p>
              </div>

              <div className="mt-3 relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors text-center cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{fileName ? `Đã chọn: ${fileName}` : 'Chọn File từ máy tính...'}</span>
                </div>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Import Settings & Account Creation Options */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-red-700" />
              <span>Tùy chọn Tạo Tài khoản Người dùng Hàng loạt</span>
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCreateAccounts}
                  onChange={(e) => setAutoCreateAccounts(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-red-700 border-gray-300 focus:ring-red-600 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Tự động tạo tài khoản đăng nhập cho tất cả quân nhân trong file
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Tên đăng nhập (username) sẽ tự động lấy theo Số hiệu quân nhân (viết thường không dấu, ví dụ: <code>sq10821</code>)
                  </span>
                </div>
              </label>

              {autoCreateAccounts && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu mặc định:</label>
                    <input
                      type="text"
                      value={defaultPassword}
                      onChange={(e) => setDefaultPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-gray-900 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Vai trò gán cho tài khoản:</label>
                    <select
                      value={defaultRole}
                      onChange={(e) => setDefaultRole(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-900 outline-hidden cursor-pointer"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-gray-200">
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-700 border-gray-300 focus:ring-emerald-600 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Cập nhật lại thông tin nếu trùng Số hiệu quân nhân
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Nếu số hiệu đã tồn tại, hệ thống sẽ cập nhật họ tên, cấp bậc, chức vụ và đơn vị mới
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Preview Parsed Table */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  <h4 className="text-xs font-black uppercase text-gray-900">
                    Xem trước danh sách đọc từ File ({parsedRows.length} quân nhân)
                  </h4>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Dữ liệu hợp lệ
                </span>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2">STT</th>
                      <th className="p-2">Số hiệu</th>
                      <th className="p-2">Họ và tên</th>
                      <th className="p-2">Cấp bậc</th>
                      <th className="p-2">Chức vụ</th>
                      <th className="p-2">Đơn vị</th>
                      <th className="p-2">Quê quán</th>
                      <th className="p-2">SĐT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2 text-gray-400 font-mono">{idx + 1}</td>
                        <td className="p-2 font-mono font-bold text-red-950">{r.militaryCode}</td>
                        <td className="p-2 font-bold text-gray-900">{r.fullName}</td>
                        <td className="p-2 text-gray-700">{r.rank}</td>
                        <td className="p-2 text-gray-700">{r.position}</td>
                        <td className="p-2 text-gray-600 truncate max-w-[160px]">{r.unit}</td>
                        <td className="p-2 text-gray-600 truncate max-w-[120px]">{r.hometown || '-'}</td>
                        <td className="p-2 text-gray-600 font-mono">{r.phoneNumber || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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

          <button
            type="button"
            disabled={parsedRows.length === 0 || isProcessing}
            onClick={handleConfirmImport}
            className="px-5 sm:px-6 py-2.5 rounded-xl bg-linear-to-r from-emerald-700 to-green-800 hover:from-emerald-800 hover:to-green-900 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-green-950/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>
              Xác nhận Nhập {parsedRows.length > 0 ? `${parsedRows.length} Hồ sơ` : 'dữ liệu'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
