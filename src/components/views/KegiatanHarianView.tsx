import React, { useState, useMemo, useRef } from 'react';
import {
  MapPin,
  UserCheck,
  CheckCircle2,
  Plus,
  Calendar,
  AlertCircle,
  Download,
  LayoutGrid,
  Table as TableIcon,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { KegiatanHarianItem, PresensiKegiatan } from '../../types';
import { Modal } from '../common/Modal';

export const KegiatanHarianView: React.FC = () => {
  const {
    kegiatanHarianList,
    siswaList,
    presensiList,
    updatePresensi,
    addKegiatanHarian,
    updateKegiatanHarian,
    deleteKegiatanHarian,
    clearAllKegiatanHarian,
  } = useApp();

  type ActiveKegiatanPanel = 'none' | 'add' | 'edit' | 'hapus';
  const [activePanel, setActivePanel] = useState<ActiveKegiatanPanel>('none');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedKegiatanForPresensi, setSelectedKegiatanForPresensi] =
    useState<KegiatanHarianItem | null>(null);

  const [viewMode, setViewMode] = useState<'tabel' | 'kartu'>('tabel');
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [fokusFilter, setFokusFilter] = useState('Semua');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit & Hapus state
  const [editTargetId, setEditTargetId] = useState<string>('');
  const [hapusMode, setHapusMode] = useState<'single' | 'all'>('single');
  const [hapusSingleId, setHapusSingleId] = useState<string>('');
  const [hapusAllConfirmed, setHapusAllConfirmed] = useState(false);

  const formSectionRef = useRef<HTMLDivElement>(null);

  const initialFormState: Omit<KegiatanHarianItem, 'id'> = {
    waktuMulai: '16:00',
    waktuSelesai: '17:00',
    namaKegiatan: '',
    fokusPengasuhan: '',
    kategori: 'Pendidikan',
    penanggungJawab: 'Wali Asuh Piket',
    tempat: 'Aula Asrama',
    deskripsi: '',
  };

  const [formData, setFormData] = useState<Omit<KegiatanHarianItem, 'id'>>(initialFormState);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const scrollToFormPanel = () => {
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const populateEditForm = (keg: KegiatanHarianItem) => {
    setEditTargetId(keg.id);
    setFormError(null);
    setFormData({
      waktuMulai: keg.waktuMulai,
      waktuSelesai: keg.waktuSelesai,
      namaKegiatan: keg.namaKegiatan,
      fokusPengasuhan: keg.fokusPengasuhan || '',
      kategori: keg.kategori,
      penanggungJawab: keg.penanggungJawab,
      tempat: keg.tempat,
      deskripsi: keg.deskripsi,
    });
  };

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setFormError(null);
    setActivePanel('add');
    scrollToFormPanel();
  };

  const handleOpenEdit = (keg?: KegiatanHarianItem) => {
    const target =
      keg || kegiatanHarianList.find((k) => k.id === editTargetId) || kegiatanHarianList[0];
    if (target) {
      populateEditForm(target);
    } else {
      setEditTargetId('');
    }
    setActivePanel('edit');
    scrollToFormPanel();
  };

  const handleOpenHapus = (keg?: KegiatanHarianItem, mode: 'single' | 'all' = 'single') => {
    setHapusMode(mode);
    setHapusAllConfirmed(false);
    if (keg) {
      setHapusSingleId(keg.id);
    } else {
      setHapusSingleId(kegiatanHarianList[0]?.id || '');
    }
    setActivePanel('hapus');
    scrollToFormPanel();
  };

  // Extract unique Fokus Pengasuhan for filter
  const uniqueFokusList = useMemo(() => {
    const set = new Set<string>();
    kegiatanHarianList.forEach((k) => {
      if (k.fokusPengasuhan) {
        k.fokusPengasuhan.split(',').forEach((f) => set.add(f.trim()));
      }
    });
    return Array.from(set).sort();
  }, [kegiatanHarianList]);

  // Filtered Kegiatan
  const filteredKegiatan = useMemo(() => {
    return kegiatanHarianList.filter((k) => {
      const matchSearch =
        k.namaKegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (k.fokusPengasuhan && k.fokusPengasuhan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        k.penanggungJawab.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.waktuMulai.includes(searchQuery);

      const matchKategori =
        kategoriFilter === 'Semua' || k.kategori === kategoriFilter;

      const matchFokus =
        fokusFilter === 'Semua' ||
        (k.fokusPengasuhan && k.fokusPengasuhan.toLowerCase().includes(fokusFilter.toLowerCase()));

      return matchSearch && matchKategori && matchFokus;
    });
  }, [kegiatanHarianList, searchQuery, kategoriFilter, fokusFilter]);

  const handleOpenPresensi = (kegiatan: KegiatanHarianItem) => {
    setSelectedKegiatanForPresensi(kegiatan);
  };

  const handleUpdateStatus = (
    siswaId: string,
    status: PresensiKegiatan['status'],
    keterangan?: string
  ) => {
    if (!selectedKegiatanForPresensi) return;
    updatePresensi({
      id: '',
      tanggal: selectedDate,
      kegiatanId: selectedKegiatanForPresensi.id,
      siswaId,
      status,
      keterangan,
    });
  };

  // Bulk mark attendance
  const handleBulkStatus = (status: PresensiKegiatan['status']) => {
    if (!selectedKegiatanForPresensi) return;
    siswaList.forEach((s) => {
      updatePresensi({
        id: '',
        tanggal: selectedDate,
        kegiatanId: selectedKegiatanForPresensi.id,
        siswaId: s.id,
        status,
      });
    });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNama = formData.namaKegiatan.trim();
    if (!trimmedNama) {
      setFormError('Nama kegiatan wajib diisi.');
      return;
    }
    setFormError(null);
    addKegiatanHarian({
      ...formData,
      namaKegiatan: trimmedNama,
      fokusPengasuhan: formData.fokusPengasuhan?.trim() || '',
      penanggungJawab: formData.penanggungJawab.trim() || 'Wali Asuh Piket',
      tempat: formData.tempat.trim() || 'Area Asrama',
      deskripsi: formData.deskripsi.trim(),
    });
    setActivePanel('none');
    setFormData(initialFormState);
    showToast(`✓ Jadwal "${trimmedNama}" berhasil ditambahkan.`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = kegiatanHarianList.find((k) => k.id === editTargetId);
    if (!target) {
      setFormError('Pilih kegiatan yang akan diperbarui.');
      return;
    }
    const trimmedNama = formData.namaKegiatan.trim();
    if (!trimmedNama) {
      setFormError('Nama kegiatan wajib diisi.');
      return;
    }
    setFormError(null);
    const updatedPayload: Partial<KegiatanHarianItem> = {
      ...formData,
      namaKegiatan: trimmedNama,
      fokusPengasuhan: formData.fokusPengasuhan?.trim() || '',
      penanggungJawab: formData.penanggungJawab.trim() || 'Wali Asuh Piket',
      tempat: formData.tempat.trim() || 'Area Asrama',
      deskripsi: formData.deskripsi.trim(),
    };
    updateKegiatanHarian(target.id, updatedPayload);
    if (selectedKegiatanForPresensi?.id === target.id) {
      setSelectedKegiatanForPresensi({ ...target, ...updatedPayload });
    }
    setActivePanel('none');
    showToast(`✓ Jadwal "${trimmedNama}" berhasil diperbarui.`);
  };

  const handleConfirmDeleteSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const target = kegiatanHarianList.find((k) => k.id === hapusSingleId);
    if (!target) return;
    deleteKegiatanHarian(target.id);
    if (selectedKegiatanForPresensi?.id === target.id) {
      setSelectedKegiatanForPresensi(null);
    }
    const remaining = kegiatanHarianList.filter((k) => k.id !== target.id);
    setHapusSingleId(remaining[0]?.id || '');
    if (remaining.length === 0) {
      setActivePanel('none');
    }
    showToast(`✓ Jadwal "${target.namaKegiatan}" berhasil dihapus.`);
  };

  const handleConfirmClearAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hapusAllConfirmed) return;
    clearAllKegiatanHarian();
    setSelectedKegiatanForPresensi(null);
    setHapusAllConfirmed(false);
    setActivePanel('none');
    showToast('✓ Seluruh jadwal kegiatan harian berhasil dihapus.');
  };

  // Export Kegiatan to Excel (.xlsx)
  const handleExportJadwalExcel = () => {
    const rows = kegiatanHarianList.map((k, index) => {
      const presensiHariIni = presensiList.filter(
        (p) => p.tanggal === selectedDate && p.kegiatanId === k.id
      );
      const hadirCount = presensiHariIni.filter((p) => p.status === 'Hadir').length;

      return {
        'No': index + 1,
        'Waktu': k.waktuSelesai ? `${k.waktuMulai}–${k.waktuSelesai}` : k.waktuMulai,
        'Kegiatan': k.namaKegiatan,
        'Fokus Pengasuhan': k.fokusPengasuhan || '-',
        'Kategori': k.kategori,
        'Penanggung Jawab': k.penanggungJawab,
        'Tempat / Lokasi': k.tempat,
        'Deskripsi Ringkas': k.deskripsi,
        'Kehadiran Hari Ini': `${hadirCount} / ${siswaList.length} Santri`,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 32 },
      { wch: 30 },
      { wch: 14 },
      { wch: 26 },
      { wch: 28 },
      { wch: 45 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal Harian Asrama');
    XLSX.writeFile(
      workbook,
      `Jadwal_Kegiatan_Harian_Sekolah_Rakyat_1_Jepara_${selectedDate}.xlsx`
    );
  };

  const renderKegiatanFormFields = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">NAMA KEGIATAN *</label>
          <input
            type="text"
            required
            placeholder="Contoh: Senam Pagi Ceria & Jalan Santai"
            value={formData.namaKegiatan}
            onChange={(e) => {
              setFormData({ ...formData, namaKegiatan: e.target.value });
              if (formError) setFormError(null);
            }}
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] font-sans text-xs focus:outline-none focus:border-[#006b54]"
          />
        </div>

        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">FOKUS PENGASUHAN</label>
          <input
            type="text"
            placeholder="Contoh: Kemandirian, kebersihan diri, etika makan..."
            value={formData.fokusPengasuhan || ''}
            onChange={(e) => setFormData({ ...formData, fokusPengasuhan: e.target.value })}
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] font-sans text-xs focus:outline-none focus:border-[#006b54]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">WAKTU MULAI</label>
          <input
            type="time"
            value={formData.waktuMulai}
            onChange={(e) => setFormData({ ...formData, waktuMulai: e.target.value })}
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
          />
        </div>
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">WAKTU SELESAI</label>
          <input
            type="time"
            value={formData.waktuSelesai}
            onChange={(e) => setFormData({ ...formData, waktuSelesai: e.target.value })}
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
          />
        </div>
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">KATEGORI</label>
          <select
            value={formData.kategori}
            onChange={(e) =>
              setFormData({
                ...formData,
                kategori: e.target.value as KegiatanHarianItem['kategori'],
              })
            }
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
          >
            <option value="Ibadah">Ibadah</option>
            <option value="Kebersihan">Kebersihan</option>
            <option value="Pendidikan">Pendidikan</option>
            <option value="Sosial">Sosial</option>
            <option value="Istirahat">Istirahat</option>
          </select>
        </div>
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">TEMPAT / LOKASI</label>
          <input
            type="text"
            placeholder="Contoh: Lapangan Asrama"
            value={formData.tempat}
            onChange={(e) => setFormData({ ...formData, tempat: e.target.value })}
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] font-sans text-xs focus:outline-none focus:border-[#006b54]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">PENANGGUNG JAWAB</label>
          <input
            type="text"
            placeholder="Contoh: Wali Asuh Piket Pagi"
            value={formData.penanggungJawab}
            onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] font-sans text-xs focus:outline-none focus:border-[#006b54]"
          />
        </div>
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">DESKRIPSI KEGIATAN</label>
          <input
            type="text"
            placeholder="Jelaskan rincian dan tata tertib kegiatan..."
            value={formData.deskripsi}
            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] font-sans text-xs focus:outline-none focus:border-[#006b54]"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b-[1.5px] border-[#1a1c1a] pb-4">
        <div>
          <span className="status-badge mb-2">
            {kegiatanHarianList.length} RANGKAIAN JADWAL RUTIN ASRAMA
          </span>
          <h1 className="font-syne text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[#1a1c1a] leading-none">
            Kegiatan Harian
          </h1>
          <p className="text-xs text-[#1a1c1a]/65 font-mono-custom mt-2 uppercase tracking-wider">
            Manajemen Jadwal, Fokus Pengasuhan & Presensi Rutinitas Santri Cilik
          </p>
        </div>

        {/* Header Action Buttons */}
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
            onClick={handleExportJadwalExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-[#fdfcf9] text-[#1a1c1a] border-[1.5px] border-[#1a1c1a] font-bold shadow-[2px_2px_0px_#1a1c1a] transition-all uppercase tracking-wider active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
            title="Download jadwal kegiatan ke Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#006b54]" />
            <span>Export Excel</span>
          </button>

          {/* Tambah Jadwal */}
          <button
            type="button"
            onClick={() => (activePanel === 'add' ? setActivePanel('none') : handleOpenAdd())}
            className="neo-btn-primary flex items-center gap-1.5 cursor-pointer"
          >
            {activePanel === 'add' ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{activePanel === 'add' ? 'TUTUP FORM' : 'TAMBAH JADWAL'}</span>
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

      {/* Menu Kelola Jadwal Kegiatan */}
      <div className="bg-white border-[1.5px] border-[#1a1c1a] p-3.5 neo-shadow font-mono-custom">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#006b54] block">
              Menu Kelola Jadwal Kegiatan
            </span>
            <p className="text-[11px] font-sans text-[#1a1c1a]/75">
              Tambahkan jadwal baru, ubah waktu/fokus pengasuhan jadwal yang ada, atau hapus jadwal yang tidak digunakan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => (activePanel === 'add' ? setActivePanel('none') : handleOpenAdd())}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-[1.5px] border-[#1a1c1a] transition-all cursor-pointer whitespace-nowrap ${
                activePanel === 'add'
                  ? 'bg-[#006b54] text-white shadow-none translate-x-0.5 translate-y-0.5'
                  : 'bg-[#fdfcf9] text-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] hover:bg-[#006b54] hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Form Tambah</span>
            </button>
            <button
              type="button"
              onClick={() => (activePanel === 'edit' ? setActivePanel('none') : handleOpenEdit())}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-[1.5px] border-[#1a1c1a] transition-all cursor-pointer whitespace-nowrap ${
                activePanel === 'edit'
                  ? 'bg-[#1a1c1a] text-white shadow-none translate-x-0.5 translate-y-0.5'
                  : 'bg-[#fdfcf9] text-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] hover:bg-[#1a1c1a] hover:text-white'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Form Edit</span>
            </button>
            <button
              type="button"
              onClick={() =>
                activePanel === 'hapus' ? setActivePanel('none') : handleOpenHapus(undefined, 'single')
              }
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-[1.5px] border-rose-700 transition-all cursor-pointer whitespace-nowrap ${
                activePanel === 'hapus'
                  ? 'bg-rose-700 text-white shadow-none translate-x-0.5 translate-y-0.5'
                  : 'bg-rose-50 text-rose-800 shadow-[2px_2px_0px_#9f1239] hover:bg-rose-700 hover:text-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Form Hapus</span>
            </button>
          </div>
        </div>
      </div>

      {/* INLINE FORM SECTION (TAMBAH / EDIT / HAPUS KEGIATAN) */}
      <div ref={formSectionRef}>
        {/* FORM TAMBAH JADWAL */}
        {activePanel === 'add' && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#1a1c1a] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  Form Tambah Jadwal Kegiatan
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Tambahkan jadwal kegiatan rutin asrama beserta waktu, lokasi, dan penanggung jawab.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form tambah jadwal"
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

            <form onSubmit={handleSaveAdd} className="space-y-4 font-mono-custom text-xs">
              {renderKegiatanFormFields()}

              <div className="pt-3 border-t border-[#1a1c1a] flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActivePanel('none')}
                  className="px-4 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-[#1a1c1a] font-bold uppercase cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 border-[1.5px] border-[#1a1c1a] bg-[#006b54] hover:bg-[#005240] text-white font-bold uppercase shadow-[2.5px_2.5px_0px_#1a1c1a] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>SIMPAN JADWAL</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FORM EDIT JADWAL */}
        {activePanel === 'edit' && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#1a1c1a] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  Form Edit Jadwal Kegiatan
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Pilih kegiatan yang ingin diubah atau klik tombol Edit pada tabel/kartu kegiatan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form edit jadwal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {kegiatanHarianList.length === 0 ? (
              <div className="p-5 bg-[#fdfcf9] border border-[#1a1c1a]/30 text-center space-y-3">
                <p className="font-sans text-xs text-[#1a1c1a]/80">
                  Belum ada jadwal kegiatan untuk diedit. Silakan tambahkan jadwal terlebih dahulu.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] text-white text-xs font-bold font-mono-custom border border-[#1a1c1a] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buka Form Tambah</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveEdit} className="space-y-4 font-mono-custom text-xs">
                <div className="p-3.5 bg-emerald-50/60 border-[1.5px] border-[#006b54] space-y-1.5">
                  <label className="block font-bold text-[#1a1c1a]">
                    Pilih Kegiatan yang Akan Diedit ({kegiatanHarianList.length} jadwal) *
                  </label>
                  <select
                    value={editTargetId}
                    onChange={(e) => {
                      const next = kegiatanHarianList.find((k) => k.id === e.target.value);
                      if (next) populateEditForm(next);
                    }}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans font-bold"
                  >
                    {kegiatanHarianList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.waktuMulai}–{k.waktuSelesai} · {k.namaKegiatan} ({k.kategori})
                      </option>
                    ))}
                  </select>
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="p-3 bg-rose-50 border border-rose-400 text-rose-900 text-xs font-medium flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {renderKegiatanFormFields()}

                <div className="pt-3 border-t border-[#1a1c1a] flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = kegiatanHarianList.find((k) => k.id === editTargetId);
                      if (target) handleOpenHapus(target, 'single');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-700 border-[1.5px] border-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white font-bold uppercase cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Jadwal Ini</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePanel('none')}
                      className="px-4 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-[#1a1c1a] font-bold uppercase cursor-pointer"
                    >
                      BATAL
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-5 py-2 border-[1.5px] border-[#1a1c1a] bg-[#006b54] hover:bg-[#005240] text-white font-bold uppercase shadow-[2.5px_2.5px_0px_#1a1c1a] cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>SIMPAN PERUBAHAN</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* FORM HAPUS JADWAL */}
        {activePanel === 'hapus' && (
          <div className="bg-white border-[1.5px] border-rose-700 shadow-[5px_5px_0px_#9f1239] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-rose-700">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-rose-900 tracking-tight">
                  Form Hapus Jadwal Kegiatan
                </h2>
                <p className="text-xs font-mono-custom text-rose-900/75 mt-0.5">
                  Hapus satu jadwal kegiatan tertentu atau kosongkan seluruh daftar jadwal kegiatan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form hapus jadwal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {kegiatanHarianList.length === 0 ? (
              <div className="p-5 bg-[#fdfcf9] border border-[#1a1c1a]/30 text-center space-y-2">
                <p className="font-sans text-xs text-[#1a1c1a]/80">
                  Saat ini tidak ada jadwal kegiatan tersimpan (0 jadwal).
                </p>
              </div>
            ) : (
              <div className="space-y-4 font-mono-custom text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHapusMode('single');
                      if (!hapusSingleId && kegiatanHarianList[0]) {
                        setHapusSingleId(kegiatanHarianList[0].id);
                      }
                    }}
                    className={`px-3 py-2 font-bold border-[1.5px] cursor-pointer transition-colors ${
                      hapusMode === 'single'
                        ? 'bg-rose-700 text-white border-[#1a1c1a]'
                        : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40 hover:border-[#1a1c1a]'
                    }`}
                  >
                    1. Hapus 1 Jadwal Kegiatan
                  </button>
                  <button
                    type="button"
                    onClick={() => setHapusMode('all')}
                    className={`px-3 py-2 font-bold border-[1.5px] cursor-pointer transition-colors ${
                      hapusMode === 'all'
                        ? 'bg-rose-700 text-white border-[#1a1c1a]'
                        : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40 hover:border-[#1a1c1a]'
                    }`}
                  >
                    2. Hapus Semua Jadwal ({kegiatanHarianList.length})
                  </button>
                </div>

                {hapusMode === 'single' && (
                  <form onSubmit={handleConfirmDeleteSingle} className="space-y-3">
                    <div>
                      <label className="block font-bold text-[#1a1c1a] mb-1">
                        Pilih Jadwal Kegiatan yang Akan Dihapus *
                      </label>
                      <select
                        value={hapusSingleId}
                        onChange={(e) => setHapusSingleId(e.target.value)}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] font-sans font-bold"
                      >
                        {kegiatanHarianList.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.waktuMulai}–{k.waktuSelesai} · {k.namaKegiatan} ({k.kategori})
                          </option>
                        ))}
                      </select>
                    </div>

                    {(() => {
                      const target = kegiatanHarianList.find((k) => k.id === hapusSingleId);
                      if (!target) return null;
                      return (
                        <div className="p-3.5 bg-rose-50 border-[1.5px] border-rose-600 text-rose-950 space-y-1">
                          <div className="font-bold text-sm font-sans">{target.namaKegiatan}</div>
                          <div>
                            Waktu:{' '}
                            <strong>
                              {target.waktuMulai}–{target.waktuSelesai}
                            </strong>{' '}
                            · Kategori: <strong>{target.kategori}</strong>
                          </div>
                          <div>
                            Lokasi: <strong>{target.tempat}</strong> · PJ:{' '}
                            <strong>{target.penanggungJawab}</strong>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex justify-end gap-2 pt-2 border-t border-rose-200">
                      <button
                        type="button"
                        onClick={() => setActivePanel('none')}
                        className="px-4 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-[#1a1c1a] font-bold uppercase cursor-pointer"
                      >
                        BATAL
                      </button>
                      <button
                        type="submit"
                        disabled={!hapusSingleId}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white font-bold uppercase border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>YA, HAPUS JADWAL INI</span>
                      </button>
                    </div>
                  </form>
                )}

                {hapusMode === 'all' && (
                  <form onSubmit={handleConfirmClearAll} className="space-y-3">
                    <div className="p-3.5 bg-rose-50 border-[1.5px] border-rose-600 text-rose-950 space-y-1.5">
                      <div className="font-bold">
                        Peringatan: Anda akan menghapus seluruh {kegiatanHarianList.length} jadwal kegiatan harian!
                      </div>
                      <p className="font-sans text-xs">
                        Data presensi kegiatan terkait juga akan ikut dibersihkan. Anda dapat menambahkan jadwal baru kapan saja melalui Form Tambah.
                      </p>
                    </div>

                    <label className="flex items-center gap-2 p-2.5 bg-[#fdfcf9] border border-[#1a1c1a] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hapusAllConfirmed}
                        onChange={(e) => setHapusAllConfirmed(e.target.checked)}
                        className="w-4 h-4 accent-rose-700"
                      />
                      <span className="font-sans font-bold text-[#1a1c1a]">
                        Saya yakin ingin menghapus seluruh jadwal kegiatan harian.
                      </span>
                    </label>

                    <div className="flex justify-end gap-2 pt-2 border-t border-rose-200">
                      <button
                        type="button"
                        onClick={() => setActivePanel('none')}
                        className="px-4 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-[#1a1c1a] font-bold uppercase cursor-pointer"
                      >
                        BATAL
                      </button>
                      <button
                        type="submit"
                        disabled={!hapusAllConfirmed}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white font-bold uppercase border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>YA, HAPUS SEMUA JADWAL</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Switcher & Filters */}
      <div className="p-3 sm:p-4 bg-[#1a1c1a]/[0.05] border-[1.5px] border-[#1a1c1a] rounded flex flex-wrap gap-2.5 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Tabs */}
          <div className="inline-flex border-[1.5px] border-[#1a1c1a] bg-white">
            <button
              type="button"
              onClick={() => setViewMode('tabel')}
              className={`px-3 py-1.5 font-mono-custom text-xs font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'tabel'
                  ? 'bg-[#1a1c1a] text-white'
                  : 'text-[#1a1c1a] hover:bg-[#1a1c1a]/10'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel Resmi</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kartu')}
              className={`px-3 py-1.5 font-mono-custom text-xs font-bold uppercase transition-colors border-l-[1.5px] border-[#1a1c1a] flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'kartu'
                  ? 'bg-[#1a1c1a] text-white'
                  : 'text-[#1a1c1a] hover:bg-[#1a1c1a]/10'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu Rinci</span>
            </button>
          </div>

          {/* Filter Kategori */}
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] focus:outline-none"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Ibadah">Kategori: Ibadah</option>
            <option value="Kebersihan">Kategori: Kebersihan</option>
            <option value="Pendidikan">Kategori: Pendidikan</option>
            <option value="Sosial">Kategori: Sosial</option>
            <option value="Istirahat">Kategori: Istirahat</option>
          </select>

          {/* Filter Fokus Pengasuhan */}
          <select
            value={fokusFilter}
            onChange={(e) => setFokusFilter(e.target.value)}
            className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] focus:outline-none max-w-[200px]"
          >
            <option value="Semua">Semua Fokus Pengasuhan</option>
            {uniqueFokusList.map((fokus) => (
              <option key={fokus} value={fokus}>
                Fokus: {fokus}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kegiatan / fokus pengasuhan..."
            className="w-full bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom text-[#1a1c1a] focus:outline-none"
          />
        </div>
      </div>

      {/* Empty State when no activities match */}
      {filteredKegiatan.length === 0 ? (
        <div className="p-8 text-center bg-white border-[1.5px] border-[#1a1c1a] neo-shadow space-y-4">
          {kegiatanHarianList.length === 0 ? (
            <>
              <div className="space-y-1">
                <h3 className="font-syne text-lg font-bold text-[#1a1c1a]">
                  Belum Ada Jadwal Kegiatan Harian
                </h3>
                <p className="font-sans text-xs text-[#1a1c1a]/70 max-w-md mx-auto">
                  Daftar jadwal kegiatan kosong. Silakan tambahkan jadwal kegiatan baru melalui Form Tambah di atas.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Jadwal Baru</span>
              </button>
            </>
          ) : (
            <p className="font-mono-custom text-xs text-[#1a1c1a]/60 uppercase">
              Tidak ada kegiatan yang cocok dengan filter atau pencarian.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* VIEW 1: TABEL RESMI & FOKUS PENGASUHAN */}
          {viewMode === 'tabel' && (
            <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow overflow-hidden">
              <div className="p-3.5 bg-[#fdfcf9] border-b-[1.5px] border-[#1a1c1a] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono-custom text-[11px] font-bold text-[#006b54] uppercase tracking-wider block">
                    // STRUKTUR JADWAL RUTINITAS RESMI ASRAMA
                  </span>
                  <p className="font-syne font-bold text-base text-[#1a1c1a]">
                    Tabel Waktu, Kegiatan, dan Fokus Pengasuhan Santri
                  </p>
                </div>
                <div className="text-[11px] font-mono-custom text-[#1a1c1a]/70">
                  Menampilkan {filteredKegiatan.length} dari {kegiatanHarianList.length} kegiatan
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono-custom">
                  <thead className="bg-[#1a1c1a] text-[#fdfcf9] uppercase text-[11px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3 text-center w-12">No</th>
                      <th className="p-3 w-36">WAKTU</th>
                      <th className="p-3">KEGIATAN</th>
                      <th className="p-3">FOKUS PENGASUHAN</th>
                      <th className="p-3">PJ & TEMPAT</th>
                      <th className="p-3 text-right w-64">AKSI & PRESENSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1c1a]/15">
                    {filteredKegiatan.map((item, index) => {
                      const presensiHariIni = presensiList.filter(
                        (p) => p.tanggal === selectedDate && p.kegiatanId === item.id
                      );
                      const hadirCount = presensiHariIni.filter((p) => p.status === 'Hadir').length;
                      const isChecked = presensiHariIni.length > 0;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#1a1c1a]/[0.02] transition-colors"
                        >
                          {/* No */}
                          <td className="p-3 text-center font-bold text-[#1a1c1a]/60">
                            {index + 1}
                          </td>

                          {/* Waktu */}
                          <td className="p-3 font-bold text-[#1a1c1a] whitespace-nowrap">
                            <span className="px-2 py-1 bg-[#1a1c1a]/5 border border-[#1a1c1a]/20 inline-block">
                              {item.waktuSelesai ? `${item.waktuMulai}–${item.waktuSelesai}` : item.waktuMulai}
                            </span>
                          </td>

                          {/* Kegiatan */}
                          <td className="p-3">
                            <div className="font-syne font-bold text-sm text-[#1a1c1a]">
                              {item.namaKegiatan}
                            </div>
                            <div className="text-[11px] text-[#1a1c1a]/65 line-clamp-1 font-sans mt-0.5">
                              {item.deskripsi}
                            </div>
                          </td>

                          {/* Fokus Pengasuhan */}
                          <td className="p-3">
                            {item.fokusPengasuhan ? (
                              <span className="inline-block px-2.5 py-1 bg-emerald-50 border border-[#006b54] text-[#006b54] font-bold text-[11px] uppercase tracking-wide">
                                {item.fokusPengasuhan}
                              </span>
                            ) : (
                              <span className="text-[#1a1c1a]/40 italic">-</span>
                            )}
                          </td>

                          {/* PJ & Tempat */}
                          <td className="p-3 text-[11px]">
                            <div className="font-semibold text-[#1a1c1a]">{item.penanggungJawab}</div>
                            <div className="text-[#1a1c1a]/60 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#006b54]" />
                              <span>{item.tempat}</span>
                            </div>
                          </td>

                          {/* Aksi & Presensi */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <span className="text-[10px] hidden xl:inline-block mr-1">
                                {isChecked ? (
                                  <span className="text-[#006b54] font-bold">
                                    {hadirCount}/{siswaList.length} Hadir
                                  </span>
                                ) : (
                                  <span className="text-[#1a1c1a]/50">Belum diisi</span>
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleOpenPresensi(item)}
                                className="neo-btn-outline text-[11px] py-1 px-2 flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#006b54]" />
                                <span>Presensi</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold border border-[#1a1c1a] bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] transition-colors cursor-pointer"
                                title="Edit jadwal kegiatan"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenHapus(item, 'single')}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold border border-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white text-rose-800 transition-colors cursor-pointer"
                                title="Hapus jadwal kegiatan"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus</span>
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
          )}

          {/* VIEW 2: KARTU RINCI TIMELINE */}
          {viewMode === 'kartu' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredKegiatan.map((item, index) => {
                const presensiHariIni = presensiList.filter(
                  (p) => p.tanggal === selectedDate && p.kegiatanId === item.id
                );
                const hadirCount = presensiHariIni.filter((p) => p.status === 'Hadir').length;
                const isChecked = presensiHariIni.length > 0;

                return (
                  <div
                    key={item.id}
                    className="bg-white border-[1.5px] border-[#1a1c1a] p-4 neo-shadow flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-[#1a1c1a]/15 pb-2 mb-2 font-mono-custom text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#1a1c1a] text-white font-bold text-[11px]">
                            #{index + 1}
                          </span>
                          <span className="font-bold text-[#1a1c1a] bg-[#1a1c1a]/5 px-2 py-0.5 border border-[#1a1c1a]/20">
                            {item.waktuSelesai ? `${item.waktuMulai}–${item.waktuSelesai}` : item.waktuMulai}
                          </span>
                        </div>
                        <span className="status-badge">{item.kategori}</span>
                      </div>

                      <h3 className="font-syne font-bold text-base text-[#1a1c1a]">
                        {item.namaKegiatan}
                      </h3>

                      {item.fokusPengasuhan && (
                        <div className="mt-2">
                          <span className="inline-block px-2.5 py-1 bg-emerald-50 border border-[#006b54] text-[#006b54] font-mono-custom font-bold text-[11px] uppercase">
                            Fokus: {item.fokusPengasuhan}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-[#1a1c1a]/70 font-sans mt-2">
                        {item.deskripsi}
                      </p>

                      <div className="mt-3 pt-2 border-t border-[#1a1c1a]/10 flex flex-wrap items-center justify-between gap-2 font-mono-custom text-[11px] text-[#1a1c1a]/65">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#006b54]" />
                          {item.tempat}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-[#006b54]" />
                          PJ: {item.penanggungJawab}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#1a1c1a]/15 flex flex-wrap items-center justify-between gap-2 font-mono-custom text-xs">
                      <div>
                        {isChecked ? (
                          <span className="text-[#006b54] font-bold">
                            ✓ Presensi: {hadirCount}/{siswaList.length} Santri
                          </span>
                        ) : (
                          <span className="text-[#1a1c1a]/50">Belum dipresensi</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
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
                          onClick={() => handleOpenHapus(item, 'single')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border border-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white text-rose-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenPresensi(item)}
                          className="neo-btn-primary py-1 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Presensi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal Presensi Kegiatan */}
      <Modal
        isOpen={!!selectedKegiatanForPresensi}
        onClose={() => setSelectedKegiatanForPresensi(null)}
        title={`PRESENSI: ${selectedKegiatanForPresensi?.namaKegiatan.toUpperCase()}`}
        subtitle={`Waktu: ${selectedKegiatanForPresensi?.waktuMulai} - ${selectedKegiatanForPresensi?.waktuSelesai} WIB · Tanggal: ${selectedDate}`}
        maxWidth="2xl"
      >
        {selectedKegiatanForPresensi && (
          <div className="space-y-4 font-mono-custom text-xs">
            {/* Focal Area Reminder Banner */}
            {selectedKegiatanForPresensi.fokusPengasuhan && (
              <div className="p-2.5 bg-emerald-50 border-[1.5px] border-[#006b54] text-[#006b54] flex items-center justify-between">
                <div>
                  <span className="font-bold uppercase block text-[10px]">
                    FOKUS PENGASUHAN KEGIATAN:
                  </span>
                  <span className="font-bold text-xs">
                    {selectedKegiatanForPresensi.fokusPengasuhan}
                  </span>
                </div>
                <span className="text-[10px] text-[#006b54]/80">
                  PJ: {selectedKegiatanForPresensi.penanggungJawab}
                </span>
              </div>
            )}

            {/* Quick Bulk Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#1a1c1a]/5 border-[1.5px] border-[#1a1c1a]">
              <span className="font-bold text-[#1a1c1a]">AKSI CEPAT PRESENSI:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleBulkStatus('Hadir')}
                  className="px-2 py-1 bg-[#006b54] text-white font-bold text-[10px] uppercase border border-[#1a1c1a] cursor-pointer"
                >
                  ✓ Hadirkan Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatus('Izin')}
                  className="px-2 py-1 bg-amber-600 text-white font-bold text-[10px] uppercase border border-[#1a1c1a] cursor-pointer"
                >
                  Semua Izin
                </button>
              </div>
            </div>

            {/* List of Students */}
            <div className="divide-y divide-[#1a1c1a]/20 border-[1.5px] border-[#1a1c1a] max-h-96 overflow-y-auto bg-white">
              {siswaList.length === 0 ? (
                <div className="p-6 text-center text-xs font-sans text-[#1a1c1a]/60">
                  Belum ada data santri terdaftar untuk dipresensi.
                </div>
              ) : (
                siswaList.map((siswa, idx) => {
                  const currentPresensi = presensiList.find(
                    (p) =>
                      p.tanggal === selectedDate &&
                      p.kegiatanId === selectedKegiatanForPresensi.id &&
                      p.siswaId === siswa.id
                  );
                  const currentStatus = currentPresensi?.status || 'Hadir';

                  return (
                    <div
                      key={siswa.id}
                      className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#1a1c1a]/5 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-[#1a1c1a] font-syne">
                          {idx + 1}. {siswa.nama}
                        </div>
                        <div className="text-[10px] text-[#1a1c1a]/60">
                          NISN: {siswa.nisn} · {siswa.kelas} ({siswa.panggilan}) · Status: {siswa.status}
                        </div>
                      </div>

                      {/* Status Options */}
                      <div className="flex items-center gap-1 shrink-0">
                        {(['Hadir', 'Sakit', 'Izin', 'Terlambat'] as const).map(
                          (status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleUpdateStatus(siswa.id, status)}
                              className={`px-2 py-1 text-[10px] font-bold border transition-all cursor-pointer ${
                                currentStatus === status
                                  ? status === 'Hadir'
                                    ? 'bg-[#006b54] text-white border-[#1a1c1a] shadow-[1px_1px_0px_#1a1c1a]'
                                    : status === 'Sakit'
                                    ? 'bg-rose-700 text-white border-[#1a1c1a] shadow-[1px_1px_0px_#1a1c1a]'
                                    : status === 'Izin'
                                    ? 'bg-amber-600 text-white border-[#1a1c1a] shadow-[1px_1px_0px_#1a1c1a]'
                                    : 'bg-indigo-700 text-white border-[#1a1c1a] shadow-[1px_1px_0px_#1a1c1a]'
                                  : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/30 hover:bg-[#1a1c1a]/10'
                              }`}
                            >
                              {status}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1a1c1a]">
              <button
                type="button"
                onClick={() => setSelectedKegiatanForPresensi(null)}
                className="neo-btn-primary py-2 px-5 text-xs cursor-pointer"
              >
                SELESAI & SIMPAN PRESENSI
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
