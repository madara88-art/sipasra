import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Plus,
  Phone,
  Trash2,
  Calendar,
  AlertCircle,
  FileText,
  Upload,
  Download,
  FileSpreadsheet,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Camera,
  CreditCard,
  FileCheck,
  User,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Siswa, DokumenSiswa } from '../../types';
import { Modal } from '../common/Modal';
import { ImportSiswaModal } from './ImportSiswaModal';
import { DokumenSiswaModal } from './DokumenSiswaModal';
import {
  exportSiswaToExcel,
  exportSiswaToCsv,
  generateSiswaTemplateExcel,
} from '../../utils/excelUtils';

export const DataSiswaView: React.FC = () => {
  const {
    siswaList,
    kamarList,
    waliAsuhList,
    addSiswa,
    updateSiswa,
    deleteSiswa,
    getKamar,
    getWaliAsuh,
    kesehatanList,
    ibadahList,
    konselingList,
    pelanggaranList,
    perkembanganList,
    searchQuery: globalSearch,
  } = useApp();

  const [localSearch, setLocalSearch] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<string>('Semua');
  const [selectedKamarFilter, setSelectedKamarFilter] = useState<string>('Semua');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Semua');
  const [selectedDokumenFilter, setSelectedDokumenFilter] = useState<string>('Semua');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDokumenModalOpen, setIsDokumenModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [selectedDokumenSiswa, setSelectedDokumenSiswa] = useState<Siswa | null>(null);

  const exportMenuRef = useRef<HTMLDivElement>(null);
  const addFotoInputRef = useRef<HTMLInputElement>(null);
  const editFotoInputRef = useRef<HTMLInputElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleExportAll = () => {
    setShowExportMenu(false);
    exportSiswaToExcel(siswaList, kamarList, waliAsuhList);
    showToast(`✓ Berhasil mengekspor seluruh ${siswaList.length} santri ke file Excel (.xlsx).`);
  };

  const handleExportFiltered = () => {
    setShowExportMenu(false);
    const dateStr = new Date().toISOString().split('T')[0];
    exportSiswaToExcel(
      filteredSiswa,
      kamarList,
      waliAsuhList,
      `Data_Siswa_Terfilter_${filteredSiswa.length}_Santri_${dateStr}.xlsx`
    );
    showToast(`✓ Berhasil mengekspor ${filteredSiswa.length} santri terfilter ke Excel (.xlsx).`);
  };

  const handleExportAllCsv = () => {
    setShowExportMenu(false);
    exportSiswaToCsv(siswaList, kamarList, waliAsuhList);
    showToast(`✓ Berhasil mengekspor seluruh ${siswaList.length} santri ke file CSV.`);
  };

  const handleExportFilteredCsv = () => {
    setShowExportMenu(false);
    const dateStr = new Date().toISOString().split('T')[0];
    exportSiswaToCsv(
      filteredSiswa,
      kamarList,
      waliAsuhList,
      `Data_Siswa_Terfilter_${filteredSiswa.length}_Santri_${dateStr}.csv`
    );
    showToast(`✓ Berhasil mengekspor ${filteredSiswa.length} santri terfilter ke file CSV.`);
  };

  const handleDownloadTemplate = () => {
    generateSiswaTemplateExcel(kamarList, waliAsuhList);
    showToast('✓ Berkas template Excel berhasil diunduh.');
  };

  // Form State
  const initialFormState: Omit<Siswa, 'id'> = {
    nisn: '',
    nama: '',
    panggilan: '',
    jenisKelamin: 'L',
    kelas: '1 SD',
    kamarId: kamarList[0]?.id || '',
    waliAsuhId: waliAsuhList[0]?.id || '',
    orangTua: {
      namaAyah: '',
      namaIbu: '',
      noHp: '',
      alamat: '',
      kotaAsal: 'Jepara',
    },
    tanggalMasuk: new Date().toISOString().split('T')[0],
    alergi: '',
    catatanKhusus: '',
    status: 'Aktif',
    dokumen: {
      ktpNomor: '',
      kkNomor: '',
      akteNomor: '',
    },
  };

  const [formData, setFormData] = useState<Omit<Siswa, 'id'>>(initialFormState);

  // Filter logic
  const activeSearch = globalSearch || localSearch;
  const filteredSiswa = siswaList.filter((s) => {
    const matchSearch =
      s.nama.toLowerCase().includes(activeSearch.toLowerCase()) ||
      s.panggilan.toLowerCase().includes(activeSearch.toLowerCase()) ||
      s.nisn.includes(activeSearch) ||
      (s.dokumen?.ktpNomor && s.dokumen.ktpNomor.includes(activeSearch)) ||
      (s.dokumen?.kkNomor && s.dokumen.kkNomor.includes(activeSearch)) ||
      (s.dokumen?.akteNomor && s.dokumen.akteNomor.toLowerCase().includes(activeSearch.toLowerCase()));

    const matchKelas = selectedKelas === 'Semua' || s.kelas === selectedKelas;
    const matchKamar =
      selectedKamarFilter === 'Semua' || s.kamarId === selectedKamarFilter;
    const matchStatus =
      selectedStatusFilter === 'Semua' ||
      (selectedStatusFilter === 'Aktif' && s.status === 'Aktif') ||
      (selectedStatusFilter === 'Sakit' && s.status === 'Sakit') ||
      (selectedStatusFilter === 'Pulang' && s.status === 'Izin Pulang');

    // Filter dokumen
    const hasFoto = Boolean(s.dokumen?.foto);
    const hasKtp = Boolean(s.dokumen?.ktp || s.dokumen?.ktpNomor);
    const hasKk = Boolean(s.dokumen?.kk || s.dokumen?.kkNomor);
    const hasAkte = Boolean(s.dokumen?.akte || s.dokumen?.akteNomor);
    const docCount = [hasFoto, hasKtp, hasKk, hasAkte].filter(Boolean).length;

    let matchDokumen = true;
    if (selectedDokumenFilter === 'Lengkap') {
      matchDokumen = docCount === 4;
    } else if (selectedDokumenFilter === 'Belum Lengkap') {
      matchDokumen = docCount < 4;
    } else if (selectedDokumenFilter === 'Ada Foto') {
      matchDokumen = hasFoto;
    } else if (selectedDokumenFilter === 'Ada KTP') {
      matchDokumen = hasKtp;
    } else if (selectedDokumenFilter === 'Ada KK') {
      matchDokumen = hasKk;
    } else if (selectedDokumenFilter === 'Ada Akte') {
      matchDokumen = hasAkte;
    }

    return matchSearch && matchKelas && matchKamar && matchStatus && matchDokumen;
  });

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (siswa: Siswa) => {
    setSelectedSiswa(siswa);
    setFormData({
      nisn: siswa.nisn,
      nama: siswa.nama,
      panggilan: siswa.panggilan,
      jenisKelamin: siswa.jenisKelamin,
      kelas: siswa.kelas,
      kamarId: siswa.kamarId,
      waliAsuhId: siswa.waliAsuhId,
      orangTua: { ...siswa.orangTua },
      tanggalMasuk: siswa.tanggalMasuk,
      alergi: siswa.alergi,
      catatanKhusus: siswa.catatanKhusus,
      status: siswa.status,
      dokumen: siswa.dokumen ? { ...siswa.dokumen } : { ktpNomor: '', kkNomor: '', akteNomor: '' },
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = (siswa: Siswa) => {
    setSelectedSiswa(siswa);
    setIsDetailModalOpen(true);
  };

  const handleOpenDokumen = (siswa: Siswa) => {
    setSelectedDokumenSiswa(siswa);
    setIsDokumenModalOpen(true);
  };

  const handleSaveDokumen = (siswaId: string, updatedDokumen: DokumenSiswa) => {
    updateSiswa(siswaId, { dokumen: updatedDokumen });
    if (selectedSiswa && selectedSiswa.id === siswaId) {
      setSelectedSiswa((prev) => (prev ? { ...prev, dokumen: updatedDokumen } : null));
    }
  };

  const handleFormFotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ Ukuran pas foto melebihi batas 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({
        ...prev,
        dokumen: {
          ...prev.dokumen,
          foto: base64,
          fotoNama: file.name,
          fotoUpdatedAt: new Date().toISOString(),
        },
      }));
      showToast('✓ Pas foto santri siap disimpan.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.nisn) return;
    addSiswa(formData);
    showToast(`✓ Santri ${formData.nama} berhasil didaftarkan.`);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswa) return;
    updateSiswa(selectedSiswa.id, formData);
    showToast(`✓ Data santri ${formData.nama} berhasil diperbarui.`);
    setIsEditModalOpen(false);
  };

  const handleDelete = (siswa: Siswa) => {
    if (window.confirm(`Yakin ingin menghapus data santri ${siswa.nama}?`)) {
      deleteSiswa(siswa.id);
      showToast(`Data santri ${siswa.nama} berhasil dihapus.`);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Section Header with Variation 2 typography */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b-[1.5px] border-[#1a1c1a] pb-4">
        <div>
          <span className="status-badge mb-2">
            {siswaList.length} SANTRI TERDAFTAR
          </span>
          <h1 className="font-syne text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[#1a1c1a] leading-none">
            Data Siswa
          </h1>
          <p className="text-xs text-[#1a1c1a]/65 font-mono-custom mt-2 uppercase tracking-wider">
            Manajemen Santri Cilik Sekolah Rakyat 1 Jepara
          </p>
        </div>

        {/* Action Buttons Cluster: Excel Import, Export, Template & Add New */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto font-mono-custom">
          {/* Import Data (Excel / CSV) */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#fdfcf9] hover:bg-[#006b54] hover:text-white text-[#1a1c1a] border-[1.5px] border-[#1a1c1a] font-bold text-xs shadow-[2px_2px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider"
            title="Import data siswa dari berkas Excel (.xlsx / .xls / .csv)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Data Siswa</span>
          </button>

          {/* Export Data Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-[#fdfcf9] text-[#1a1c1a] border-[1.5px] border-[#1a1c1a] font-bold text-xs shadow-[2px_2px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider"
              title="Export data siswa ke Excel atau CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Data</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-72 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] shadow-[4px_4px_0px_#1a1c1a] z-40 py-1 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1a1c1a]/60 bg-[#1a1c1a]/5 border-b border-[#1a1c1a]/10">
                  Format Spreadsheet Excel (.xlsx)
                </div>
                <button
                  type="button"
                  onClick={handleExportAll}
                  className="w-full text-left px-3 py-2 hover:bg-[#006b54] hover:text-white transition-colors flex items-center justify-between border-b border-[#1a1c1a]/10"
                >
                  <span className="font-bold">Export Excel (Semua Santri)</span>
                  <span className="text-[10px] font-mono opacity-80">{siswaList.length} santri</span>
                </button>

                {filteredSiswa.length !== siswaList.length && (
                  <button
                    type="button"
                    onClick={handleExportFiltered}
                    className="w-full text-left px-3 py-2 hover:bg-[#006b54] hover:text-white transition-colors flex items-center justify-between border-b border-[#1a1c1a]/10"
                  >
                    <span className="font-bold">Export Excel (Hasil Filter)</span>
                    <span className="text-[10px] font-mono opacity-80">{filteredSiswa.length} santri</span>
                  </button>
                )}

                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1a1c1a]/60 bg-[#1a1c1a]/5 border-b border-[#1a1c1a]/10">
                  Format Berkas CSV (.csv)
                </div>
                <button
                  type="button"
                  onClick={handleExportAllCsv}
                  className="w-full text-left px-3 py-2 hover:bg-[#006b54] hover:text-white transition-colors flex items-center justify-between border-b border-[#1a1c1a]/10"
                >
                  <span className="font-bold">Export CSV (Semua Santri)</span>
                  <span className="text-[10px] font-mono opacity-80">{siswaList.length} santri</span>
                </button>

                {filteredSiswa.length !== siswaList.length && (
                  <button
                    type="button"
                    onClick={handleExportFilteredCsv}
                    className="w-full text-left px-3 py-2 hover:bg-[#006b54] hover:text-white transition-colors flex items-center justify-between border-b border-[#1a1c1a]/10"
                  >
                    <span className="font-bold">Export CSV (Hasil Filter)</span>
                    <span className="text-[10px] font-mono opacity-80">{filteredSiswa.length} santri</span>
                  </button>
                )}

                <div className="border-t border-[#1a1c1a]/15 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      handleDownloadTemplate();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#1a1c1a] hover:text-[#fdfcf9] transition-colors flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#006b54]" />
                    <span>Download Template Import Excel</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add New Student */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="neo-btn-primary flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>TAMBAH SISWA</span>
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
            className="text-[10px] uppercase font-bold hover:underline ml-3"
          >
            TUTUP
          </button>
        </div>
      )}

      {/* Pusat Import & Export Data Siswa Card */}
      <div className="bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] p-4 neo-shadow font-mono-custom">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#006b54] inline-block"></span>
              <h3 className="font-syne font-bold text-sm text-[#1a1c1a] uppercase tracking-wide">
                Pusat Import & Export Data Santri
              </h3>
              <span className="text-[10px] px-2 py-0.5 border border-[#1a1c1a] bg-emerald-100 text-[#006b54] font-bold">
                {siswaList.length} Santri Aktif
              </span>
            </div>
            <p className="text-[11px] text-[#1a1c1a]/70">
              Sinkronisasi data santri secara massal dengan format Excel (.xlsx, .xls) atau CSV (.csv). Tersedia 3 opsi impor data: perbarui NISN yang sama, tambahkan semua, atau timpa data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006b54] hover:bg-[#005240] text-white font-bold text-xs border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Berkas</span>
            </button>
            <button
              type="button"
              onClick={handleExportAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-[#fdfcf9] text-[#1a1c1a] font-bold text-xs border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportAllCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-[#fdfcf9] text-[#1a1c1a] font-bold text-xs border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase"
              title="Unduh berkas template Excel kosong untuk acuan pengisian data"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-800" />
              <span>Template Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row matching Variation 2 */}
      <div className="p-3 sm:p-4 bg-[#1a1c1a]/[0.05] border-[1.5px] border-[#1a1c1a] rounded flex flex-wrap gap-2.5 items-center">
        <select
          value={selectedKelas}
          onChange={(e) => setSelectedKelas(e.target.value)}
          className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] rounded-sm focus:outline-none"
        >
          <option value="Semua">Semua Kelas</option>
          <option value="1 SD">Kelas 1 SD</option>
          <option value="2 SD">Kelas 2 SD</option>
          <option value="3 SD">Kelas 3 SD</option>
          <option value="4 SD">Kelas 4 SD</option>
          <option value="5 SD">Kelas 5 SD</option>
          <option value="6 SD">Kelas 6 SD</option>
        </select>

        <select
          value={selectedKamarFilter}
          onChange={(e) => setSelectedKamarFilter(e.target.value)}
          className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] rounded-sm focus:outline-none"
        >
          <option value="Semua">Semua Kamar</option>
          {kamarList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>

        <select
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] rounded-sm focus:outline-none"
        >
          <option value="Semua">Semua Status</option>
          <option value="Aktif">Status: Aktif</option>
          <option value="Sakit">Status: Sakit / Rawat</option>
          <option value="Pulang">Status: Izin Pulang</option>
        </select>

        <select
          value={selectedDokumenFilter}
          onChange={(e) => setSelectedDokumenFilter(e.target.value)}
          className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] rounded-sm focus:outline-none"
        >
          <option value="Semua">Semua Dokumen</option>
          <option value="Lengkap">Dokumen Lengkap (4/4)</option>
          <option value="Belum Lengkap">Dokumen Belum Lengkap</option>
          <option value="Ada Foto">Ada Pas Foto</option>
          <option value="Ada KTP">Ada KTP Orang Tua</option>
          <option value="Ada KK">Ada Kartu Keluarga</option>
          <option value="Ada Akte">Ada Akta Kelahiran</option>
        </select>

        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Cari NISN, Nama, NIK, No KK, Akte..."
          className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom text-[#1a1c1a] rounded-sm focus:outline-none flex-1 min-w-[200px]"
        />
      </div>

      {/* Student Grid with Neo-brutalist Student Cards from Variation 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSiswa.map((siswa) => {
          const kamar = getKamar(siswa.kamarId);
          const wali = getWaliAsuh(siswa.waliAsuhId);

          const hasFoto = Boolean(siswa.dokumen?.foto);
          const hasKtp = Boolean(siswa.dokumen?.ktp || siswa.dokumen?.ktpNomor);
          const hasKk = Boolean(siswa.dokumen?.kk || siswa.dokumen?.kkNomor);
          const hasAkte = Boolean(siswa.dokumen?.akte || siswa.dokumen?.akteNomor);
          const docsCount = [hasFoto, hasKtp, hasKk, hasAkte].filter(Boolean).length;

          return (
            <div
              key={siswa.id}
              className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-5 flex flex-col justify-between gap-3.5 relative transition-transform hover:-translate-y-0.5"
            >
              {/* Card Meta: NISN & Status Badge */}
              <div className="flex items-center justify-between text-[#1a1c1a]/60 font-mono-custom text-[0.68rem] uppercase">
                <span>NISN: {siswa.nisn}</span>
                <span
                  className={`status-badge ${
                    siswa.status === 'Sakit'
                      ? 'danger'
                      : siswa.status === 'Izin Pulang'
                      ? 'warning'
                      : ''
                  }`}
                >
                  {siswa.status === 'Sakit'
                    ? 'SAKIT'
                    : siswa.status === 'Izin Pulang'
                    ? 'PULANG'
                    : 'AKTIF'}
                </span>
              </div>

              {/* Card Title & Student Avatar Thumbnail */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenDokumen(siswa)}
                  className="w-14 h-16 bg-[#1a1c1a]/5 border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition-opacity group relative"
                  title="Klik untuk melihat / mengelola berkas santri"
                >
                  {siswa.dokumen?.foto ? (
                    <img
                      src={siswa.dokumen.foto}
                      alt={siswa.nama}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="text-center p-1">
                      <User className="w-5 h-5 mx-auto text-[#1a1c1a]/40" />
                      <span className="text-[7.5px] font-mono-custom font-bold text-[#1a1c1a]/50 block leading-tight mt-0.5">
                        {siswa.jenisKelamin === 'L' ? 'Ikhwan' : 'Akhwat'}
                      </span>
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-[#1a1c1a]/80 text-[#fdfcf9] text-[7.5px] font-bold py-0.5 opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                    Berkas
                  </span>
                </button>

                <div className="flex-1 min-w-0">
                  <h3 className="font-syne text-base font-bold text-[#1a1c1a] tracking-tight leading-snug line-clamp-1">
                    {siswa.nama}
                  </h3>
                  <div className="text-xs text-[#1a1c1a]/70 font-sans mt-1 space-y-0.5 leading-relaxed">
                    <div>
                      <strong className="text-[#1a1c1a]">{siswa.kelas}</strong> · {kamar?.nama || 'Kamar -'}
                    </div>
                    <div className="truncate">
                      Wali: <span className="font-medium text-[#1a1c1a]">{wali?.nama || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Status Indicators */}
              <div className="bg-[#1a1c1a]/[0.03] border border-[#1a1c1a]/20 p-2 flex items-center justify-between text-[10px] font-mono-custom">
                <div className="flex items-center gap-1 flex-wrap">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold border ${
                      hasFoto
                        ? 'bg-emerald-100 text-[#006b54] border-emerald-400'
                        : 'bg-stone-100 text-stone-400 border-stone-200'
                    }`}
                    title={hasFoto ? 'Pas foto telah diunggah' : 'Pas foto belum ada'}
                  >
                    📷 Foto
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold border ${
                      hasKtp
                        ? 'bg-emerald-100 text-[#006b54] border-emerald-400'
                        : 'bg-stone-100 text-stone-400 border-stone-200'
                    }`}
                    title={hasKtp ? `KTP: ${siswa.dokumen?.ktpNomor || 'Berkas Ada'}` : 'KTP belum diunggah'}
                  >
                    🪪 KTP
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold border ${
                      hasKk
                        ? 'bg-emerald-100 text-[#006b54] border-emerald-400'
                        : 'bg-stone-100 text-stone-400 border-stone-200'
                    }`}
                    title={hasKk ? `KK: ${siswa.dokumen?.kkNomor || 'Berkas Ada'}` : 'KK belum diunggah'}
                  >
                    📄 KK
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold border ${
                      hasAkte
                        ? 'bg-emerald-100 text-[#006b54] border-emerald-400'
                        : 'bg-stone-100 text-stone-400 border-stone-200'
                    }`}
                    title={hasAkte ? `Akta: ${siswa.dokumen?.akteNomor || 'Berkas Ada'}` : 'Akta belum diunggah'}
                  >
                    📜 Akte
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenDokumen(siswa)}
                  className={`text-[10px] font-bold underline ${
                    docsCount === 4 ? 'text-[#006b54]' : 'text-amber-800'
                  }`}
                  title="Buka pengelola dokumen"
                >
                  {docsCount}/4 Berkas
                </button>
              </div>

              {/* Card Actions: Primary RAPOR ASRAMA, Dokumen, WA, Edit, Delete */}
              <div className="mt-auto pt-2 border-t border-[#1a1c1a]/15 grid grid-cols-2 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(siswa)}
                  className="neo-btn-primary text-center text-xs py-1.5"
                >
                  RAPOR ASRAMA
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDokumen(siswa)}
                  className="neo-btn-outline inline-flex items-center justify-center gap-1 text-xs py-1.5 px-2 bg-emerald-50/70 hover:bg-[#006b54] hover:text-white transition-colors"
                  title="Kelola Berkas (Foto, KTP, KK, Akte)"
                >
                  <FileCheck className="w-3.5 h-3.5 text-[#006b54]" />
                  <span>Berkas</span>
                </button>
                <a
                  href={`https://wa.me/${siswa.orangTua.noHp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="neo-btn-outline flex items-center justify-center p-2"
                  title="WhatsApp Orang Tua"
                >
                  <Phone className="w-3.5 h-3.5 text-[#006b54]" />
                </a>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(siswa)}
                  className="neo-btn-outline flex items-center justify-center p-2"
                  title="Edit Data Siswa"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(siswa)}
                  className="neo-btn-outline flex items-center justify-center p-2 hover:bg-rose-50 hover:text-rose-700"
                  title="Hapus Data Siswa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSiswa.length === 0 && (
        <div className="p-8 text-center bg-white border-[1.5px] border-[#1a1c1a] neo-shadow">
          <p className="font-mono-custom text-xs text-[#1a1c1a]/60 uppercase">
            Tidak ada data santri yang cocok dengan pencarian / filter.
          </p>
        </div>
      )}

      {/* DETAIL MODAL: Matching Variation 2 modal specification */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedSiswa?.nama || 'Profil Santri'}
        subtitle="DETAIL PROFIL SANTRI & BERKAS RESMI"
        maxWidth="2xl"
      >
        {selectedSiswa && (
          <div className="space-y-5">
            {/* Header: Student Photo, Primary Identifiers & Quick Status */}
            <div className="flex flex-col sm:flex-row gap-4 items-start pb-4 border-b border-[#1a1c1a]/20 bg-[#1a1c1a]/[0.02] p-3 border-[1.5px] border-[#1a1c1a]">
              <div className="w-24 h-28 sm:w-28 sm:h-36 bg-white border-2 border-[#1a1c1a] shadow-[3px_3px_0px_#1a1c1a] flex items-center justify-center overflow-hidden shrink-0 relative group">
                {selectedSiswa.dokumen?.foto ? (
                  <img
                    src={selectedSiswa.dokumen.foto}
                    alt={selectedSiswa.nama}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-[#1a1c1a]/40">
                    <User className="w-10 h-10 mx-auto mb-1 text-[#1a1c1a]/30" />
                    <span className="text-[8px] font-mono-custom font-bold uppercase block">
                      Belum Ada Pas Foto
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenDokumen(selectedSiswa)}
                  className="absolute inset-0 bg-[#006b54]/90 text-white font-bold text-[10px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider p-1"
                >
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>Ubah Foto</span>
                </button>
              </div>

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono-custom text-xs font-bold bg-[#1a1c1a] text-[#fdfcf9] px-2 py-0.5">
                    NISN: {selectedSiswa.nisn}
                  </span>
                  <span
                    className={`status-badge ${
                      selectedSiswa.status === 'Sakit'
                        ? 'danger'
                        : selectedSiswa.status === 'Izin Pulang'
                        ? 'warning'
                        : ''
                    }`}
                  >
                    {selectedSiswa.status}
                  </span>
                  <span className="text-[10px] font-mono-custom bg-emerald-100 text-[#006b54] px-2 py-0.5 border border-emerald-300 font-bold">
                    {selectedSiswa.jenisKelamin === 'L' ? 'Laki-laki (Ikhwan)' : 'Perempuan (Akhwat)'}
                  </span>
                </div>

                <h2 className="font-syne text-xl font-bold text-[#1a1c1a] tracking-tight">
                  {selectedSiswa.nama}
                </h2>

                <p className="text-xs text-[#1a1c1a]/80 font-sans">
                  Nama Panggilan: <strong>{selectedSiswa.panggilan || '-'}</strong> · Tingkat:{' '}
                  <strong>{selectedSiswa.kelas}</strong>
                </p>

                <p className="text-xs text-[#1a1c1a]/80 font-sans">
                  Kamar Asrama: <strong>{getKamar(selectedSiswa.kamarId)?.nama || '-'}</strong> · Wali Pamong:{' '}
                  <strong>{getWaliAsuh(selectedSiswa.waliAsuhId)?.nama || '-'}</strong>
                </p>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDokumen(selectedSiswa)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#006b54] text-white text-[11px] font-bold border border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] hover:bg-[#005240] transition-colors"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Kelola Berkas (Foto, KTP, KK, Akte)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid 2 Columns: STUDENT INFO & GUARDIAN INFO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-white border-[1.5px] border-[#1a1c1a]">
              <div className="text-xs leading-relaxed space-y-1.5">
                <span className="font-mono-custom text-[0.65rem] text-[#1a1c1a]/50 uppercase tracking-widest block font-bold mb-1">
                  // STUDENT INFO
                </span>
                <div>
                  <strong className="font-mono-custom text-[11px]">NISN:</strong> {selectedSiswa.nisn}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">KELAS:</strong> {selectedSiswa.kelas}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">KAMAR:</strong> {getKamar(selectedSiswa.kamarId)?.nama || '-'}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">KOTA ASAL:</strong> {selectedSiswa.orangTua.kotaAsal}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">STATUS:</strong>{' '}
                  <span className={`status-badge ${selectedSiswa.status === 'Sakit' ? 'danger' : ''}`}>
                    {selectedSiswa.status}
                  </span>
                </div>
              </div>

              <div className="text-xs leading-relaxed space-y-1.5">
                <span className="font-mono-custom text-[0.65rem] text-[#1a1c1a]/50 uppercase tracking-widest block font-bold mb-1">
                  // GUARDIAN INFO
                </span>
                <div>
                  <strong className="font-mono-custom text-[11px]">WALI ASUH:</strong> {getWaliAsuh(selectedSiswa.waliAsuhId)?.nama || '-'}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">ORANG TUA:</strong> {selectedSiswa.orangTua.namaAyah} & {selectedSiswa.orangTua.namaIbu}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">KONTAK WA:</strong> {selectedSiswa.orangTua.noHp}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">ALAMAT:</strong> {selectedSiswa.orangTua.alamat}
                </div>
              </div>
            </div>

            {/* SECTION DOKUMEN & BERKAS RESMI (FOTO, KTP, KK, AKTE) */}
            <div className="p-4 bg-white border-[1.5px] border-[#1a1c1a] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono-custom text-[0.65rem] text-[#1a1c1a]/60 uppercase tracking-widest font-bold">
                  // DOKUMEN IDENTITAS SANTRI (FOTO, KTP, KK, AKTE)
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenDokumen(selectedSiswa)}
                  className="text-xs font-bold text-[#006b54] hover:underline inline-flex items-center gap-1 font-mono-custom"
                >
                  <span>Kelola Berkas Lengkap</span> &rarr;
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Pas Foto */}
                <div
                  onClick={() => handleOpenDokumen(selectedSiswa)}
                  className="p-2.5 border border-[#1a1c1a] bg-[#1a1c1a]/[0.02] cursor-pointer hover:bg-emerald-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-[#1a1c1a]">📷 Pas Foto</span>
                    <span
                      className={`text-[8.5px] px-1 py-0.2 font-mono-custom font-bold ${
                        selectedSiswa.dokumen?.foto ? 'text-emerald-700 bg-emerald-100' : 'text-stone-500 bg-stone-100'
                      }`}
                    >
                      {selectedSiswa.dokumen?.foto ? 'ADA' : 'KOSONG'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#1a1c1a]/60 font-mono-custom truncate">
                    {selectedSiswa.dokumen?.fotoNama || (selectedSiswa.dokumen?.foto ? 'Terunggah' : 'Belum upload')}
                  </p>
                </div>

                {/* 2. KTP Orang Tua */}
                <div
                  onClick={() => handleOpenDokumen(selectedSiswa)}
                  className="p-2.5 border border-[#1a1c1a] bg-[#1a1c1a]/[0.02] cursor-pointer hover:bg-emerald-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-[#1a1c1a]">🪪 KTP Orang Tua</span>
                    <span
                      className={`text-[8.5px] px-1 py-0.2 font-mono-custom font-bold ${
                        selectedSiswa.dokumen?.ktp || selectedSiswa.dokumen?.ktpNomor
                          ? 'text-emerald-700 bg-emerald-100'
                          : 'text-stone-500 bg-stone-100'
                      }`}
                    >
                      {selectedSiswa.dokumen?.ktp ? 'BERKAS' : selectedSiswa.dokumen?.ktpNomor ? 'NOMOR' : 'KOSONG'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#1a1c1a]/70 font-mono-custom truncate">
                    {selectedSiswa.dokumen?.ktpNomor || (selectedSiswa.dokumen?.ktp ? 'Berkas Ada' : 'Belum ada')}
                  </p>
                </div>

                {/* 3. Kartu Keluarga */}
                <div
                  onClick={() => handleOpenDokumen(selectedSiswa)}
                  className="p-2.5 border border-[#1a1c1a] bg-[#1a1c1a]/[0.02] cursor-pointer hover:bg-emerald-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-[#1a1c1a]">📄 Kartu Keluarga</span>
                    <span
                      className={`text-[8.5px] px-1 py-0.2 font-mono-custom font-bold ${
                        selectedSiswa.dokumen?.kk || selectedSiswa.dokumen?.kkNomor
                          ? 'text-emerald-700 bg-emerald-100'
                          : 'text-stone-500 bg-stone-100'
                      }`}
                    >
                      {selectedSiswa.dokumen?.kk ? 'BERKAS' : selectedSiswa.dokumen?.kkNomor ? 'NOMOR' : 'KOSONG'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#1a1c1a]/70 font-mono-custom truncate">
                    {selectedSiswa.dokumen?.kkNomor || (selectedSiswa.dokumen?.kk ? 'Berkas Ada' : 'Belum ada')}
                  </p>
                </div>

                {/* 4. Akta Kelahiran */}
                <div
                  onClick={() => handleOpenDokumen(selectedSiswa)}
                  className="p-2.5 border border-[#1a1c1a] bg-[#1a1c1a]/[0.02] cursor-pointer hover:bg-emerald-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-[#1a1c1a]">📜 Akta Lahir</span>
                    <span
                      className={`text-[8.5px] px-1 py-0.2 font-mono-custom font-bold ${
                        selectedSiswa.dokumen?.akte || selectedSiswa.dokumen?.akteNomor
                          ? 'text-emerald-700 bg-emerald-100'
                          : 'text-stone-500 bg-stone-100'
                      }`}
                    >
                      {selectedSiswa.dokumen?.akte ? 'BERKAS' : selectedSiswa.dokumen?.akteNomor ? 'NOMOR' : 'KOSONG'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#1a1c1a]/70 font-mono-custom truncate">
                    {selectedSiswa.dokumen?.akteNomor || (selectedSiswa.dokumen?.akte ? 'Berkas Ada' : 'Belum ada')}
                  </p>
                </div>
              </div>
            </div>

            {/* INTEGRATED LOGS from Variation 2 */}
            <div className="pt-1">
              <span className="font-mono-custom text-[0.65rem] text-[#1a1c1a]/50 uppercase tracking-widest block font-bold mb-2">
                // INTEGRATED LOGS & CATATAN ASRAMA
              </span>

              {/* Medis Log */}
              <div className="bg-white border-[1.5px] border-[#1a1c1a] p-3 mb-2 text-xs">
                {kesehatanList.filter((k) => k.siswaId === selectedSiswa.id).length > 0 ? (
                  <div>
                    <span className="font-mono-custom font-bold text-rose-600 mr-2">[MEDIS]</span>
                    {kesehatanList.filter((k) => k.siswaId === selectedSiswa.id)[0].keluhan} (
                    {kesehatanList.filter((k) => k.siswaId === selectedSiswa.id)[0].suhuTubuh}) -{' '}
                    <strong className="text-rose-700">
                      {kesehatanList.filter((k) => k.siswaId === selectedSiswa.id)[0].status}
                    </strong>
                  </div>
                ) : (
                  <div>
                    <span className="font-mono-custom font-bold text-emerald-700 mr-2">[MEDIS]</span>
                    Alhamdulillah belum ada riwayat keluhan sakit. Kondisi santri sehat & aktif.
                  </div>
                )}
              </div>

              {/* Pembinaan Log */}
              <div className="bg-white border-[1.5px] border-[#1a1c1a] p-3 mb-2 text-xs">
                {pelanggaranList.filter((p) => p.siswaId === selectedSiswa.id).length > 0 ? (
                  <div>
                    <span className="font-mono-custom font-bold text-amber-700 mr-2">[PEMBINAAN]</span>
                    {pelanggaranList.filter((p) => p.siswaId === selectedSiswa.id)[0].pelanggaran} -{' '}
                    <span className="text-slate-600">
                      Tugas Edukatif:{' '}
                      {pelanggaranList.filter((p) => p.siswaId === selectedSiswa.id)[0].bentukPembinaan}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="font-mono-custom font-bold text-[#006b54] mr-2">[PEMBINAAN]</span>
                    Siswa tertib, santun, dan tidak ada catatan pelanggaran disiplin.
                  </div>
                )}
              </div>

              {/* Ibadah Log */}
              <div className="bg-white border-[1.5px] border-[#1a1c1a] p-3 text-xs">
                <span className="font-mono-custom font-bold text-[#006b54] mr-2">[IBADAH & TAHFIDZ]</span>
                Sholat 5 waktu berjamaah di masjid, setoran hafalan Juz 'Amma berjalan lancar.
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-[#1a1c1a]/20">
              <a
                href={`https://wa.me/${selectedSiswa.orangTua.noHp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="neo-btn-outline inline-flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-[#006b54]" />
                KIRIM LAPORAN WA KE ORANG TUA
              </a>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="neo-btn-primary"
              >
                TUTUP PROFIL
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* FORM MODAL (ADD / EDIT) */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Tambah Siswa Baru' : 'Edit Data Santri'}
        subtitle="FORMULIR DATA SANTRI ASRAMA & DOKUMEN"
        maxWidth="2xl"
      >
        <form
          onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit}
          className="space-y-4 text-xs font-mono-custom"
        >
          {/* FOTO SANTRI INPUT SECTION */}
          <div className="p-3 bg-white border-[1.5px] border-[#1a1c1a]">
            <span className="font-bold text-[#1a1c1a] block mb-2">// PAS FOTO SANTRI</span>
            <div className="flex items-center gap-4">
              <div className="w-20 h-24 bg-[#1a1c1a]/5 border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] flex items-center justify-center overflow-hidden shrink-0">
                {formData.dokumen?.foto ? (
                  <img
                    src={formData.dokumen.foto}
                    alt="Preview Santri"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-1 text-[#1a1c1a]/40">
                    <User className="w-7 h-7 mx-auto mb-0.5" />
                    <span className="text-[7.5px] font-bold block">FOTO</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  ref={isAddModalOpen ? addFotoInputRef : editFotoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFormFotoUpload(e, isEditModalOpen)}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isAddModalOpen) addFotoInputRef.current?.click();
                      else editFotoInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-[#fdfcf9] text-[#1a1c1a] font-bold border border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] text-xs transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{formData.dokumen?.foto ? 'Ganti Foto' : 'Unggah Pas Foto'}</span>
                  </button>
                  {formData.dokumen?.foto && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          dokumen: { ...prev.dokumen, foto: undefined, fotoNama: undefined },
                        }))
                      }
                      className="px-2 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-300 text-xs font-bold"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[#1a1c1a]/60">
                  Format JPG, PNG, WEBP (maks. 5MB). Pas foto resmi berseragam santri / latar polos.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">
                NISN Santri *
              </label>
              <input
                type="text"
                required
                placeholder="10 digit NISN"
                value={formData.nisn}
                onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                placeholder="Nama lengkap santri"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">Nama Panggilan</label>
              <input
                type="text"
                value={formData.panggilan}
                onChange={(e) => setFormData({ ...formData, panggilan: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">Kelas SD</label>
              <select
                value={formData.kelas}
                onChange={(e) =>
                  setFormData({ ...formData, kelas: e.target.value as Siswa['kelas'] })
                }
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
              >
                <option value="1 SD">1 SD</option>
                <option value="2 SD">2 SD</option>
                <option value="3 SD">3 SD</option>
                <option value="4 SD">4 SD</option>
                <option value="5 SD">5 SD</option>
                <option value="6 SD">6 SD</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">Status Keberadaan</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as Siswa['status'] })
                }
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-bold"
              >
                <option value="Aktif">Aktif di Asrama</option>
                <option value="Sakit">Sakit (Rawat UKS)</option>
                <option value="Izin Pulang">Izin Pulang (Keluarga)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">Kamar Asrama</label>
              <select
                value={formData.kamarId}
                onChange={(e) => setFormData({ ...formData, kamarId: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
              >
                {kamarList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama} ({k.gedung})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">Wali Asuh Binaan</label>
              <select
                value={formData.waliAsuhId}
                onChange={(e) => setFormData({ ...formData, waliAsuhId: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
              >
                {waliAsuhList.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nama}, {w.gelar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DOKUMEN LEGAL (KTP, KK, AKTE) */}
          <div className="p-3 bg-white border-[1.5px] border-[#1a1c1a] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1a1c1a] block">// NOMOR IDENTITAS LEGAL (KTP, KK, AKTE)</span>
              <span className="text-[10px] text-[#1a1c1a]/60">Opsional / Dapat diisi bertahap</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#1a1c1a] mb-1 font-bold">NIK KTP Orang Tua</label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="16 digit NIK"
                  value={formData.dokumen?.ktpNomor || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dokumen: { ...formData.dokumen, ktpNomor: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-[#1a1c1a] text-xs"
                />
              </div>
              <div>
                <label className="block text-[#1a1c1a] mb-1 font-bold">Nomor Kartu Keluarga (KK)</label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="16 digit No. KK"
                  value={formData.dokumen?.kkNomor || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dokumen: { ...formData.dokumen, kkNomor: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-[#1a1c1a] text-xs"
                />
              </div>
              <div>
                <label className="block text-[#1a1c1a] mb-1 font-bold">No. Akta Kelahiran</label>
                <input
                  type="text"
                  placeholder="No. registrasi akta"
                  value={formData.dokumen?.akteNomor || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dokumen: { ...formData.dokumen, akteNomor: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-[#1a1c1a] text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] text-[#1a1c1a]/60 italic">
              * Scan berkas fisik KTP, KK, dan Akta Kelahiran dapat diunggah melalui tombol menu "Berkas" pada kartu santri.
            </p>
          </div>

          <div className="p-3 bg-white border-[1.5px] border-[#1a1c1a] space-y-3">
            <span className="font-bold text-[#1a1c1a] block">// DATA ORANG TUA / WALI</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1a1c1a] mb-1">Nama Ayah</label>
                <input
                  type="text"
                  value={formData.orangTua.namaAyah}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orangTua: { ...formData.orangTua, namaAyah: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-[#1a1c1a] text-xs"
                />
              </div>
              <div>
                <label className="block text-[#1a1c1a] mb-1">Nama Ibu</label>
                <input
                  type="text"
                  value={formData.orangTua.namaIbu}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orangTua: { ...formData.orangTua, namaIbu: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-[#1a1c1a] text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#1a1c1a] mb-1">No. WhatsApp</label>
                <input
                  type="text"
                  placeholder="08xxxxxxxxxx"
                  value={formData.orangTua.noHp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orangTua: { ...formData.orangTua, noHp: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-[#1a1c1a] text-xs"
                />
              </div>
              <div>
                <label className="block text-[#1a1c1a] mb-1">Kota Asal</label>
                <input
                  type="text"
                  value={formData.orangTua.kotaAsal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orangTua: { ...formData.orangTua, kotaAsal: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-[#1a1c1a] text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">Catatan Khusus Wali Asuh</label>
            <textarea
              rows={2}
              placeholder="Karakter, kebiasaan tidur, hafalan, atau catatan adaptasi..."
              value={formData.catatanKhusus}
              onChange={(e) => setFormData({ ...formData, catatanKhusus: e.target.value })}
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1a1c1a]">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="neo-btn-outline"
            >
              BATAL
            </button>
            <button type="submit" className="neo-btn-primary">
              SIMPAN SANTRI
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DOKUMEN SANTRI (FOTO, KTP, KK, AKTE) */}
      {selectedDokumenSiswa && (
        <DokumenSiswaModal
          isOpen={isDokumenModalOpen}
          onClose={() => {
            setIsDokumenModalOpen(false);
            setSelectedDokumenSiswa(null);
          }}
          siswa={selectedDokumenSiswa}
          kamar={getKamar(selectedDokumenSiswa.kamarId)}
          waliAsuh={getWaliAsuh(selectedDokumenSiswa.waliAsuhId)}
          onSave={handleSaveDokumen}
          showToast={showToast}
        />
      )}

      {/* Modal Upload & Import Siswa Excel */}
      <ImportSiswaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(stats) => {
          showToast(`✓ Berhasil mengimpor ${stats.added} santri baru dan memperbarui ${stats.updated} data santri.`);
        }}
      />
    </div>
  );
};
