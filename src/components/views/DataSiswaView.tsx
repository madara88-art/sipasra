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
  X,
  CheckSquare,
  Square,
  ArrowRightLeft,
  History,
  Pencil,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Siswa, DokumenSiswa, MutasiRecord } from '../../types';
import { Modal } from '../common/Modal';
import { DokumenSiswaModal } from './DokumenSiswaModal';
import {
  exportSiswaToExcel,
  exportSiswaToCsv,
  generateSiswaTemplateExcel,
  parseSiswaExcel,
  parseFlexibleDate,
  ParseResult,
} from '../../utils/excelUtils';

const isoToDmyDisplay = (isoStr?: string): string => {
  if (!isoStr) return '';
  const m = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const parsed = parseFlexibleDate(isoStr);
  if (parsed) {
    const p = parsed.split('-');
    return `${p[2]}-${p[1]}-${p[0]}`;
  }
  return isoStr;
};

interface TanggalLahirInputProps {
  value: string;
  onChange: (isoDate: string) => void;
  inputClassName?: string;
}

const TanggalLahirInput: React.FC<TanggalLahirInputProps> = ({
  value,
  onChange,
  inputClassName = 'w-full pl-3 pr-9 py-1.5 border border-[#1a1c1a] bg-white text-xs focus:outline-none focus:border-[#006b54]',
}) => {
  const [text, setText] = useState<string>(() => isoToDmyDisplay(value));
  const isFocusedRef = useRef(false);
  const nativePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setText(isoToDmyDisplay(value));
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextText = e.target.value;
    setText(nextText);

    const trimmed = nextText.trim();
    if (!trimmed) {
      onChange('');
      return;
    }

    const hasFourDigitYear = /\d{4}/.test(trimmed) || /^\d{8}$/.test(trimmed);
    if (hasFourDigitYear) {
      const parsedIso = parseFlexibleDate(trimmed);
      if (parsedIso) {
        onChange(parsedIso);
      }
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    const trimmed = text.trim();
    if (!trimmed) {
      onChange('');
      setText('');
      return;
    }
    const parsedIso = parseFlexibleDate(trimmed);
    if (parsedIso) {
      onChange(parsedIso);
      setText(isoToDmyDisplay(parsedIso));
    }
  };

  const handleOpenPicker = () => {
    const picker = nativePickerRef.current;
    if (!picker) return;
    if (
      typeof (picker as HTMLInputElement & { showPicker?: () => void }).showPicker ===
      'function'
    ) {
      try {
        (picker as HTMLInputElement & { showPicker?: () => void }).showPicker!();
        return;
      } catch {
        // fallback to click
      }
    }
    picker.click();
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD-MM-YYYY (cth: 15-08-2016)"
        value={text}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onChange={handleTextChange}
        onBlur={handleBlur}
        className={inputClassName}
      />
      <button
        type="button"
        onClick={handleOpenPicker}
        title="Pilih dari kalender"
        aria-label="Pilih tanggal lahir dari kalender"
        className="absolute right-1.5 p-1 text-[#1a1c1a]/65 hover:text-[#006b54] cursor-pointer"
      >
        <Calendar className="w-3.5 h-3.5" />
      </button>
      <input
        ref={nativePickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : parseFlexibleDate(value) || ''}
        onChange={(e) => {
          const picked = e.target.value;
          onChange(picked);
          setText(isoToDmyDisplay(picked));
        }}
        className="sr-only"
      />
    </div>
  );
};

export const DataSiswaView: React.FC = () => {
  const {
    siswaList,
    kamarList,
    waliAsuhList,
    addSiswa,
    updateSiswa,
    importSiswaList,
    deleteSiswa,
    deleteMultipleSiswa,
    clearAllSiswa,
    mutasiList,
    mutateSiswa,
    getKamar,
    getWaliAsuh,
    kesehatanList,
    ibadahList,
    konselingList,
    pelanggaranList,
    perkembanganList,
    searchQuery: globalSearch,
    selectedSiswaId,
    setSelectedSiswaId,
  } = useApp();

  const [localSearch, setLocalSearch] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<string>('Semua');
  const [selectedKamarFilter, setSelectedKamarFilter] = useState<string>('Semua');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Semua');
  const [selectedDokumenFilter, setSelectedDokumenFilter] = useState<string>('Semua');

  // Active inline panel & Modal states
  type ActiveFormPanel = 'none' | 'add' | 'edit' | 'mutasi' | 'hapus' | 'import';
  const [activePanel, setActivePanel] = useState<ActiveFormPanel>('none');
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editTargetId, setEditTargetId] = useState<string>('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDokumenModalOpen, setIsDokumenModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inline Import Berkas form states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isParsingImport, setIsParsingImport] = useState(false);
  const [importParseResult, setImportParseResult] = useState<ParseResult | null>(null);
  const [importMode, setImportMode] = useState<'upsert' | 'append' | 'replace'>('upsert');
  const [showAllImportPreview, setShowAllImportPreview] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [selectedDokumenSiswa, setSelectedDokumenSiswa] = useState<Siswa | null>(null);

  // Bulk grid selection state
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedIdsForDelete, setSelectedIdsForDelete] = useState<string[]>([]);

  // Inline Hapus form states
  const [hapusMode, setHapusMode] = useState<'single' | 'multiple' | 'all'>('single');
  const [hapusSingleId, setHapusSingleId] = useState<string>('');
  const [hapusSelectedIds, setHapusSelectedIds] = useState<string[]>([]);
  const [hapusSearchQuery, setHapusSearchQuery] = useState('');
  const [hapusAllConfirmed, setHapusAllConfirmed] = useState(false);

  // Inline Mutasi & Riwayat Mutasi states
  const [mutasiTargetIds, setMutasiTargetIds] = useState<string[]>([]);
  const [mutasiSearchQuery, setMutasiSearchQuery] = useState('');
  const [mutasiForm, setMutasiForm] = useState<{
    jenisMutasi: MutasiRecord['jenisMutasi'];
    keKamarId: string;
    keWaliAsuhId: string;
    keKelas: Siswa['kelas'];
    tanggal: string;
    keterangan: string;
  }>({
    jenisMutasi: 'Pindah Kamar',
    keKamarId: '',
    keWaliAsuhId: '',
    keKelas: '1 SD',
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: '',
  });
  const [isRiwayatMutasiOpen, setIsRiwayatMutasiOpen] = useState(false);

  const exportMenuRef = useRef<HTMLDivElement>(null);
  const addFotoInputRef = useRef<HTMLInputElement>(null);
  const editFotoInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

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

  // Open student detail automatically if navigated with selectedSiswaId
  useEffect(() => {
    if (selectedSiswaId) {
      const target = siswaList.find((s) => s.id === selectedSiswaId);
      if (target) {
        setSelectedSiswa(target);
        setIsDetailModalOpen(true);
      }
      setSelectedSiswaId(null);
    }
  }, [selectedSiswaId, siswaList, setSelectedSiswaId]);

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
    nik: '',
    noKk: '',
    tempatLahir: '',
    tanggalLahir: '',
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
      desa: '',
      kecamatan: '',
      kabupaten: '',
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

  const formatTanggalIndonesia = (dateStr?: string) => {
    if (!dateStr) return '';
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : parseFlexibleDate(dateStr);
    const parsed = iso ? new Date(`${iso}T00:00:00`) : new Date(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTTL = (siswa: Siswa) => {
    const tempat = siswa.tempatLahir?.trim();
    const tgl = formatTanggalIndonesia(siswa.tanggalLahir);
    if (tempat && tgl) return `${tempat}, ${tgl}`;
    return tempat || tgl || '-';
  };

  // Filter logic
  const activeSearch = globalSearch || localSearch;
  const filteredSiswa = siswaList.filter((s) => {
    const q = activeSearch.toLowerCase();
    const matchSearch =
      s.nama.toLowerCase().includes(q) ||
      s.panggilan.toLowerCase().includes(q) ||
      s.nisn.includes(activeSearch) ||
      (s.nik && s.nik.includes(activeSearch)) ||
      (s.noKk && s.noKk.includes(activeSearch)) ||
      (s.tempatLahir && s.tempatLahir.toLowerCase().includes(q)) ||
      (s.orangTua.alamat && s.orangTua.alamat.toLowerCase().includes(q)) ||
      (s.orangTua.desa && s.orangTua.desa.toLowerCase().includes(q)) ||
      (s.orangTua.kecamatan && s.orangTua.kecamatan.toLowerCase().includes(q)) ||
      (s.orangTua.kabupaten && s.orangTua.kabupaten.toLowerCase().includes(q)) ||
      (s.dokumen?.ktpNomor && s.dokumen.ktpNomor.includes(activeSearch)) ||
      (s.dokumen?.kkNomor && s.dokumen.kkNomor.includes(activeSearch)) ||
      (s.dokumen?.akteNomor && s.dokumen.akteNomor.toLowerCase().includes(q));

    const matchKelas = selectedKelas === 'Semua' || s.kelas === selectedKelas;
    const matchKamar =
      selectedKamarFilter === 'Semua' || s.kamarId === selectedKamarFilter;
    const matchStatus =
      selectedStatusFilter === 'Semua' ||
      (selectedStatusFilter === 'Aktif' && s.status === 'Aktif') ||
      (selectedStatusFilter === 'Sakit' && s.status === 'Sakit') ||
      (selectedStatusFilter === 'Pulang' && s.status === 'Izin Pulang') ||
      (selectedStatusFilter === 'Mutasi Keluar' && s.status === 'Mutasi Keluar');

    // Filter dokumen
    const hasFoto = Boolean(s.dokumen?.foto);
    const hasKtp = Boolean(s.dokumen?.ktp || s.dokumen?.ktpNomor);
    const hasKk = Boolean(s.dokumen?.kk || s.dokumen?.kkNomor || s.noKk);
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

  const scrollToFormPanel = () => {
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const populateEditFormFromSiswa = (siswa: Siswa) => {
    setEditTargetId(siswa.id);
    setEditFormError(null);
    const syncedKk = siswa.noKk || siswa.dokumen?.kkNomor || '';
    setFormData({
      nisn: siswa.nisn,
      nik: siswa.nik || '',
      noKk: syncedKk,
      tempatLahir: siswa.tempatLahir || '',
      tanggalLahir: siswa.tanggalLahir || '',
      nama: siswa.nama,
      panggilan: siswa.panggilan,
      jenisKelamin: siswa.jenisKelamin,
      kelas: siswa.kelas,
      kamarId: siswa.kamarId,
      waliAsuhId: siswa.waliAsuhId,
      orangTua: {
        ...siswa.orangTua,
        desa: siswa.orangTua.desa || '',
        kecamatan: siswa.orangTua.kecamatan || '',
        kabupaten: siswa.orangTua.kabupaten || '',
      },
      tanggalMasuk: siswa.tanggalMasuk,
      alergi: siswa.alergi || '',
      catatanKhusus: siswa.catatanKhusus || '',
      status: siswa.status,
      dokumen: siswa.dokumen
        ? { ...siswa.dokumen, kkNomor: syncedKk }
        : { ktpNomor: '', kkNomor: syncedKk, akteNomor: '' },
    });
  };

  const handleOpenAdd = () => {
    const defaultKamar = kamarList[0];
    setFormData({
      ...initialFormState,
      kamarId: defaultKamar?.id || '',
      waliAsuhId: defaultKamar?.waliAsuhId || waliAsuhList[0]?.id || '',
    });
    setAddFormError(null);
    setActivePanel('add');
    scrollToFormPanel();
  };

  const handleOpenEdit = (siswa?: Siswa) => {
    const target = siswa || siswaList.find((s) => s.id === editTargetId) || siswaList[0];
    setIsDetailModalOpen(false);
    if (target) {
      populateEditFormFromSiswa(target);
    } else {
      setEditTargetId('');
    }
    setActivePanel('edit');
    scrollToFormPanel();
  };

  const handleOpenImport = () => {
    setActivePanel('import');
    scrollToFormPanel();
  };

  const handleImportFileChange = async (selectedFile: File) => {
    setImportFile(selectedFile);
    setIsParsingImport(true);
    setImportParseResult(null);
    setShowAllImportPreview(false);

    try {
      const res = await parseSiswaExcel(selectedFile, kamarList, waliAsuhList);
      setImportParseResult(res);
    } catch (err: any) {
      setImportParseResult({
        data: [],
        totalRows: 0,
        validRows: 0,
        errors: [`Gagal membaca berkas: ${err?.message || 'Format tidak valid'}`],
        warnings: [],
      });
    } finally {
      setIsParsingImport(false);
    }
  };

  const handleImportDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImportFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleResetImport = () => {
    setImportFile(null);
    setImportParseResult(null);
    setShowAllImportPreview(false);
    if (importFileInputRef.current) importFileInputRef.current.value = '';
  };

  const handleExecuteImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importParseResult || importParseResult.data.length === 0) return;

    const stats = importSiswaList(importParseResult.data, importMode);

    // Reset filter so newly imported students are immediately visible
    setSelectedKelas('Semua');
    setSelectedKamarFilter('Semua');
    setSelectedStatusFilter('Semua');
    setSelectedDokumenFilter('Semua');
    setLocalSearch('');

    handleResetImport();
    setActivePanel('none');
    showToast(
      `✓ Berhasil mengimpor ${stats.added} santri baru dan memperbarui ${stats.updated} data santri.`
    );
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
    const syncedNoKk = updatedDokumen.kkNomor?.trim() || undefined;
    updateSiswa(siswaId, { dokumen: updatedDokumen, noKk: syncedNoKk });
    if (selectedSiswa && selectedSiswa.id === siswaId) {
      setSelectedSiswa((prev) =>
        prev ? { ...prev, dokumen: updatedDokumen, noKk: syncedNoKk } : null
      );
    }
  };

  const handleFormFotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>
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
    setAddFormError(null);
    const rawNama = formData.nama.trim();
    const rawPanggilan = formData.panggilan.trim();
    const rawNisn = formData.nisn.trim();
    const trimmedNisn = rawNisn || String(Date.now()).slice(-10);
    const trimmedNama =
      rawNama ||
      rawPanggilan ||
      (rawNisn ? `Santri (${rawNisn})` : `Santri Baru #${siswaList.length + 1}`);
    const panggilan = rawPanggilan || trimmedNama.split(' ')[0];
    const trimmedNik = (formData.nik || '').trim() || undefined;
    const trimmedNoKk =
      (formData.noKk || formData.dokumen?.kkNomor || '').trim() || undefined;
    const trimmedTempatLahir = (formData.tempatLahir || '').trim() || undefined;
    const trimmedTanggalLahir = (formData.tanggalLahir || '').trim() || undefined;
    const tanggalMasuk = formData.tanggalMasuk || new Date().toISOString().split('T')[0];

    const trimmedDesa = (formData.orangTua.desa || '').trim() || undefined;
    const trimmedKecamatan = (formData.orangTua.kecamatan || '').trim() || undefined;
    const trimmedKabupaten = (formData.orangTua.kabupaten || '').trim() || undefined;
    const trimmedKotaAsal = formData.orangTua.kotaAsal.trim() || trimmedKabupaten || '';

    addSiswa({
      ...formData,
      nama: trimmedNama,
      nisn: trimmedNisn,
      nik: trimmedNik,
      noKk: trimmedNoKk,
      tempatLahir: trimmedTempatLahir,
      tanggalLahir: trimmedTanggalLahir,
      tanggalMasuk,
      panggilan,
      orangTua: {
        ...formData.orangTua,
        desa: trimmedDesa,
        kecamatan: trimmedKecamatan,
        kabupaten: trimmedKabupaten,
        kotaAsal: trimmedKotaAsal,
      },
      dokumen: {
        ...formData.dokumen,
        kkNomor: trimmedNoKk,
      },
    });

    // Reset filter so newly added student is immediately visible
    setSelectedKelas('Semua');
    setSelectedKamarFilter('Semua');
    setSelectedStatusFilter('Semua');
    setSelectedDokumenFilter('Semua');
    setLocalSearch('');

    const hasMissingData =
      !rawNama ||
      !rawNisn ||
      !trimmedNik ||
      !trimmedNoKk ||
      !trimmedTempatLahir ||
      !trimmedTanggalLahir ||
      !formData.orangTua.noHp.trim();

    showToast(
      hasMissingData
        ? `✓ Santri ${trimmedNama} disimpan (data yang kurang bisa dilengkapi nanti via Edit).`
        : `✓ Santri ${trimmedNama} berhasil ditambahkan.`
    );
    setActivePanel('none');
    setFormData(initialFormState);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = siswaList.find((s) => s.id === editTargetId);
    if (!target) {
      setEditFormError('Pilih santri yang akan diperbarui terlebih dahulu.');
      return;
    }
    setEditFormError(null);
    const rawNama = formData.nama.trim();
    const rawPanggilan = formData.panggilan.trim();
    const trimmedNisn = formData.nisn.trim() || '-';
    const trimmedNama =
      rawNama ||
      rawPanggilan ||
      target.nama ||
      `Santri (${trimmedNisn})`;
    const trimmedNik = (formData.nik || '').trim() || undefined;
    const trimmedNoKk =
      (formData.noKk || formData.dokumen?.kkNomor || '').trim() || undefined;
    const trimmedTempatLahir = (formData.tempatLahir || '').trim() || undefined;
    const trimmedTanggalLahir = (formData.tanggalLahir || '').trim() || undefined;

    const trimmedDesa = (formData.orangTua.desa || '').trim() || undefined;
    const trimmedKecamatan = (formData.orangTua.kecamatan || '').trim() || undefined;
    const trimmedKabupaten = (formData.orangTua.kabupaten || '').trim() || undefined;
    const trimmedKotaAsal = formData.orangTua.kotaAsal.trim() || trimmedKabupaten || '';

    const updatedPayload: Omit<Siswa, 'id'> = {
      ...formData,
      nama: trimmedNama,
      nisn: trimmedNisn,
      nik: trimmedNik,
      noKk: trimmedNoKk,
      tempatLahir: trimmedTempatLahir,
      tanggalLahir: trimmedTanggalLahir,
      panggilan: rawPanggilan || trimmedNama.split(' ')[0],
      orangTua: {
        ...formData.orangTua,
        desa: trimmedDesa,
        kecamatan: trimmedKecamatan,
        kabupaten: trimmedKabupaten,
        kotaAsal: trimmedKotaAsal,
      },
      dokumen: {
        ...formData.dokumen,
        kkNomor: trimmedNoKk,
      },
    };
    updateSiswa(target.id, updatedPayload);
    if (selectedSiswa?.id === target.id) {
      setSelectedSiswa({ ...target, ...updatedPayload });
    }
    showToast(`✓ Data santri ${trimmedNama} berhasil diperbarui.`);
    setActivePanel('none');
  };

  const handleDelete = (siswa?: Siswa, mode: 'single' | 'multiple' | 'all' = 'single') => {
    setIsDetailModalOpen(false);
    setHapusMode(mode);
    setHapusAllConfirmed(false);
    setHapusSearchQuery('');
    if (siswa) {
      setHapusSingleId(siswa.id);
      setHapusSelectedIds([siswa.id]);
    } else if (mode === 'multiple' && selectedIdsForDelete.length > 0) {
      setHapusSelectedIds(selectedIdsForDelete);
    } else {
      const firstId = siswaList[0]?.id || '';
      setHapusSingleId(firstId);
      setHapusSelectedIds([]);
    }
    setActivePanel('hapus');
    scrollToFormPanel();
  };

  const confirmDeleteSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const target = siswaList.find((s) => s.id === hapusSingleId);
    if (!target) return;
    const deletedName = target.nama;
    const deletedId = target.id;
    deleteSiswa(deletedId);
    setSelectedIdsForDelete((prev) => prev.filter((id) => id !== deletedId));
    setHapusSelectedIds((prev) => prev.filter((id) => id !== deletedId));
    setMutasiTargetIds((prev) => prev.filter((id) => id !== deletedId));
    if (selectedSiswa?.id === deletedId) {
      setIsDetailModalOpen(false);
      setSelectedSiswa(null);
    }
    const remaining = siswaList.filter((s) => s.id !== deletedId);
    setHapusSingleId(remaining[0]?.id || '');
    if (remaining.length === 0) {
      setActivePanel('none');
    }
    showToast(`✓ Data santri ${deletedName} berhasil dihapus.`);
  };

  const toggleSelectForDelete = (id: string) => {
    setSelectedIdsForDelete((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredSiswa.map((s) => s.id);
    const allSelected =
      filteredIds.length > 0 && filteredIds.every((id) => selectedIdsForDelete.includes(id));
    if (allSelected) {
      setSelectedIdsForDelete([]);
    } else {
      setSelectedIdsForDelete(filteredIds);
    }
  };

  const confirmDeleteBulk = (e: React.FormEvent) => {
    e.preventDefault();
    if (hapusSelectedIds.length === 0) return;
    const count = hapusSelectedIds.length;
    deleteMultipleSiswa(hapusSelectedIds);
    setSelectedIdsForDelete([]);
    setHapusSelectedIds([]);
    setIsBulkSelectMode(false);
    setActivePanel('none');
    showToast(`✓ Berhasil menghapus ${count} data santri terpilih.`);
  };

  const confirmDeleteAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hapusAllConfirmed) return;
    clearAllSiswa();
    setSelectedIdsForDelete([]);
    setHapusSelectedIds([]);
    setMutasiTargetIds([]);
    setIsBulkSelectMode(false);
    setHapusAllConfirmed(false);
    setActivePanel('none');
    showToast('✓ Seluruh data santri berhasil dihapus. Siap diisi ulang via Import atau manual.');
  };

  const handleOpenMutasi = (targets?: Siswa[]) => {
    setIsDetailModalOpen(false);
    setMutasiSearchQuery('');
    const list = targets && targets.length > 0 ? targets : siswaList[0] ? [siswaList[0]] : [];
    const first = list[0];
    const fallbackKamar =
      kamarList.find((k) => k.id !== first?.kamarId) ||
      kamarList.find((k) => k.id === first?.kamarId) ||
      kamarList[0];
    setMutasiTargetIds(list.map((t) => t.id));
    setMutasiForm({
      jenisMutasi: 'Pindah Kamar',
      keKamarId: fallbackKamar?.id || first?.kamarId || '',
      keWaliAsuhId: fallbackKamar?.waliAsuhId || first?.waliAsuhId || '',
      keKelas: first?.kelas || '1 SD',
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: '',
    });
    setActivePanel('mutasi');
    scrollToFormPanel();
  };

  const handleConfirmMutasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (mutasiTargetIds.length === 0) {
      showToast('⚠️ Pilih minimal 1 santri untuk diproses mutasi.');
      return;
    }
    const count = mutateSiswa({
      siswaIds: mutasiTargetIds,
      jenisMutasi: mutasiForm.jenisMutasi,
      keKamarId: mutasiForm.keKamarId || undefined,
      keWaliAsuhId: mutasiForm.keWaliAsuhId || undefined,
      keKelas: mutasiForm.keKelas,
      tanggal: mutasiForm.tanggal || new Date().toISOString().split('T')[0],
      keterangan: mutasiForm.keterangan,
    });

    if (selectedSiswa && mutasiTargetIds.includes(selectedSiswa.id)) {
      setIsDetailModalOpen(false);
      setSelectedSiswa(null);
    }

    setMutasiTargetIds([]);
    setSelectedIdsForDelete([]);
    setIsBulkSelectMode(false);
    setActivePanel('none');
    showToast(`✓ Berhasil memproses mutasi (${mutasiForm.jenisMutasi}) untuk ${count} santri.`);
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
            onClick={() => (activePanel === 'import' ? setActivePanel('none') : handleOpenImport())}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border-[1.5px] border-[#1a1c1a] font-bold text-xs shadow-[2px_2px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider ${
              activePanel === 'import'
                ? 'bg-[#006b54] text-white'
                : 'bg-[#fdfcf9] hover:bg-[#006b54] hover:text-white text-[#1a1c1a]'
            }`}
            title="Buka Form Import Berkas data siswa dari Excel (.xlsx / .xls / .csv)"
          >
            {activePanel === 'import' ? <X className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{activePanel === 'import' ? 'Tutup Import' : 'Import Data Siswa'}</span>
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

          {/* Riwayat Mutasi Button */}
          <button
            type="button"
            onClick={() => setIsRiwayatMutasiOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-[#fdfcf9] text-[#1a1c1a] border-[1.5px] border-[#1a1c1a] font-bold text-xs shadow-[2px_2px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider whitespace-nowrap cursor-pointer"
            title="Lihat riwayat mutasi & perpindahan santri"
          >
            <History className="w-3.5 h-3.5 text-[#006b54]" />
            <span>Riwayat Mutasi ({mutasiList.length})</span>
          </button>

          {/* Add New Student */}
          <button
            type="button"
            onClick={() => {
              if (activePanel === 'add') {
                setActivePanel('none');
              } else {
                handleOpenAdd();
              }
            }}
            className="neo-btn-primary flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            {activePanel === 'add' ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{activePanel === 'add' ? 'TUTUP FORM' : 'TAMBAH SISWA'}</span>
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
              onClick={() => (activePanel === 'import' ? setActivePanel('none') : handleOpenImport())}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase cursor-pointer ${
                activePanel === 'import'
                  ? 'bg-[#1a1c1a] text-white'
                  : 'bg-[#006b54] hover:bg-[#005240] text-white'
              }`}
            >
              {activePanel === 'import' ? <X className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{activePanel === 'import' ? 'Tutup Form Import' : 'Import Berkas'}</span>
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

      {/* MENU AKSI DATA SISWA: TAMBAH, EDIT, MUTASI & HAPUS */}
      <div className="bg-white border-[1.5px] border-[#1a1c1a] p-3.5 neo-shadow font-mono-custom">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#006b54] block">
              Menu Kelola Data Santri
            </span>
            <p className="text-[11px] font-sans text-[#1a1c1a]/75">
              Pilih menu form di samping untuk menambah, mengedit biodata, memutasi kamar/kelas, atau menghapus data santri.
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
              onClick={() => (activePanel === 'mutasi' ? setActivePanel('none') : handleOpenMutasi())}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-[1.5px] border-[#1a1c1a] transition-all cursor-pointer whitespace-nowrap ${
                activePanel === 'mutasi'
                  ? 'bg-amber-600 text-white shadow-none translate-x-0.5 translate-y-0.5'
                  : 'bg-amber-50 text-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] hover:bg-amber-600 hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Form Mutasi</span>
            </button>
            <button
              type="button"
              onClick={() =>
                activePanel === 'hapus' ? setActivePanel('none') : handleDelete(undefined, 'single')
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

      {/* UNIFIED INLINE FORM SECTION (TAMBAH / EDIT / MUTASI / HAPUS) */}
      <div ref={formSectionRef}>
        {activePanel === 'add' && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#1a1c1a] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  Form Tambah Siswa Baru
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Isi data yang tersedia — tetap dapat disimpan meski belum lengkap dan bisa dilengkapi nanti.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form tambah siswa"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addFormError && (
              <div
                role="alert"
                className="mb-4 p-3 bg-rose-50 border border-rose-400 text-rose-900 text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{addFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs font-mono-custom">
              {/* Pas Foto */}
              <div className="p-3 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a]">
                <span className="font-bold text-[#1a1c1a] block mb-2">Pas Foto Santri (Opsional)</span>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 bg-white border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] flex items-center justify-center overflow-hidden shrink-0">
                    {formData.dokumen?.foto ? (
                      <img
                        src={formData.dokumen.foto}
                        alt="Preview Santri"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-1 text-[#1a1c1a]/40">
                        <User className="w-6 h-6 mx-auto" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <input
                      ref={addFotoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleFormFotoUpload}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addFotoInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] font-bold border border-[#1a1c1a] text-xs transition-colors cursor-pointer"
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
                          className="px-2.5 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-300 text-xs font-bold cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-[#1a1c1a]/60">
                      Format JPG, PNG, atau WEBP maksimal 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Identitas Utama */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Nama Lengkap Santri
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ahmad Fauzan Pratama (boleh dikosongkan sementara)"
                    value={formData.nama}
                    onChange={(e) => {
                      setFormData({ ...formData, nama: e.target.value });
                      if (addFormError) setAddFormError(null);
                    }}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-sans focus:outline-none focus:border-[#006b54]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Nama Panggilan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Fauzan"
                    value={formData.panggilan}
                    onChange={(e) => setFormData({ ...formData, panggilan: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">NISN</label>
                  <input
                    type="text"
                    placeholder="Otomatis jika kosong"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) =>
                      setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
                  >
                    <option value="L">Laki-laki (Putra)</option>
                    <option value="P">Perempuan (Putri)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">Kelas SD</label>
                  <select
                    value={formData.kelas}
                    onChange={(e) =>
                      setFormData({ ...formData, kelas: e.target.value as Siswa['kelas'] })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
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
                  <label className="block font-bold text-[#1a1c1a] mb-1">Status Santri</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as Siswa['status'] })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-bold focus:outline-none focus:border-[#006b54]"
                  >
                    <option value="Aktif">Aktif di Asrama</option>
                    <option value="Sakit">Sakit (Rawat UKS)</option>
                    <option value="Izin Pulang">Izin Pulang (Keluarga)</option>
                  </select>
                </div>
              </div>

              {/* Identitas Kependudukan & Tempat/Tanggal Lahir */}
              <div className="p-3 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] space-y-2.5">
                <span className="font-bold text-[#1a1c1a] block">
                  Identitas Kependudukan & Kelahiran (No. KK, NIK, Tempat & Tanggal Lahir)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[#1a1c1a] mb-1 font-bold">
                      No. KK (Kartu Keluarga)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      placeholder="16 digit No. KK"
                      value={formData.noKk || formData.dokumen?.kkNomor || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          noKk: val,
                          dokumen: { ...formData.dokumen, kkNomor: val },
                        });
                      }}
                      className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs focus:outline-none focus:border-[#006b54]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1a1c1a] mb-1 font-bold">
                      NIK (Nomor Induk Kependudukan)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={16}
                      placeholder="16 digit NIK Santri"
                      value={formData.nik || ''}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs focus:outline-none focus:border-[#006b54]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1a1c1a] mb-1 font-bold">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jepara"
                      value={formData.tempatLahir || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, tempatLahir: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans focus:outline-none focus:border-[#006b54]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1a1c1a] mb-1 font-bold">
                      Tanggal Lahir (Tgl-Bln-Thn)
                    </label>
                    <TanggalLahirInput
                      value={formData.tanggalLahir || ''}
                      onChange={(iso) =>
                        setFormData({ ...formData, tanggalLahir: iso })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">Kamar Asrama</label>
                  <select
                    value={formData.kamarId}
                    onChange={(e) => {
                      const nextKamarId = e.target.value;
                      const kamarObj = kamarList.find((k) => k.id === nextKamarId);
                      setFormData({
                        ...formData,
                        kamarId: nextKamarId,
                        waliAsuhId: kamarObj?.waliAsuhId || formData.waliAsuhId,
                      });
                    }}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
                  >
                    <option value="">-- Belum Ditentukan --</option>
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
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
                  >
                    <option value="">-- Belum Ditentukan --</option>
                    {waliAsuhList.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">Tanggal Masuk (Tgl-Bln-Thn)</label>
                  <TanggalLahirInput
                    value={formData.tanggalMasuk}
                    onChange={(iso) => setFormData({ ...formData, tanggalMasuk: iso })}
                    inputClassName="w-full pl-3 pr-9 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
                  />
                </div>
              </div>

              {/* Orang Tua & Kontak */}
              <div className="p-3 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] space-y-3">
                <span className="font-bold text-[#1a1c1a] block">Data Orang Tua / Wali</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[#1a1c1a] mb-1">Nama Ayah</label>
                    <input
                      type="text"
                      placeholder="Nama ayah"
                      value={formData.orangTua.namaAyah}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          orangTua: { ...formData.orangTua, namaAyah: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1a1c1a] mb-1">Nama Ibu</label>
                    <input
                      type="text"
                      placeholder="Nama ibu"
                      value={formData.orangTua.namaIbu}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          orangTua: { ...formData.orangTua, namaIbu: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                    />
                  </div>
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
                      className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
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
                      className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[#1a1c1a] mb-1">Alamat Lengkap (Jalan / Dusun / RT-RW)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Jl. Sunan Mantingan RT 03/RW 02"
                      value={formData.orangTua.alamat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          orangTua: { ...formData.orangTua, alamat: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[#1a1c1a] mb-1 font-bold">Desa / Kelurahan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Desa Tahunan"
                        value={formData.orangTua.desa || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            orangTua: { ...formData.orangTua, desa: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[#1a1c1a] mb-1 font-bold">Kecamatan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Kec. Tahunan"
                        value={formData.orangTua.kecamatan || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            orangTua: { ...formData.orangTua, kecamatan: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[#1a1c1a] mb-1 font-bold">Kabupaten / Kota</label>
                      <input
                        type="text"
                        placeholder="Contoh: Kab. Jepara"
                        value={formData.orangTua.kabupaten || ''}
                        onChange={(e) => {
                          const nextKab = e.target.value;
                          setFormData({
                            ...formData,
                            orangTua: {
                              ...formData.orangTua,
                              kabupaten: nextKab,
                              kotaAsal: nextKab || formData.orangTua.kotaAsal,
                            },
                          });
                        }}
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">Riwayat Alergi / Kesehatan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tidak ada alergi / Alergi seafood"
                    value={formData.alergi || ''}
                    onChange={(e) => setFormData({ ...formData, alergi: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-sans"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">Catatan Khusus Wali Asuh</label>
                  <input
                    type="text"
                    placeholder="Karakter, kebiasaan tidur, hafalan..."
                    value={formData.catatanKhusus || ''}
                    onChange={(e) => setFormData({ ...formData, catatanKhusus: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-sans"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-[#1a1c1a]">
                <button
                  type="button"
                  onClick={() => setActivePanel('none')}
                  className="neo-btn-outline"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold uppercase tracking-wider border-[1.5px] border-[#1a1c1a] shadow-[2.5px_2.5px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>SIMPAN SISWA BARU</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* INLINE FORM EDIT DATA SISWA */}
        {activePanel === 'edit' && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#1a1c1a] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  Form Edit Data Siswa
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Pilih santri yang ingin diubah lalu perbarui biodata, kamar, kelas, atau kontak orang tua.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form edit siswa"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {siswaList.length === 0 ? (
              <div className="p-5 bg-[#fdfcf9] border border-[#1a1c1a]/30 text-center space-y-3">
                <p className="font-sans text-xs text-[#1a1c1a]/80">
                  Belum ada data santri untuk diedit. Silakan tambahkan siswa baru atau impor dari Excel terlebih dahulu.
                </p>
                <div className="flex flex-wrap justify-center gap-2 font-mono-custom">
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#006b54] text-white text-xs font-bold border border-[#1a1c1a] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buka Form Tambah</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenImport}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#1a1c1a] text-xs font-bold border border-[#1a1c1a] cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Excel / CSV</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono-custom">
                {/* Selector Santri */}
                <div className="p-3.5 bg-emerald-50/60 border-[1.5px] border-[#006b54] space-y-2">
                  <label className="block font-bold text-[#1a1c1a]">
                    Pilih Santri yang Akan Diedit ({siswaList.length} tersedia) *
                  </label>
                  <select
                    value={editTargetId}
                    onChange={(e) => {
                      const next = siswaList.find((s) => s.id === e.target.value);
                      if (next) populateEditFormFromSiswa(next);
                    }}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans font-bold text-[#1a1c1a]"
                  >
                    {siswaList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} — NISN {s.nisn} ({s.kelas} · {getKamar(s.kamarId)?.nama || '-'})
                      </option>
                    ))}
                  </select>
                </div>

                {editFormError && (
                  <div
                    role="alert"
                    className="p-3 bg-rose-50 border border-rose-400 text-rose-900 text-xs font-medium flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{editFormError}</span>
                  </div>
                )}

                {/* Pas Foto */}
                <div className="p-3 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a]">
                  <span className="font-bold text-[#1a1c1a] block mb-2">Pas Foto Santri</span>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-20 bg-white border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] flex items-center justify-center overflow-hidden shrink-0">
                      {formData.dokumen?.foto ? (
                        <img
                          src={formData.dokumen.foto}
                          alt="Preview Santri"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-1 text-[#1a1c1a]/40">
                          <User className="w-6 h-6 mx-auto" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <input
                        ref={editFotoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={handleFormFotoUpload}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editFotoInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] font-bold border border-[#1a1c1a] text-xs transition-colors cursor-pointer"
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
                            className="px-2.5 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-300 text-xs font-bold cursor-pointer"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-[#1a1c1a]/60">
                        Format JPG, PNG, atau WEBP maksimal 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#1a1c1a] mb-1">
                      Nama Lengkap Santri
                    </label>
                    <input
                      type="text"
                      value={formData.nama}
                      onChange={(e) => {
                        setFormData({ ...formData, nama: e.target.value });
                        if (editFormError) setEditFormError(null);
                      }}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-sans focus:outline-none focus:border-[#006b54]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">Nama Panggilan</label>
                    <input
                      type="text"
                      value={formData.panggilan}
                      onChange={(e) => setFormData({ ...formData, panggilan: e.target.value })}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">NISN</label>
                    <input
                      type="text"
                      value={formData.nisn}
                      onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">Jenis Kelamin</label>
                    <select
                      value={formData.jenisKelamin}
                      onChange={(e) =>
                        setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })
                      }
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
                    >
                      <option value="L">Laki-laki (Putra)</option>
                      <option value="P">Perempuan (Putri)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">Kelas SD</label>
                    <select
                      value={formData.kelas}
                      onChange={(e) =>
                        setFormData({ ...formData, kelas: e.target.value as Siswa['kelas'] })
                      }
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
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
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-bold focus:outline-none focus:border-[#006b54]"
                    >
                      <option value="Aktif">Aktif di Asrama</option>
                      <option value="Sakit">Sakit (Rawat UKS)</option>
                      <option value="Izin Pulang">Izin Pulang (Keluarga)</option>
                      <option value="Mutasi Keluar">Mutasi Keluar Asrama</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">Kamar Asrama</label>
                    <select
                      value={formData.kamarId}
                      onChange={(e) => {
                        const nextKamarId = e.target.value;
                        const kamarObj = kamarList.find((k) => k.id === nextKamarId);
                        setFormData({
                          ...formData,
                          kamarId: nextKamarId,
                          waliAsuhId: kamarObj?.waliAsuhId || formData.waliAsuhId,
                        });
                      }}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
                    >
                      <option value="">-- Belum Ditentukan --</option>
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
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
                    >
                      <option value="">-- Belum Ditentukan --</option>
                      {waliAsuhList.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">Tanggal Masuk (Tgl-Bln-Thn)</label>
                    <TanggalLahirInput
                      value={formData.tanggalMasuk}
                      onChange={(iso) => setFormData({ ...formData, tanggalMasuk: iso })}
                      inputClassName="w-full pl-3 pr-9 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs focus:outline-none focus:border-[#006b54]"
                    />
                  </div>
                </div>

                {/* Nomor Identitas Legal & TTL */}
                <div className="p-3 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] space-y-2.5">
                  <span className="font-bold text-[#1a1c1a] block">
                    Identitas Kependudukan & Kelahiran (NIK, No. KK, TTL, Akta)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[#1a1c1a] mb-1">NIK Santri</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={16}
                        placeholder="16 digit NIK Santri"
                        value={formData.nik || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, nik: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#1a1c1a] mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        placeholder="Contoh: Jepara"
                        value={formData.tempatLahir || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, tempatLahir: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[#1a1c1a] mb-1">Tanggal Lahir (Tgl-Bln-Thn)</label>
                      <TanggalLahirInput
                        value={formData.tanggalLahir || ''}
                        onChange={(iso) =>
                          setFormData({ ...formData, tanggalLahir: iso })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[#1a1c1a] mb-1">Nomor Kartu Keluarga (KK)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={16}
                        placeholder="16 digit No. KK"
                        value={formData.noKk || formData.dokumen?.kkNomor || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            noKk: val,
                            dokumen: { ...formData.dokumen, kkNomor: val },
                          });
                        }}
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#1a1c1a] mb-1">NIK KTP Orang Tua</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={16}
                        placeholder="16 digit NIK Orang Tua"
                        value={formData.dokumen?.ktpNomor || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dokumen: { ...formData.dokumen, ktpNomor: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#1a1c1a] mb-1">No. Akta Kelahiran</label>
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
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Data Orang Tua */}
                <div className="p-3 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] space-y-3">
                  <span className="font-bold text-[#1a1c1a] block">Data Orang Tua / Wali</span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
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
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#1a1c1a] mb-1">No. WhatsApp</label>
                      <input
                        type="text"
                        value={formData.orangTua.noHp}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            orangTua: { ...formData.orangTua, noHp: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
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
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[#1a1c1a] mb-1">Alamat Lengkap (Jalan / Dusun / RT-RW)</label>
                      <input
                        type="text"
                        placeholder="Contoh: Jl. Sunan Mantingan RT 03/RW 02"
                        value={formData.orangTua.alamat}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            orangTua: { ...formData.orangTua, alamat: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[#1a1c1a] mb-1 font-bold">Desa / Kelurahan</label>
                        <input
                          type="text"
                          placeholder="Contoh: Desa Tahunan"
                          value={formData.orangTua.desa || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              orangTua: { ...formData.orangTua, desa: e.target.value },
                            })
                          }
                          className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[#1a1c1a] mb-1 font-bold">Kecamatan</label>
                        <input
                          type="text"
                          placeholder="Contoh: Kec. Tahunan"
                          value={formData.orangTua.kecamatan || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              orangTua: { ...formData.orangTua, kecamatan: e.target.value },
                            })
                          }
                          className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[#1a1c1a] mb-1 font-bold">Kabupaten / Kota</label>
                        <input
                          type="text"
                          placeholder="Contoh: Kab. Jepara"
                          value={formData.orangTua.kabupaten || ''}
                          onChange={(e) => {
                            const nextKab = e.target.value;
                            setFormData({
                              ...formData,
                              orangTua: {
                                ...formData.orangTua,
                                kabupaten: nextKab,
                                kotaAsal: nextKab || formData.orangTua.kotaAsal,
                              },
                            });
                          }}
                          className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">Riwayat Alergi / Kesehatan</label>
                    <input
                      type="text"
                      value={formData.alergi || ''}
                      onChange={(e) => setFormData({ ...formData, alergi: e.target.value })}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-sans"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">Catatan Khusus Wali Asuh</label>
                    <input
                      type="text"
                      value={formData.catatanKhusus || ''}
                      onChange={(e) => setFormData({ ...formData, catatanKhusus: e.target.value })}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-sans"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1a1c1a]">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const target = siswaList.find((s) => s.id === editTargetId);
                        if (target) handleOpenMutasi([target]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-[#1a1c1a] border-[1.5px] border-[#1a1c1a] bg-amber-50 hover:bg-amber-100 font-bold text-xs uppercase transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Mutasikan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = siswaList.find((s) => s.id === editTargetId);
                        if (target) handleDelete(target, 'single');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-700 border-[1.5px] border-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white font-bold text-xs uppercase transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Santri Ini</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePanel('none')}
                      className="neo-btn-outline"
                    >
                      BATAL
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold uppercase tracking-wider border-[1.5px] border-[#1a1c1a] shadow-[2.5px_2.5px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
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

        {/* INLINE FORM MUTASI / PERPINDAHAN SISWA */}
        {activePanel === 'mutasi' && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#1a1c1a] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  Form Mutasi & Perpindahan Siswa
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Pindahkan santri antar kamar/wali asuh, naik/pindah kelas, atau catat mutasi keluar asrama.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form mutasi siswa"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {siswaList.length === 0 ? (
              <div className="p-5 bg-[#fdfcf9] border border-[#1a1c1a]/30 text-center space-y-3">
                <p className="font-sans text-xs text-[#1a1c1a]/80">
                  Belum ada data santri yang dapat dimutasi. Silakan tambahkan siswa baru atau impor dari Excel terlebih dahulu.
                </p>
                <div className="flex flex-wrap justify-center gap-2 font-mono-custom">
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#006b54] text-white text-xs font-bold border border-[#1a1c1a] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buka Form Tambah</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenImport}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#1a1c1a] text-xs font-bold border border-[#1a1c1a] cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Excel / CSV</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmMutasi} className="space-y-4 text-xs font-mono-custom">
                {/* Pilih 1 atau Banyak Santri */}
                <div className="p-3.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#1a1c1a]">
                      1. Pilih Santri untuk Mutasi ({mutasiTargetIds.length} dipilih) *
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMutasiTargetIds(siswaList.map((s) => s.id))}
                        className="px-2 py-1 bg-white border border-[#1a1c1a] text-[10px] font-bold hover:bg-[#1a1c1a] hover:text-white cursor-pointer"
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setMutasiTargetIds([])}
                        className="px-2 py-1 bg-white border border-[#1a1c1a] text-[10px] font-bold hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                      >
                        Reset Pilihan
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={mutasiSearchQuery}
                    onChange={(e) => setMutasiSearchQuery(e.target.value)}
                    placeholder="Cari nama atau NISN santri..."
                    className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                  />

                  <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1">
                    {siswaList
                      .filter(
                        (s) =>
                          !mutasiSearchQuery.trim() ||
                          s.nama.toLowerCase().includes(mutasiSearchQuery.toLowerCase()) ||
                          s.nisn.includes(mutasiSearchQuery)
                      )
                      .map((st) => {
                        const checked = mutasiTargetIds.includes(st.id);
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() =>
                              setMutasiTargetIds((prev) =>
                                prev.includes(st.id)
                                  ? prev.filter((id) => id !== st.id)
                                  : [...prev, st.id]
                              )
                            }
                            className={`flex items-center justify-between gap-2 px-2.5 py-2 border text-left transition-colors cursor-pointer ${
                              checked
                                ? 'bg-emerald-50 border-[#006b54] text-[#1a1c1a]'
                                : 'bg-white border-[#1a1c1a]/25 hover:border-[#1a1c1a]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {checked ? (
                                <CheckSquare className="w-4 h-4 text-[#006b54] shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-[#1a1c1a]/40 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="font-sans font-bold truncate">{st.nama}</div>
                                <div className="text-[10px] text-[#1a1c1a]/65 truncate">
                                  {st.kelas} · {getKamar(st.kamarId)?.nama || '-'} ({st.status})
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Jenis Mutasi */}
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1.5">
                    2. Jenis Mutasi / Perpindahan *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        'Pindah Kamar',
                        'Pindah Kelas',
                        'Pindah Kamar & Kelas',
                        'Mutasi Keluar',
                      ] as MutasiRecord['jenisMutasi'][]
                    ).map((jenis) => {
                      const active = mutasiForm.jenisMutasi === jenis;
                      const isOut = jenis === 'Mutasi Keluar';
                      return (
                        <button
                          key={jenis}
                          type="button"
                          onClick={() =>
                            setMutasiForm((prev) => ({ ...prev, jenisMutasi: jenis }))
                          }
                          className={`px-3 py-2 text-center font-bold border-[1.5px] transition-colors cursor-pointer ${
                            active
                              ? isOut
                                ? 'bg-rose-700 text-white border-[#1a1c1a]'
                                : 'bg-[#006b54] text-white border-[#1a1c1a]'
                              : 'bg-white text-[#1a1c1a] border-[#1a1c1a]/40 hover:border-[#1a1c1a]'
                          }`}
                        >
                          {jenis}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tujuan Kamar & Wali */}
                {(mutasiForm.jenisMutasi === 'Pindah Kamar' ||
                  mutasiForm.jenisMutasi === 'Pindah Kamar & Kelas') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-emerald-50/50 border border-[#006b54]/50">
                    <div>
                      <label className="block font-bold text-[#1a1c1a] mb-1">
                        Pindah ke Kamar Tujuan *
                      </label>
                      <select
                        value={mutasiForm.keKamarId}
                        onChange={(e) => {
                          const kamarId = e.target.value;
                          const k = getKamar(kamarId);
                          setMutasiForm((prev) => ({
                            ...prev,
                            keKamarId: kamarId,
                            keWaliAsuhId: k?.waliAsuhId || prev.keWaliAsuhId,
                          }));
                        }}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
                      >
                        <option value="">-- Belum Ditentukan --</option>
                        {kamarList.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.nama} ({k.gedung})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#1a1c1a] mb-1">
                        Wali Asuh Tujuan
                      </label>
                      <select
                        value={mutasiForm.keWaliAsuhId}
                        onChange={(e) =>
                          setMutasiForm((prev) => ({ ...prev, keWaliAsuhId: e.target.value }))
                        }
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
                      >
                        <option value="">-- Belum Ditentukan --</option>
                        {waliAsuhList.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Tujuan Kelas */}
                {(mutasiForm.jenisMutasi === 'Pindah Kelas' ||
                  mutasiForm.jenisMutasi === 'Pindah Kamar & Kelas') && (
                  <div className="p-3.5 bg-emerald-50/50 border border-[#006b54]/50">
                    <label className="block font-bold text-[#1a1c1a] mb-1">
                      Pindah ke Kelas Tujuan
                    </label>
                    <select
                      value={mutasiForm.keKelas}
                      onChange={(e) =>
                        setMutasiForm((prev) => ({
                          ...prev,
                          keKelas: e.target.value as Siswa['kelas'],
                        }))
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
                )}

                {mutasiForm.jenisMutasi === 'Mutasi Keluar' && (
                  <div className="p-3 bg-rose-50 border border-rose-600 text-rose-950 font-sans text-xs">
                    Status santri terpilih akan diubah menjadi <strong>Mutasi Keluar</strong> dan tercatat di Riwayat Mutasi. Jika ingin menghapus permanen karena salah input, gunakan <strong>Form Hapus</strong>.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">
                      Tanggal Mutasi
                    </label>
                    <input
                      type="date"
                      value={mutasiForm.tanggal}
                      onChange={(e) =>
                        setMutasiForm((prev) => ({ ...prev, tanggal: e.target.value }))
                      }
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">
                      Alasan / Keterangan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Koreksi kamar, kenaikan kelas, pindah sekolah..."
                      value={mutasiForm.keterangan}
                      onChange={(e) =>
                        setMutasiForm((prev) => ({ ...prev, keterangan: e.target.value }))
                      }
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-sans"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1a1c1a]">
                  <button
                    type="button"
                    onClick={() => setIsRiwayatMutasiOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] font-bold text-xs hover:bg-[#1a1c1a] hover:text-white transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-[#006b54]" />
                    <span>Lihat Riwayat Mutasi ({mutasiList.length})</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePanel('none')}
                      className="neo-btn-outline"
                    >
                      BATAL
                    </button>
                    <button
                      type="submit"
                      disabled={mutasiTargetIds.length === 0}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#006b54] hover:bg-[#005240] disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider border-[1.5px] border-[#1a1c1a] shadow-[2.5px_2.5px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>SIMPAN MUTASI ({mutasiTargetIds.length})</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* INLINE FORM HAPUS DATA SISWA */}
        {activePanel === 'hapus' && (
          <div className="bg-white border-[1.5px] border-rose-700 shadow-[5px_5px_0px_#9f1239] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-rose-700">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-rose-900 tracking-tight">
                  Form Hapus Data Siswa
                </h2>
                <p className="text-xs font-mono-custom text-rose-900/75 mt-0.5">
                  Hapus data santri yang salah input secara satuan, beberapa santri sekaligus, atau kosongkan seluruh daftar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form hapus siswa"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {siswaList.length === 0 ? (
              <div className="p-5 bg-[#fdfcf9] border border-[#1a1c1a]/30 text-center space-y-2">
                <p className="font-sans text-xs text-[#1a1c1a]/80">
                  Saat ini tidak ada data santri tersimpan (0 santri).
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-mono-custom">
                {/* Mode Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHapusMode('single');
                      if (!hapusSingleId && siswaList[0]) setHapusSingleId(siswaList[0].id);
                    }}
                    className={`px-3 py-2 font-bold border-[1.5px] cursor-pointer transition-colors ${
                      hapusMode === 'single'
                        ? 'bg-rose-700 text-white border-[#1a1c1a]'
                        : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40 hover:border-[#1a1c1a]'
                    }`}
                  >
                    1. Hapus 1 Santri
                  </button>
                  <button
                    type="button"
                    onClick={() => setHapusMode('multiple')}
                    className={`px-3 py-2 font-bold border-[1.5px] cursor-pointer transition-colors ${
                      hapusMode === 'multiple'
                        ? 'bg-rose-700 text-white border-[#1a1c1a]'
                        : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40 hover:border-[#1a1c1a]'
                    }`}
                  >
                    2. Hapus Beberapa Santri
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
                    3. Hapus Semua ({siswaList.length})
                  </button>
                </div>

                {/* Mode 1: Hapus 1 Santri */}
                {hapusMode === 'single' && (
                  <form onSubmit={confirmDeleteSingle} className="space-y-3">
                    <div>
                      <label className="block font-bold text-[#1a1c1a] mb-1">
                        Pilih Santri yang Akan Dihapus *
                      </label>
                      <select
                        value={hapusSingleId}
                        onChange={(e) => setHapusSingleId(e.target.value)}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-sans font-bold"
                      >
                        {siswaList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nama} — NISN {s.nisn} ({s.kelas} · {getKamar(s.kamarId)?.nama || '-'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {(() => {
                      const target = siswaList.find((s) => s.id === hapusSingleId);
                      if (!target) return null;
                      return (
                        <div className="p-3.5 bg-rose-50 border-[1.5px] border-rose-600 text-rose-950 space-y-1">
                          <div className="font-bold text-sm font-sans">{target.nama}</div>
                          <div>
                            NISN: <strong>{target.nisn}</strong> · Kelas: <strong>{target.kelas}</strong>
                          </div>
                          <div>
                            Kamar: <strong>{getKamar(target.kamarId)?.nama || '-'}</strong> · Wali Asuh:{' '}
                            <strong>{getWaliAsuh(target.waliAsuhId)?.nama || '-'}</strong>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex justify-end gap-2 pt-2 border-t border-rose-200">
                      <button
                        type="button"
                        onClick={() => setActivePanel('none')}
                        className="neo-btn-outline"
                      >
                        BATAL
                      </button>
                      <button
                        type="submit"
                        disabled={!hapusSingleId}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white font-bold text-xs uppercase border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>YA, HAPUS SANTRI INI</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Mode 2: Hapus Beberapa Santri */}
                {hapusMode === 'multiple' && (
                  <form onSubmit={confirmDeleteBulk} className="space-y-3">
                    <div className="p-3.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-[#1a1c1a]">
                          Centang Santri yang Akan Dihapus ({hapusSelectedIds.length} dipilih)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setHapusSelectedIds(siswaList.map((s) => s.id))}
                            className="px-2 py-1 bg-white border border-[#1a1c1a] text-[10px] font-bold hover:bg-[#1a1c1a] hover:text-white cursor-pointer"
                          >
                            Pilih Semua
                          </button>
                          <button
                            type="button"
                            onClick={() => setHapusSelectedIds([])}
                            className="px-2 py-1 bg-white border border-[#1a1c1a] text-[10px] font-bold cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={hapusSearchQuery}
                        onChange={(e) => setHapusSearchQuery(e.target.value)}
                        placeholder="Cari nama atau NISN santri..."
                        className="w-full px-3 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                      />

                      <div className="max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1">
                        {siswaList
                          .filter(
                            (s) =>
                              !hapusSearchQuery.trim() ||
                              s.nama.toLowerCase().includes(hapusSearchQuery.toLowerCase()) ||
                              s.nisn.includes(hapusSearchQuery)
                          )
                          .map((st) => {
                            const checked = hapusSelectedIds.includes(st.id);
                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() =>
                                  setHapusSelectedIds((prev) =>
                                    prev.includes(st.id)
                                      ? prev.filter((id) => id !== st.id)
                                      : [...prev, st.id]
                                  )
                                }
                                className={`flex items-center gap-2 px-2.5 py-2 border text-left transition-colors cursor-pointer ${
                                  checked
                                    ? 'bg-rose-50 border-rose-700 text-rose-950'
                                    : 'bg-white border-[#1a1c1a]/25 hover:border-[#1a1c1a]'
                                }`}
                              >
                                {checked ? (
                                  <CheckSquare className="w-4 h-4 text-rose-700 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-[#1a1c1a]/40 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="font-sans font-bold truncate">{st.nama}</div>
                                  <div className="text-[10px] text-[#1a1c1a]/65 truncate">
                                    {st.kelas} · {getKamar(st.kamarId)?.nama || '-'}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-rose-200">
                      <button
                        type="button"
                        onClick={() => setActivePanel('none')}
                        className="neo-btn-outline"
                      >
                        BATAL
                      </button>
                      <button
                        type="submit"
                        disabled={hapusSelectedIds.length === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white font-bold text-xs uppercase border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>HAPUS {hapusSelectedIds.length} SANTRI TERPILIH</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Mode 3: Hapus Semua */}
                {hapusMode === 'all' && (
                  <form onSubmit={confirmDeleteAll} className="space-y-3">
                    <div className="p-3.5 bg-rose-50 border-[1.5px] border-rose-600 text-rose-950 space-y-1.5">
                      <div className="font-bold">
                        Peringatan: Anda akan menghapus seluruh {siswaList.length} data santri!
                      </div>
                      <p className="font-sans text-xs">
                        Catatan presensi, ibadah, kesehatan, konseling, perkembangan, pelanggaran, dan riwayat mutasi terkait santri juga akan dikosongkan. Data kamar asrama dan wali asuh tetap aman.
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
                        Saya yakin ingin menghapus seluruh data santri agar bisa diisi ulang.
                      </span>
                    </label>

                    <div className="flex justify-end gap-2 pt-2 border-t border-rose-200">
                      <button
                        type="button"
                        onClick={() => setActivePanel('none')}
                        className="neo-btn-outline"
                      >
                        BATAL
                      </button>
                      <button
                        type="submit"
                        disabled={!hapusAllConfirmed}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white font-bold text-xs uppercase border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>YA, KOSONGKAN SEMUA DATA</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {activePanel === 'import' && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#006b54] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <span className="text-[10px] font-mono-custom font-bold uppercase tracking-wider text-[#006b54] block mb-0.5">
                  // IMPORT BERKAS DATA SANTRI (EXCEL & CSV)
                </span>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  Form Import Berkas Data Siswa
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Unggah berkas (.xlsx, .xls, .csv, atau .txt) — cukup berisi Nama Siswa saja sudah bisa langsung diimpor dan disimpan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form import berkas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteImport} className="space-y-4 font-mono-custom text-xs">
              {/* Banner Template Excel */}
              <div className="p-3.5 bg-emerald-50 border-[1.5px] border-[#006b54] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#006b54] text-xs uppercase flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Cukup Nama Siswa — Kolom Lain Opsional</span>
                  </div>
                  <p className="text-[11px] text-[#1a1c1a]/70 mt-0.5">
                    Anda boleh mengunggah daftar nama siswa saja (dengan atau tanpa header), atau gunakan template Excel lengkap.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#fdfcf9] hover:bg-[#006b54] hover:text-white text-[#1a1c1a] border-[1.5px] border-[#1a1c1a] font-bold text-xs shadow-[2px_2px_0px_#1a1c1a] transition-all shrink-0 uppercase tracking-wider cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Dropzone / File Picker */}
              <input
                ref={importFileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImportFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {!importFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleImportDrop}
                  onClick={() => importFileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#1a1c1a] p-7 text-center bg-[#fdfcf9] hover:bg-emerald-50/40 cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 mx-auto bg-[#1a1c1a] text-[#fdfcf9] flex items-center justify-center border border-[#1a1c1a] mb-3 shadow-[2.5px_2.5px_0px_#006b54]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="font-syne font-bold text-sm text-[#1a1c1a]">
                    Klik untuk Memilih atau Seret Berkas Excel / CSV / TXT ke Sini
                  </p>
                  <p className="text-[11px] text-[#1a1c1a]/60 mt-1 mb-3">
                    Mendukung .xlsx, .xls, .csv, dan .txt (cukup kolom Nama Siswa sudah bisa disimpan)
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#006b54] text-white font-bold text-xs border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] uppercase">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Pilih Berkas</span>
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] flex flex-wrap items-center justify-between gap-3 shadow-[2.5px_2.5px_0px_#1a1c1a]">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-9 h-9 bg-[#006b54] text-white flex items-center justify-center shrink-0 border border-[#1a1c1a]">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs text-[#1a1c1a] truncate">
                        {importFile.name}
                      </div>
                      <div className="text-[10px] text-[#1a1c1a]/60">
                        {(importFile.size / 1024).toFixed(1)} KB · Berkas terpilih
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => importFileInputRef.current?.click()}
                      className="px-2.5 py-1 text-[11px] border border-[#1a1c1a] bg-white hover:bg-[#1a1c1a] hover:text-white font-bold uppercase cursor-pointer"
                    >
                      Ganti Berkas
                    </button>
                    <button
                      type="button"
                      onClick={handleResetImport}
                      className="px-2 py-1 border border-rose-600 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold uppercase cursor-pointer"
                    >
                      Hapus Berkas
                    </button>
                  </div>
                </div>
              )}

              {/* Parsing Indicator */}
              {isParsingImport && (
                <div className="p-4 border-[1.5px] border-[#1a1c1a] bg-amber-50 text-center flex items-center justify-center gap-2 text-xs font-bold text-amber-900">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-800" />
                  <span>Menganalisis dan memvalidasi isi berkas spreadsheet...</span>
                </div>
              )}

              {/* Validation & Preview */}
              {importParseResult && !isParsingImport && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a]">
                      <span className="text-[10px] text-[#1a1c1a]/60 block uppercase">Total Baris</span>
                      <span className="font-bold text-base text-[#1a1c1a]">
                        {importParseResult.totalRows}
                      </span>
                    </div>
                    <div className="p-2.5 bg-emerald-50 border-[1.5px] border-[#006b54]">
                      <span className="text-[10px] text-[#006b54] block uppercase font-bold">
                        Siap Diimpor
                      </span>
                      <span className="font-bold text-base text-[#006b54]">
                        {importParseResult.validRows} Siswa
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-[#1a1c1a]/60 block uppercase">
                        Peringatan / Catatan
                      </span>
                      <span className="font-bold text-base text-[#1a1c1a]">
                        {importParseResult.warnings.length} Catatan
                      </span>
                    </div>
                  </div>

                  {importParseResult.errors.length > 0 && (
                    <div className="p-3 bg-rose-50 border-[1.5px] border-rose-500 text-rose-900 text-xs">
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-700">
                        <AlertCircle className="w-4 h-4" />
                        <span>Kendala Validasi Berkas ({importParseResult.errors.length}):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {importParseResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {importParseResult.warnings.length > 0 && (
                    <div className="p-2.5 bg-amber-50 border border-amber-400 text-amber-900 text-[11px] max-h-24 overflow-y-auto">
                      <div className="font-bold flex items-center gap-1 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Penyesuaian Otomatis ({importParseResult.warnings.length}):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {importParseResult.warnings.slice(0, 5).map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                        {importParseResult.warnings.length > 5 && (
                          <li className="font-bold italic">
                            ...dan {importParseResult.warnings.length - 5} penyesuaian lainnya.
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {importParseResult.validRows > 0 && (
                    <div>
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
                        <span className="font-bold text-xs uppercase text-[#1a1c1a]">
                          // PRATINJAU DATA BERKAS ({showAllImportPreview ? importParseResult.data.length : Math.min(importParseResult.data.length, 5)} DARI {importParseResult.data.length} SANTRI)
                        </span>
                        {importParseResult.data.length > 5 && (
                          <button
                            type="button"
                            onClick={() => setShowAllImportPreview((prev) => !prev)}
                            className="text-[10px] font-bold text-[#006b54] hover:underline uppercase cursor-pointer"
                          >
                            {showAllImportPreview ? 'Ringkas (5 Baris)' : 'Lihat Semua Baris'}
                          </button>
                        )}
                      </div>

                      <div className="overflow-x-auto max-h-64 border-[1.5px] border-[#1a1c1a] bg-white">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-[#1a1c1a] text-[#fdfcf9] font-bold text-[10px] uppercase sticky top-0">
                            <tr>
                              <th className="p-2">No</th>
                              <th className="p-2">NISN</th>
                              <th className="p-2">NAMA LENGKAP</th>
                              <th className="p-2">L/P</th>
                              <th className="p-2">KELAS</th>
                              <th className="p-2">KAMAR</th>
                              <th className="p-2">WALI ASUH</th>
                              <th className="p-2">STATUS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1a1c1a]/20">
                            {(showAllImportPreview
                              ? importParseResult.data
                              : importParseResult.data.slice(0, 5)
                            ).map((s, idx) => (
                              <tr key={idx} className="hover:bg-[#1a1c1a]/5">
                                <td className="p-2 text-[#1a1c1a]/60 font-bold">{idx + 1}</td>
                                <td className="p-2 font-mono text-[10px] font-bold">{s.nisn}</td>
                                <td className="p-2 font-bold font-syne">{s.nama}</td>
                                <td className="p-2">{s.jenisKelamin}</td>
                                <td className="p-2">{s.kelas}</td>
                                <td className="p-2 font-medium">{getKamar(s.kamarId)?.nama || '-'}</td>
                                <td className="p-2 text-[#006b54] font-medium">
                                  {getWaliAsuh(s.waliAsuhId)?.nama || '-'}
                                </td>
                                <td className="p-2">
                                  <span className="px-1.5 py-0.5 border border-[#1a1c1a] text-[9px] font-bold">
                                    {s.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {importParseResult.validRows > 0 && (
                    <div className="p-3 bg-[#1a1c1a]/5 border-[1.5px] border-[#1a1c1a] space-y-2">
                      <span className="font-bold text-xs uppercase text-[#1a1c1a] block">
                        PILIH METODE IMPORT DATA:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label
                          className={`p-2.5 border-[1.5px] cursor-pointer flex flex-col justify-between transition-all ${
                            importMode === 'upsert'
                              ? 'border-[#006b54] bg-emerald-50 shadow-[2px_2px_0px_#006b54]'
                              : 'border-[#1a1c1a] bg-[#fdfcf9]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="inlineImportMode"
                              value="upsert"
                              checked={importMode === 'upsert'}
                              onChange={() => setImportMode('upsert')}
                              className="accent-[#006b54]"
                            />
                            <span className="font-bold text-xs text-[#1a1c1a]">
                              Perbarui & Tambah
                            </span>
                          </div>
                          <p className="text-[10px] text-[#1a1c1a]/70 mt-1 pl-5">
                            (Rekomendasi) Update siswa jika NISN sama, tambah jika baru.
                          </p>
                        </label>

                        <label
                          className={`p-2.5 border-[1.5px] cursor-pointer flex flex-col justify-between transition-all ${
                            importMode === 'append'
                              ? 'border-[#006b54] bg-emerald-50 shadow-[2px_2px_0px_#006b54]'
                              : 'border-[#1a1c1a] bg-[#fdfcf9]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="inlineImportMode"
                              value="append"
                              checked={importMode === 'append'}
                              onChange={() => setImportMode('append')}
                              className="accent-[#006b54]"
                            />
                            <span className="font-bold text-xs text-[#1a1c1a]">
                              Tambahkan Semua
                            </span>
                          </div>
                          <p className="text-[10px] text-[#1a1c1a]/70 mt-1 pl-5">
                            Tambahkan semua baris berkas ke daftar santri yang sudah ada.
                          </p>
                        </label>

                        <label
                          className={`p-2.5 border-[1.5px] cursor-pointer flex flex-col justify-between transition-all ${
                            importMode === 'replace'
                              ? 'border-rose-600 bg-rose-50 shadow-[2px_2px_0px_#e11d48]'
                              : 'border-[#1a1c1a] bg-[#fdfcf9]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="inlineImportMode"
                              value="replace"
                              checked={importMode === 'replace'}
                              onChange={() => setImportMode('replace')}
                              className="accent-rose-600"
                            />
                            <span className="font-bold text-xs text-rose-700">
                              Timpa Seluruh Data
                            </span>
                          </div>
                          <p className="text-[10px] text-[#1a1c1a]/70 mt-1 pl-5">
                            Hapus data santri lama dan gantikan penuh dengan berkas ini.
                          </p>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t-[1.5px] border-[#1a1c1a] flex flex-col sm:flex-row justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActivePanel('none')}
                  className="neo-btn-outline"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={!importParseResult || importParseResult.validRows === 0}
                  className={`px-5 py-2 border-[1.5px] border-[#1a1c1a] font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-[2.5px_2.5px_0px_#1a1c1a] transition-all ${
                    !importParseResult || importParseResult.validRows === 0
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                      : 'bg-[#006b54] hover:bg-[#005240] text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {importParseResult?.validRows
                      ? `IMPORT ${importParseResult.validRows} SISWA SEKARANG`
                      : 'IMPORT DATA SEKARANG'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
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
          <option value="Mutasi Keluar">Status: Mutasi Keluar</option>
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

        {/* Toggle Bulk Select Mode (Mutasi & Delete) */}
        {siswaList.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => {
                setIsBulkSelectMode((prev) => !prev);
                setSelectedIdsForDelete([]);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-custom font-bold border-[1.5px] border-[#1a1c1a] transition-colors cursor-pointer whitespace-nowrap ${
                isBulkSelectMode
                  ? 'bg-[#1a1c1a] text-white'
                  : 'bg-white text-[#1a1c1a] hover:bg-emerald-50 hover:text-[#006b54]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isBulkSelectMode ? 'Batal Pilih' : 'Pilih (Mutasi / Hapus)'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDelete(undefined, 'all')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-custom font-bold border-[1.5px] border-rose-700 bg-rose-50 text-rose-800 hover:bg-rose-700 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              title="Hapus seluruh data siswa"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          </>
        )}
      </div>

      {/* Bulk Action Bar: Mutasi & Hapus */}
      {isBulkSelectMode && (
        <div className="p-3 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] shadow-[2.5px_2.5px_0px_#1a1c1a] flex flex-wrap items-center justify-between gap-3 font-mono-custom text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="px-2.5 py-1 bg-white border border-[#1a1c1a] font-bold hover:bg-[#1a1c1a] hover:text-white transition-colors cursor-pointer"
            >
              {filteredSiswa.length > 0 &&
              filteredSiswa.every((s) => selectedIdsForDelete.includes(s.id))
                ? 'Batal Pilih Semua'
                : `Pilih Semua (${filteredSiswa.length})`}
            </button>
            <span className="font-bold text-[#1a1c1a]">
              {selectedIdsForDelete.length} santri dipilih
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={selectedIdsForDelete.length === 0}
              onClick={() => {
                const targets = siswaList.filter((s) => selectedIdsForDelete.includes(s.id));
                handleOpenMutasi(targets);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#006b54] hover:bg-[#005240] disabled:opacity-40 text-white font-bold border border-[#1a1c1a] transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Mutasi Terpilih ({selectedIdsForDelete.length})</span>
            </button>
            <button
              type="button"
              disabled={selectedIdsForDelete.length === 0}
              onClick={() => handleDelete(undefined, 'multiple')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white font-bold border border-[#1a1c1a] transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Terpilih ({selectedIdsForDelete.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Student Grid with Neo-brutalist Student Cards from Variation 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSiswa.map((siswa) => {
          const kamar = getKamar(siswa.kamarId);
          const wali = getWaliAsuh(siswa.waliAsuhId);
          const isChecked = selectedIdsForDelete.includes(siswa.id);

          const hasFoto = Boolean(siswa.dokumen?.foto);
          const hasKtp = Boolean(siswa.dokumen?.ktp || siswa.dokumen?.ktpNomor);
          const hasKk = Boolean(siswa.dokumen?.kk || siswa.dokumen?.kkNomor || siswa.noKk);
          const hasAkte = Boolean(siswa.dokumen?.akte || siswa.dokumen?.akteNomor);
          const docsCount = [hasFoto, hasKtp, hasKk, hasAkte].filter(Boolean).length;

          return (
            <div
              key={siswa.id}
              className={`bg-white border-[1.5px] neo-shadow p-5 flex flex-col justify-between gap-3.5 relative transition-transform hover:-translate-y-0.5 ${
                isChecked ? 'border-rose-700 ring-2 ring-rose-500/40' : 'border-[#1a1c1a]'
              }`}
            >
              {/* Card Meta: NISN & Status Badge */}
              <div className="flex items-center justify-between text-[#1a1c1a]/60 font-mono-custom text-[0.68rem] uppercase gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isBulkSelectMode && (
                    <button
                      type="button"
                      onClick={() => toggleSelectForDelete(siswa.id)}
                      className="text-[#1a1c1a] hover:text-rose-700 cursor-pointer shrink-0"
                      aria-label={`Pilih ${siswa.nama}`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-rose-700" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <span className="truncate">NISN: {siswa.nisn}</span>
                </div>
                <span
                  className={`status-badge ${
                    siswa.status === 'Sakit' || siswa.status === 'Mutasi Keluar'
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
                    : siswa.status === 'Mutasi Keluar'
                    ? 'MUTASI'
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
                    title={
                      hasKk
                        ? `KK: ${siswa.noKk || siswa.dokumen?.kkNomor || 'Berkas Ada'}`
                        : 'KK belum diunggah'
                    }
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

              {/* Card Actions: Primary RAPOR ASRAMA, Dokumen, WA + Edit, Mutasi & Delete row */}
              <div className="mt-auto pt-2 border-t border-[#1a1c1a]/15 space-y-1.5">
                <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto_auto] gap-1.5">
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
                </div>

                {/* Explicit Edit, Mutasi & Hapus Row */}
                <div className="grid grid-cols-3 gap-1.5 font-mono-custom">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(siswa)}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold border border-[#1a1c1a] bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] transition-colors cursor-pointer whitespace-nowrap"
                    title="Edit Biodata Siswa"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenMutasi([siswa])}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold border border-[#1a1c1a] bg-amber-50 hover:bg-[#006b54] hover:text-white text-[#1a1c1a] transition-colors cursor-pointer whitespace-nowrap"
                    title="Pindahkan kamar, kelas, atau mutasi keluar santri"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Mutasi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(siswa)}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold border border-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white text-rose-800 transition-colors cursor-pointer whitespace-nowrap"
                    title="Hapus permanen data siswa yang salah input"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSiswa.length === 0 && (
        <div className="p-8 text-center bg-white border-[1.5px] border-[#1a1c1a] neo-shadow space-y-4">
          {siswaList.length === 0 ? (
            <>
              <div className="space-y-1">
                <h3 className="font-syne text-lg font-bold text-[#1a1c1a]">
                  Belum Ada Data Santri
                </h3>
                <p className="font-sans text-xs text-[#1a1c1a]/70 max-w-md mx-auto">
                  Silakan tambahkan data anak secara manual melalui form tambah siswa atau impor langsung dari berkas Excel / CSV.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 font-mono-custom">
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Siswa Manual</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenImport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] text-xs font-bold border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Excel / CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Unduh Template Excel</span>
                </button>
              </div>
            </>
          ) : (
            <p className="font-mono-custom text-xs text-[#1a1c1a]/60 uppercase">
              Tidak ada data santri yang cocok dengan pencarian / filter.
            </p>
          )}
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
                      selectedSiswa.status === 'Sakit' || selectedSiswa.status === 'Mutasi Keluar'
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
                  <strong className="font-mono-custom text-[11px]">NIK SANTRI:</strong>{' '}
                  {selectedSiswa.nik || '-'}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">NO. KK:</strong>{' '}
                  {selectedSiswa.noKk || selectedSiswa.dokumen?.kkNomor || '-'}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">TEMPAT, TGL LAHIR:</strong>{' '}
                  {formatTTL(selectedSiswa)}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">KELAS:</strong> {selectedSiswa.kelas}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">KAMAR:</strong> {getKamar(selectedSiswa.kamarId)?.nama || '-'}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">KOTA ASAL:</strong>{' '}
                  {selectedSiswa.orangTua.kotaAsal || '-'}
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
                  <strong className="font-mono-custom text-[11px]">WALI ASUH:</strong>{' '}
                  {getWaliAsuh(selectedSiswa.waliAsuhId)?.nama || '-'}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">ORANG TUA:</strong>{' '}
                  {selectedSiswa.orangTua.namaAyah || '-'} &amp; {selectedSiswa.orangTua.namaIbu || '-'}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">KONTAK WA:</strong>{' '}
                  {selectedSiswa.orangTua.noHp || '-'}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">ALAMAT:</strong>{' '}
                  {selectedSiswa.orangTua.alamat || '-'}
                </div>
                <div>
                  <strong className="font-mono-custom text-[11px]">DESA / KEC / KAB:</strong>{' '}
                  {[
                    selectedSiswa.orangTua.desa ? `Desa ${selectedSiswa.orangTua.desa}` : '',
                    selectedSiswa.orangTua.kecamatan ? `Kec. ${selectedSiswa.orangTua.kecamatan}` : '',
                    selectedSiswa.orangTua.kabupaten ? `Kab. ${selectedSiswa.orangTua.kabupaten}` : '',
                  ]
                    .filter(Boolean)
                    .join(', ') || '-'}
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
                        selectedSiswa.dokumen?.kk || selectedSiswa.dokumen?.kkNomor || selectedSiswa.noKk
                          ? 'text-emerald-700 bg-emerald-100'
                          : 'text-stone-500 bg-stone-100'
                      }`}
                    >
                      {selectedSiswa.dokumen?.kk
                        ? 'BERKAS'
                        : selectedSiswa.dokumen?.kkNomor || selectedSiswa.noKk
                        ? 'NOMOR'
                        : 'KOSONG'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#1a1c1a]/70 font-mono-custom truncate">
                    {selectedSiswa.noKk ||
                      selectedSiswa.dokumen?.kkNomor ||
                      (selectedSiswa.dokumen?.kk ? 'Berkas Ada' : 'Belum ada')}
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
              <div className="flex flex-wrap items-center gap-2">
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
                  onClick={() => handleOpenEdit(selectedSiswa)}
                  className="neo-btn-outline inline-flex items-center gap-1.5 text-[#1a1c1a] bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-white"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  EDIT DATA
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenMutasi([selectedSiswa])}
                  className="neo-btn-outline inline-flex items-center gap-1.5 text-[#1a1c1a] bg-amber-50 hover:bg-[#006b54] hover:text-white"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  MUTASI / PINDAH
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedSiswa)}
                  className="neo-btn-outline inline-flex items-center gap-1.5 text-rose-700 border-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  HAPUS SISWA
                </button>
              </div>
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

      {/* Inline forms Tambah, Edit, Mutasi, Hapus & Import Berkas dirender langsung di atas daftar siswa */}

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

      {/* Modal Riwayat Mutasi tetap menggunakan jendela ringkas */}

      {/* MODAL RIWAYAT MUTASI */}
      <Modal
        isOpen={isRiwayatMutasiOpen}
        onClose={() => setIsRiwayatMutasiOpen(false)}
        title="Riwayat Mutasi Santri"
        subtitle={`CATATAN PERPINDAHAN KAMAR, KELAS & KELUAR (${mutasiList.length} LOG)`}
        maxWidth="2xl"
      >
        <div className="space-y-3 text-xs font-mono-custom">
          {mutasiList.length === 0 ? (
            <div className="p-6 text-center bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a]/30 text-[#1a1c1a]/70 font-sans">
              Belum ada catatan mutasi atau perpindahan santri.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
              {mutasiList.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-white border-[1.5px] border-[#1a1c1a] space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-sm text-[#1a1c1a]">
                        {log.namaSiswa}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold border border-[#1a1c1a] ${
                          log.jenisMutasi === 'Mutasi Keluar'
                            ? 'bg-rose-100 text-rose-900'
                            : 'bg-emerald-100 text-[#006b54]'
                        }`}
                      >
                        {log.jenisMutasi}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#1a1c1a]/65">
                      {log.tanggal} · Oleh: {log.petugas || 'Admin'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-[#fdfcf9] p-2 border border-[#1a1c1a]/15">
                    <div>
                      <span className="text-[#1a1c1a]/55 block text-[10px]">Kamar:</span>
                      <strong>{log.dariKamar || '-'}</strong> → <strong>{log.keKamar || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-[#1a1c1a]/55 block text-[10px]">Kelas:</span>
                      <strong>{log.dariKelas || '-'}</strong> → <strong>{log.keKelas || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-[#1a1c1a]/55 block text-[10px]">Wali Asuh:</span>
                      <strong>{log.dariWali || '-'}</strong> → <strong>{log.keWali || '-'}</strong>
                    </div>
                  </div>

                  {log.keterangan && (
                    <div className="font-sans text-[11px] text-[#1a1c1a]/80">
                      Keterangan: {log.keterangan}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-[#1a1c1a]/20">
            <button
              type="button"
              onClick={() => setIsRiwayatMutasiOpen(false)}
              className="neo-btn-primary"
            >
              TUTUP
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
