import React, { useState, useMemo, useRef } from 'react';
import {
  Scale,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  User,
  MapPin,
  Eye,
  RotateCcw,
  Search,
  Trash2,
  Edit3,
  Users,
  ShieldCheck,
  Tag,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PelanggaranPembinaan, StatusPelanggaran } from '../../types';

const PRESET_LOKASI = [
  'Musholla Asrama',
  'Kamar Tidur Asrama',
  'Ruang Makan Asrama',
  'Kamar Mandi / Tempat Wudhu',
  'Koridor / Selasar Lantai 1',
  'Koridor / Selasar Lantai 2',
  'Lapangan Olahraga / Halaman',
  'Ruang Belajar / Perpustakaan',
];

const PRESET_JENIS = [
  'Kedisiplinan & Waktu',
  'Kebersihan & Kerapian Barang',
  'Adab & Kesopanan',
  'Ketertiban Jam Istirahat / Tidur',
  'Interaksi & Bahasa Santun',
  'Ketertiban Ibadah & Adab Masjid',
  'Tanggung Jawab Makan & Minum',
  'Lainnya',
];

const PRESET_PEMBINAAN = [
  'Merapikan dan membersihkan deretan rak sandal/sepatu musholla asrama',
  'Didampingi wali asuh mencuci peralatan makan mandiri & membantu mengelap meja makan',
  'Membaca 1 kisah adab sahabat Nabi SAW dan menyampaikan hikmahnya kepada wali asuh',
  'Setoran doa harian & dzikir adab asrama bersama wali asuh',
  'Membantu piket kebersihan halaman dan koridor asrama selama 2 hari',
  'Merapikan lemari pakaian dan merapikan sprei tempat tidur secara mandiri',
];

export const PelanggaranView: React.FC = () => {
  const {
    pelanggaranList,
    siswaList,
    kamarList,
    waliAsuhList,
    addPelanggaran,
    updatePelanggaran,
    updatePelanggaranStatus,
    deletePelanggaran,
    getSiswa,
    getKamar,
    getWaliAsuh,
  } = useApp();

  // Filter States
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterKamar, setFilterKamar] = useState<string>('Semua');
  const [filterJenis, setFilterJenis] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inline Form States (Tambah / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PelanggaranPembinaan | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  // Inline Status Transition per Card
  const [statusEditingId, setStatusEditingId] = useState<string | null>(null);
  const [targetStatus, setTargetStatus] = useState<StatusPelanggaran>('Dipantau');
  const [catatanPerubahanInput, setCatatanPerubahanInput] = useState<string>('');

  // Inline Delete Confirmation per Card
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nama: string } | null>(null);

  const formatWaliName = (wali?: { nama: string; gelar?: string }) => {
    if (!wali) return '';
    return wali.gelar ? `${wali.nama}, ${wali.gelar}` : wali.nama;
  };

  // Initial Form Data
  const getInitialForm = (): Omit<PelanggaranPembinaan, 'id'> => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
    const today = now.toISOString().split('T')[0];
    const defaultSiswa = siswaList[0];
    const defaultKamar = getKamar(defaultSiswa?.kamarId)?.nama || kamarList[0]?.nama || '';
    const defaultWali = getWaliAsuh(defaultSiswa?.waliAsuhId) || waliAsuhList[0];
    const defaultWaliName = formatWaliName(defaultWali) || '';

    return {
      tanggal: today,
      jam: currentTime,
      siswaId: defaultSiswa?.id || '',
      namaSiswa: defaultSiswa?.nama || '',
      kamar: defaultKamar,
      lokasi: 'Musholla Asrama',
      jenisPelanggaran: 'Kedisiplinan & Waktu',
      tingkat: 'Ringan',
      pelanggaran: '',
      kronologi: '',
      bentukPembinaan: '',
      saksi: '',
      petugas: defaultWaliName,
      pembina: defaultWaliName,
      status: 'Dalam Pembinaan',
      catatanPerubahan: '',
    };
  };

  const [formData, setFormData] = useState<Omit<PelanggaranPembinaan, 'id'>>(getInitialForm);

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

  // Handle student selection change in form -> auto populate kamar & petugas
  const handleSiswaChange = (siswaId: string) => {
    const s = getSiswa(siswaId);
    const k = getKamar(s?.kamarId);
    const w = getWaliAsuh(s?.waliAsuhId);
    const waliName = formatWaliName(w) || formData.petugas || formData.pembina || '';

    setFormData((prev) => ({
      ...prev,
      siswaId,
      namaSiswa: s?.nama || (siswaId ? '' : prev.namaSiswa || ''),
      kamar: k ? k.nama : siswaId ? prev.kamar : '',
      petugas: waliName,
      pembina: waliName,
    }));
  };

  const handleOpenAdd = () => {
    setFormData(getInitialForm());
    setEditingRecord(null);
    setFormError(null);
    setIsFormOpen(true);
    scrollToForm();
  };

  const handleOpenEdit = (item: PelanggaranPembinaan) => {
    const s = getSiswa(item.siswaId);
    const k = getKamar(s?.kamarId);
    setEditingRecord(item);
    setFormError(null);
    setFormData({
      tanggal: item.tanggal,
      jam: item.jam || '14:00',
      siswaId: item.siswaId,
      namaSiswa: item.namaSiswa || s?.nama || '',
      kamar: item.kamar || k?.nama || '',
      lokasi: item.lokasi || 'Musholla Asrama',
      jenisPelanggaran: item.jenisPelanggaran || 'Kedisiplinan & Waktu',
      tingkat: item.tingkat || 'Ringan',
      pelanggaran: item.pelanggaran,
      kronologi: item.kronologi,
      bentukPembinaan: item.bentukPembinaan,
      saksi: item.saksi || '',
      petugas: item.petugas || item.pembina,
      pembina: item.pembina || item.petugas || '',
      status: item.status,
      catatanPerubahan: item.catatanPerubahan || '',
    });
    setIsFormOpen(true);
    scrollToForm();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRecord(null);
    setFormError(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedSiswa = formData.siswaId ? getSiswa(formData.siswaId) : undefined;
    const resolvedNama = resolvedSiswa?.nama || formData.namaSiswa?.trim() || '';

    if (!resolvedNama) {
      setFormError('Pilih santri atau isi nama santri secara manual terlebih dahulu.');
      return;
    }
    if (!formData.kamar?.trim()) {
      setFormError('Kamar asrama wajib diisi.');
      return;
    }
    if (!formData.lokasi?.trim()) {
      setFormError('Lokasi kejadian wajib diisi.');
      return;
    }
    if (!formData.pelanggaran.trim()) {
      setFormError('Bentuk pelanggaran / deskripsi singkat wajib diisi.');
      return;
    }
    if (!formData.kronologi.trim()) {
      setFormError('Kronologi kejadian wajib diisi.');
      return;
    }
    if (!formData.bentukPembinaan.trim()) {
      setFormError('Bentuk pembinaan edukatif ramah anak wajib diisi.');
      return;
    }

    const petugasValue = (formData.petugas || formData.pembina || '').trim() || 'Wali Asuh';
    setFormError(null);

    const payload: Omit<PelanggaranPembinaan, 'id'> = {
      ...formData,
      namaSiswa: resolvedNama,
      kamar: formData.kamar.trim(),
      lokasi: formData.lokasi.trim(),
      pelanggaran: formData.pelanggaran.trim(),
      kronologi: formData.kronologi.trim(),
      bentukPembinaan: formData.bentukPembinaan.trim(),
      saksi: formData.saksi?.trim() || '',
      petugas: petugasValue,
      pembina: petugasValue,
      catatanPerubahan: formData.catatanPerubahan?.trim() || '',
    };

    if (editingRecord) {
      updatePelanggaran(editingRecord.id, payload);
      showToast(`✓ Catatan pembinaan ${resolvedNama} berhasil diperbarui.`);
    } else {
      addPelanggaran(payload);
      showToast(`✓ Catatan pembinaan baru untuk ${resolvedNama} berhasil disimpan.`);
    }

    setIsFormOpen(false);
    setEditingRecord(null);
  };

  const handleOpenInlineStatus = (item: PelanggaranPembinaan, nextStatus: StatusPelanggaran) => {
    setStatusEditingId(item.id);
    setTargetStatus(nextStatus);
    setCatatanPerubahanInput(item.catatanPerubahan || '');
    setDeleteTarget(null);
  };

  const handleConfirmStatusChange = (e: React.FormEvent, itemId: string, siswaNama: string) => {
    e.preventDefault();
    const defaultNote =
      targetStatus === 'Selesai'
        ? 'Santri telah menuntaskan tugas pembinaan edukatif dengan baik dan menunjukkan perubahan perilaku positif.'
        : targetStatus === 'Dipantau'
        ? 'Tugas pembinaan awal telah diselesaikan, kini memasuki masa pemantauan konsistensi sikap santri.'
        : 'Santri sedang aktif menjalani bimbingan dan pembinaan edukatif.';

    updatePelanggaranStatus(
      itemId,
      targetStatus,
      catatanPerubahanInput.trim() || defaultNote
    );

    setStatusEditingId(null);
    showToast(`✓ Status pembinaan ${siswaNama} diperbarui menjadi "${targetStatus}".`);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deletePelanggaran(deleteTarget.id);
    if (editingRecord?.id === deleteTarget.id) {
      handleCloseForm();
    }
    if (statusEditingId === deleteTarget.id) {
      setStatusEditingId(null);
    }
    showToast(`✓ Catatan pembinaan ${deleteTarget.nama} berhasil dihapus.`);
    setDeleteTarget(null);
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return pelanggaranList.filter((item) => {
      // Normalize legacy statuses
      let normalizedStatus = item.status;
      if (normalizedStatus === 'Sedang Berjalan') normalizedStatus = 'Dalam Pembinaan';
      if (normalizedStatus === 'Tuntas') normalizedStatus = 'Selesai';

      // Status Filter
      if (filterStatus !== 'Semua') {
        if (filterStatus === 'Dalam Pembinaan' && normalizedStatus !== 'Dalam Pembinaan') return false;
        if (filterStatus === 'Dipantau' && normalizedStatus !== 'Dipantau') return false;
        if (filterStatus === 'Selesai' && normalizedStatus !== 'Selesai') return false;
      }

      // Kamar Filter
      if (filterKamar !== 'Semua') {
        const s = getSiswa(item.siswaId);
        const k = getKamar(s?.kamarId);
        const itemKamar = item.kamar || k?.nama || '';
        if (!itemKamar.toLowerCase().includes(filterKamar.toLowerCase())) return false;
      }

      // Jenis Filter
      if (filterJenis !== 'Semua') {
        if ((item.jenisPelanggaran || '').toLowerCase() !== filterJenis.toLowerCase()) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const s = getSiswa(item.siswaId);
        const displayNama = (s?.nama || item.namaSiswa || '').toLowerCase();
        const matchNama = displayNama.includes(q);
        const matchNisn = s?.nisn.includes(q);
        const matchPelanggaran = item.pelanggaran.toLowerCase().includes(q);
        const matchKronologi = item.kronologi.toLowerCase().includes(q);
        const matchLokasi = (item.lokasi || '').toLowerCase().includes(q);
        const matchPetugas = (item.petugas || item.pembina || '').toLowerCase().includes(q);
        const matchSaksi = (item.saksi || '').toLowerCase().includes(q);
        const matchPembinaan = item.bentukPembinaan.toLowerCase().includes(q);

        return (
          matchNama ||
          matchNisn ||
          matchPelanggaran ||
          matchKronologi ||
          matchLokasi ||
          matchPetugas ||
          matchSaksi ||
          matchPembinaan
        );
      }

      return true;
    });
  }, [pelanggaranList, filterStatus, filterKamar, filterJenis, searchQuery, siswaList, kamarList]);

  // Statistics
  const stats = useMemo(() => {
    let dalamPembinaan = 0;
    let dipantau = 0;
    let selesai = 0;

    pelanggaranList.forEach((item) => {
      let st = item.status;
      if (st === 'Sedang Berjalan') st = 'Dalam Pembinaan';
      if (st === 'Tuntas') st = 'Selesai';

      if (st === 'Dalam Pembinaan') dalamPembinaan++;
      else if (st === 'Dipantau') dipantau++;
      else if (st === 'Selesai') selesai++;
    });

    return {
      total: pelanggaranList.length,
      dalamPembinaan,
      dipantau,
      selesai,
    };
  }, [pelanggaranList]);

  const isAddingMode = isFormOpen && !editingRecord;

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Neo-brutalist Header Banner */}
      <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-amber-600 inline-block"></span>
            <span className="text-[10px] font-mono-custom uppercase tracking-wider font-bold text-[#1a1c1a]/60">
              DISIPLIN POSITIF & RESTITUSI SANTRI
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-syne font-bold text-[#1a1c1a] tracking-tight">
            Pelanggaran & Pembinaan Edukatif
          </h1>
          <p className="text-xs text-[#1a1c1a]/70 font-sans mt-0.5 max-w-2xl">
            Pencatatan komprehensif disiplin santri tanpa kekerasan: memuat tanggal, jam, santri, kamar, lokasi, jenis pelanggaran, kronologi kejadian, bentuk pembinaan, saksi, petugas/wali asuh, serta alur status <strong>Dalam Pembinaan → Dipantau → Selesai</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => (isAddingMode ? handleCloseForm() : handleOpenAdd())}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006b54] hover:bg-[#005240] text-white font-bold text-xs sm:text-sm border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase shrink-0 cursor-pointer"
        >
          {isAddingMode ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isAddingMode ? 'Tutup Form' : 'Catat Pembinaan Baru'}</span>
        </button>
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

      {/* INLINE FORM CATATAN PEMBINAAN BARU / EDIT */}
      <div ref={formSectionRef}>
        {isFormOpen && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#006b54] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <span className="text-[10px] font-mono-custom font-bold uppercase tracking-wider text-[#006b54] block">
                  // FORMULIR DISIPLIN POSITIF & RESTITUSI SANTRI
                </span>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  {editingRecord ? 'Form Edit Catatan Pelanggaran & Pembinaan' : 'Form Catatan Pembinaan Baru'}
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Lengkapi waktu kejadian, identitas santri, kronologi, serta bentuk pembinaan edukatif ramah anak.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseForm}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form catatan pembinaan"
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

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs font-mono-custom">
              {/* Baris 1: Tanggal & Jam */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Tanggal Kejadian *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Jam Kejadian (WIB) *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.jam || ''}
                    onChange={(e) => setFormData({ ...formData, jam: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-mono-custom"
                  />
                </div>
              </div>

              {/* Baris 2: Nama Siswa & Kamar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Nama Santri *
                  </label>
                  {siswaList.length > 0 ? (
                    <select
                      value={formData.siswaId}
                      onChange={(e) => {
                        handleSiswaChange(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-sans font-semibold"
                    >
                      <option value="">-- Input Manual / Santri Belum Terdaftar --</option>
                      {siswaList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nama} ({s.kelas} · {getKamar(s.kamarId)?.nama || '-'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Ketik nama santri..."
                      value={formData.namaSiswa || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, namaSiswa: e.target.value });
                        if (formError) setFormError(null);
                      }}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-sans"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Kamar Asrama *
                  </label>
                  <input
                    type="text"
                    required
                    list="kamar-pelanggaran-suggestions"
                    placeholder="Contoh: Kamar Al-Ghazali"
                    value={formData.kamar || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, kamar: e.target.value });
                      if (formError) setFormError(null);
                    }}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-sans"
                  />
                  <datalist id="kamar-pelanggaran-suggestions">
                    {kamarList.map((k) => (
                      <option key={k.id} value={k.nama} />
                    ))}
                  </datalist>
                </div>
              </div>

              {siswaList.length > 0 && !formData.siswaId && (
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Nama Santri (Input Manual) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ketik nama lengkap santri..."
                    value={formData.namaSiswa || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, namaSiswa: e.target.value });
                      if (formError) setFormError(null);
                    }}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-sans"
                  />
                </div>
              )}

              {/* Baris 3: Lokasi Kejadian */}
              <div>
                <label className="block font-bold text-[#1a1c1a] mb-1">
                  Lokasi Kejadian *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Musholla Asrama, Ruang Makan, Koridor Lt 2..."
                  value={formData.lokasi || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, lokasi: e.target.value });
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-sans"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] text-[#1a1c1a]/55 self-center mr-1">Pilih cepat:</span>
                  {PRESET_LOKASI.map((lok) => (
                    <button
                      key={lok}
                      type="button"
                      onClick={() => setFormData({ ...formData, lokasi: lok })}
                      className={`px-2 py-0.5 text-[10px] border rounded-sm cursor-pointer transition-colors ${
                        formData.lokasi === lok
                          ? 'bg-[#006b54] text-white border-[#1a1c1a]'
                          : 'bg-[#1a1c1a]/5 hover:bg-[#1a1c1a]/10 border-[#1a1c1a]/20 text-[#1a1c1a]'
                      }`}
                    >
                      {lok}
                    </button>
                  ))}
                </div>
              </div>

              {/* Baris 4: Jenis Pelanggaran & Tingkat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Jenis Pelanggaran *
                  </label>
                  <select
                    value={formData.jenisPelanggaran || 'Kedisiplinan & Waktu'}
                    onChange={(e) => setFormData({ ...formData, jenisPelanggaran: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs"
                  >
                    {PRESET_JENIS.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Tingkat Pelanggaran
                  </label>
                  <select
                    value={formData.tingkat || 'Ringan'}
                    onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-bold"
                  >
                    <option value="Ringan">Ringan (Lupa letak barang, terlambat antre, baju berantakan)</option>
                    <option value="Sedang">Sedang (Bercanda berlebihan, berselisih sesama teman)</option>
                    <option value="Perlu Pendampingan">Perlu Pendampingan Khusus (Berulang kali diingatkan)</option>
                  </select>
                </div>
              </div>

              {/* Baris 5: Bentuk Pelanggaran */}
              <div>
                <label className="block font-bold text-[#1a1c1a] mb-1">
                  Bentuk Pelanggaran / Deskripsi Singkat *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Meletakkan sepatu di luar rak musholla sehingga berserakan"
                  value={formData.pelanggaran}
                  onChange={(e) => {
                    setFormData({ ...formData, pelanggaran: e.target.value });
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-sans"
                />
              </div>

              {/* Baris 6: Kronologi Kejadian */}
              <div>
                <label className="block font-bold text-[#1a1c1a] mb-1">
                  Kronologi Kejadian *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ceritakan urutan kejadian secara jelas dan faktual..."
                  value={formData.kronologi}
                  onChange={(e) => {
                    setFormData({ ...formData, kronologi: e.target.value });
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-sans"
                />
              </div>

              {/* Baris 7: Bentuk Pembinaan Edukatif */}
              <div>
                <label className="block font-bold text-[#1a1c1a] mb-1">
                  Bentuk Pembinaan Edukatif (Ramah Anak) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Merapikan rak sandal musholla selama 2 hari berturut-turut & membaca doa adab masjid..."
                  value={formData.bentukPembinaan}
                  onChange={(e) => {
                    setFormData({ ...formData, bentukPembinaan: e.target.value });
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-sans"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] text-[#1a1c1a]/55 self-center mr-1">
                    Rekomendasi Restitusi:
                  </span>
                  {PRESET_PEMBINAAN.map((pem, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, bentukPembinaan: pem })}
                      className="px-2 py-0.5 text-[10px] bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-sm truncate max-w-[260px] cursor-pointer"
                      title={pem}
                    >
                      {pem}
                    </button>
                  ))}
                </div>
              </div>

              {/* Baris 8: Saksi & Petugas / Wali Asuh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Saksi Kejadian
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Teman sekamar, guru piket, pengurus musholla..."
                    value={formData.saksi || ''}
                    onChange={(e) => setFormData({ ...formData, saksi: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-sans"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Petugas / Wali Asuh Penanggung Jawab *
                  </label>
                  <input
                    type="text"
                    required
                    list="petugas-pelanggaran-suggestions"
                    placeholder="Nama petugas / wali asuh..."
                    value={formData.petugas || formData.pembina || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        petugas: e.target.value,
                        pembina: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-sans font-semibold"
                  />
                  <datalist id="petugas-pelanggaran-suggestions">
                    {waliAsuhList.map((w) => (
                      <option key={w.id} value={formatWaliName(w)} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Baris 9: Status Awal & Catatan Evaluasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Status Alur Pembinaan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as StatusPelanggaran,
                      })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-bold"
                  >
                    <option value="Dalam Pembinaan">1. Dalam Pembinaan (Aktif menjalankan tugas restitusi)</option>
                    <option value="Dipantau">2. Dipantau (Observasi perubahan sikap pasca pembinaan)</option>
                    <option value="Selesai">3. Selesai (Tuntas & santri menunjukkan komitmen tertib)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Catatan Evaluasi Perubahan Sikap (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Catatan perkembangan karakter & respon santri..."
                    value={formData.catatanPerubahan || ''}
                    onChange={(e) => setFormData({ ...formData, catatanPerubahan: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] text-xs font-sans"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-[#1a1c1a]">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-[#1a1c1a] font-bold uppercase cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#006b54] hover:bg-[#005240] text-white font-bold border-[1.5px] border-[#1a1c1a] shadow-[2.5px_2.5px_0px_#1a1c1a] uppercase cursor-pointer"
                >
                  {editingRecord ? 'PERBARUI DATA' : 'SIMPAN PEMBINAAN'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-3.5">
          <span className="text-[10px] font-mono-custom text-[#1a1c1a]/60 font-bold uppercase block">
            TOTAL KASUS
          </span>
          <div className="text-2xl font-syne font-bold text-[#1a1c1a] mt-0.5">
            {stats.total}
          </div>
          <span className="text-[10px] text-[#1a1c1a]/60 font-sans">
            Catatan kedisiplinan santri
          </span>
        </div>

        <div className="bg-amber-50 border-[1.5px] border-[#1a1c1a] neo-shadow p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-custom text-amber-900 font-bold uppercase block">
              1. DALAM PEMBINAAN
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-syne font-bold text-amber-900 mt-0.5">
            {stats.dalamPembinaan}
          </div>
          <span className="text-[10px] text-amber-800/80 font-sans">
            Sedang proses bimbingan
          </span>
        </div>

        <div className="bg-sky-50 border-[1.5px] border-[#1a1c1a] neo-shadow p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-custom text-sky-900 font-bold uppercase block">
              2. DIPANTAU
            </span>
            <Eye className="w-3.5 h-3.5 text-sky-700" />
          </div>
          <div className="text-2xl font-syne font-bold text-sky-900 mt-0.5">
            {stats.dipantau}
          </div>
          <span className="text-[10px] text-sky-800/80 font-sans">
            Observasi konsistensi sikap
          </span>
        </div>

        <div className="bg-emerald-50 border-[1.5px] border-[#1a1c1a] neo-shadow p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-custom text-emerald-900 font-bold uppercase block">
              3. SELESAI
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-2xl font-syne font-bold text-emerald-900 mt-0.5">
            {stats.selesai}
          </div>
          <span className="text-[10px] text-emerald-800/80 font-sans">
            Tuntas & perilaku membaik
          </span>
        </div>
      </div>

      {/* Prinsip Restitusi Edukatif */}
      <div className="bg-stone-50 border-[1.5px] border-[#1a1c1a] p-3.5 flex items-start gap-3 text-xs">
        <Scale className="w-4 h-4 text-[#006b54] shrink-0 mt-0.5" />
        <div className="text-[#1a1c1a]/80">
          <strong className="text-[#1a1c1a]">Filosofi Pembinaan Asrama Sekolah Rakyat 1 Jepara:</strong>{' '}
          Setiap pelanggaran diselesaikan dengan <em>Restitusi Edukatif Ramah Anak</em> (merapikan fasilitas bersama, membaca kisah sirah nabawiyah, dan setoran doa adab), berfokus pada introspeksi dan pemulihan karakter santri bersama wali asuh.
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 sm:p-4 bg-[#1a1c1a]/[0.04] border-[1.5px] border-[#1a1c1a] rounded flex flex-wrap gap-2.5 items-center">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] rounded-sm focus:outline-none"
        >
          <option value="Semua">Semua Status</option>
          <option value="Dalam Pembinaan">Status: 1. Dalam Pembinaan</option>
          <option value="Dipantau">Status: 2. Dipantau</option>
          <option value="Selesai">Status: 3. Selesai</option>
        </select>

        <select
          value={filterKamar}
          onChange={(e) => setFilterKamar(e.target.value)}
          className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] rounded-sm focus:outline-none"
        >
          <option value="Semua">Semua Kamar</option>
          {kamarList.map((k) => (
            <option key={k.id} value={k.nama}>
              {k.nama}
            </option>
          ))}
        </select>

        <select
          value={filterJenis}
          onChange={(e) => setFilterJenis(e.target.value)}
          className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] rounded-sm focus:outline-none"
        >
          <option value="Semua">Semua Jenis Pelanggaran</option>
          {PRESET_JENIS.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1a1c1a]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari santri, pelanggaran, lokasi, saksi, petugas..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom text-[#1a1c1a] rounded-sm focus:outline-none"
          />
        </div>

        {(filterStatus !== 'Semua' || filterKamar !== 'Semua' || filterJenis !== 'Semua' || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setFilterStatus('Semua');
              setFilterKamar('Semua');
              setFilterJenis('Semua');
              setSearchQuery('');
            }}
            className="text-[11px] font-mono-custom font-bold text-rose-700 hover:underline px-2 cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {filteredList.map((item) => {
          const siswa = getSiswa(item.siswaId);
          const kamar = getKamar(siswa?.kamarId);
          const displayNama = siswa?.nama || item.namaSiswa || 'Santri Asrama';
          const displayKamar = item.kamar || kamar?.nama || 'Kamar -';
          const displayPetugas = item.petugas || item.pembina || '-';

          // Normalize status
          let currentStatus: StatusPelanggaran = item.status;
          if (currentStatus === 'Sedang Berjalan') currentStatus = 'Dalam Pembinaan';
          if (currentStatus === 'Tuntas') currentStatus = 'Selesai';

          const isConfirmingDelete = deleteTarget?.id === item.id;
          const isEditingStatus = statusEditingId === item.id;

          return (
            <div
              key={item.id}
              className={`bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-4 sm:p-5 transition-transform hover:-translate-y-0.5 space-y-4 ${
                currentStatus === 'Dalam Pembinaan'
                  ? 'border-l-4 border-l-amber-600'
                  : currentStatus === 'Dipantau'
                  ? 'border-l-4 border-l-sky-600'
                  : 'border-l-4 border-l-emerald-600'
              }`}
            >
              {/* Header Bar: Tanggal, Jam, Status Badge, Tingkat */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#1a1c1a]/15">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1c1a]/[0.04] border border-[#1a1c1a]/30 text-xs font-mono-custom font-bold text-[#1a1c1a]">
                    <Calendar className="w-3.5 h-3.5 text-[#006b54]" />
                    <span>{item.tanggal}</span>
                    {item.jam && (
                      <>
                        <span className="text-[#1a1c1a]/40">·</span>
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>{item.jam} WIB</span>
                      </>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 border border-[#1a1c1a]/30 text-[11px] font-mono-custom font-semibold text-[#1a1c1a]">
                    <Tag className="w-3 h-3 text-[#1a1c1a]/60" />
                    <span>{item.jenisPelanggaran || 'Indisipliner'}</span>
                  </span>

                  <span
                    className={`text-[10px] font-mono-custom font-bold px-2 py-0.5 border ${
                      item.tingkat === 'Ringan'
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : item.tingkat === 'Sedang'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-rose-100 text-rose-900 border-rose-300'
                    }`}
                  >
                    Tingkat: {item.tingkat || 'Ringan'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono-custom font-bold px-3 py-1 border-[1.5px] border-[#1a1c1a] shadow-[1.5px_1.5px_0px_#1a1c1a] uppercase ${
                      currentStatus === 'Dalam Pembinaan'
                        ? 'bg-amber-200 text-amber-950'
                        : currentStatus === 'Dipantau'
                        ? 'bg-sky-200 text-sky-950'
                        : 'bg-emerald-200 text-emerald-950'
                    }`}
                  >
                    {currentStatus === 'Dalam Pembinaan' && '⏳ Dalam Pembinaan'}
                    {currentStatus === 'Dipantau' && '👁️ Dipantau'}
                    {currentStatus === 'Selesai' && '✓ Selesai'}
                  </span>
                </div>
              </div>

              {/* Student & Violation Meta Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-4 flex items-start gap-3 bg-[#1a1c1a]/[0.02] p-3 border border-[#1a1c1a]/20">
                  <div className="w-12 h-14 bg-white border border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] flex items-center justify-center overflow-hidden shrink-0">
                    {siswa?.dokumen?.foto ? (
                      <img
                        src={siswa.dokumen.foto}
                        alt={displayNama}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-[#1a1c1a]/40" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-syne font-bold text-sm text-[#1a1c1a] leading-tight truncate">
                      {displayNama}
                    </h3>
                    <p className="text-[11px] font-mono-custom text-[#1a1c1a]/70 mt-0.5">
                      NISN: {siswa?.nisn || '-'} · {siswa?.kelas || 'Santri Asrama'}
                    </p>
                    <p className="text-[11px] text-[#1a1c1a]/80 font-sans mt-0.5">
                      <strong>Kamar:</strong> {displayKamar}
                    </p>
                    <p className="text-[11px] text-[#1a1c1a]/80 font-sans mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
                      <span className="truncate"><strong>Lokasi:</strong> {item.lokasi || 'Area Asrama'}</span>
                    </p>
                  </div>
                </div>

                <div className="md:col-span-8 space-y-2.5">
                  <div className="bg-white border border-[#1a1c1a] p-3">
                    <span className="font-mono-custom text-[10px] text-[#1a1c1a]/60 uppercase tracking-wider font-bold block mb-1">
                      // BENTUK PELANGGARAN & KRONOLOGI KEJADIAN
                    </span>
                    <p className="text-xs font-bold text-[#1a1c1a] leading-snug">
                      {item.pelanggaran}
                    </p>
                    {item.kronologi && (
                      <p className="text-[11px] text-[#1a1c1a]/80 font-sans mt-1.5 bg-[#1a1c1a]/[0.02] p-2 border-l-2 border-amber-600 italic leading-relaxed">
                        "{item.kronologi}"
                      </p>
                    )}
                  </div>

                  <div className="bg-amber-50/70 border border-[#1a1c1a] p-3">
                    <span className="font-mono-custom text-[10px] text-amber-900 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      // BENTUK PEMBINAAN EDUKATIF RAMAH ANAK
                    </span>
                    <p className="text-xs text-stone-900 font-medium leading-relaxed">
                      {item.bentukPembinaan}
                    </p>
                  </div>

                  {item.catatanPerubahan && (
                    <div className="bg-emerald-50/80 border border-emerald-300 p-2.5 text-xs text-emerald-950 font-sans">
                      <strong className="font-mono-custom text-[10px] uppercase block text-emerald-800 mb-0.5">
                        // CATATAN EVALUASI & PERUBAHAN PERILAKU:
                      </strong>
                      {item.catatanPerubahan}
                    </div>
                  )}
                </div>
              </div>

              {/* Saksi & Petugas / Wali Asuh Strip */}
              <div className="p-2.5 bg-[#1a1c1a]/[0.03] border border-[#1a1c1a]/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono-custom">
                <div className="flex items-center gap-1.5 text-[#1a1c1a]/80 truncate">
                  <Users className="w-3.5 h-3.5 text-[#006b54] shrink-0" />
                  <span>Saksi:</span>
                  <strong className="text-[#1a1c1a] truncate">{item.saksi || 'Wali Asuh Pendamping'}</strong>
                </div>
                <div className="flex items-center gap-1.5 text-[#1a1c1a]/80 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                  <span>Petugas / Wali Asuh:</span>
                  <strong className="text-[#1a1c1a] truncate">{displayPetugas}</strong>
                </div>
              </div>

              {/* Lifecycle Progress Bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[10px] font-mono-custom text-[#1a1c1a]/60 uppercase font-bold mb-1.5">
                  <span>Alur Status Pembinaan:</span>
                  <span className="text-[#1a1c1a]">
                    Tahap: {currentStatus === 'Dalam Pembinaan' ? '1/3' : currentStatus === 'Dipantau' ? '2/3' : '3/3'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <div
                    className={`py-1.5 px-2 text-center text-[10px] font-mono-custom font-bold border ${
                      currentStatus === 'Dalam Pembinaan'
                        ? 'bg-amber-500 text-white border-amber-700 shadow-xs'
                        : 'bg-stone-100 text-stone-600 border-stone-300'
                    }`}
                  >
                    1. Dalam Pembinaan
                  </div>
                  <div
                    className={`py-1.5 px-2 text-center text-[10px] font-mono-custom font-bold border ${
                      currentStatus === 'Dipantau'
                        ? 'bg-sky-600 text-white border-sky-800 shadow-xs'
                        : currentStatus === 'Selesai'
                        ? 'bg-stone-200 text-stone-700 border-stone-300'
                        : 'bg-stone-100 text-stone-400 border-stone-200'
                    }`}
                  >
                    2. Dipantau
                  </div>
                  <div
                    className={`py-1.5 px-2 text-center text-[10px] font-mono-custom font-bold border ${
                      currentStatus === 'Selesai'
                        ? 'bg-emerald-600 text-white border-emerald-800 shadow-xs'
                        : 'bg-stone-100 text-stone-400 border-stone-200'
                    }`}
                  >
                    3. Selesai
                  </div>
                </div>
              </div>

              {/* Inline Status Update Form inside Card */}
              {isEditingStatus && (
                <form
                  onSubmit={(e) => handleConfirmStatusChange(e, item.id, displayNama)}
                  className="p-3.5 bg-sky-50/70 border-[1.5px] border-[#1a1c1a] space-y-3 text-xs font-mono-custom"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#1a1c1a] uppercase">
                      // Perbarui Status Pembinaan: {displayNama}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStatusEditingId(null)}
                      className="text-[11px] font-bold text-[#1a1c1a]/70 hover:text-rose-700 cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#1a1c1a] mb-1">
                        Pilih Status Baru
                      </label>
                      <select
                        value={targetStatus}
                        onChange={(e) => setTargetStatus(e.target.value as StatusPelanggaran)}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-bold"
                      >
                        <option value="Dalam Pembinaan">1. Dalam Pembinaan (Aktif dibina)</option>
                        <option value="Dipantau">2. Dipantau (Masa pemantauan)</option>
                        <option value="Selesai">3. Selesai (Tuntas & perilaku membaik)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#1a1c1a] mb-1">
                        Catatan Perubahan Perilaku Santri *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Tuliskan evaluasi sikap dan respon santri..."
                        value={catatanPerubahanInput}
                        onChange={(e) => setCatatanPerubahanInput(e.target.value)}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusEditingId(null)}
                      className="px-3 py-1.5 border border-[#1a1c1a] bg-white text-[#1a1c1a] font-bold uppercase cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#006b54] hover:bg-[#005240] text-white font-bold border border-[#1a1c1a] shadow-[1.5px_1.5px_0px_#1a1c1a] uppercase cursor-pointer"
                    >
                      Simpan Status
                    </button>
                  </div>
                </form>
              )}

              {/* Inline Delete Confirmation Banner inside Card */}
              {isConfirmingDelete && (
                <div className="p-3 bg-rose-50 border-[1.5px] border-rose-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono-custom">
                  <div>
                    <p className="font-bold text-rose-900">
                      Hapus catatan pembinaan untuk {displayNama}?
                    </p>
                    <p className="text-[11px] text-rose-800/80 font-sans">
                      Tindakan ini tidak dapat dibatalkan.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(null)}
                      className="px-3 py-1.5 border border-[#1a1c1a] bg-white text-[#1a1c1a] font-bold uppercase cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold border border-[#1a1c1a] uppercase cursor-pointer"
                    >
                      Ya, Hapus
                    </button>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-2 border-t border-[#1a1c1a]/15 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {currentStatus === 'Dalam Pembinaan' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenInlineStatus(item, 'Dipantau')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-950 font-bold text-xs border border-sky-400 shadow-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-800" />
                        <span>Lanjut ke "Dipantau"</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenInlineStatus(item, 'Selesai')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold text-xs border border-emerald-400 shadow-xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Tandai "Selesai"</span>
                      </button>
                    </>
                  )}

                  {currentStatus === 'Dipantau' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenInlineStatus(item, 'Selesai')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold text-xs border border-emerald-400 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Selesaikan Pembinaan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenInlineStatus(item, 'Dalam Pembinaan')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs border border-stone-300 transition-colors cursor-pointer"
                        title="Kembalikan ke status Dalam Pembinaan"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Kembali ke Pembinaan</span>
                      </button>
                    </>
                  )}

                  {currentStatus === 'Selesai' && (
                    <button
                      type="button"
                      onClick={() => handleOpenInlineStatus(item, 'Dipantau')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs border border-stone-300 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Buka Pemantauan Ulang</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-100 text-[#1a1c1a] font-bold text-xs border border-[#1a1c1a] shadow-[1.5px_1.5px_0px_#1a1c1a] transition-all cursor-pointer"
                    title="Edit Data Lengkap"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget({ id: item.id, nama: displayNama });
                      setStatusEditingId(null);
                    }}
                    className="p-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-[#1a1c1a] shadow-[1.5px_1.5px_0px_#1a1c1a] transition-all cursor-pointer"
                    title="Hapus Catatan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredList.length === 0 && (
        <div className="p-8 text-center bg-white border-[1.5px] border-[#1a1c1a] neo-shadow space-y-3">
          <p className="font-mono-custom text-xs text-[#1a1c1a]/60 uppercase">
            {pelanggaranList.length === 0
              ? 'Belum ada catatan pelanggaran & pembinaan yang tersimpan.'
              : 'Tidak ada catatan pelanggaran & pembinaan yang cocok dengan filter / pencarian.'}
          </p>
          {pelanggaranList.length === 0 && !isFormOpen && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] hover:bg-[#005240] text-white font-bold text-xs border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] uppercase cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Pembinaan Baru</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
