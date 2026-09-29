import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  CheckSquare,
  Square,
  Users,
  Sparkles,
  Zap,
  Edit3,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Clock,
  HeartPulse,
  Home,
  Check,
  ChevronDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { IbadahRecord, StatusIbadah, SesiIbadah, Siswa } from '../../types';
import { Modal } from '../common/Modal';

// List of the 7 official prayer & diniyah sessions
export const SESI_IBADAH_LIST: {
  key: SesiIbadah;
  label: string;
  waktu: string;
  icon: string;
}[] = [
  { key: 'subuh', label: 'Salat Subuh', waktu: '04.15 - 04.45', icon: '🌅' },
  { key: 'dhuha', label: 'Salat Dhuha', waktu: '09.30 - 10.00', icon: '☀️' },
  { key: 'duhur', label: 'Salat Duhur', waktu: '12.00 - 12.30', icon: '☀️' },
  { key: 'ashar', label: 'Salat Ashar', waktu: '14.30 - 15.00', icon: '🌤️' },
  { key: 'maghrib', label: 'Salat Maghrib', waktu: '18.00 - 18.30', icon: '🌇' },
  { key: 'isya', label: 'Salat Isya', waktu: '19.00 - 19.30', icon: '🌙' },
  { key: 'diniyah', label: 'Diniyah', waktu: '19.30 - 20.30', icon: '📖' },
];

export const STATUS_IBADAH_OPTIONS: {
  value: StatusIbadah;
  label: string;
  badgeClass: string;
  bgActive: string;
}[] = [
  {
    value: 'Melaksanakan',
    label: 'Melaksanakan',
    badgeClass: 'bg-emerald-50 text-[#006b54] border-[#006b54]',
    bgActive: 'bg-[#006b54] text-white',
  },
  {
    value: 'Sakit',
    label: 'Sakit',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-600',
    bgActive: 'bg-rose-700 text-white',
  },
  {
    value: 'Izin',
    label: 'Izin',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-600',
    bgActive: 'bg-amber-600 text-white',
  },
  {
    value: 'Tidak Melaksanakan',
    label: 'Tidak Melaksanakan',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-500',
    bgActive: 'bg-slate-800 text-white',
  },
];

export const IbadahView: React.FC = () => {
  const {
    ibadahList,
    siswaList,
    kamarList,
    waliAsuhList,
    updateIbadahRecord,
    bulkUpdateIbadah,
    getSiswa,
    getKamar,
    getWaliAsuh,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>('2026-09-22');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKamarFilter, setSelectedKamarFilter] = useState('Semua');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('Semua');

  // Bulk selection of students
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);

  // Bulk action options
  const [bulkSesi, setBulkSesi] = useState<'semua' | SesiIbadah>('semua');
  const [bulkStatus, setBulkStatus] = useState<StatusIbadah>('Melaksanakan');

  // Modal edit single record
  const [editingRecord, setEditingRecord] = useState<{
    siswa: Siswa;
    record: IbadahRecord;
  } | null>(null);

  // Map existing records for the selected date
  const recordsMap = useMemo(() => {
    const map = new Map<string, IbadahRecord>();
    ibadahList
      .filter((r) => r.tanggal === selectedDate)
      .forEach((r) => {
        map.set(r.siswaId, r);
      });
    return map;
  }, [ibadahList, selectedDate]);

  // Helper to get or create record for a student
  const getRecordForSiswa = (siswaId: string): IbadahRecord => {
    const existing = recordsMap.get(siswaId);
    if (existing) return existing;

    const s = siswaList.find((x) => x.id === siswaId);
    const defaultStat: StatusIbadah =
      s?.status === 'Sakit'
        ? 'Sakit'
        : s?.status === 'Izin Pulang'
        ? 'Izin'
        : 'Melaksanakan';

    return {
      id: `ibd-${siswaId}-${selectedDate}`,
      tanggal: selectedDate,
      siswaId,
      subuh: defaultStat,
      dhuha: defaultStat,
      duhur: defaultStat,
      ashar: defaultStat,
      maghrib: defaultStat,
      isya: defaultStat,
      diniyah: defaultStat,
      dzuhur: defaultStat,
    };
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return siswaList.filter((s) => {
      const matchSearch =
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.panggilan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.includes(searchQuery);

      const matchKamar =
        selectedKamarFilter === 'Semua' || s.kamarId === selectedKamarFilter;

      const matchKelas =
        selectedKelasFilter === 'Semua' || s.kelas === selectedKelasFilter;

      return matchSearch && matchKamar && matchKelas;
    });
  }, [siswaList, searchQuery, selectedKamarFilter, selectedKelasFilter]);

  // Bulk selection helpers
  const isAllSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedSiswaIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSiswaIds([]);
    } else {
      setSelectedSiswaIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelectSiswa = (id: string) => {
    setSelectedSiswaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Apply Bulk Update
  const handleApplyBulk = () => {
    if (selectedSiswaIds.length === 0) return;

    const sesiTargets: SesiIbadah[] =
      bulkSesi === 'semua'
        ? ['subuh', 'dhuha', 'duhur', 'ashar', 'maghrib', 'isya', 'diniyah']
        : [bulkSesi];

    bulkUpdateIbadah(selectedSiswaIds, sesiTargets, bulkStatus, selectedDate);
  };

  // Quick 1-click: Set all filtered students to 'Melaksanakan' for all sessions
  const handleSetAllMelaksanakan = () => {
    const ids = filteredStudents.map((s) => s.id);
    bulkUpdateIbadah(
      ids,
      ['subuh', 'dhuha', 'duhur', 'ashar', 'maghrib', 'isya', 'diniyah'],
      'Melaksanakan',
      selectedDate
    );
  };

  // Quick 1-click for a single student: set all 7 sessions to 'Melaksanakan'
  const handleSetSingleStudentAllMelaksanakan = (siswaId: string) => {
    bulkUpdateIbadah(
      [siswaId],
      ['subuh', 'dhuha', 'duhur', 'ashar', 'maghrib', 'isya', 'diniyah'],
      'Melaksanakan',
      selectedDate
    );
  };

  // Quick bulk for a specific column header
  const handleColumnBulk = (sesi: SesiIbadah, status: StatusIbadah) => {
    const ids = filteredStudents.map((s) => s.id);
    bulkUpdateIbadah(ids, [sesi], status, selectedDate);
  };

  // Cycle status on cell click: Melaksanakan -> Sakit -> Izin -> Tidak Melaksanakan -> Melaksanakan
  const handleCycleStatus = (siswaId: string, sesi: SesiIbadah) => {
    const rec = getRecordForSiswa(siswaId);
    const current = rec[sesi];
    let next: StatusIbadah = 'Melaksanakan';

    if (current === 'Melaksanakan') next = 'Sakit';
    else if (current === 'Sakit') next = 'Izin';
    else if (current === 'Izin') next = 'Tidak Melaksanakan';
    else next = 'Melaksanakan';

    const updated: IbadahRecord = {
      ...rec,
      [sesi]: next,
      ...(sesi === 'duhur' ? { dzuhur: next } : {}),
    };
    updateIbadahRecord(updated);
  };

  // Change status directly to a specific value
  const handleChangeStatusDirect = (
    siswaId: string,
    sesi: SesiIbadah,
    status: StatusIbadah
  ) => {
    const rec = getRecordForSiswa(siswaId);
    const updated: IbadahRecord = {
      ...rec,
      [sesi]: status,
      ...(sesi === 'duhur' ? { dzuhur: status } : {}),
    };
    updateIbadahRecord(updated);
  };

  // Statistics calculation for today
  const stats = useMemo(() => {
    let totalChecks = 0;
    let melaksanakanCount = 0;
    let sakitCount = 0;
    let izinCount = 0;
    let tidakCount = 0;

    siswaList.forEach((s) => {
      const rec = getRecordForSiswa(s.id);
      const sessions: SesiIbadah[] = [
        'subuh',
        'dhuha',
        'duhur',
        'ashar',
        'maghrib',
        'isya',
        'diniyah',
      ];
      sessions.forEach((sesi) => {
        totalChecks++;
        const st = rec[sesi];
        if (st === 'Melaksanakan') melaksanakanCount++;
        else if (st === 'Sakit') sakitCount++;
        else if (st === 'Izin') izinCount++;
        else tidakCount++;
      });
    });

    const percent = totalChecks > 0 ? Math.round((melaksanakanCount / totalChecks) * 100) : 0;

    // Per-session count for today
    const perSesiCount: Record<SesiIbadah, { melaksanakan: number; sakit: number; izin: number; tidak: number }> = {
      subuh: { melaksanakan: 0, sakit: 0, izin: 0, tidak: 0 },
      dhuha: { melaksanakan: 0, sakit: 0, izin: 0, tidak: 0 },
      duhur: { melaksanakan: 0, sakit: 0, izin: 0, tidak: 0 },
      ashar: { melaksanakan: 0, sakit: 0, izin: 0, tidak: 0 },
      maghrib: { melaksanakan: 0, sakit: 0, izin: 0, tidak: 0 },
      isya: { melaksanakan: 0, sakit: 0, izin: 0, tidak: 0 },
      diniyah: { melaksanakan: 0, sakit: 0, izin: 0, tidak: 0 },
    };

    siswaList.forEach((s) => {
      const rec = getRecordForSiswa(s.id);
      (Object.keys(perSesiCount) as SesiIbadah[]).forEach((sesi) => {
        const val = rec[sesi];
        if (val === 'Melaksanakan') perSesiCount[sesi].melaksanakan++;
        else if (val === 'Sakit') perSesiCount[sesi].sakit++;
        else if (val === 'Izin') perSesiCount[sesi].izin++;
        else perSesiCount[sesi].tidak++;
      });
    });

    return {
      totalChecks,
      melaksanakanCount,
      sakitCount,
      izinCount,
      tidakCount,
      percent,
      perSesiCount,
    };
  }, [siswaList, recordsMap]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const rows = filteredStudents.map((siswa, idx) => {
      const kamar = getKamar(siswa.kamarId);
      const wali = getWaliAsuh(siswa.waliAsuhId);
      const rec = getRecordForSiswa(siswa.id);

      const sessions: SesiIbadah[] = [
        'subuh',
        'dhuha',
        'duhur',
        'ashar',
        'maghrib',
        'isya',
        'diniyah',
      ];
      const melaks = sessions.filter((k) => rec[k] === 'Melaksanakan').length;
      const kepatuhan = `${melaks}/7 (${Math.round((melaks / 7) * 100)}%)`;

      return {
        No: idx + 1,
        Tanggal: selectedDate,
        NISN: siswa.nisn,
        'Nama Santri': siswa.nama,
        Kelas: siswa.kelas,
        Kamar: kamar?.nama || '-',
        'Wali Asuh': wali?.nama || '-',
        '1. Salat Subuh': rec.subuh,
        '2. Salat Dhuha': rec.dhuha,
        '3. Salat Duhur': rec.duhur,
        '4. Salat Ashar': rec.ashar,
        '5. Salat Maghrib': rec.maghrib,
        '6. Salat Isya': rec.isya,
        '7. Diniyah': rec.diniyah,
        'Kepatuhan Ibadah': kepatuhan,
        Catatan: rec.catatan || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 14 },
      { wch: 25 },
      { wch: 8 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Ibadah & Diniyah');
    XLSX.writeFile(wb, `Rekap_Ibadah_Diniyah_${selectedDate}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner / Header in Variation 2 */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b-[1.5px] border-[#1a1c1a] pb-4">
        <div>
          <span className="status-badge mb-2">
            7 SESI IBADAH & MADRASAH DINIYAH HARIAN
          </span>
          <h1 className="font-syne text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[#1a1c1a] leading-none">
            Ibadah & Diniyah
          </h1>
          <p className="text-xs text-[#1a1c1a]/65 font-mono-custom mt-2 uppercase tracking-wider">
            Subuh · Dhuha · Duhur · Ashar · Maghrib · Isya · Diniyah · Checklist Serentak
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 font-mono-custom text-xs">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a]">
            <Calendar className="w-3.5 h-3.5 text-[#006b54]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-[#1a1c1a] focus:outline-none"
            />
          </div>

          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-[#fdfcf9] text-[#1a1c1a] border-[1.5px] border-[#1a1c1a] font-bold shadow-[2px_2px_0px_#1a1c1a] transition-all uppercase tracking-wider active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            title="Download Rekap Ibadah ke Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#006b54]" />
            <span>Export Excel</span>
          </button>

          {/* Quick Mark All Melaksanakan */}
          <button
            type="button"
            onClick={handleSetAllMelaksanakan}
            className="neo-btn-primary flex items-center gap-1.5"
            title="Tandai seluruh santri melaksanakan semua sholat & diniyah hari ini"
          >
            <Zap className="w-4 h-4 text-emerald-200" />
            <span>SEMUA MELAKSANAKAN (1-KLIK)</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono-custom">
        <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 neo-shadow">
          <span className="text-[10px] text-[#1a1c1a]/60 uppercase font-bold block mb-1">
            // TINGKAT KEPATUHAN HARI INI
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-syne font-black text-[#006b54]">
              {stats.percent}%
            </span>
            <span className="text-[11px] text-[#1a1c1a]/70">
              ({stats.melaksanakanCount}/{stats.totalChecks} sesi)
            </span>
          </div>
        </div>

        <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 neo-shadow">
          <span className="text-[10px] text-[#1a1c1a]/60 uppercase font-bold block mb-1">
            // STATUS: MELAKSANAKAN
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-syne font-black text-[#006b54]">
              {stats.melaksanakanCount}
            </span>
            <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 border border-[#006b54]">
              TERTIB JAMAAH
            </span>
          </div>
        </div>

        <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 neo-shadow">
          <span className="text-[10px] text-[#1a1c1a]/60 uppercase font-bold block mb-1">
            // DISPENSASI UKS (SAKIT)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-syne font-black text-rose-700">
              {stats.sakitCount}
            </span>
            <span className="text-[11px] text-rose-800 font-bold bg-rose-50 px-1.5 py-0.5 border border-rose-600">
              RAWAT / SHOLAT DI UKS
            </span>
          </div>
        </div>

        <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 neo-shadow">
          <span className="text-[10px] text-[#1a1c1a]/60 uppercase font-bold block mb-1">
            // IZIN PULANG / TIDAK
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-syne font-black text-amber-700">
              {stats.izinCount + stats.tidakCount}
            </span>
            <span className="text-[11px] text-amber-900 font-bold bg-amber-50 px-1.5 py-0.5 border border-amber-600">
              {stats.izinCount} Izin · {stats.tidakCount} Absen
            </span>
          </div>
        </div>
      </div>

      {/* KEHADIRAN SALAT & DINIYAH (TERMASUK SALAT DHUHA) */}
      <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-[#1a1c1a]/15 pb-2">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-600" />
            <span className="font-mono-custom text-xs font-bold uppercase tracking-wider text-[#1a1c1a]">
              // KEHADIRAN SALAT & IBADAH HARIAN (TERMASUK SALAT DHUHA)
            </span>
          </div>
          <span className="status-badge accent font-mono-custom text-[11px]">
            TANGGAL: {new Date(selectedDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center font-mono-custom">
          {SESI_IBADAH_LIST.map((sesi) => {
            const dataSesi = stats.perSesiCount[sesi.key];
            const totalSiswaCount = siswaList.length || 1;
            const pct = Math.round((dataSesi.melaksanakan / totalSiswaCount) * 100);
            const isDhuha = sesi.key === 'dhuha';

            return (
              <div
                key={sesi.key}
                className={`p-2.5 border-[1.5px] border-[#1a1c1a] transition-all relative ${
                  isDhuha
                    ? 'bg-amber-50/80 shadow-[2px_2px_0px_#d97706]'
                    : 'bg-[#fdfcf9]'
                }`}
              >
                {isDhuha && (
                  <span className="absolute -top-2 right-1 bg-amber-600 text-white text-[8px] px-1 font-bold uppercase tracking-wider border border-[#1a1c1a]">
                    SUNNAH
                  </span>
                )}
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#1a1c1a]">
                  <span>{sesi.icon}</span>
                  <span className="uppercase">{sesi.label}</span>
                </div>
                <div className="text-[9px] text-[#1a1c1a]/60 mt-0.5">{sesi.waktu}</div>

                <div className="font-syne text-lg font-extrabold text-[#1a1c1a] mt-1">
                  {dataSesi.melaksanakan} <span className="text-xs font-normal text-[#1a1c1a]/60">/ {totalSiswaCount}</span>
                </div>

                <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#1a1c1a]/15 text-[10px]">
                  <span className={`font-bold ${isDhuha ? 'text-amber-800' : 'text-[#006b54]'}`}>
                    {pct}% Hadir
                  </span>
                  {(dataSesi.sakit > 0 || dataSesi.izin > 0) && (
                    <span className="text-[9px] text-[#1a1c1a]/60" title={`Sakit: ${dataSesi.sakit}, Izin: ${dataSesi.izin}`}>
                      {dataSesi.sakit > 0 ? `✚${dataSesi.sakit}` : ''} {dataSesi.izin > 0 ? `★${dataSesi.izin}` : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BULK ACTION BAR / CEKLIS SERENTAK (Directly fulfilling user request) */}
      <div className="bg-[#1a1c1a] text-white p-4 border-[1.5px] border-[#1a1c1a] shadow-[4px_4px_0px_#006b54]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#006b54] text-white font-bold border border-white">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-syne font-bold text-sm sm:text-base uppercase tracking-wider text-white">
                FITUR CEKLIS SERENTAK IBADAH & DINIYAH
              </h2>
              <p className="text-[11px] text-white/70 font-mono-custom">
                Tandai banyak santri sekaligus dengan satu kali klik. Pilihan: Melaksanakan, Sakit, Izin, Tidak Melaksanakan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-3 py-1.5 bg-white text-[#1a1c1a] font-mono-custom text-xs font-bold border border-white hover:bg-emerald-50 active:translate-x-0.5 active:translate-y-0.5"
            >
              {isAllSelected
                ? '✕ BATAL PILIH SEMUA'
                : `✓ PILIH SEMUA (${filteredStudents.length} SANTRI)`}
            </button>
            <span className="px-2.5 py-1 bg-white/10 font-mono-custom text-xs font-bold border border-white/30 text-emerald-300">
              {selectedSiswaIds.length} Terpilih
            </span>
          </div>
        </div>

        {/* Bulk Controls Form */}
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 font-mono-custom text-xs items-center">
          {/* Sesi Target */}
          <div className="lg:col-span-4">
            <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">
              1. Pilih Sesi Ibadah:
            </label>
            <select
              value={bulkSesi}
              onChange={(e) => setBulkSesi(e.target.value as any)}
              className="w-full px-2.5 py-2 bg-white text-[#1a1c1a] font-bold border border-white text-xs focus:outline-none"
            >
              <option value="semua">★ SEMUA SESI (7 Sesi Sekaligus)</option>
              {SESI_IBADAH_LIST.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.icon} {s.label} ({s.waktu})
                </option>
              ))}
            </select>
          </div>

          {/* Status Target */}
          <div className="lg:col-span-5">
            <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">
              2. Pilih Status yang Diterapkan:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {STATUS_IBADAH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBulkStatus(opt.value)}
                  className={`py-1.5 px-1 text-center font-bold text-[10px] border transition-all uppercase whitespace-nowrap ${
                    bulkStatus === opt.value
                      ? `${opt.bgActive} border-white shadow-sm ring-1 ring-white`
                      : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <div className="lg:col-span-3 flex items-end">
            <button
              type="button"
              onClick={handleApplyBulk}
              disabled={selectedSiswaIds.length === 0}
              className={`w-full py-2 px-3 font-bold text-xs uppercase tracking-wider border border-white transition-all flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_white] ${
                selectedSiswaIds.length > 0
                  ? 'bg-[#006b54] text-white hover:bg-emerald-600 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer'
                  : 'bg-white/20 text-white/40 border-white/20 cursor-not-allowed shadow-none'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>TERAPKAN SERENTAK</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 sm:p-4 bg-[#1a1c1a]/[0.05] border-[1.5px] border-[#1a1c1a] rounded flex flex-wrap gap-2.5 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white border-[1.5px] border-[#1a1c1a]">
            <Search className="w-3.5 h-3.5 text-[#1a1c1a]/50" />
            <input
              type="text"
              placeholder="Cari santri / NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-mono-custom text-xs font-semibold text-[#1a1c1a] bg-transparent focus:outline-none w-36 sm:w-48"
            />
          </div>

          {/* Filter Kamar */}
          <select
            value={selectedKamarFilter}
            onChange={(e) => setSelectedKamarFilter(e.target.value)}
            className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] focus:outline-none"
          >
            <option value="Semua">Semua Kamar Asrama</option>
            {kamarList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} ({k.kapasitas} Santri)
              </option>
            ))}
          </select>

          {/* Filter Kelas */}
          <select
            value={selectedKelasFilter}
            onChange={(e) => setSelectedKelasFilter(e.target.value)}
            className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] focus:outline-none"
          >
            <option value="Semua">Semua Kelas</option>
            <option value="Kelas 1">Kelas 1</option>
            <option value="Kelas 2">Kelas 2</option>
            <option value="Kelas 3">Kelas 3</option>
            <option value="Kelas 4">Kelas 4</option>
            <option value="Kelas 5">Kelas 5</option>
            <option value="Kelas 6">Kelas 6</option>
          </select>
        </div>

        <div className="text-xs font-mono-custom text-[#1a1c1a]/70">
          Menampilkan <span className="font-bold text-[#1a1c1a]">{filteredStudents.length}</span> dari 75 santri
        </div>
      </div>

      {/* MAIN CHECKLIST TABLE WITH 7 SESSIONS */}
      <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow overflow-hidden">
        <div className="p-3 bg-[#fdfcf9] border-b-[1.5px] border-[#1a1c1a] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono-custom text-xs font-bold text-[#006b54] uppercase tracking-wider">
              // TABEL CHECKLIST IBADAH & DINIYAH
            </span>
            <span className="text-[11px] font-mono-custom text-[#1a1c1a]/60">
              (Klik status pada tabel untuk mengubah status dengan cepat)
            </span>
          </div>

          {/* Legend Guide */}
          <div className="flex flex-wrap items-center gap-2 font-mono-custom text-[10px]">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-[#006b54] border border-[#006b54] font-bold">
              ✓ Melaksanakan
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-600 font-bold">
              ✚ Sakit
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-600 font-bold">
              ★ Izin
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-400 font-bold">
              ✕ Tidak Melaksanakan
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-custom">
            <thead className="bg-[#1a1c1a] text-[#fdfcf9] uppercase text-[10px] font-bold tracking-wider">
              <tr>
                {/* Select All Checkbox */}
                <th className="p-2.5 text-center w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-3.5 h-3.5 accent-[#006b54] cursor-pointer"
                    title="Pilih semua santri yang ditampilkan"
                  />
                </th>
                <th className="p-2.5 text-center w-10">No</th>
                <th className="p-2.5 min-w-[190px]">SANTRI & KAMAR</th>

                {/* 7 Session Headers with quick bulk dropdown */}
                {SESI_IBADAH_LIST.map((sesi) => (
                  <th key={sesi.key} className="p-2 text-center min-w-[125px]">
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] whitespace-nowrap">
                        {sesi.icon} {sesi.label}
                      </span>
                      <span className="text-[9px] text-[#fdfcf9]/60 lowercase">
                        {sesi.waktu}
                      </span>
                      {/* Column Bulk Trigger */}
                      <div className="mt-1 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleColumnBulk(sesi.key, 'Melaksanakan')}
                          title={`Setel semua ${sesi.label} -> Melaksanakan`}
                          className="px-1 py-0.2 bg-[#006b54] text-white hover:bg-emerald-500 border border-white text-[8px] font-bold"
                        >
                          ✓ Semua
                        </button>
                        <button
                          type="button"
                          onClick={() => handleColumnBulk(sesi.key, 'Sakit')}
                          title={`Setel semua ${sesi.label} -> Sakit`}
                          className="px-1 py-0.2 bg-rose-700 text-white hover:bg-rose-600 border border-white text-[8px] font-bold"
                        >
                          ✚ Sakit
                        </button>
                      </div>
                    </div>
                  </th>
                ))}

                <th className="p-2.5 text-center w-24">HASIL</th>
                <th className="p-2.5 text-right w-24">AKSI</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1a1c1a]/15">
              {filteredStudents.map((siswa, index) => {
                const kamar = getKamar(siswa.kamarId);
                const rec = getRecordForSiswa(siswa.id);
                const isSelected = selectedSiswaIds.includes(siswa.id);

                const sessions: SesiIbadah[] = [
                  'subuh',
                  'dhuha',
                  'duhur',
                  'ashar',
                  'maghrib',
                  'isya',
                  'diniyah',
                ];
                const melaksCount = sessions.filter(
                  (s) => rec[s] === 'Melaksanakan'
                ).length;
                const percent = Math.round((melaksCount / 7) * 100);

                return (
                  <tr
                    key={siswa.id}
                    className={`transition-colors hover:bg-[#1a1c1a]/[0.02] ${
                      isSelected ? 'bg-emerald-50/50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectSiswa(siswa.id)}
                        className="w-3.5 h-3.5 accent-[#006b54] cursor-pointer"
                      />
                    </td>

                    {/* No */}
                    <td className="p-2.5 text-center font-bold text-[#1a1c1a]/60">
                      {index + 1}
                    </td>

                    {/* Santri Info */}
                    <td className="p-2.5">
                      <div className="font-syne font-bold text-xs text-[#1a1c1a]">
                        {siswa.nama}
                      </div>
                      <div className="text-[10px] text-[#1a1c1a]/60 font-mono-custom">
                        {siswa.kelas} ({siswa.panggilan}) · Kamar {kamar?.nama}
                      </div>
                      {rec.catatan && (
                        <div className="text-[10px] text-amber-900 font-semibold italic mt-0.5">
                          💬 {rec.catatan}
                        </div>
                      )}
                    </td>

                    {/* 7 Session Cells */}
                    {SESI_IBADAH_LIST.map((sesi) => {
                      const statusVal = rec[sesi.key];

                      return (
                        <td key={sesi.key} className="p-1.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {/* Main Toggle Button */}
                            <button
                              type="button"
                              onClick={() => handleCycleStatus(siswa.id, sesi.key)}
                              title={`Klik untuk berganti status (${statusVal}). Klik kanan/dropdown untuk memilih langsung.`}
                              className={`w-full py-1 px-1.5 font-bold text-[10px] border transition-all active:scale-95 leading-tight ${
                                statusVal === 'Melaksanakan'
                                  ? 'bg-emerald-50 text-[#006b54] border-[#006b54] hover:bg-emerald-100'
                                  : statusVal === 'Sakit'
                                  ? 'bg-rose-50 text-rose-700 border-rose-600 hover:bg-rose-100'
                                  : statusVal === 'Izin'
                                  ? 'bg-amber-50 text-amber-800 border-amber-600 hover:bg-amber-100'
                                  : 'bg-slate-100 text-slate-800 border-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {statusVal === 'Melaksanakan' && '✓ Melaksanakan'}
                              {statusVal === 'Sakit' && '✚ Sakit'}
                              {statusVal === 'Izin' && '★ Izin'}
                              {statusVal === 'Tidak Melaksanakan' && '✕ Tidak'}
                            </button>

                            {/* Direct Dropdown for exact selection */}
                            <select
                              value={statusVal}
                              onChange={(e) =>
                                handleChangeStatusDirect(
                                  siswa.id,
                                  sesi.key,
                                  e.target.value as StatusIbadah
                                )
                              }
                              className="text-[9px] bg-transparent text-[#1a1c1a]/70 border-b border-[#1a1c1a]/20 focus:outline-none cursor-pointer"
                            >
                              <option value="Melaksanakan">Melaksanakan</option>
                              <option value="Sakit">Sakit</option>
                              <option value="Izin">Izin</option>
                              <option value="Tidak Melaksanakan">Tidak</option>
                            </select>
                          </div>
                        </td>
                      );
                    })}

                    {/* Score / Percent */}
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 font-bold text-[10px] border ${
                          percent === 100
                            ? 'bg-emerald-50 text-[#006b54] border-[#006b54]'
                            : percent >= 70
                            ? 'bg-amber-50 text-amber-900 border-amber-500'
                            : 'bg-rose-50 text-rose-800 border-rose-500'
                        }`}
                      >
                        {melaksCount}/7 ({percent}%)
                      </span>
                    </td>

                    {/* Fast Action */}
                    <td className="p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleSetSingleStudentAllMelaksanakan(siswa.id)}
                          title="Tandai semua 7 sesi Melaksanakan"
                          className="px-1.5 py-1 bg-white hover:bg-emerald-50 border border-[#1a1c1a] text-[9px] font-bold text-[#006b54]"
                        >
                          ✓ Semua
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRecord({ siswa, record: rec })}
                          title="Beri Catatan Khusus"
                          className="p-1 bg-white hover:bg-[#1a1c1a] hover:text-white border border-[#1a1c1a] text-[#1a1c1a]"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDIT SINGLE RECORD / DETAIL CATATAN */}
      {editingRecord && (
        <Modal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          title={`CATATAN IBADAH: ${editingRecord.siswa.nama}`}
          subtitle={`Tanggal: ${selectedDate} · Kelas ${editingRecord.siswa.kelas}`}
          maxWidth="md"
        >
          <div className="space-y-4 font-mono-custom text-xs">
            <div className="p-3 bg-[#fdfcf9] border border-[#1a1c1a] space-y-2">
              <span className="font-bold text-[#1a1c1a] block border-b border-[#1a1c1a]/15 pb-1">
                STATUS PER SESI:
              </span>

              <div className="grid grid-cols-2 gap-2">
                {SESI_IBADAH_LIST.map((sesi) => (
                  <div key={sesi.key} className="flex items-center justify-between p-1.5 bg-white border border-[#1a1c1a]/30">
                    <span className="font-bold text-[11px]">
                      {sesi.icon} {sesi.label}:
                    </span>
                    <select
                      value={editingRecord.record[sesi.key]}
                      onChange={(e) => {
                        const nextStat = e.target.value as StatusIbadah;
                        const updated: IbadahRecord = {
                          ...editingRecord.record,
                          [sesi.key]: nextStat,
                          ...(sesi.key === 'duhur' ? { dzuhur: nextStat } : {}),
                        };
                        setEditingRecord({ ...editingRecord, record: updated });
                        updateIbadahRecord(updated);
                      }}
                      className="px-1.5 py-0.5 bg-white border border-[#1a1c1a] text-[10px] font-bold"
                    >
                      <option value="Melaksanakan">Melaksanakan</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Izin">Izin</option>
                      <option value="Tidak Melaksanakan">Tidak Melaksanakan</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">
                Catatan Pengasuhan / Keterangan Sakit/Izin:
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Mengikuti sholat di ruang UKS dengan tayamum, atau izin pulang ke Jepara kota..."
                value={editingRecord.record.catatan || ''}
                onChange={(e) => {
                  const updated: IbadahRecord = {
                    ...editingRecord.record,
                    catatan: e.target.value,
                  };
                  setEditingRecord({ ...editingRecord, record: updated });
                  updateIbadahRecord(updated);
                }}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1a1c1a]">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="neo-btn-primary"
              >
                SELESAI & TUTUP
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
