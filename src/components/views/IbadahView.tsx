import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  Search,
  Download,
  CheckSquare,
  Zap,
  Edit3,
  Sun,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ListChecks,
  ExternalLink,
  CheckCircle2,
  X,
  MessageSquarePlus,
  Trash2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { IbadahRecord, StatusIbadah, SesiIbadah, Siswa } from '../../types';

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

const SESSION_KEYS: SesiIbadah[] = [
  'subuh',
  'dhuha',
  'duhur',
  'ashar',
  'maghrib',
  'isya',
  'diniyah',
];

const toLocalISODate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateIndo = (dateStr: string, withWeekday = false): string => {
  if (!dateStr) return '-';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('id-ID', {
    ...(withWeekday ? { weekday: 'short' as const } : {}),
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const IbadahView: React.FC = () => {
  const {
    ibadahList,
    siswaList,
    kamarList,
    updateIbadahRecord,
    bulkUpdateIbadah,
    getKamar,
    getWaliAsuh,
  } = useApp();

  const todayStr = toLocalISODate(new Date());

  // View mode: daily checklist vs multi-date recap
  const [viewMode, setViewMode] = useState<'harian' | 'rekap'>('harian');

  // Single-date filter for Checklist Harian
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Date-range filter for Rekap Rentang Tanggal
  const [rekapStartDate, setRekapStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return toLocalISODate(d);
  });
  const [rekapEndDate, setRekapEndDate] = useState<string>(todayStr);
  const [rekapIncludeAllDates, setRekapIncludeAllDates] = useState<boolean>(false);

  // Shared student filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKamarFilter, setSelectedKamarFilter] = useState('Semua');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('Semua');

  // Bulk selection of students
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);

  // Bulk action options
  const [bulkSesi, setBulkSesi] = useState<'semua' | SesiIbadah>('semua');
  const [bulkStatus, setBulkStatus] = useState<StatusIbadah>('Melaksanakan');

  // Inline Form Beri Catatan Khusus
  const [noteFormState, setNoteFormState] = useState<{
    siswa: Siswa;
    record: IbadahRecord;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const noteFormRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenNoteForm = (siswa: Siswa, record: IbadahRecord) => {
    setNoteFormState({
      siswa,
      record: { ...record, catatan: record.catatan || '' },
    });
    setTimeout(() => {
      noteFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleSwitchNoteSiswa = (siswaId: string) => {
    const target = siswaList.find((s) => s.id === siswaId);
    if (!target) return;
    const rec = getRecordForSiswa(target.id);
    setNoteFormState({
      siswa: target,
      record: { ...rec, catatan: rec.catatan || '' },
    });
  };

  const handleSaveNoteForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteFormState) return;
    const cleanedCatatan = (noteFormState.record.catatan || '').trim();
    const updated: IbadahRecord = {
      ...noteFormState.record,
      catatan: cleanedCatatan,
    };
    updateIbadahRecord(updated);
    showToast(
      `✓ Catatan khusus ibadah untuk ${noteFormState.siswa.nama} (${formatDateIndo(selectedDate)}) berhasil disimpan.`
    );
    setNoteFormState(null);
  };

  const handleClearNoteForm = () => {
    if (!noteFormState) return;
    const updated: IbadahRecord = {
      ...noteFormState.record,
      catatan: '',
    };
    updateIbadahRecord(updated);
    showToast(
      `✓ Catatan khusus ibadah untuk ${noteFormState.siswa.nama} (${formatDateIndo(selectedDate)}) dihapus.`
    );
    setNoteFormState(null);
  };

  // Unique recorded dates sorted newest first
  const recordedDates = useMemo(() => {
    const counts = new Map<string, number>();
    ibadahList.forEach((r) => {
      if (r.tanggal) {
        counts.set(r.tanggal, (counts.get(r.tanggal) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([tanggal, count]) => ({ tanggal, count }));
  }, [ibadahList]);

  const handleStepDate = (deltaDays: number) => {
    const base = new Date(`${selectedDate || todayStr}T00:00:00`);
    base.setDate(base.getDate() + deltaDays);
    setSelectedDate(toLocalISODate(base));
  };

  const handleApplyRekapPreset = (
    preset: 'hari-ini' | '7-hari' | 'bulan-ini' | 'bulan-lalu' | 'semua'
  ) => {
    const now = new Date();
    if (preset === 'semua') {
      setRekapIncludeAllDates(true);
      return;
    }
    setRekapIncludeAllDates(false);

    if (preset === 'hari-ini') {
      const t = toLocalISODate(now);
      setRekapStartDate(t);
      setRekapEndDate(t);
    } else if (preset === '7-hari') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setRekapStartDate(toLocalISODate(start));
      setRekapEndDate(toLocalISODate(now));
    } else if (preset === 'bulan-ini') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setRekapStartDate(toLocalISODate(start));
      setRekapEndDate(toLocalISODate(now));
    } else if (preset === 'bulan-lalu') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setRekapStartDate(toLocalISODate(start));
      setRekapEndDate(toLocalISODate(end));
    }
  };

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

  // Helper to get or create record for a student on selectedDate
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
    const q = searchQuery.toLowerCase();
    return siswaList.filter((s) => {
      const matchSearch =
        s.nama.toLowerCase().includes(q) ||
        s.panggilan.toLowerCase().includes(q) ||
        s.nisn.includes(searchQuery);

      const matchKamar =
        selectedKamarFilter === 'Semua' || s.kamarId === selectedKamarFilter;

      const matchKelas =
        selectedKelasFilter === 'Semua' || s.kelas === selectedKelasFilter;

      return matchSearch && matchKamar && matchKelas;
    });
  }, [siswaList, searchQuery, selectedKamarFilter, selectedKelasFilter]);

  const filteredStudentIds = useMemo(
    () => new Set(filteredStudents.map((s) => s.id)),
    [filteredStudents]
  );

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
      bulkSesi === 'semua' ? SESSION_KEYS : [bulkSesi];

    bulkUpdateIbadah(selectedSiswaIds, sesiTargets, bulkStatus, selectedDate);
  };

  // Quick 1-click: Set all filtered students to 'Melaksanakan' for all sessions
  const handleSetAllMelaksanakan = () => {
    const ids = filteredStudents.map((s) => s.id);
    if (ids.length === 0) return;
    bulkUpdateIbadah(ids, SESSION_KEYS, 'Melaksanakan', selectedDate);
  };

  // Quick 1-click for a single student: set all 7 sessions to 'Melaksanakan'
  const handleSetSingleStudentAllMelaksanakan = (siswaId: string) => {
    bulkUpdateIbadah([siswaId], SESSION_KEYS, 'Melaksanakan', selectedDate);
  };

  // Quick bulk for a specific column header
  const handleColumnBulk = (sesi: SesiIbadah, status: StatusIbadah) => {
    const ids = filteredStudents.map((s) => s.id);
    if (ids.length === 0) return;
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

  // Daily statistics calculation (respects siswaList)
  const stats = useMemo(() => {
    let totalChecks = 0;
    let melaksanakanCount = 0;
    let sakitCount = 0;
    let izinCount = 0;
    let tidakCount = 0;

    const perSesiCount: Record<
      SesiIbadah,
      { melaksanakan: number; sakit: number; izin: number; tidak: number }
    > = {
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
      SESSION_KEYS.forEach((sesi) => {
        totalChecks++;
        const st = rec[sesi];
        if (st === 'Melaksanakan') {
          melaksanakanCount++;
          perSesiCount[sesi].melaksanakan++;
        } else if (st === 'Sakit') {
          sakitCount++;
          perSesiCount[sesi].sakit++;
        } else if (st === 'Izin') {
          izinCount++;
          perSesiCount[sesi].izin++;
        } else {
          tidakCount++;
          perSesiCount[sesi].tidak++;
        }
      });
    });

    const percent =
      totalChecks > 0 ? Math.round((melaksanakanCount / totalChecks) * 100) : 0;

    return {
      totalChecks,
      melaksanakanCount,
      sakitCount,
      izinCount,
      tidakCount,
      percent,
      perSesiCount,
    };
  }, [siswaList, recordsMap, selectedDate]);

  // ============================================================================
  // REKAP RENTANG TANGGAL COMPUTATIONS
  // ============================================================================
  const rekapRecords = useMemo(() => {
    const start = rekapStartDate && rekapEndDate && rekapStartDate > rekapEndDate
      ? rekapEndDate
      : rekapStartDate;
    const end = rekapStartDate && rekapEndDate && rekapStartDate > rekapEndDate
      ? rekapStartDate
      : rekapEndDate;

    return ibadahList.filter((r) => {
      if (!filteredStudentIds.has(r.siswaId)) return false;
      if (rekapIncludeAllDates) return true;
      if (start && r.tanggal < start) return false;
      if (end && r.tanggal > end) return false;
      return true;
    });
  }, [ibadahList, filteredStudentIds, rekapStartDate, rekapEndDate, rekapIncludeAllDates]);

  const rekapSummaryByDate = useMemo(() => {
    const map = new Map<
      string,
      {
        tanggal: string;
        jumlahSantri: number;
        melaksanakan: number;
        sakit: number;
        izin: number;
        tidak: number;
        totalSesi: number;
      }
    >();

    rekapRecords.forEach((rec) => {
      const curr = map.get(rec.tanggal) || {
        tanggal: rec.tanggal,
        jumlahSantri: 0,
        melaksanakan: 0,
        sakit: 0,
        izin: 0,
        tidak: 0,
        totalSesi: 0,
      };
      curr.jumlahSantri += 1;
      SESSION_KEYS.forEach((sesi) => {
        curr.totalSesi += 1;
        const val = rec[sesi];
        if (val === 'Melaksanakan') curr.melaksanakan += 1;
        else if (val === 'Sakit') curr.sakit += 1;
        else if (val === 'Izin') curr.izin += 1;
        else curr.tidak += 1;
      });
      map.set(rec.tanggal, curr);
    });

    return Array.from(map.values()).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [rekapRecords]);

  const rekapByStudent = useMemo(() => {
    const map = new Map<
      string,
      {
        siswa: Siswa;
        hariTercatat: number;
        melaksanakan: number;
        sakit: number;
        izin: number;
        tidak: number;
        totalSesi: number;
        perSesiMelaksanakan: Record<SesiIbadah, number>;
      }
    >();

    filteredStudents.forEach((siswa) => {
      map.set(siswa.id, {
        siswa,
        hariTercatat: 0,
        melaksanakan: 0,
        sakit: 0,
        izin: 0,
        tidak: 0,
        totalSesi: 0,
        perSesiMelaksanakan: {
          subuh: 0,
          dhuha: 0,
          duhur: 0,
          ashar: 0,
          maghrib: 0,
          isya: 0,
          diniyah: 0,
        },
      });
    });

    rekapRecords.forEach((rec) => {
      const entry = map.get(rec.siswaId);
      if (!entry) return;
      entry.hariTercatat += 1;
      SESSION_KEYS.forEach((sesi) => {
        entry.totalSesi += 1;
        const val = rec[sesi];
        if (val === 'Melaksanakan') {
          entry.melaksanakan += 1;
          entry.perSesiMelaksanakan[sesi] += 1;
        } else if (val === 'Sakit') {
          entry.sakit += 1;
        } else if (val === 'Izin') {
          entry.izin += 1;
        } else {
          entry.tidak += 1;
        }
      });
    });

    return Array.from(map.values());
  }, [filteredStudents, rekapRecords]);

  const rekapTotals = useMemo(() => {
    let totalSesi = 0;
    let melaksanakan = 0;
    let sakit = 0;
    let izin = 0;
    let tidak = 0;

    rekapRecords.forEach((rec) => {
      SESSION_KEYS.forEach((sesi) => {
        totalSesi += 1;
        const val = rec[sesi];
        if (val === 'Melaksanakan') melaksanakan += 1;
        else if (val === 'Sakit') sakit += 1;
        else if (val === 'Izin') izin += 1;
        else tidak += 1;
      });
    });

    const percent = totalSesi > 0 ? Math.round((melaksanakan / totalSesi) * 100) : 0;

    return {
      totalHari: rekapSummaryByDate.length,
      totalRecords: rekapRecords.length,
      totalSesi,
      melaksanakan,
      sakit,
      izin,
      tidak,
      percent,
    };
  }, [rekapRecords, rekapSummaryByDate]);

  // Export to Excel (.xlsx) - adapts to active mode
  const handleExportExcel = () => {
    if (viewMode === 'harian') {
      const rows = filteredStudents.map((siswa, idx) => {
        const kamar = getKamar(siswa.kamarId);
        const wali = getWaliAsuh(siswa.waliAsuhId);
        const rec = getRecordForSiswa(siswa.id);

        const melaks = SESSION_KEYS.filter((k) => rec[k] === 'Melaksanakan').length;
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
      return;
    }

    // Export Rekap Rentang Tanggal
    const siswaRows = rekapByStudent.map((row, idx) => {
      const kamar = getKamar(row.siswa.kamarId);
      const wali = getWaliAsuh(row.siswa.waliAsuhId);
      const pct = row.totalSesi > 0 ? Math.round((row.melaksanakan / row.totalSesi) * 100) : 0;
      return {
        No: idx + 1,
        NISN: row.siswa.nisn,
        'Nama Santri': row.siswa.nama,
        Kelas: row.siswa.kelas,
        Kamar: kamar?.nama || '-',
        'Wali Asuh': wali?.nama || '-',
        'Hari Tercatat': row.hariTercatat,
        'Subuh (Hadir)': row.perSesiMelaksanakan.subuh,
        'Dhuha (Hadir)': row.perSesiMelaksanakan.dhuha,
        'Duhur (Hadir)': row.perSesiMelaksanakan.duhur,
        'Ashar (Hadir)': row.perSesiMelaksanakan.ashar,
        'Maghrib (Hadir)': row.perSesiMelaksanakan.maghrib,
        'Isya (Hadir)': row.perSesiMelaksanakan.isya,
        'Diniyah (Hadir)': row.perSesiMelaksanakan.diniyah,
        'Total Melaksanakan': row.melaksanakan,
        'Total Sakit': row.sakit,
        'Total Izin': row.izin,
        'Total Tidak': row.tidak,
        'Kepatuhan (%)': `${pct}%`,
      };
    });

    const dateRows = rekapSummaryByDate.map((d, idx) => {
      const pct = d.totalSesi > 0 ? Math.round((d.melaksanakan / d.totalSesi) * 100) : 0;
      return {
        No: idx + 1,
        Tanggal: d.tanggal,
        'Santri Tercatat': d.jumlahSantri,
        'Total Sesi': d.totalSesi,
        Melaksanakan: d.melaksanakan,
        Sakit: d.sakit,
        Izin: d.izin,
        'Tidak Melaksanakan': d.tidak,
        'Kepatuhan (%)': `${pct}%`,
      };
    });

    const detailRows = [...rekapRecords]
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .map((rec, idx) => {
        const s = siswaList.find((x) => x.id === rec.siswaId);
        const kamar = s ? getKamar(s.kamarId) : undefined;
        return {
          No: idx + 1,
          Tanggal: rec.tanggal,
          'Nama Santri': s?.nama || rec.siswaId,
          Kelas: s?.kelas || '-',
          Kamar: kamar?.nama || '-',
          Subuh: rec.subuh,
          Dhuha: rec.dhuha,
          Duhur: rec.duhur,
          Ashar: rec.ashar,
          Maghrib: rec.maghrib,
          Isya: rec.isya,
          Diniyah: rec.diniyah,
          Catatan: rec.catatan || '-',
        };
      });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(siswaRows), 'Rekap Per Santri');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dateRows), 'Rekap Per Tanggal');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), 'Detail Harian');
    const rangeTag = rekapIncludeAllDates ? 'Semua_Tanggal' : `${rekapStartDate}_sd_${rekapEndDate}`;
    XLSX.writeFile(wb, `Rekap_Periode_Ibadah_${rangeTag}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b-[1.5px] border-[#1a1c1a] pb-4">
        <div>
          <span className="status-badge mb-2">
            7 SESI IBADAH & MADRASAH DINIYAH HARIAN
          </span>
          <h1 className="font-syne text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[#1a1c1a] leading-none">
            Ibadah & Diniyah
          </h1>
          <p className="text-xs text-[#1a1c1a]/65 font-mono-custom mt-2 uppercase tracking-wider">
            Subuh · Dhuha · Duhur · Ashar · Maghrib · Isya · Diniyah · Filter Tanggal & Perekapan
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 font-mono-custom text-xs">
          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-[#fdfcf9] text-[#1a1c1a] border-[1.5px] border-[#1a1c1a] font-bold shadow-[2px_2px_0px_#1a1c1a] transition-all uppercase tracking-wider active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            title={
              viewMode === 'harian'
                ? 'Download Rekap Ibadah Tanggal Ini ke Excel'
                : 'Download Rekap Periode Ibadah ke Excel'
            }
          >
            <Download className="w-3.5 h-3.5 text-[#006b54]" />
            <span>{viewMode === 'harian' ? 'Export Excel' : 'Export Rekap Excel'}</span>
          </button>

          {/* Quick Mark All Melaksanakan (only in Harian mode) */}
          {viewMode === 'harian' && (
            <button
              type="button"
              onClick={handleSetAllMelaksanakan}
              className="neo-btn-primary flex items-center gap-1.5"
              title="Tandai seluruh santri melaksanakan semua sholat & diniyah pada tanggal terpilih"
            >
              <Zap className="w-4 h-4 text-emerald-200" />
              <span>SEMUA MELAKSANAKAN (1-KLIK)</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border-[1.5px] border-[#006b54] text-[#006b54] font-mono-custom text-xs font-bold flex items-center justify-between shadow-[2.5px_2.5px_0px_#1a1c1a]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[10px] uppercase font-bold hover:underline ml-3 cursor-pointer"
          >
            TUTUP
          </button>
        </div>
      )}

      {/* FILTER TANGGAL & MODE PEREKAPAN */}
      <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1a1c1a]/15 pb-3">
          {/* Mode Tabs */}
          <div className="flex flex-wrap items-center gap-2 font-mono-custom text-xs">
            <button
              type="button"
              onClick={() => setViewMode('harian')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 font-bold uppercase border-[1.5px] border-[#1a1c1a] transition-all ${
                viewMode === 'harian'
                  ? 'bg-[#1a1c1a] text-white shadow-[2px_2px_0px_#006b54]'
                  : 'bg-[#fdfcf9] text-[#1a1c1a] hover:bg-[#1a1c1a]/5'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Checklist Harian (Per Tanggal)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('rekap')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 font-bold uppercase border-[1.5px] border-[#1a1c1a] transition-all ${
                viewMode === 'rekap'
                  ? 'bg-[#006b54] text-white shadow-[2px_2px_0px_#1a1c1a]'
                  : 'bg-[#fdfcf9] text-[#1a1c1a] hover:bg-[#1a1c1a]/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Rekap Rentang Tanggal</span>
            </button>
          </div>

          <div className="text-[11px] font-mono-custom text-[#1a1c1a]/70">
            {viewMode === 'harian' ? (
              <span>
                Tersimpan:{' '}
                <strong className="text-[#006b54]">{recordsMap.size}</strong> / {siswaList.length}{' '}
                santri pada <strong>{formatDateIndo(selectedDate)}</strong>
              </span>
            ) : (
              <span>
                Total Periode:{' '}
                <strong className="text-[#006b54]">{rekapTotals.totalHari} hari</strong> ·{' '}
                <strong>{rekapTotals.totalRecords}</strong> catatan santri
              </span>
            )}
          </div>
        </div>

        {/* Date Filter Controls */}
        {viewMode === 'harian' ? (
          <div className="space-y-2.5 font-mono-custom text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase text-[#1a1c1a]/70 mr-1">
                Filter Tanggal:
              </span>

              <button
                type="button"
                onClick={() => handleStepDate(-1)}
                className="p-2 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-white border-[1.5px] border-[#1a1c1a] transition-colors"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a]">
                <Calendar className="w-3.5 h-3.5 text-[#006b54]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value || todayStr)}
                  className="bg-transparent font-bold text-[#1a1c1a] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => handleStepDate(1)}
                className="p-2 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-white border-[1.5px] border-[#1a1c1a] transition-colors"
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-3 py-1.5 font-bold uppercase border-[1.5px] border-[#1a1c1a] transition-colors ${
                  selectedDate === todayStr
                    ? 'bg-[#006b54] text-white'
                    : 'bg-white text-[#1a1c1a] hover:bg-emerald-50'
                }`}
              >
                Hari Ini
              </button>
            </div>

            {recordedDates.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase text-[#1a1c1a]/60 mr-1">
                  Tanggal Tercatat:
                </span>
                {recordedDates.slice(0, 8).map((item) => (
                  <button
                    key={item.tanggal}
                    type="button"
                    onClick={() => setSelectedDate(item.tanggal)}
                    className={`px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                      selectedDate === item.tanggal
                        ? 'bg-[#1a1c1a] text-white border-[#1a1c1a]'
                        : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40 hover:border-[#1a1c1a]'
                    }`}
                  >
                    {formatDateIndo(item.tanggal)} ({item.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 font-mono-custom text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase text-[#1a1c1a]/70">
                  Dari:
                </span>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a]">
                  <Calendar className="w-3.5 h-3.5 text-[#006b54]" />
                  <input
                    type="date"
                    value={rekapStartDate}
                    disabled={rekapIncludeAllDates}
                    onChange={(e) => {
                      setRekapIncludeAllDates(false);
                      setRekapStartDate(e.target.value);
                    }}
                    className="bg-transparent font-bold text-[#1a1c1a] focus:outline-none disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase text-[#1a1c1a]/70">
                  Sampai:
                </span>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a]">
                  <Calendar className="w-3.5 h-3.5 text-[#006b54]" />
                  <input
                    type="date"
                    value={rekapEndDate}
                    disabled={rekapIncludeAllDates}
                    onChange={(e) => {
                      setRekapIncludeAllDates(false);
                      setRekapEndDate(e.target.value);
                    }}
                    className="bg-transparent font-bold text-[#1a1c1a] focus:outline-none disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyRekapPreset('hari-ini')}
                  className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 border-[1.5px] border-[#1a1c1a] font-bold text-[10px] uppercase"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRekapPreset('7-hari')}
                  className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 border-[1.5px] border-[#1a1c1a] font-bold text-[10px] uppercase"
                >
                  7 Hari Terakhir
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRekapPreset('bulan-ini')}
                  className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 border-[1.5px] border-[#1a1c1a] font-bold text-[10px] uppercase"
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRekapPreset('bulan-lalu')}
                  className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 border-[1.5px] border-[#1a1c1a] font-bold text-[10px] uppercase"
                >
                  Bulan Lalu
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRekapPreset('semua')}
                  className={`px-2.5 py-1.5 border-[1.5px] border-[#1a1c1a] font-bold text-[10px] uppercase ${
                    rekapIncludeAllDates
                      ? 'bg-[#1a1c1a] text-white'
                      : 'bg-white hover:bg-[#1a1c1a]/5 text-[#1a1c1a]'
                  }`}
                >
                  Semua Tanggal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODE 1: CHECKLIST HARIAN (PER TANGGAL) */}
      {/* ===================================================================== */}
      {viewMode === 'harian' && (
        <>
          {/* KPI METRICS OVERVIEW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono-custom">
            <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 neo-shadow">
              <span className="text-[10px] text-[#1a1c1a]/60 uppercase font-bold block mb-1">
                // TINGKAT KEPATUHAN TANGGAL INI
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
                TANGGAL: {formatDateIndo(selectedDate, true)}
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
                      {dataSesi.melaksanakan}{' '}
                      <span className="text-xs font-normal text-[#1a1c1a]/60">
                        / {siswaList.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#1a1c1a]/15 text-[10px]">
                      <span
                        className={`font-bold ${isDhuha ? 'text-amber-800' : 'text-[#006b54]'}`}
                      >
                        {siswaList.length > 0 ? `${pct}% Hadir` : '0% Hadir'}
                      </span>
                      {(dataSesi.sakit > 0 || dataSesi.izin > 0) && (
                        <span
                          className="text-[9px] text-[#1a1c1a]/60"
                          title={`Sakit: ${dataSesi.sakit}, Izin: ${dataSesi.izin}`}
                        >
                          {dataSesi.sakit > 0 ? `✚${dataSesi.sakit}` : ''}{' '}
                          {dataSesi.izin > 0 ? `★${dataSesi.izin}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BULK ACTION BAR / CEKLIS SERENTAK */}
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
                    Tandai banyak santri sekaligus pada tanggal {formatDateIndo(selectedDate)}.
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
              <div className="lg:col-span-4">
                <label className="block text-[10px] font-bold uppercase text-white/70 mb-1">
                  1. Pilih Sesi Ibadah:
                </label>
                <select
                  value={bulkSesi}
                  onChange={(e) => setBulkSesi(e.target.value as 'semua' | SesiIbadah)}
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

              <select
                value={selectedKelasFilter}
                onChange={(e) => setSelectedKelasFilter(e.target.value)}
                className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] focus:outline-none"
              >
                <option value="Semua">Semua Kelas</option>
                <option value="1 SD">Kelas 1 SD</option>
                <option value="2 SD">Kelas 2 SD</option>
                <option value="3 SD">Kelas 3 SD</option>
                <option value="4 SD">Kelas 4 SD</option>
                <option value="5 SD">Kelas 5 SD</option>
                <option value="6 SD">Kelas 6 SD</option>
              </select>
            </div>

            <div className="text-xs font-mono-custom text-[#1a1c1a]/70">
              Menampilkan <span className="font-bold text-[#1a1c1a]">{filteredStudents.length}</span>{' '}
              dari {siswaList.length} santri
            </div>
          </div>

          {/* FORM INLINE BERI CATATAN KHUSUS (TERBUKA DARI AKSI) */}
          <div ref={noteFormRef}>
            {noteFormState && (
              <form
                onSubmit={handleSaveNoteForm}
                className="bg-[#fdfcf9] border-[2px] border-[#1a1c1a] shadow-[4px_4px_0px_#006b54] p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b-[1.5px] border-[#1a1c1a] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#006b54] text-white border border-[#1a1c1a]">
                      <MessageSquarePlus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono-custom font-bold uppercase text-[#006b54] tracking-wider block">
                        // FORM BERI CATATAN KHUSUS IBADAH
                      </span>
                      <h3 className="font-syne font-extrabold text-base sm:text-lg text-[#1a1c1a]">
                        {noteFormState.siswa.nama}{' '}
                        <span className="text-xs font-mono-custom font-normal text-[#1a1c1a]/70">
                          ({noteFormState.siswa.kelas} · Kamar{' '}
                          {getKamar(noteFormState.siswa.kamarId)?.nama || '-'} ·{' '}
                          {formatDateIndo(selectedDate)})
                        </span>
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNoteFormState(null)}
                    className="p-1.5 bg-white hover:bg-rose-50 border-[1.5px] border-[#1a1c1a] text-[#1a1c1a]"
                    title="Tutup Form"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Pilih Santri & Quick All Melaksanakan */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end font-mono-custom text-xs">
                  <div className="sm:col-span-7">
                    <label className="block text-[10px] font-bold uppercase text-[#1a1c1a]/70 mb-1">
                      Santri Terpilih
                    </label>
                    <select
                      value={noteFormState.siswa.id}
                      onChange={(e) => handleSwitchNoteSiswa(e.target.value)}
                      className="w-full px-3 py-2 bg-white border-[1.5px] border-[#1a1c1a] font-bold text-xs focus:outline-none"
                    >
                      {siswaList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nama} ({s.kelas} · Kamar {getKamar(s.kamarId)?.nama || '-'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-5 flex justify-start sm:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setNoteFormState((prev) =>
                          prev
                            ? {
                                ...prev,
                                record: {
                                  ...prev.record,
                                  subuh: 'Melaksanakan',
                                  dhuha: 'Melaksanakan',
                                  duhur: 'Melaksanakan',
                                  ashar: 'Melaksanakan',
                                  maghrib: 'Melaksanakan',
                                  isya: 'Melaksanakan',
                                  diniyah: 'Melaksanakan',
                                  dzuhur: 'Melaksanakan',
                                },
                              }
                            : null
                        )
                      }
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#006b54] border-[1.5px] border-[#006b54] font-bold text-[11px] uppercase"
                    >
                      ✓ Setel 7 Sesi Melaksanakan
                    </button>
                  </div>
                </div>

                {/* Status Per 7 Sesi */}
                <div className="p-3 bg-white border-[1.5px] border-[#1a1c1a] space-y-2 font-mono-custom text-xs">
                  <span className="font-bold text-[10px] uppercase text-[#1a1c1a]/70 block">
                    Status Per Sesi Ibadah & Diniyah:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {SESI_IBADAH_LIST.map((sesi) => (
                      <div
                        key={sesi.key}
                        className="flex items-center justify-between gap-2 p-2 bg-[#fdfcf9] border border-[#1a1c1a]/30"
                      >
                        <span className="font-bold text-[11px] whitespace-nowrap">
                          {sesi.icon} {sesi.label}
                        </span>
                        <select
                          value={noteFormState.record[sesi.key]}
                          onChange={(e) => {
                            const nextStat = e.target.value as StatusIbadah;
                            setNoteFormState((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    record: {
                                      ...prev.record,
                                      [sesi.key]: nextStat,
                                      ...(sesi.key === 'duhur' ? { dzuhur: nextStat } : {}),
                                    },
                                  }
                                : null
                            );
                          }}
                          className="px-1.5 py-1 bg-white border border-[#1a1c1a] text-[10px] font-bold focus:outline-none"
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

                {/* Template Catatan Cepat & Textarea */}
                <div className="space-y-2 font-mono-custom text-xs">
                  <label className="block text-[11px] font-bold uppercase text-[#1a1c1a]">
                    Catatan Khusus Pengasuhan / Keterangan Sakit / Izin:
                  </label>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-[#1a1c1a]/60 font-bold mr-1">
                      Template Cepat:
                    </span>
                    {[
                      'Mengikuti sholat di ruang UKS (sakit)',
                      'Izin pulang bersama orang tua',
                      'Perlu bimbingan bacaan & gerakan sholat',
                      'Terlambat jamaah, perlu pendampingan',
                      'Tertib, khusyuk & tepat waktu',
                    ].map((tpl) => (
                      <button
                        key={tpl}
                        type="button"
                        onClick={() =>
                          setNoteFormState((prev) => {
                            if (!prev) return null;
                            const existing = (prev.record.catatan || '').trim();
                            const nextNote = existing ? `${existing}; ${tpl}` : tpl;
                            return {
                              ...prev,
                              record: { ...prev.record, catatan: nextNote },
                            };
                          })
                        }
                        className="px-2 py-0.5 bg-white hover:bg-amber-50 border border-[#1a1c1a]/50 text-[10px] font-semibold text-[#1a1c1a]"
                      >
                        + {tpl}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Tulis catatan khusus untuk santri ini (misal: alasan tidak ikut jamaah, kondisi sakit di UKS, atau catatan adab masjid)..."
                    value={noteFormState.record.catatan || ''}
                    onChange={(e) =>
                      setNoteFormState((prev) =>
                        prev
                          ? {
                              ...prev,
                              record: { ...prev.record, catatan: e.target.value },
                            }
                          : null
                      )
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans focus:outline-none focus:ring-2 focus:ring-[#006b54]/30"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1a1c1a]/20 font-mono-custom text-xs">
                  <div>
                    {(noteFormState.record.catatan || '').trim() !== '' && (
                      <button
                        type="button"
                        onClick={handleClearNoteForm}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border-[1.5px] border-rose-600 font-bold uppercase"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Catatan</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNoteFormState(null)}
                      className="px-4 py-2 bg-white hover:bg-[#1a1c1a]/5 text-[#1a1c1a] border-[1.5px] border-[#1a1c1a] font-bold uppercase"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="neo-btn-primary inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Catatan Khusus</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* MAIN CHECKLIST TABLE WITH 7 SESSIONS */}
          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow overflow-hidden">
            <div className="p-3 bg-[#fdfcf9] border-b-[1.5px] border-[#1a1c1a] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono-custom text-xs font-bold text-[#006b54] uppercase tracking-wider">
                  // TABEL CHECKLIST IBADAH & DINIYAH ({formatDateIndo(selectedDate)})
                </span>
                <span className="text-[11px] font-mono-custom text-[#1a1c1a]/60">
                  (Klik status pada tabel untuk mengubah status dengan cepat)
                </span>
              </div>

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

                    {SESI_IBADAH_LIST.map((sesi) => (
                      <th key={sesi.key} className="p-2 text-center min-w-[125px]">
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] whitespace-nowrap">
                            {sesi.icon} {sesi.label}
                          </span>
                          <span className="text-[9px] text-[#fdfcf9]/60 lowercase">
                            {sesi.waktu}
                          </span>
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
                    <th className="p-2.5 text-right min-w-[165px]">AKSI</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#1a1c1a]/15">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="p-8 text-center text-xs text-[#1a1c1a]/60 font-mono-custom"
                      >
                        Belum ada data santri yang sesuai dengan filter. Tambahkan santri di menu
                        Data Siswa atau ubah filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((siswa, index) => {
                      const kamar = getKamar(siswa.kamarId);
                      const rec = getRecordForSiswa(siswa.id);
                      const isSelected = selectedSiswaIds.includes(siswa.id);

                      const melaksCount = SESSION_KEYS.filter(
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
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectSiswa(siswa.id)}
                              className="w-3.5 h-3.5 accent-[#006b54] cursor-pointer"
                            />
                          </td>

                          <td className="p-2.5 text-center font-bold text-[#1a1c1a]/60">
                            {index + 1}
                          </td>

                          <td className="p-2.5">
                            <div className="font-syne font-bold text-xs text-[#1a1c1a]">
                              {siswa.nama}
                            </div>
                            <div className="text-[10px] text-[#1a1c1a]/60 font-mono-custom">
                              {siswa.kelas} ({siswa.panggilan}) · Kamar {kamar?.nama || '-'}
                            </div>
                            {rec.catatan && (
                              <div className="text-[10px] text-amber-900 font-semibold italic mt-0.5">
                                💬 {rec.catatan}
                              </div>
                            )}
                          </td>

                          {SESI_IBADAH_LIST.map((sesi) => {
                            const statusVal = rec[sesi.key];

                            return (
                              <td key={sesi.key} className="p-1.5 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleCycleStatus(siswa.id, sesi.key)}
                                    title={`Klik untuk berganti status (${statusVal}). Gunakan dropdown di bawah untuk memilih langsung.`}
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

                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleSetSingleStudentAllMelaksanakan(siswa.id)}
                                title="Tandai semua 7 sesi Melaksanakan"
                                className="px-1.5 py-1 bg-white hover:bg-emerald-50 border border-[#1a1c1a] text-[9px] font-bold text-[#006b54] whitespace-nowrap"
                              >
                                ✓ Semua
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenNoteForm(siswa, rec)}
                                title="Buka Form Beri Catatan Khusus"
                                className={`inline-flex items-center gap-1 px-2 py-1 border border-[#1a1c1a] text-[9px] font-bold whitespace-nowrap transition-colors ${
                                  rec.catatan
                                    ? 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                                    : 'bg-white text-[#1a1c1a] hover:bg-[#1a1c1a] hover:text-white'
                                }`}
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>{rec.catatan ? 'Edit Catatan' : 'Beri Catatan'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* MODE 2: REKAP RENTANG TANGGAL (UNTUK PEREKAPAN) */}
      {/* ===================================================================== */}
      {viewMode === 'rekap' && (
        <>
          {/* KPI REKAP PERIODE */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono-custom">
            <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 neo-shadow">
              <span className="text-[10px] text-[#1a1c1a]/60 uppercase font-bold block mb-1">
                // HARI TERCATAT DALAM PERIODE
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-syne font-black text-[#1a1c1a]">
                  {rekapTotals.totalHari}
                </span>
                <span className="text-[11px] text-[#1a1c1a]/70">
                  Hari ({rekapTotals.totalRecords} data santri)
                </span>
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 neo-shadow">
              <span className="text-[10px] text-[#1a1c1a]/60 uppercase font-bold block mb-1">
                // RATA-RATA KEPATUHAN PERIODE
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-syne font-black text-[#006b54]">
                  {rekapTotals.percent}%
                </span>
                <span className="text-[11px] text-[#1a1c1a]/70">
                  ({rekapTotals.melaksanakan}/{rekapTotals.totalSesi} sesi)
                </span>
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 neo-shadow">
              <span className="text-[10px] text-[#1a1c1a]/60 uppercase font-bold block mb-1">
                // TOTAL SESI SAKIT (UKS)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-syne font-black text-rose-700">
                  {rekapTotals.sakit}
                </span>
                <span className="text-[11px] text-rose-800 font-bold bg-rose-50 px-1.5 py-0.5 border border-rose-600">
                  SESI DISPENSASI
                </span>
              </div>
            </div>

            <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 neo-shadow">
              <span className="text-[10px] text-[#1a1c1a]/60 uppercase font-bold block mb-1">
                // TOTAL IZIN & TIDAK MELAKSANAKAN
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-syne font-black text-amber-700">
                  {rekapTotals.izin + rekapTotals.tidak}
                </span>
                <span className="text-[11px] text-amber-900 font-bold bg-amber-50 px-1.5 py-0.5 border border-amber-600">
                  {rekapTotals.izin} Izin · {rekapTotals.tidak} Absen
                </span>
              </div>
            </div>
          </div>

          {/* FILTER & SEARCH BAR (REKAP) */}
          <div className="p-3 sm:p-4 bg-[#1a1c1a]/[0.05] border-[1.5px] border-[#1a1c1a] rounded flex flex-wrap gap-2.5 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
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

              <select
                value={selectedKelasFilter}
                onChange={(e) => setSelectedKelasFilter(e.target.value)}
                className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] focus:outline-none"
              >
                <option value="Semua">Semua Kelas</option>
                <option value="1 SD">Kelas 1 SD</option>
                <option value="2 SD">Kelas 2 SD</option>
                <option value="3 SD">Kelas 3 SD</option>
                <option value="4 SD">Kelas 4 SD</option>
                <option value="5 SD">Kelas 5 SD</option>
                <option value="6 SD">Kelas 6 SD</option>
              </select>
            </div>

            <div className="text-xs font-mono-custom text-[#1a1c1a]/70">
              Periode:{' '}
              <strong className="text-[#1a1c1a]">
                {rekapIncludeAllDates
                  ? 'Semua Tanggal Tercatat'
                  : `${formatDateIndo(rekapStartDate)} s/d ${formatDateIndo(rekapEndDate)}`}
              </strong>
            </div>
          </div>

          {/* RINGKASAN PER TANGGAL */}
          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow overflow-hidden">
            <div className="p-3 bg-[#fdfcf9] border-b-[1.5px] border-[#1a1c1a] flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono-custom text-xs font-bold text-[#006b54] uppercase tracking-wider">
                // RINGKASAN PER TANGGAL ({rekapSummaryByDate.length} TANGGAL)
              </span>
              <span className="font-mono-custom text-[11px] text-[#1a1c1a]/60">
                Klik &quot;Buka Tanggal&quot; untuk memeriksa atau mengedit checklist harian
              </span>
            </div>

            {rekapSummaryByDate.length === 0 ? (
              <div className="p-8 text-center font-mono-custom text-xs text-[#1a1c1a]/60 space-y-3">
                <p>
                  Belum ada catatan ibadah yang tersimpan pada rentang tanggal yang dipilih.
                </p>
                <button
                  type="button"
                  onClick={() => setViewMode('harian')}
                  className="neo-btn-primary inline-flex items-center gap-1.5"
                >
                  <ListChecks className="w-4 h-4" />
                  <span>BUKA CHECKLIST HARIAN</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono-custom">
                  <thead className="bg-[#1a1c1a] text-[#fdfcf9] uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-2.5 text-center w-10">No</th>
                      <th className="p-2.5">Tanggal</th>
                      <th className="p-2.5 text-center">Santri Tercatat</th>
                      <th className="p-2.5 text-center">Melaksanakan</th>
                      <th className="p-2.5 text-center">Sakit</th>
                      <th className="p-2.5 text-center">Izin</th>
                      <th className="p-2.5 text-center">Tidak</th>
                      <th className="p-2.5 text-center">Kepatuhan</th>
                      <th className="p-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1c1a]/15">
                    {rekapSummaryByDate.map((row, idx) => {
                      const pct =
                        row.totalSesi > 0
                          ? Math.round((row.melaksanakan / row.totalSesi) * 100)
                          : 0;
                      return (
                        <tr key={row.tanggal} className="hover:bg-[#1a1c1a]/[0.02]">
                          <td className="p-2.5 text-center font-bold text-[#1a1c1a]/60">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 font-bold text-[#1a1c1a]">
                            {formatDateIndo(row.tanggal, true)}
                          </td>
                          <td className="p-2.5 text-center font-bold">{row.jumlahSantri} santri</td>
                          <td className="p-2.5 text-center text-[#006b54] font-bold">
                            {row.melaksanakan}
                          </td>
                          <td className="p-2.5 text-center text-rose-700 font-bold">{row.sakit}</td>
                          <td className="p-2.5 text-center text-amber-700 font-bold">{row.izin}</td>
                          <td className="p-2.5 text-center text-slate-700 font-bold">{row.tidak}</td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 font-bold text-[10px] border ${
                                pct >= 90
                                  ? 'bg-emerald-50 text-[#006b54] border-[#006b54]'
                                  : pct >= 70
                                  ? 'bg-amber-50 text-amber-900 border-amber-500'
                                  : 'bg-rose-50 text-rose-800 border-rose-500'
                              }`}
                            >
                              {pct}%
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDate(row.tanggal);
                                setViewMode('harian');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-[#1a1c1a] hover:text-white border border-[#1a1c1a] text-[10px] font-bold uppercase transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Buka Tanggal</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TABEL REKAP PER SANTRI DALAM PERIODE */}
          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow overflow-hidden">
            <div className="p-3 bg-[#fdfcf9] border-b-[1.5px] border-[#1a1c1a] flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono-custom text-xs font-bold text-[#006b54] uppercase tracking-wider">
                // REKAP KEHADIRAN IBADAH PER SANTRI ({rekapByStudent.length} SANTRI)
              </span>
              <span className="font-mono-custom text-[11px] text-[#1a1c1a]/60">
                Angka per sesi menunjukkan jumlah hadir melaksanakan / total hari tercatat
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-custom">
                <thead className="bg-[#1a1c1a] text-[#fdfcf9] uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-2.5 text-center w-10">No</th>
                    <th className="p-2.5 min-w-[180px]">Santri & Kamar</th>
                    <th className="p-2.5 text-center">Hari Tercatat</th>
                    {SESI_IBADAH_LIST.map((sesi) => (
                      <th key={sesi.key} className="p-2 text-center whitespace-nowrap">
                        {sesi.icon} {sesi.label.replace('Salat ', '')}
                      </th>
                    ))}
                    <th className="p-2.5 text-center text-rose-300">Sakit</th>
                    <th className="p-2.5 text-center text-amber-300">Izin</th>
                    <th className="p-2.5 text-center">Tidak</th>
                    <th className="p-2.5 text-center">Kepatuhan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1c1a]/15">
                  {rekapByStudent.length === 0 ? (
                    <tr>
                      <td
                        colSpan={14}
                        className="p-8 text-center text-xs text-[#1a1c1a]/60 font-mono-custom"
                      >
                        Tidak ada santri yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    rekapByStudent.map((row, idx) => {
                      const kamar = getKamar(row.siswa.kamarId);
                      const pct =
                        row.totalSesi > 0
                          ? Math.round((row.melaksanakan / row.totalSesi) * 100)
                          : 0;
                      return (
                        <tr key={row.siswa.id} className="hover:bg-[#1a1c1a]/[0.02]">
                          <td className="p-2.5 text-center font-bold text-[#1a1c1a]/60">
                            {idx + 1}
                          </td>
                          <td className="p-2.5">
                            <div className="font-syne font-bold text-xs text-[#1a1c1a]">
                              {row.siswa.nama}
                            </div>
                            <div className="text-[10px] text-[#1a1c1a]/60">
                              {row.siswa.kelas} · Kamar {kamar?.nama || '-'}
                            </div>
                          </td>
                          <td className="p-2.5 text-center font-bold">
                            {row.hariTercatat} hari
                          </td>
                          {SESI_IBADAH_LIST.map((sesi) => (
                            <td key={sesi.key} className="p-2 text-center">
                              {row.hariTercatat > 0 ? (
                                <span className="font-bold text-[#006b54]">
                                  {row.perSesiMelaksanakan[sesi.key]}/{row.hariTercatat}
                                </span>
                              ) : (
                                <span className="text-[#1a1c1a]/30">-</span>
                              )}
                            </td>
                          ))}
                          <td className="p-2.5 text-center font-bold text-rose-700">
                            {row.sakit}
                          </td>
                          <td className="p-2.5 text-center font-bold text-amber-700">
                            {row.izin}
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700">
                            {row.tidak}
                          </td>
                          <td className="p-2.5 text-center">
                            {row.hariTercatat > 0 ? (
                              <span
                                className={`inline-block px-2 py-0.5 font-bold text-[10px] border ${
                                  pct >= 90
                                    ? 'bg-emerald-50 text-[#006b54] border-[#006b54]'
                                    : pct >= 70
                                    ? 'bg-amber-50 text-amber-900 border-amber-500'
                                    : 'bg-rose-50 text-rose-800 border-rose-500'
                                }`}
                              >
                                {pct}%
                              </span>
                            ) : (
                              <span className="text-[#1a1c1a]/40 text-[10px]">Belum ada</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
