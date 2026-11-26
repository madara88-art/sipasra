import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  ClipboardCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { CatatanPergantianShift, ShiftPiketType } from '../../types';

const SHIFT_OPTIONS: ShiftPiketType[] = [
  'Pagi (07:00 - 15:00)',
  'Sore (15:00 - 23:00)',
  'Malam (23:00 - 07:00)',
  'Pendamping Penuh',
];

const SHIFT_HANDOVER_DEFAULTS: Record<
  ShiftPiketType,
  { keShift: ShiftPiketType; waktuSerahTerima: string }
> = {
  'Pagi (07:00 - 15:00)': {
    keShift: 'Sore (15:00 - 23:00)',
    waktuSerahTerima: '15:00',
  },
  'Sore (15:00 - 23:00)': {
    keShift: 'Malam (23:00 - 07:00)',
    waktuSerahTerima: '23:00',
  },
  'Malam (23:00 - 07:00)': {
    keShift: 'Pagi (07:00 - 15:00)',
    waktuSerahTerima: '07:00',
  },
  'Pendamping Penuh': {
    keShift: 'Pagi (07:00 - 15:00)',
    waktuSerahTerima: '07:00',
  },
};

const formatDateIndo = (dateStr: string) => {
  if (!dateStr) return '-';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const shiftLabelShort = (shift: ShiftPiketType) => shift.split(' (')[0];

export const PergantianShiftView: React.FC = () => {
  const {
    shiftLogList,
    waliAsuhList,
    siswaList,
    kesehatanList,
    currentUser,
    addShiftLog,
    updateShiftLog,
    deleteShiftLog,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dateFilterMode, setDateFilterMode] = useState<'per-date' | 'all'>('per-date');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatatanPergantianShift | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatatanPergantianShift | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const formSectionRef = useRef<HTMLDivElement>(null);

  const defaultHadirCount = siswaList.filter(
    (s) => s.status === 'Aktif' || s.status === 'Sakit'
  ).length;
  const defaultSakitCount =
    siswaList.filter((s) => s.status === 'Sakit').length ||
    kesehatanList.filter(
      (k) => (k.kondisi || k.status) === 'Dalam Perawatan'
    ).length;
  const defaultIzinCount = siswaList.filter((s) => s.status === 'Izin Pulang').length;

  const getInitialForm = (tanggalOverride?: string): Omit<CatatanPergantianShift, 'id'> => ({
    tanggal: tanggalOverride || selectedDate || todayStr,
    waktuSerahTerima: '15:00',
    dariShift: 'Pagi (07:00 - 15:00)',
    keShift: 'Sore (15:00 - 23:00)',
    waliMenyerahkan: waliAsuhList[0]?.nama || currentUser?.displayName || '',
    waliMenerima: waliAsuhList[1]?.nama || '',
    jumlahSantriHadir: defaultHadirCount,
    jumlahSantriSakit: defaultSakitCount,
    jumlahSantriIzin: defaultIzinCount,
    ringkasanKondisi: '',
    catatanPenting: '',
    perlengkapanDiserahkan: 'Kunci Asrama, Buku Piket, HP/HT Piket, Kotak P3K',
    status: 'Selesai Serah Terima',
  });

  const [formData, setFormData] = useState<Omit<CatatanPergantianShift, 'id'>>(getInitialForm);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const scrollToForm = () => {
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleStepDate = (deltaDays: number) => {
    const base = new Date(`${selectedDate || todayStr}T00:00:00`);
    base.setDate(base.getDate() + deltaDays);
    setSelectedDate(base.toISOString().split('T')[0]);
    setDateFilterMode('per-date');
  };

  const handleOpenAdd = () => {
    setFormData(getInitialForm(selectedDate || todayStr));
    setEditingItem(null);
    setFormError(null);
    setIsFormOpen(true);
    scrollToForm();
  };

  const handleOpenEdit = (item: CatatanPergantianShift) => {
    setEditingItem(item);
    setFormError(null);
    setFormData({
      tanggal: item.tanggal,
      waktuSerahTerima: item.waktuSerahTerima,
      dariShift: item.dariShift,
      keShift: item.keShift,
      waliMenyerahkan: item.waliMenyerahkan,
      waliMenerima: item.waliMenerima,
      jumlahSantriHadir: item.jumlahSantriHadir,
      jumlahSantriSakit: item.jumlahSantriSakit,
      jumlahSantriIzin: item.jumlahSantriIzin,
      ringkasanKondisi: item.ringkasanKondisi,
      catatanPenting: item.catatanPenting || '',
      perlengkapanDiserahkan: item.perlengkapanDiserahkan || '',
      status: item.status,
    });
    setIsFormOpen(true);
    scrollToForm();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.waliMenyerahkan.trim() || !formData.waliMenerima.trim()) {
      setFormError('Nama Wali Asuh yang menyerahkan dan yang menerima shift wajib diisi.');
      return;
    }
    if (!formData.ringkasanKondisi.trim()) {
      setFormError('Ringkasan kondisi asrama & santri saat serah terima wajib diisi.');
      return;
    }
    setFormError(null);

    const payload: Omit<CatatanPergantianShift, 'id'> = {
      ...formData,
      waliMenyerahkan: formData.waliMenyerahkan.trim(),
      waliMenerima: formData.waliMenerima.trim(),
      jumlahSantriHadir: Math.max(0, Number(formData.jumlahSantriHadir) || 0),
      jumlahSantriSakit: Math.max(0, Number(formData.jumlahSantriSakit) || 0),
      jumlahSantriIzin: Math.max(0, Number(formData.jumlahSantriIzin) || 0),
      ringkasanKondisi: formData.ringkasanKondisi.trim(),
      catatanPenting: formData.catatanPenting?.trim() || '',
      perlengkapanDiserahkan: formData.perlengkapanDiserahkan?.trim() || '',
    };

    if (editingItem) {
      updateShiftLog(editingItem.id, payload);
      showToast(`✓ Catatan pergantian shift tanggal ${payload.tanggal} berhasil diperbarui.`);
    } else {
      addShiftLog(payload);
      setSelectedDate(payload.tanggal);
      showToast(`✓ Catatan pergantian shift tanggal ${payload.tanggal} berhasil disimpan.`);
    }

    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteShiftLog(deleteTarget.id);
    if (editingItem?.id === deleteTarget.id) {
      setIsFormOpen(false);
      setEditingItem(null);
    }
    showToast(`✓ Catatan pergantian shift tanggal ${deleteTarget.tanggal} berhasil dihapus.`);
    setDeleteTarget(null);
  };

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return shiftLogList
      .filter((item) => {
        const matchDate = dateFilterMode === 'all' || item.tanggal === selectedDate;
        const matchSearch =
          !q ||
          item.waliMenyerahkan.toLowerCase().includes(q) ||
          item.waliMenerima.toLowerCase().includes(q) ||
          item.ringkasanKondisi.toLowerCase().includes(q) ||
          (item.catatanPenting && item.catatanPenting.toLowerCase().includes(q)) ||
          item.dariShift.toLowerCase().includes(q) ||
          item.keShift.toLowerCase().includes(q);
        return matchDate && matchSearch;
      })
      .sort((a, b) => {
        const dateCmp = b.tanggal.localeCompare(a.tanggal);
        if (dateCmp !== 0) return dateCmp;
        return b.waktuSerahTerima.localeCompare(a.waktuSerahTerima);
      });
  }, [shiftLogList, dateFilterMode, selectedDate, searchTerm]);

  // Group filtered logs by tanggal for per-date display
  const groupedByDate = useMemo(() => {
    const groups: { tanggal: string; items: CatatanPergantianShift[] }[] = [];
    const map = new Map<string, CatatanPergantianShift[]>();
    filteredLogs.forEach((item) => {
      const existing = map.get(item.tanggal);
      if (existing) {
        existing.push(item);
      } else {
        const arr = [item];
        map.set(item.tanggal, arr);
        groups.push({ tanggal: item.tanggal, items: arr });
      }
    });
    return groups;
  }, [filteredLogs]);

  // Stats for selected date
  const logsOnSelectedDate = useMemo(
    () => shiftLogList.filter((l) => l.tanggal === selectedDate),
    [shiftLogList, selectedDate]
  );

  const handleExportExcel = () => {
    const rows = filteredLogs.map((item, idx) => ({
      No: idx + 1,
      Tanggal: item.tanggal,
      'Waktu Serah Terima': item.waktuSerahTerima,
      'Dari Shift': item.dariShift,
      'Ke Shift': item.keShift,
      'Wali Menyerahkan': item.waliMenyerahkan,
      'Wali Menerima': item.waliMenerima,
      'Santri Hadir': item.jumlahSantriHadir,
      'Santri Sakit': item.jumlahSantriSakit,
      'Santri Izin': item.jumlahSantriIzin,
      'Ringkasan Kondisi': item.ringkasanKondisi,
      'Catatan Penting / Tindak Lanjut': item.catatanPenting || '-',
      'Perlengkapan Diserahkan': item.perlengkapanDiserahkan || '-',
      Status: item.status,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 13 },
      { wch: 16 },
      { wch: 24 },
      { wch: 24 },
      { wch: 22 },
      { wch: 22 },
      { wch: 13 },
      { wch: 13 },
      { wch: 13 },
      { wch: 40 },
      { wch: 35 },
      { wch: 30 },
      { wch: 22 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pergantian Shift');
    const suffix = dateFilterMode === 'per-date' ? selectedDate : 'Semua_Tanggal';
    XLSX.writeFile(wb, `SIPASRA_Catatan_Pergantian_Shift_${suffix}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header Banner */}
      <div className="bg-[#fdfcf9] p-5 border-[1.5px] border-[#1a1c1a] shadow-[3.5px_3.5px_0px_#1a1c1a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-custom text-[#006b54] font-bold uppercase tracking-wider mb-1">
            <span>// SERAH TERIMA PIKET PAMONG ASRAMA</span>
            <span>·</span>
            <span>{shiftLogList.length} CATATAN TERDATA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-syne text-[#1a1c1a] tracking-tight">
            Catatan Pergantian Shift (Per Tanggal)
          </h1>
          <p className="text-xs text-[#1a1c1a]/70 font-mono-custom mt-1">
            Log serah terima tugas piket Pagi (07.00 - 15.00), Sore (15.00 - 23.00), dan Malam (23.00 - 07.00) antar wali asuh asrama Sekolah Rakyat 1 Jepara
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-[#1a1c1a] hover:text-white disabled:opacity-40 text-[#1a1c1a] text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] transition-all uppercase cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => (isFormOpen && !editingItem ? setIsFormOpen(false) : handleOpenAdd())}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2.5px_2.5px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider cursor-pointer whitespace-nowrap"
          >
            {isFormOpen && !editingItem ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isFormOpen && !editingItem ? 'Tutup Form' : 'Catat Pergantian Shift'}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border-[1.5px] border-[#006b54] text-[#006b54] font-mono-custom text-xs font-bold flex items-center justify-between shadow-[2.5px_2.5px_0px_#1a1c1a]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#006b54]" />
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

      {/* Filter Pertanggal & Pencarian Bar */}
      <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 neo-shadow space-y-3 font-mono-custom text-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Date Navigator */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#006b54] mr-1">
              Filter Tanggal:
            </span>

            <div className="inline-flex items-center border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9]">
              <button
                type="button"
                onClick={() => handleStepDate(-1)}
                className="p-2 hover:bg-[#1a1c1a]/10 border-r border-[#1a1c1a] cursor-pointer"
                title="Hari sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#006b54]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setDateFilterMode('per-date');
                  }}
                  className="bg-transparent font-bold text-[#1a1c1a] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleStepDate(1)}
                className="p-2 hover:bg-[#1a1c1a]/10 border-l border-[#1a1c1a] cursor-pointer"
                title="Hari berikutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedDate(todayStr);
                setDateFilterMode('per-date');
              }}
              className={`px-3 py-2 font-bold border-[1.5px] border-[#1a1c1a] uppercase cursor-pointer ${
                dateFilterMode === 'per-date' && selectedDate === todayStr
                  ? 'bg-[#006b54] text-white'
                  : 'bg-[#fdfcf9] text-[#1a1c1a] hover:bg-[#1a1c1a]/5'
              }`}
            >
              Hari Ini
            </button>

            <button
              type="button"
              onClick={() =>
                setDateFilterMode(dateFilterMode === 'per-date' ? 'all' : 'per-date')
              }
              className={`px-3 py-2 font-bold border-[1.5px] border-[#1a1c1a] uppercase cursor-pointer ${
                dateFilterMode === 'all'
                  ? 'bg-[#1a1c1a] text-white'
                  : 'bg-[#fdfcf9] text-[#1a1c1a] hover:bg-[#1a1c1a]/5'
              }`}
            >
              {dateFilterMode === 'all'
                ? `Semua Tanggal (${shiftLogList.length})`
                : `Lihat Semua Tanggal (${shiftLogList.length})`}
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-64">
            <Search className="w-3.5 h-3.5 text-[#1a1c1a]/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari petugas / catatan..."
              className="w-full pl-8 pr-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
            />
          </div>
        </div>

        {/* Summary strip for selected date */}
        <div className="pt-2.5 border-t border-[#1a1c1a]/15 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div>
            {dateFilterMode === 'per-date' ? (
              <span>
                Menampilkan tanggal:{' '}
                <strong className="text-[#006b54]">{formatDateIndo(selectedDate)}</strong> ·{' '}
                <strong>{logsOnSelectedDate.length}</strong> pergantian shift tercatat
              </span>
            ) : (
              <span>
                Menampilkan <strong>seluruh riwayat pergantian shift</strong> ({filteredLogs.length}{' '}
                catatan)
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[#1a1c1a]/75">
            <span>
              Selesai:{' '}
              <strong className="text-[#006b54]">
                {filteredLogs.filter((l) => l.status === 'Selesai Serah Terima').length}
              </strong>
            </span>
            <span>
              Menunggu Verifikasi:{' '}
              <strong className="text-amber-700">
                {filteredLogs.filter((l) => l.status === 'Menunggu Verifikasi').length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* INLINE FORM CATATAN PERGANTIAN SHIFT (TAMBAH / EDIT) */}
      <div ref={formSectionRef}>
        {isFormOpen && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#006b54] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <span className="text-[10px] font-mono-custom font-bold uppercase tracking-wider text-[#006b54] block">
                  // SERAH TERIMA TUGAS PIKET ASRAMA
                </span>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  {editingItem
                    ? 'Form Edit Catatan Pergantian Shift'
                    : 'Form Catatan Pergantian Shift Baru'}
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Catat tanggal, jam serah terima, petugas piket lama & baru, kondisi santri, serta pesan tindak lanjut.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingItem(null);
                }}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form pergantian shift"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-4 p-3 bg-rose-50 border border-rose-400 text-rose-900 text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 font-mono-custom text-xs">
              {/* Pilihan Cepat Jadwal Serah Terima Shift */}
              <div className="p-2.5 bg-emerald-50/60 border border-[#006b54]/40 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-[#006b54]">
                  Jadwal Serah Terima:
                </span>
                {(
                  [
                    'Pagi (07:00 - 15:00)',
                    'Sore (15:00 - 23:00)',
                    'Malam (23:00 - 07:00)',
                  ] as ShiftPiketType[]
                ).map((shiftItem) => {
                  const preset = SHIFT_HANDOVER_DEFAULTS[shiftItem];
                  const isActive =
                    formData.dariShift === shiftItem &&
                    formData.keShift === preset.keShift &&
                    formData.waktuSerahTerima === preset.waktuSerahTerima;
                  return (
                    <button
                      key={shiftItem}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          dariShift: shiftItem,
                          keShift: preset.keShift,
                          waktuSerahTerima: preset.waktuSerahTerima,
                        })
                      }
                      className={`px-2.5 py-1 text-[10px] font-bold border border-[#1a1c1a] cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#006b54] text-white'
                          : 'bg-white text-[#1a1c1a] hover:bg-[#1a1c1a]/5'
                      }`}
                    >
                      {shiftLabelShort(shiftItem)} → {shiftLabelShort(preset.keShift)} ({preset.waktuSerahTerima})
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">TANGGAL *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">JAM SERAH TERIMA *</label>
                  <input
                    type="time"
                    required
                    value={formData.waktuSerahTerima}
                    onChange={(e) =>
                      setFormData({ ...formData, waktuSerahTerima: e.target.value })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">DARI SHIFT *</label>
                  <select
                    value={formData.dariShift}
                    onChange={(e) => {
                      const nextDari = e.target.value as ShiftPiketType;
                      const suggested = SHIFT_HANDOVER_DEFAULTS[nextDari];
                      setFormData({
                        ...formData,
                        dariShift: nextDari,
                        keShift: suggested?.keShift || formData.keShift,
                        waktuSerahTerima:
                          suggested?.waktuSerahTerima || formData.waktuSerahTerima,
                      });
                    }}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
                  >
                    {SHIFT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">KE SHIFT *</label>
                  <select
                    value={formData.keShift}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        keShift: e.target.value as ShiftPiketType,
                      })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
                  >
                    {SHIFT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    WALI ASUH MENYERAHKAN TUGAS *
                  </label>
                  <input
                    type="text"
                    required
                    list="wali-shift-options"
                    placeholder="Nama wali asuh yang selesai piket..."
                    value={formData.waliMenyerahkan}
                    onChange={(e) => {
                      setFormData({ ...formData, waliMenyerahkan: e.target.value });
                      if (formError) setFormError(null);
                    }}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    WALI ASUH MENERIMA TUGAS *
                  </label>
                  <input
                    type="text"
                    required
                    list="wali-shift-options"
                    placeholder="Nama wali asuh yang mulai piket..."
                    value={formData.waliMenerima}
                    onChange={(e) => {
                      setFormData({ ...formData, waliMenerima: e.target.value });
                      if (formError) setFormError(null);
                    }}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                  />
                </div>
                <datalist id="wali-shift-options">
                  {waliAsuhList.map((w) => (
                    <option key={w.id} value={w.nama} />
                  ))}
                </datalist>
              </div>

              {/* Rekap Kondisi Santri */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-[#fdfcf9] border border-[#1a1c1a]/40">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">SANTRI HADIR (ASRAMA)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.jumlahSantriHadir}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jumlahSantriHadir: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white focus:outline-none focus:border-[#006b54]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-rose-800 mb-1">SANTRI SAKIT / UKS</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.jumlahSantriSakit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jumlahSantriSakit: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white focus:outline-none focus:border-[#006b54]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-amber-800 mb-1">SANTRI IZIN PULANG</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.jumlahSantriIzin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jumlahSantriIzin: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white focus:outline-none focus:border-[#006b54]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">STATUS SERAH TERIMA</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as CatatanPergantianShift['status'],
                      })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white focus:outline-none focus:border-[#006b54]"
                  >
                    <option value="Selesai Serah Terima">Selesai Serah Terima</option>
                    <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1a1c1a] mb-1">
                  RINGKASAN KONDISI ASRAMA & KEGIATAN *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Seluruh kegiatan pagi berjalan tertib, sarapan selesai pukul 06:40, 1 santri istirahat di ruang UKS..."
                  value={formData.ringkasanKondisi}
                  onChange={(e) => {
                    setFormData({ ...formData, ringkasanKondisi: e.target.value });
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    PESAN / TINDAK LANJUT SHIFT BERIKUTNYA
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Cek ulang suhu santri di UKS pukul 15:00 & ingatkan piket sore..."
                    value={formData.catatanPenting || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, catatanPenting: e.target.value })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    PERLENGKAPAN & INVENTARIS DISERAHKAN
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Kunci Asrama, Buku Piket, HP/HT Piket, Kotak P3K"
                    value={formData.perlengkapanDiserahkan || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, perlengkapanDiserahkan: e.target.value })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-[#1a1c1a]">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-[#1a1c1a] font-bold uppercase cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 border-[1.5px] border-[#1a1c1a] bg-[#006b54] hover:bg-[#005240] text-white font-bold uppercase shadow-[2.5px_2.5px_0px_#1a1c1a] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? 'SIMPAN PERUBAHAN' : 'SIMPAN CATATAN SHIFT'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Inline Delete Confirmation */}
      {deleteTarget && (
        <div className="p-4 bg-rose-50 border-[1.5px] border-rose-700 shadow-[3px_3px_0px_#9f1239] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono-custom text-xs">
          <div className="text-rose-950">
            <span className="font-bold block">Konfirmasi Hapus Catatan Pergantian Shift</span>
            <span className="font-sans">
              Yakin ingin menghapus catatan serah terima tanggal{' '}
              <strong>{deleteTarget.tanggal}</strong> ({shiftLabelShort(deleteTarget.dariShift)} →{' '}
              {shiftLabelShort(deleteTarget.keShift)})?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-3 py-1.5 bg-white border-[1.5px] border-[#1a1c1a] font-bold uppercase cursor-pointer"
            >
              BATAL
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white border-[1.5px] border-[#1a1c1a] font-bold uppercase cursor-pointer"
            >
              YA, HAPUS
            </button>
          </div>
        </div>
      )}

      {/* Empty State or Grouped-by-Date Shift Logs */}
      {groupedByDate.length === 0 ? (
        <div className="p-8 text-center bg-white border-[1.5px] border-[#1a1c1a] neo-shadow space-y-4">
          <div className="w-12 h-12 mx-auto bg-emerald-50 border-[1.5px] border-[#1a1c1a] flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6 text-[#006b54]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-syne text-lg font-bold text-[#1a1c1a]">
              {dateFilterMode === 'per-date'
                ? `Belum Ada Catatan Pergantian Shift pada ${formatDateIndo(selectedDate)}`
                : 'Belum Ada Catatan Pergantian Shift'}
            </h3>
            <p className="font-sans text-xs text-[#1a1c1a]/70 max-w-md mx-auto">
              Catat serah terima tugas piket antar wali asuh untuk tanggal ini agar koordinasi pengasuhan tetap terjaga.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {!isFormOpen && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Pergantian Shift</span>
              </button>
            )}
            {dateFilterMode === 'per-date' && shiftLogList.length > 0 && (
              <button
                type="button"
                onClick={() => setDateFilterMode('all')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] cursor-pointer"
              >
                <span>Lihat Semua Tanggal ({shiftLogList.length})</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map((group) => (
            <div key={group.tanggal} className="space-y-3">
              {/* Date Group Header */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#1a1c1a] text-[#fdfcf9] font-mono-custom text-xs">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{formatDateIndo(group.tanggal)}</span>
                  <span className="text-[#fdfcf9]/50">({group.tanggal})</span>
                </div>
                <span className="px-2 py-0.5 bg-[#006b54] text-white text-[10px] font-bold">
                  {group.items.length} SERAH TERIMA
                </span>
              </div>

              {/* Cards for this date */}
              <div className="space-y-3">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] p-4 sm:p-5 shadow-[3.5px_3.5px_0px_#1a1c1a] hover:shadow-[4.5px_4.5px_0px_#006b54] transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-[1.5px] border-[#1a1c1a]/20 pb-3">
                      <div className="flex flex-wrap items-center gap-2 font-mono-custom">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1a1c1a] text-white text-xs font-bold">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          {item.waktuSerahTerima} WIB
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-[#006b54] text-[#006b54] text-xs font-bold">
                          <span>{item.dariShift}</span>
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>{item.keShift}</span>
                        </span>
                      </div>

                      <span
                        className={`font-mono-custom text-[10px] font-bold px-2.5 py-1 border border-[#1a1c1a] uppercase self-start sm:self-auto ${
                          item.status === 'Selesai Serah Terima'
                            ? 'bg-[#006b54] text-white'
                            : 'bg-amber-200 text-[#1a1c1a]'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Petugas Serah Terima & Jumlah Santri */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono-custom text-xs">
                      <div className="p-3 bg-white border border-[#1a1c1a]/25 space-y-1">
                        <div className="text-[10px] text-[#1a1c1a]/60 uppercase font-bold">
                          PETUGAS SERAH TERIMA PIKET
                        </div>
                        <div className="font-sans text-xs text-[#1a1c1a]">
                          Diserahkan: <strong>{item.waliMenyerahkan}</strong>
                        </div>
                        <div className="font-sans text-xs text-[#006b54]">
                          Diterima: <strong>{item.waliMenerima}</strong>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-[#1a1c1a]/25 flex items-center justify-around text-center">
                        <div>
                          <span className="text-[10px] text-[#1a1c1a]/60 block">HADIR</span>
                          <strong className="text-base font-syne text-[#006b54]">
                            {item.jumlahSantriHadir}
                          </strong>
                        </div>
                        <div className="h-8 w-px bg-[#1a1c1a]/15" />
                        <div>
                          <span className="text-[10px] text-[#1a1c1a]/60 block">SAKIT / UKS</span>
                          <strong className="text-base font-syne text-rose-700">
                            {item.jumlahSantriSakit}
                          </strong>
                        </div>
                        <div className="h-8 w-px bg-[#1a1c1a]/15" />
                        <div>
                          <span className="text-[10px] text-[#1a1c1a]/60 block">IZIN</span>
                          <strong className="text-base font-syne text-amber-700">
                            {item.jumlahSantriIzin}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Ringkasan Kondisi & Catatan Penting */}
                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-white border border-[#1a1c1a]/20">
                        <span className="font-mono-custom text-[10px] font-bold uppercase text-[#1a1c1a] block mb-1">
                          Ringkasan Kondisi Asrama & Kegiatan:
                        </span>
                        <p className="text-[#1a1c1a]/85 leading-relaxed">
                          {item.ringkasanKondisi}
                        </p>
                      </div>

                      {(item.catatanPenting || item.perlengkapanDiserahkan) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.catatanPenting && (
                            <div className="p-3 bg-amber-50/70 border border-amber-400/60">
                              <span className="font-mono-custom text-[10px] font-bold uppercase text-amber-900 block mb-1">
                                Pesan / Tindak Lanjut Shift Berikutnya:
                              </span>
                              <p className="text-[#1a1c1a]/85 leading-relaxed">
                                {item.catatanPenting}
                              </p>
                            </div>
                          )}

                          {item.perlengkapanDiserahkan && (
                            <div className="p-3 bg-emerald-50/60 border border-[#006b54]/30">
                              <span className="font-mono-custom text-[10px] font-bold uppercase text-[#006b54] block mb-1">
                                Perlengkapan & Inventaris Diserahkan:
                              </span>
                              <p className="text-[#1a1c1a]/85 leading-relaxed">
                                {item.perlengkapanDiserahkan}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="pt-2.5 border-t border-[#1a1c1a]/15 flex flex-wrap items-center justify-end gap-1.5 font-mono-custom">
                      {item.status !== 'Selesai Serah Terima' && (
                        <button
                          type="button"
                          onClick={() => {
                            updateShiftLog(item.id, { status: 'Selesai Serah Terima' });
                            showToast(`✓ Pergantian shift tanggal ${item.tanggal} diverifikasi selesai.`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border border-[#006b54] bg-emerald-50 hover:bg-[#006b54] hover:text-white text-[#006b54] transition-colors cursor-pointer"
                        >
                          <ClipboardCheck className="w-3 h-3" />
                          <span>Verifikasi Selesai</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border border-[#1a1c1a] bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border border-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white text-rose-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
