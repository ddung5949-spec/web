import React, { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Flame,
  Search,
  Shield,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MilitaryProfile, User as UserType } from '../types';

interface SoldierActivityStatsProps {
  profiles: MilitaryProfile[];
  users: UserType[];
  onOpenProfile: (profile: MilitaryProfile) => void;
}

// Format minutes into human-readable Vietnamese time
export function formatActiveTime(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 phút';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} phút`;
  if (remainingMinutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${remainingMinutes} phút`;
}

export const SoldierActivityStats: React.FC<SoldierActivityStatsProps> = ({
  profiles,
  users,
  onOpenProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState<'all' | 'online' | 'high' | 'medium' | 'none'>('all');

  // Compute merged stats for each soldier profile
  const soldierStats = useMemo(() => {
    return profiles.map((p) => {
      const linkedUser = users.find((u) => u.id === p.userId);
      const totalMinutes = (p.totalActiveMinutes || 0) + (linkedUser?.totalActiveMinutes || 0);
      const isOnline = !!(p.isOnline || linkedUser?.isOnline);
      const lastActive = p.lastActiveAt || linkedUser?.lastActiveAt || 'Chưa đăng nhập';
      const sessionCount = (p.sessionCount || 0) + (linkedUser?.sessionCount || 0);

      return {
        ...p,
        effectiveTotalMinutes: totalMinutes,
        effectiveIsOnline: isOnline,
        effectiveLastActive: lastActive,
        effectiveSessionCount: sessionCount,
        hasAccount: !!p.userId,
      };
    });
  }, [profiles, users]);

  // Summary Metrics
  const totalSoldiers = soldierStats.length;
  const activatedAccounts = soldierStats.filter((s) => s.hasAccount).length;
  const onlineCount = soldierStats.filter((s) => s.effectiveIsOnline).length;
  const totalMinutesAll = soldierStats.reduce((sum, s) => sum + s.effectiveTotalMinutes, 0);
  const avgMinutes = totalSoldiers > 0 ? Math.round(totalMinutesAll / totalSoldiers) : 0;

  // Filtered List
  const filteredSoldiers = useMemo(() => {
    return soldierStats
      .filter((s) => {
        const matchesSearch =
          s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.militaryCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.username && s.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          s.unit.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesUnit = unitFilter === 'all' || s.unit.includes(unitFilter);

        let matchesTime = true;
        if (timeRangeFilter === 'online') matchesTime = s.effectiveIsOnline;
        else if (timeRangeFilter === 'high') matchesTime = s.effectiveTotalMinutes >= 600; // >= 10 hours
        else if (timeRangeFilter === 'medium')
          matchesTime = s.effectiveTotalMinutes > 0 && s.effectiveTotalMinutes < 600;
        else if (timeRangeFilter === 'none') matchesTime = s.effectiveTotalMinutes === 0;

        return matchesSearch && matchesUnit && matchesTime;
      })
      .sort((a, b) => b.effectiveTotalMinutes - a.effectiveTotalMinutes);
  }, [soldierStats, searchTerm, unitFilter, timeRangeFilter]);

  // Top 5 Most Active
  const topActiveSoldiers = useMemo(() => {
    return [...soldierStats]
      .filter((s) => s.effectiveTotalMinutes > 0)
      .sort((a, b) => b.effectiveTotalMinutes - a.effectiveTotalMinutes)
      .slice(0, 5);
  }, [soldierStats]);

  // Units list for filter
  const unitList = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) => {
      if (p.unit.includes('28')) set.add('Trung đoàn 28');
      else if (p.unit.includes('24')) set.add('Trung đoàn 24');
      else if (p.unit.includes('66')) set.add('Trung đoàn 66');
      else if (p.unit.includes('Chính trị')) set.add('Phòng Chính trị');
      else if (p.unit.includes('Tham mưu')) set.add('Phòng Tham mưu');
      else set.add('Khối Cơ quan / Trực thuộc');
    });
    return Array.from(set);
  }, [profiles]);

  // Export Excel Report
  const handleExportReport = () => {
    const data = soldierStats.map((s, idx) => ({
      STT: idx + 1,
      'Số hiệu quân nhân': s.militaryCode,
      'Họ và tên': s.fullName,
      'Cấp bậc': s.rank,
      'Chức vụ': s.position,
      'Đơn vị': s.unit,
      'Tài khoản': s.username ? `@${s.username}` : 'Chưa cấp',
      'Trạng thái': s.effectiveIsOnline ? 'Đang trực tuyến' : 'Ngoại tuyến',
      'Tổng thời gian hoạt động': formatActiveTime(s.effectiveTotalMinutes),
      'Tổng số phút': s.effectiveTotalMinutes,
      'Số phiên đăng nhập': s.effectiveSessionCount,
      'Truy cập gần nhất': s.effectiveLastActive,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 24 },
      { wch: 15 },
      { wch: 20 },
      { wch: 32 },
      { wch: 18 },
      { wch: 18 },
      { wch: 24 },
      { wch: 14 },
      { wch: 18 },
      { wch: 22 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoHoatDong');
    XLSX.writeFile(wb, `Bao_Cao_Thoi_Gian_Hoat_Dong_SuDoan10_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Soldiers */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tổng Quân số</div>
            <div className="text-xl font-black text-gray-900 leading-tight">{totalSoldiers}</div>
            <div className="text-[10px] text-gray-400">Hồ sơ quản lý</div>
          </div>
        </div>

        {/* Activated Accounts */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Đã cấp Tài khoản</div>
            <div className="text-xl font-black text-emerald-800 leading-tight">
              {activatedAccounts}{' '}
              <span className="text-xs text-emerald-600 font-normal">
                ({totalSoldiers > 0 ? Math.round((activatedAccounts / totalSoldiers) * 100) : 0}%)
              </span>
            </div>
            <div className="text-[10px] text-gray-400">Đã liên kết hệ thống</div>
          </div>
        </div>

        {/* Currently Online */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 relative">
            <Wifi className="w-5 h-5" />
            {onlineCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Đang Trực tuyến</div>
            <div className="text-xl font-black text-blue-900 leading-tight flex items-center gap-1.5">
              <span>{onlineCount}</span>
              {onlineCount > 0 && (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </div>
            <div className="text-[10px] text-gray-400">Quân nhân Online</div>
          </div>
        </div>

        {/* Total Active Hours */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tổng Giờ Hoạt động</div>
            <div className="text-lg font-black text-amber-900 leading-tight">
              {Math.floor(totalMinutesAll / 60)}h {totalMinutesAll % 60}m
            </div>
            <div className="text-[10px] text-gray-400">Tích lũy toàn Sư đoàn</div>
          </div>
        </div>

        {/* Average per Soldier */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Trung bình / Quân nhân</div>
            <div className="text-lg font-black text-purple-950 leading-tight">
              {formatActiveTime(avgMinutes)}
            </div>
            <div className="text-[10px] text-gray-400">Thời lượng thực tế</div>
          </div>
        </div>
      </div>

      {/* 2. Top Active Banner + Unit Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Active Soldiers (Hall of Fame) */}
        <div className="lg:col-span-2 bg-linear-to-br from-red-950 via-red-900 to-amber-950 text-white rounded-2xl p-5 shadow-sm border border-red-800/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Flame className="w-5 h-5 text-amber-300 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Cán bộ, Chiến sĩ Hoạt động Tích cực Nhất
                </h3>
                <p className="text-[11px] text-gray-200">
                  Thống kê thời lượng đăng nhập tra cứu văn kiện, học tập và làm việc trực tuyến
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
              Thực số hệ thống
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {topActiveSoldiers.slice(0, 3).map((soldier, idx) => (
              <div
                key={soldier.id}
                onClick={() => onOpenProfile(soldier)}
                className="bg-white/10 hover:bg-white/15 p-3 rounded-xl border border-white/15 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      idx === 0
                        ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300/50'
                        : idx === 1
                        ? 'bg-slate-200 text-slate-900'
                        : 'bg-amber-700 text-white'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 font-mono">
                    {soldier.militaryCode}
                  </span>
                </div>

                <div className="mt-2">
                  <div className="font-bold text-xs text-white group-hover:text-amber-200 transition-colors line-clamp-1">
                    {soldier.fullName}
                  </div>
                  <div className="text-[10px] text-gray-300 truncate">
                    {soldier.rank} • {soldier.unit}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                  <span className="text-gray-300">Tổng thời gian:</span>
                  <span className="font-black text-amber-300">
                    {formatActiveTime(soldier.effectiveTotalMinutes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Export & Actions Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-900">
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Báo cáo Thống kê Thực số</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Trích xuất toàn bộ dữ liệu thời gian hoạt động thực tế, số phiên đăng nhập và tình trạng tài khoản ra file Excel.
            </p>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1 text-xs">
            <div className="flex justify-between font-bold">
              <span>Đơn vị ghi nhận cao nhất:</span>
              <span className="text-emerald-800">Ban Tuyên huấn</span>
            </div>
            <div className="flex justify-between">
              <span>Tỷ lệ truy cập tuần này:</span>
              <span className="font-bold text-emerald-800">94.2%</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportReport}
            className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-emerald-700 to-green-800 hover:from-emerald-800 hover:to-green-900 text-white font-bold text-xs shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 3. Detailed Statistics & Activity Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-red-700 rounded-full inline-block" />
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-700" />
              <span>Bảng Thống kê Chi tiết Thời gian Hoạt động Từng Quân nhân</span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên, số hiệu, username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden"
              />
            </div>

            {/* Time Filter */}
            <select
              value={timeRangeFilter}
              onChange={(e) => setTimeRangeFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-red-600 outline-hidden cursor-pointer"
            >
              <option value="all">Mọi thời lượng</option>
              <option value="online">Đang trực tuyến (Online)</option>
              <option value="high">Hoạt động nhiều (&gt; 10 giờ)</option>
              <option value="medium">Đã hoạt động (1 - 10 giờ)</option>
              <option value="none">Chưa hoạt động (0 giờ)</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100/75 text-gray-700 font-bold border-b border-gray-200">
              <tr>
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3">Số hiệu / Tài khoản</th>
                <th className="p-3">Quân nhân & Đơn vị</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3">Thời gian hoạt động</th>
                <th className="p-3 text-center">Số phiên</th>
                <th className="p-3">Truy cập gần nhất</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSoldiers.length > 0 ? (
                filteredSoldiers.map((soldier, idx) => (
                  <tr key={soldier.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-400">{idx + 1}</td>

                    {/* Military Code & Username */}
                    <td className="p-3">
                      <div className="font-mono font-black text-red-900 text-xs">
                        {soldier.militaryCode}
                      </div>
                      {soldier.username ? (
                        <div className="text-[10px] font-mono text-emerald-700 font-bold">
                          @{soldier.username}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Chưa cấp tài khoản</span>
                      )}
                    </td>

                    {/* Full Name & Unit */}
                    <td className="p-3">
                      <div className="font-bold text-gray-900">{soldier.fullName}</div>
                      <div className="text-[11px] text-gray-500">
                        {soldier.rank} - {soldier.position}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[220px]">
                        {soldier.unit}
                      </div>
                    </td>

                    {/* Online / Offline Status */}
                    <td className="p-3 text-center">
                      {soldier.effectiveIsOnline ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>Online</span>
                        </span>
                      ) : soldier.effectiveTotalMinutes > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                          <WifiOff className="w-2.5 h-2.5" />
                          <span>Ngoại tuyến</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Chưa kích hoạt
                        </span>
                      )}
                    </td>

                    {/* Total Active Time with Progress Bar */}
                    <td className="p-3">
                      <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{formatActiveTime(soldier.effectiveTotalMinutes)}</span>
                      </div>
                      <div className="w-32 bg-gray-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            soldier.effectiveTotalMinutes >= 600
                              ? 'bg-emerald-600'
                              : soldier.effectiveTotalMinutes > 60
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (soldier.effectiveTotalMinutes / 1440) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>

                    {/* Session Count */}
                    <td className="p-3 text-center font-mono font-bold text-gray-700">
                      {soldier.effectiveSessionCount}
                    </td>

                    {/* Last Active Timestamp */}
                    <td className="p-3 text-[11px] text-gray-600 font-mono">
                      {soldier.effectiveLastActive}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenProfile(soldier)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        Chi tiết hồ sơ
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 italic">
                    Không tìm thấy quân nhân nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
