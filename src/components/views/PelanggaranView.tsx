import React, { useState, useMemo } from 'react';
import {
  Scale,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  AlertTriangle,
  User,
  MapPin,
  Eye,
  ArrowRight,
  RotateCcw,
  Search,
  Filter,
  Trash2,
  Edit3,
  Users,
  ShieldCheck,
  FileText,
  Tag,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PelanggaranPembinaan, StatusPelanggaran } from '../../types';
import { Modal } from '../common/Modal';

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

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PelanggaranPembinaan | null>(null);

  // Status Transition Modal
  const [statusModalRecord, setStatusModalRecord] = useState<PelanggaranPembinaan | null>(null);
  const [targetStatus, setTargetStatus] = useState<StatusPelanggaran>('Dipantau');
  const [catatanPerubahanInput, setCatatanPerubahanInput] = useState<string>('');

  // Delete Confirmation Modal
  const [deletingRecord, setDeletingRecord] = useState<PelanggaranPembinaan | null>(null);

  // Initial Form Data
  const getInitialForm = (): Omit<PelanggaranPembinaan, 'id'> => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
    const today = now.toISOString().split('T')[0];
    const defaultSiswa = siswaList[0];
    const defaultKamar = getKamar(defaultSiswa?.kamarId)?.nama || 'Kamar Al-Ghazali';
    const defaultWali = getWaliAsuh(defaultSiswa?.waliAsuhId);
    const defaultWaliName = defaultWali ? `${defaultWali.nama}, ${defaultWali.gelar}` : 'Ust. Farid, S.Pd';

    return {
      tanggal: today,
      jam: currentTime,
      siswaId: defaultSiswa?.id || '',
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

  const [formData, setFormData] = useState<Omit<PelanggaranPembinaan, 'id'>>(getInitialForm());

  // Handle student selection change in form -> auto populate kamar & petugas
  const handleSiswaChange = (siswaId: string) => {
    const s = getSiswa(siswaId);
    const k = getKamar(s?.kamarId);
    const w = getWaliAsuh(s?.waliAsuhId);
    const waliName = w ? `${w.nama}, ${w.gelar}` : formData.petugas || formData.pembina || 'Wali Asuh';

    setFormData((prev) => ({
      ...prev,
      siswaId,
      kamar: k ? k.nama : prev.kamar,
      petugas: waliName,
      pembina: waliName,
    }));
  };

  const handleOpenAdd = () => {
    setFormData(getInitialForm());
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: PelanggaranPembinaan) => {
    setEditingRecord(item);
    setFormData({
      tanggal: item.tanggal,
      jam: item.jam || '14:00',
      siswaId: item.siswaId,
      kamar: item.kamar || getKamar(getSiswa(item.siswaId)?.kamarId)?.nama || '',
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
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pelanggaran.trim() || !formData.bentukPembinaan.trim()) return;

    addPelanggaran({
      ...formData,
      pembina: formData.petugas || formData.pembina,
    });
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (!formData.pelanggaran.trim() || !formData.bentukPembinaan.trim()) return;

    updatePelanggaran(editingRecord.id, {
      ...formData,
      pembina: formData.petugas || formData.pembina,
    });
    setIsEditModalOpen(false);
    setEditingRecord(null);
  };

  const handleOpenStatusModal = (item: PelanggaranPembinaan, nextStatus: StatusPelanggaran) => {
    setStatusModalRecord(item);
    setTargetStatus(nextStatus);
    setCatatanPerubahanInput(item.catatanPerubahan || '');
  };

  const handleConfirmStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalRecord) return;

    updatePelanggaranStatus(
      statusModalRecord.id,
      targetStatus,
      catatanPerubahanInput ||
        (targetStatus === 'Selesai'
          ? 'Santri telah menuntaskan tugas pembinaan edukatif dengan baik dan menunjukkan perubahan perilaku positif.'
          : targetStatus === 'Dipantau'
          ? 'Tugas pembinaan awal telah diselesaikan, kini memasuki masa pemantauan konsistensi sikap santri.'
          : 'Santri sedang aktif menjalani bimbingan dan pembinaan edukatif.')
    );

    setStatusModalRecord(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    deletePelanggaran(deletingRecord.id);
    setDeletingRecord(null);
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
        const matchNama = s?.nama.toLowerCase().includes(q);
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
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006b54] hover:bg-[#005240] text-white font-bold text-xs sm:text-sm border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Pembinaan Baru</span>
        </button>
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
        {/* Status Filter */}
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

        {/* Kamar Filter */}
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

        {/* Jenis Filter */}
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

        {/* Search Input */}
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
            className="text-[11px] font-mono-custom font-bold text-rose-700 hover:underline px-2"
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
          const displayKamar = item.kamar || kamar?.nama || 'Kamar -';
          const displayPetugas = item.petugas || item.pembina || '-';

          // Normalize status
          let currentStatus: StatusPelanggaran = item.status;
          if (currentStatus === 'Sedang Berjalan') currentStatus = 'Dalam Pembinaan';
          if (currentStatus === 'Tuntas') currentStatus = 'Selesai';

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
                  {/* Tanggal & Jam */}
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

                  {/* Jenis Pelanggaran Tag */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 border border-[#1a1c1a]/30 text-[11px] font-mono-custom font-semibold text-[#1a1c1a]">
                    <Tag className="w-3 h-3 text-[#1a1c1a]/60" />
                    <span>{item.jenisPelanggaran || 'Indisipliner'}</span>
                  </span>

                  {/* Tingkat Pelanggaran */}
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

                {/* Status Badge */}
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
                {/* Santri Info with Avatar (Columns 1-4) */}
                <div className="md:col-span-4 flex items-start gap-3 bg-[#1a1c1a]/[0.02] p-3 border border-[#1a1c1a]/20">
                  <div className="w-12 h-14 bg-white border border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] flex items-center justify-center overflow-hidden shrink-0">
                    {siswa?.dokumen?.foto ? (
                      <img
                        src={siswa.dokumen.foto}
                        alt={siswa.nama}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-[#1a1c1a]/40" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-syne font-bold text-sm text-[#1a1c1a] leading-tight truncate">
                      {siswa?.nama || 'Nama Santri Tidak Ditemukan'}
                    </h3>
                    <p className="text-[11px] font-mono-custom text-[#1a1c1a]/70 mt-0.5">
                      NISN: {siswa?.nisn || '-'} · {siswa?.kelas || '-'}
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

                {/* Pelanggaran, Kronologi, & Pembinaan (Columns 5-12) */}
                <div className="md:col-span-8 space-y-2.5">
                  {/* Pelanggaran & Kronologi */}
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

                  {/* Bentuk Pembinaan Edukatif */}
                  <div className="bg-amber-50/70 border border-[#1a1c1a] p-3">
                    <span className="font-mono-custom text-[10px] text-amber-900 uppercase tracking-wider font-bold block mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      // BENTUK PEMBINAAN EDUKATIF RAMAH ANAK
                    </span>
                    <p className="text-xs text-stone-900 font-medium leading-relaxed">
                      {item.bentukPembinaan}
                    </p>
                  </div>

                  {/* Catatan Perubahan Perilaku (jika ada) */}
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

              {/* Lifecycle Progress Bar: Dalam Pembinaan → Dipantau → Selesai */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[10px] font-mono-custom text-[#1a1c1a]/60 uppercase font-bold mb-1.5">
                  <span>Alur Status Pembinaan:</span>
                  <span className="text-[#1a1c1a]">
                    Tahap: {currentStatus === 'Dalam Pembinaan' ? '1/3' : currentStatus === 'Dipantau' ? '2/3' : '3/3'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {/* Step 1: Dalam Pembinaan */}
                  <div
                    className={`py-1.5 px-2 text-center text-[10px] font-mono-custom font-bold border ${
                      currentStatus === 'Dalam Pembinaan'
                        ? 'bg-amber-500 text-white border-amber-700 shadow-xs'
                        : 'bg-stone-100 text-stone-600 border-stone-300'
                    }`}
                  >
                    1. Dalam Pembinaan
                  </div>

                  {/* Step 2: Dipantau */}
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

                  {/* Step 3: Selesai */}
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

              {/* Action Bar */}
              <div className="pt-2 border-t border-[#1a1c1a]/15 flex flex-wrap items-center justify-between gap-2">
                {/* Quick Status Progression Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {currentStatus === 'Dalam Pembinaan' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(item, 'Dipantau')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-950 font-bold text-xs border border-sky-400 shadow-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-800" />
                        <span>Lanjut ke "Dipantau"</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(item, 'Selesai')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold text-xs border border-emerald-400 shadow-xs transition-colors"
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
                        onClick={() => handleOpenStatusModal(item, 'Selesai')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold text-xs border border-emerald-400 shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Selesaikan Pembinaan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(item, 'Dalam Pembinaan')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs border border-stone-300 transition-colors"
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
                      onClick={() => handleOpenStatusModal(item, 'Dipantau')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs border border-stone-300 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Buka Pemantauan Ulang</span>
                    </button>
                  )}
                </div>

                {/* Edit & Delete Buttons */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-100 text-[#1a1c1a] font-bold text-xs border border-[#1a1c1a] shadow-[1.5px_1.5px_0px_#1a1c1a] transition-all"
                    title="Edit Data Lengkap"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingRecord(item)}
                    className="p-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-[#1a1c1a] shadow-[1.5px_1.5px_0px_#1a1c1a] transition-all"
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
        <div className="p-8 text-center bg-white border-[1.5px] border-[#1a1c1a] neo-shadow">
          <p className="font-mono-custom text-xs text-[#1a1c1a]/60 uppercase">
            Tidak ada catatan pelanggaran & pembinaan yang cocok dengan filter / pencarian.
          </p>
        </div>
      )}

      {/* MODAL TAMBAH & EDIT (LENGKAP 11 FIELD) */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setEditingRecord(null);
        }}
        title={isAddModalOpen ? 'Catat Pelanggaran & Pembinaan Baru' : 'Edit Catatan Pelanggaran & Pembinaan'}
        subtitle="FORMULIR DISIPLIN POSITIF & RESTITUSI SANTRI"
        maxWidth="2xl"
      >
        <form
          onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit}
          className="space-y-4 text-xs font-mono-custom"
        >
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
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
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
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-mono-custom"
              />
            </div>
          </div>

          {/* Baris 2: Nama Siswa & Kamar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">
                Nama Siswa *
              </label>
              <select
                required
                value={formData.siswaId}
                onChange={(e) => handleSiswaChange(e.target.value)}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans font-semibold"
              >
                {siswaList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kelas} · {getKamar(s.kamarId)?.nama || '-'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">
                Kamar Asrama *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Kamar Uranus (Gedung A)"
                value={formData.kamar || ''}
                onChange={(e) => setFormData({ ...formData, kamar: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
              />
            </div>
          </div>

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
              onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
            />
            {/* Quick preset locations */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="text-[10px] text-[#1a1c1a]/50 self-center mr-1">Pilih cepat:</span>
              {PRESET_LOKASI.map((lok) => (
                <button
                  key={lok}
                  type="button"
                  onClick={() => setFormData({ ...formData, lokasi: lok })}
                  className="px-2 py-0.5 text-[9.5px] bg-[#1a1c1a]/5 hover:bg-[#1a1c1a]/10 border border-[#1a1c1a]/20 rounded-sm"
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
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
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
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-bold"
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
              onChange={(e) => setFormData({ ...formData, pelanggaran: e.target.value })}
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
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
              onChange={(e) => setFormData({ ...formData, kronologi: e.target.value })}
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans"
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
              onChange={(e) => setFormData({ ...formData, bentukPembinaan: e.target.value })}
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans"
            />
            {/* Quick preset pembinaan */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="text-[10px] text-[#1a1c1a]/50 self-center mr-1">Rekomendasi Restitusi:</span>
              {PRESET_PEMBINAAN.slice(0, 3).map((pem, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFormData({ ...formData, bentukPembinaan: pem })}
                  className="px-2 py-0.5 text-[9.5px] bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-sm truncate max-w-[260px]"
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
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">
                Petugas / Wali Asuh Penanggung Jawab *
              </label>
              <select
                value={formData.petugas || formData.pembina}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    petugas: e.target.value,
                    pembina: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-semibold"
              >
                {waliAsuhList.map((w) => (
                  <option key={w.id} value={`${w.nama}, ${w.gelar}`}>
                    {w.nama}, {w.gelar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 9: Status Awal */}
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
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-bold"
            >
              <option value="Dalam Pembinaan">1. Dalam Pembinaan (Aktif menjalankan tugas restitusi)</option>
              <option value="Dipantau">2. Dipantau (Observasi perubahan sikap pasca pembinaan)</option>
              <option value="Selesai">3. Selesai (Tuntas & santri menunjukkan komitmen tertib)</option>
            </select>
          </div>

          {/* Catatan Evaluasi Sikap (Opsional) */}
          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">
              Catatan Evaluasi Perubahan Sikap (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Catatan perkembangan karakter dan respon santri selama dibina..."
              value={formData.catatanPerubahan || ''}
              onChange={(e) => setFormData({ ...formData, catatanPerubahan: e.target.value })}
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1a1c1a]">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingRecord(null);
              }}
              className="neo-btn-outline"
            >
              BATAL
            </button>
            <button type="submit" className="neo-btn-primary">
              {isAddModalOpen ? 'SIMPAN PEMBINAAN' : 'PERBARUI DATA'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL TRANSISI STATUS & EVALUASI */}
      <Modal
        isOpen={!!statusModalRecord}
        onClose={() => setStatusModalRecord(null)}
        title={`Perbarui Status: ${targetStatus}`}
        subtitle={getSiswa(statusModalRecord?.siswaId)?.nama || 'Santri Asrama'}
        maxWidth="md"
      >
        {statusModalRecord && (
          <form onSubmit={handleConfirmStatusChange} className="space-y-4 text-xs font-mono-custom">
            <div className="bg-[#1a1c1a]/[0.03] p-3 border border-[#1a1c1a] space-y-1">
              <span className="font-bold text-[#1a1c1a] block">
                Pelanggaran: {statusModalRecord.pelanggaran}
              </span>
              <span className="text-[#1a1c1a]/70 block font-sans text-[11px]">
                Pembinaan: {statusModalRecord.bentukPembinaan}
              </span>
            </div>

            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">
                Pilih Status Baru:
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
              <textarea
                rows={3}
                required
                placeholder="Tuliskan evaluasi sikap, komitmen perbaikan, dan respon santri terhadap pembinaan..."
                value={catatanPerubahanInput}
                onChange={(e) => setCatatanPerubahanInput(e.target.value)}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1a1c1a]">
              <button
                type="button"
                onClick={() => setStatusModalRecord(null)}
                className="neo-btn-outline"
              >
                BATAL
              </button>
              <button type="submit" className="neo-btn-primary">
                SIMPAN PERUBAHAN STATUS
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL KONFIRMASI HAPUS */}
      <Modal
        isOpen={!!deletingRecord}
        onClose={() => setDeletingRecord(null)}
        title="Hapus Catatan Pembinaan"
        subtitle="KONFIRMASI PENGHAPUSAN"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs font-mono-custom">
          <p className="text-stone-700 font-sans leading-relaxed">
            Apakah Anda yakin ingin menghapus catatan pelanggaran & pembinaan untuk santri{' '}
            <strong>{getSiswa(deletingRecord?.siswaId)?.nama}</strong>?
          </p>
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-900 text-[11px]">
            Tindakan ini tidak dapat dibatalkan.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1a1c1a]">
            <button
              type="button"
              onClick={() => setDeletingRecord(null)}
              className="neo-btn-outline"
            >
              BATAL
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a]"
            >
              HAPUS CATATAN
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
