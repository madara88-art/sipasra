import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle2,
  Plus,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Filter,
  Sparkles,
  Search,
  Check,
  LayoutGrid,
  Table as TableIcon,
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
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedKegiatanForPresensi, setSelectedKegiatanForPresensi] =
    useState<KegiatanHarianItem | null>(null);

  const [isAddKegiatanOpen, setIsAddKegiatanOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'tabel' | 'kartu'>('tabel');
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [fokusFilter, setFokusFilter] = useState('Semua');

  // New activity form
  const [newKegiatan, setNewKegiatan] = useState<Omit<KegiatanHarianItem, 'id'>>({
    waktuMulai: '16:00',
    waktuSelesai: '17:00',
    namaKegiatan: '',
    fokusPengasuhan: '',
    kategori: 'Pendidikan',
    penanggungJawab: 'Wali Asuh Piket',
    tempat: 'Aula Asrama',
    deskripsi: '',
  });

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

  const handleSaveKegiatan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKegiatan.namaKegiatan) return;
    addKegiatanHarian(newKegiatan);
    setIsAddKegiatanOpen(false);
    setNewKegiatan({
      waktuMulai: '16:00',
      waktuSelesai: '17:00',
      namaKegiatan: '',
      fokusPengasuhan: '',
      kategori: 'Pendidikan',
      penanggungJawab: 'Wali Asuh Piket',
      tempat: 'Aula Asrama',
      deskripsi: '',
    });
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

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Section Header matching Variation 2 */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b-[1.5px] border-[#1a1c1a] pb-4">
        <div>
          <span className="status-badge mb-2">
            20 RANGKAIAN JADWAL RUTIN RESMI
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
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-[#fdfcf9] text-[#1a1c1a] border-[1.5px] border-[#1a1c1a] font-bold shadow-[2px_2px_0px_#1a1c1a] transition-all uppercase tracking-wider active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            title="Download jadwal kegiatan ke Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#006b54]" />
            <span>Export Excel</span>
          </button>

          {/* Tambah Jadwal */}
          <button
            type="button"
            onClick={() => setIsAddKegiatanOpen(true)}
            className="neo-btn-primary flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>TAMBAH JADWAL</span>
          </button>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="p-3 sm:p-4 bg-[#1a1c1a]/[0.05] border-[1.5px] border-[#1a1c1a] rounded flex flex-wrap gap-2.5 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Tabs */}
          <div className="inline-flex border-[1.5px] border-[#1a1c1a] bg-white">
            <button
              type="button"
              onClick={() => setViewMode('tabel')}
              className={`px-3 py-1.5 font-mono-custom text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 font-mono-custom text-xs font-bold uppercase transition-colors border-l-[1.5px] border-[#1a1c1a] flex items-center gap-1.5 ${
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

      {/* VIEW 1: TABEL RESMI & FOKUS PENGASUHAN (Exact table format requested by user) */}
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
                  <th className="p-3 text-right w-44">AKSI & PRESENSI</th>
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

                      {/* Presensi Action */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] hidden sm:inline-block">
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
                            className="neo-btn-outline text-[11px] py-1 px-2.5 flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#006b54]" />
                            <span>Presensi</span>
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
                        🎯 Fokus: {item.fokusPengasuhan}
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

                <div className="pt-2 border-t border-[#1a1c1a]/15 flex items-center justify-between font-mono-custom text-xs">
                  <div>
                    {isChecked ? (
                      <span className="text-[#006b54] font-bold">
                        ✓ Presensi: {hadirCount}/{siswaList.length} Santri
                      </span>
                    ) : (
                      <span className="text-[#1a1c1a]/50">Belum dipresensi</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenPresensi(item)}
                    className="neo-btn-primary py-1 px-3 text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Presensi</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
                  className="px-2 py-1 bg-[#006b54] text-white font-bold text-[10px] uppercase border border-[#1a1c1a]"
                >
                  ✓ Hadirkan Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatus('Izin')}
                  className="px-2 py-1 bg-amber-600 text-white font-bold text-[10px] uppercase border border-[#1a1c1a]"
                >
                  Semua Izin
                </button>
              </div>
            </div>

            {/* List of 75 Students */}
            <div className="divide-y divide-[#1a1c1a]/20 border-[1.5px] border-[#1a1c1a] max-h-96 overflow-y-auto bg-white">
              {siswaList.map((siswa, idx) => {
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
                            className={`px-2 py-1 text-[10px] font-bold border transition-all ${
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
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1a1c1a]">
              <button
                type="button"
                onClick={() => setSelectedKegiatanForPresensi(null)}
                className="neo-btn-primary py-2 px-5 text-xs"
              >
                SELESAI & SIMPAN PRESENSI
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tambah Jadwal Kegiatan */}
      <Modal
        isOpen={isAddKegiatanOpen}
        onClose={() => setIsAddKegiatanOpen(false)}
        title="TAMBAH JADWAL KEGIATAN ASRAMA"
        subtitle="Sekolah Rakyat 1 Jepara"
        maxWidth="md"
      >
        <form onSubmit={handleSaveKegiatan} className="space-y-3 font-mono-custom text-xs">
          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">Nama Kegiatan *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Senam Pagi Ceria & Jalan Santai"
              value={newKegiatan.namaKegiatan}
              onChange={(e) =>
                setNewKegiatan({ ...newKegiatan, namaKegiatan: e.target.value })
              }
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white font-sans text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">Fokus Pengasuhan</label>
            <input
              type="text"
              placeholder="Contoh: Kemandirian, kebersihan diri, etika makan, ibadah..."
              value={newKegiatan.fokusPengasuhan || ''}
              onChange={(e) =>
                setNewKegiatan({ ...newKegiatan, fokusPengasuhan: e.target.value })
              }
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white font-sans text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">Waktu Mulai</label>
              <input
                type="time"
                value={newKegiatan.waktuMulai}
                onChange={(e) =>
                  setNewKegiatan({ ...newKegiatan, waktuMulai: e.target.value })
                }
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">Waktu Selesai</label>
              <input
                type="time"
                value={newKegiatan.waktuSelesai}
                onChange={(e) =>
                  setNewKegiatan({ ...newKegiatan, waktuSelesai: e.target.value })
                }
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">Kategori</label>
              <select
                value={newKegiatan.kategori}
                onChange={(e) =>
                  setNewKegiatan({
                    ...newKegiatan,
                    kategori: e.target.value as KegiatanHarianItem['kategori'],
                  })
                }
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
              >
                <option value="Ibadah">Ibadah</option>
                <option value="Kebersihan">Kebersihan</option>
                <option value="Pendidikan">Pendidikan</option>
                <option value="Sosial">Sosial</option>
                <option value="Istirahat">Istirahat</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">Tempat</label>
              <input
                type="text"
                placeholder="Contoh: Lapangan Asrama"
                value={newKegiatan.tempat}
                onChange={(e) =>
                  setNewKegiatan({ ...newKegiatan, tempat: e.target.value })
                }
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">Penanggung Jawab</label>
            <input
              type="text"
              placeholder="Contoh: Ust. M. Ridwan Anshori, S.Pd"
              value={newKegiatan.penanggungJawab}
              onChange={(e) =>
                setNewKegiatan({ ...newKegiatan, penanggungJawab: e.target.value })
              }
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">Deskripsi Kegiatan</label>
            <textarea
              rows={2}
              placeholder="Jelaskan rincian dan tata tertib kegiatan..."
              value={newKegiatan.deskripsi}
              onChange={(e) =>
                setNewKegiatan({ ...newKegiatan, deskripsi: e.target.value })
              }
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1a1c1a]">
            <button
              type="button"
              onClick={() => setIsAddKegiatanOpen(false)}
              className="neo-btn-outline"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="neo-btn-primary"
            >
              SIMPAN JADWAL
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
