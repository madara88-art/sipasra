import React, { useState, useMemo, useRef } from 'react';
import {
  HeartPulse,
  Plus,
  Thermometer,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Search,
  Activity,
  Eye,
  Smile,
  Scissors,
  Sparkles,
  Trash2,
  Edit3,
  Phone,
  FileSpreadsheet,
  Stethoscope,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { CatatanKesehatan, PemeriksaanCKG } from '../../types';
import { Modal } from '../common/Modal';

export const KesehatanView: React.FC = () => {
  const {
    kesehatanList,
    ckgList,
    siswaList,
    addKesehatan,
    updateKesehatan,
    deleteKesehatan,
    updateKesehatanStatus,
    addCKG,
    updateCKG,
    deleteCKG,
    getSiswa,
    getKamar,
    getWaliAsuh,
  } = useApp();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'pemeriksaan' | 'ckg'>('pemeriksaan');

  // Search & Filters for Pemeriksaan Kesehatan
  const [searchPemeriksaan, setSearchPemeriksaan] = useState('');
  const [filterKondisi, setFilterKondisi] = useState<string>('Semua');
  const [filterKamarPemeriksaan, setFilterKamarPemeriksaan] = useState<string>('Semua');

  // Search & Filters for CKG
  const [searchCKG, setSearchCKG] = useState('');
  const [filterGigiCKG, setFilterGigiCKG] = useState<string>('Semua');
  const [filterPenglihatanCKG, setFilterPenglihatanCKG] = useState<string>('Semua');

  // Inline form & notification states for Pemeriksaan Kesehatan
  const [isKesFormOpen, setIsKesFormOpen] = useState(false);
  const [editingKes, setEditingKes] = useState<CatatanKesehatan | null>(null);
  const [deleteKesTarget, setDeleteKesTarget] = useState<{ id: string; nama: string } | null>(null);
  const [deleteCKGTarget, setDeleteCKGTarget] = useState<{ id: string; nama: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [kesFormError, setKesFormError] = useState<string | null>(null);

  const [selectedRecordToUpdate, setSelectedRecordToUpdate] = useState<CatatanKesehatan | null>(null);
  const [quickUpdateKondisi, setQuickUpdateKondisi] = useState<string>('Sembuh');
  const [quickUpdateCatatan, setQuickUpdateCatatan] = useState('');

  const kesFormRef = useRef<HTMLDivElement>(null);

  // Form state for Pemeriksaan Kesehatan
  const defaultKesForm = {
    tanggal: new Date().toISOString().split('T')[0],
    siswaId: siswaList[0]?.id || '',
    namaSiswa: '',
    kamar: '',
    waliAsuh: '',
    kondisi: 'Dalam Perawatan',
    keluhan: '',
    penanganan: '',
    rujukan: 'Tidak Perlu Rujukan (Cukup Rawat UKS Asrama)',
    catatan: '',
    suhuTubuh: '37.0 °C',
    lokasiPerawatan: 'Ruang UKS' as 'Kamar Asrama' | 'Ruang UKS' | 'Puskesmas Tahunan' | 'RSUD RA Kartini Jepara',
  };
  const [kesFormData, setKesFormData] = useState(defaultKesForm);

  // Modal states for CKG
  const [isAddCKGModalOpen, setIsAddCKGModalOpen] = useState(false);
  const [editingCKG, setEditingCKG] = useState<PemeriksaanCKG | null>(null);

  // Form state for CKG
  const defaultCKGForm = {
    tanggal: new Date().toISOString().split('T')[0],
    siswaId: siswaList[0]?.id || '',
    beratBadan: 28.0,
    tinggiBadan: 126,
    penglihatan: 'Normal (6/6)',
    kondisiGigi: 'Bersih & Sehat (Bebas Karies)',
    kondisiKuku: 'Pendek & Bersih',
    kebersihanDiri: 'Sangat Bersih & Mandiri',
    catatan: 'Pertumbuhan fisik normal, kebersihan diri terjaga dengan baik.',
    pemeriksa: 'dr. Nurul Hidayah & Tim UKS Asrama',
  };
  const [ckgFormData, setCkgFormData] = useState(defaultCKGForm);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const scrollToKesForm = () => {
    setTimeout(() => {
      kesFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Synchronize kamar & wali asuh when siswaId changes in Kes Form
  const handleSiswaChangeInKesForm = (id: string) => {
    const s = getSiswa(id);
    const k = getKamar(s?.kamarId);
    const w = getWaliAsuh(s?.waliAsuhId);
    setKesFormData((prev) => ({
      ...prev,
      siswaId: id,
      namaSiswa: s?.nama || prev.namaSiswa,
      kamar: k?.nama || (id ? '' : prev.kamar),
      waliAsuh: w?.nama || (id ? '' : prev.waliAsuh),
    }));
  };

  // Open inline form for Catatan Pemeriksaan Baru
  const handleOpenAddKes = () => {
    const firstSiswa = siswaList[0];
    const k = getKamar(firstSiswa?.kamarId);
    const w = getWaliAsuh(firstSiswa?.waliAsuhId);
    setKesFormData({
      ...defaultKesForm,
      tanggal: new Date().toISOString().split('T')[0],
      siswaId: firstSiswa?.id || '',
      namaSiswa: firstSiswa?.nama || '',
      kamar: k?.nama || '',
      waliAsuh: w?.nama || '',
    });
    setKesFormError(null);
    setEditingKes(null);
    setIsKesFormOpen(true);
    scrollToKesForm();
  };

  // Open inline form for Edit Pemeriksaan Kesehatan
  const handleOpenEditKes = (item: CatatanKesehatan) => {
    const s = getSiswa(item.siswaId);
    const k = getKamar(s?.kamarId);
    const w = getWaliAsuh(s?.waliAsuhId);
    setEditingKes(item);
    setKesFormError(null);
    setKesFormData({
      tanggal: item.tanggal,
      siswaId: item.siswaId,
      namaSiswa: item.namaSiswa || s?.nama || '',
      kamar: item.kamar || k?.nama || '',
      waliAsuh: item.waliAsuh || w?.nama || '',
      kondisi: item.kondisi || item.status || 'Dalam Perawatan',
      keluhan: item.keluhan,
      penanganan: item.penanganan || item.penangananObat || '',
      rujukan: item.rujukan || 'Tidak Perlu Rujukan (Cukup Rawat UKS Asrama)',
      catatan: item.catatan || item.catatanPerkembangan || '',
      suhuTubuh: item.suhuTubuh || '37.0 °C',
      lokasiPerawatan: item.lokasiPerawatan || 'Ruang UKS',
    });
    setIsKesFormOpen(true);
    scrollToKesForm();
  };

  // Save Pemeriksaan Kesehatan (Add or Edit)
  const handleSaveKes = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedSiswa = kesFormData.siswaId ? getSiswa(kesFormData.siswaId) : undefined;
    const resolvedNama = resolvedSiswa?.nama || kesFormData.namaSiswa.trim();

    if (!resolvedNama) {
      setKesFormError('Pilih santri atau isi nama anak terlebih dahulu.');
      return;
    }
    if (!kesFormData.keluhan.trim() || !kesFormData.penanganan.trim()) {
      setKesFormError('Mohon lengkapi data keluhan dan penanganan medis.');
      return;
    }
    setKesFormError(null);

    const payload = {
      tanggal: kesFormData.tanggal,
      siswaId: kesFormData.siswaId,
      namaSiswa: resolvedNama,
      kamar: kesFormData.kamar.trim(),
      waliAsuh: kesFormData.waliAsuh.trim(),
      kondisi: kesFormData.kondisi,
      keluhan: kesFormData.keluhan.trim(),
      penanganan: kesFormData.penanganan.trim(),
      rujukan: kesFormData.rujukan,
      catatan: kesFormData.catatan.trim(),
      suhuTubuh: kesFormData.suhuTubuh.trim(),
      lokasiPerawatan: kesFormData.lokasiPerawatan,
      penangananObat: kesFormData.penanganan.trim(),
      jadwalObat: 'Sesuai resep UKS',
      status: (kesFormData.kondisi === 'Sembuh'
        ? 'Sembuh'
        : kesFormData.kondisi === 'Observasi'
        ? 'Observasi'
        : kesFormData.kondisi === 'Rujuk Medis'
        ? 'Rujuk Medis'
        : 'Dalam Perawatan') as CatatanKesehatan['status'],
      dicatatOleh: kesFormData.waliAsuh ? `${kesFormData.waliAsuh} & Tim UKS` : 'Tim UKS & Wali Asuh',
      catatanPerkembangan: kesFormData.catatan.trim(),
    };

    if (editingKes) {
      updateKesehatan(editingKes.id, payload);
      showToast(`✓ Catatan pemeriksaan untuk ${resolvedNama} berhasil diperbarui.`);
    } else {
      addKesehatan(payload);
      showToast(`✓ Catatan pemeriksaan baru untuk ${resolvedNama} berhasil disimpan.`);
    }
    setIsKesFormOpen(false);
    setEditingKes(null);
  };

  // Save quick condition update
  const handleSaveQuickUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordToUpdate) return;
    updateKesehatan(selectedRecordToUpdate.id, {
      kondisi: quickUpdateKondisi,
      status: (quickUpdateKondisi === 'Sembuh'
        ? 'Sembuh'
        : quickUpdateKondisi === 'Observasi'
        ? 'Observasi'
        : quickUpdateKondisi === 'Rujuk Medis'
        ? 'Rujuk Medis'
        : 'Dalam Perawatan') as CatatanKesehatan['status'],
      catatan: quickUpdateCatatan || selectedRecordToUpdate.catatan,
      catatanPerkembangan: quickUpdateCatatan || selectedRecordToUpdate.catatanPerkembangan,
    });
    setSelectedRecordToUpdate(null);
    showToast('✓ Perkembangan kondisi santri berhasil diperbarui.');
  };

  // Delete Pemeriksaan Kesehatan record (inline confirm)
  const handleConfirmDeleteKes = () => {
    if (!deleteKesTarget) return;
    deleteKesehatan(deleteKesTarget.id);
    if (editingKes?.id === deleteKesTarget.id) {
      setIsKesFormOpen(false);
      setEditingKes(null);
    }
    showToast(`✓ Catatan pemeriksaan ${deleteKesTarget.nama} berhasil dihapus.`);
    setDeleteKesTarget(null);
  };

  // Open add CKG Modal
  const handleOpenAddCKG = () => {
    setCkgFormData(defaultCKGForm);
    setEditingCKG(null);
    setIsAddCKGModalOpen(true);
  };

  // Open edit CKG Modal
  const handleOpenEditCKG = (item: PemeriksaanCKG) => {
    setEditingCKG(item);
    setCkgFormData({
      tanggal: item.tanggal,
      siswaId: item.siswaId,
      beratBadan: item.beratBadan,
      tinggiBadan: item.tinggiBadan,
      penglihatan: item.penglihatan,
      kondisiGigi: item.kondisiGigi,
      kondisiKuku: item.kondisiKuku,
      kebersihanDiri: item.kebersihanDiri,
      catatan: item.catatan || '',
      pemeriksa: item.pemeriksa || 'dr. Nurul Hidayah & Tim UKS',
    });
    setIsAddCKGModalOpen(true);
  };

  // Save CKG (Add or Edit)
  const handleSaveCKG = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tanggal: ckgFormData.tanggal,
      siswaId: ckgFormData.siswaId,
      beratBadan: Number(ckgFormData.beratBadan) || 25,
      tinggiBadan: Number(ckgFormData.tinggiBadan) || 120,
      penglihatan: ckgFormData.penglihatan,
      kondisiGigi: ckgFormData.kondisiGigi,
      kondisiKuku: ckgFormData.kondisiKuku,
      kebersihanDiri: ckgFormData.kebersihanDiri,
      catatan: ckgFormData.catatan,
      pemeriksa: ckgFormData.pemeriksa,
    };

    if (editingCKG) {
      updateCKG(editingCKG.id, payload);
      showToast('✓ Data pemeriksaan berkala (CKG) berhasil diperbarui.');
    } else {
      addCKG(payload);
      showToast('✓ Data pemeriksaan berkala (CKG) berhasil disimpan.');
    }
    setIsAddCKGModalOpen(false);
  };

  // Delete CKG (inline confirm)
  const handleConfirmDeleteCKG = () => {
    if (!deleteCKGTarget) return;
    deleteCKG(deleteCKGTarget.id);
    showToast(`✓ Data CKG ${deleteCKGTarget.nama} berhasil dihapus.`);
    setDeleteCKGTarget(null);
  };

  // Filtered Pemeriksaan Kesehatan List
  const filteredKesehatanList = useMemo(() => {
    return kesehatanList.filter((item) => {
      const siswa = getSiswa(item.siswaId);
      const displayName = siswa?.nama || item.namaSiswa || '';
      const matchSearch =
        !searchPemeriksaan ||
        displayName.toLowerCase().includes(searchPemeriksaan.toLowerCase()) ||
        (siswa?.panggilan && siswa.panggilan.toLowerCase().includes(searchPemeriksaan.toLowerCase())) ||
        item.keluhan.toLowerCase().includes(searchPemeriksaan.toLowerCase()) ||
        item.penanganan.toLowerCase().includes(searchPemeriksaan.toLowerCase()) ||
        (item.rujukan && item.rujukan.toLowerCase().includes(searchPemeriksaan.toLowerCase()));

      const kondisi = item.kondisi || item.status || 'Dalam Perawatan';
      const matchKondisi =
        filterKondisi === 'Semua' || kondisi.toLowerCase() === filterKondisi.toLowerCase();

      const matchKamar =
        filterKamarPemeriksaan === 'Semua' || siswa?.kamarId === filterKamarPemeriksaan;

      return matchSearch && matchKondisi && matchKamar;
    });
  }, [kesehatanList, searchPemeriksaan, filterKondisi, filterKamarPemeriksaan, siswaList]);

  // Filtered CKG List
  const filteredCKGList = useMemo(() => {
    return ckgList.filter((item) => {
      const siswa = getSiswa(item.siswaId);
      const matchSearch =
        !searchCKG ||
        siswa?.nama.toLowerCase().includes(searchCKG.toLowerCase()) ||
        siswa?.panggilan.toLowerCase().includes(searchCKG.toLowerCase()) ||
        (item.catatan && item.catatan.toLowerCase().includes(searchCKG.toLowerCase()));

      const matchGigi =
        filterGigiCKG === 'Semua' ||
        (filterGigiCKG === 'Bebas Karies' && item.kondisiGigi.includes('Bebas Karies')) ||
        (filterGigiCKG === 'Berlubang' && item.kondisiGigi.includes('Berlubang')) ||
        (filterGigiCKG === 'Plak' && item.kondisiGigi.includes('Plak'));

      const matchPenglihatan =
        filterPenglihatanCKG === 'Semua' ||
        (filterPenglihatanCKG === 'Normal' && item.penglihatan.includes('Normal')) ||
        (filterPenglihatanCKG === 'Rabun' && item.penglihatan.includes('Rabun'));

      return matchSearch && matchGigi && matchPenglihatan;
    });
  }, [ckgList, searchCKG, filterGigiCKG, filterPenglihatanCKG, siswaList]);

  // Statistics for Pemeriksaan
  const statsPemeriksaan = useMemo(() => {
    const rawat = kesehatanList.filter(
      (k) => (k.kondisi || k.status) === 'Dalam Perawatan'
    ).length;
    const observasi = kesehatanList.filter(
      (k) => (k.kondisi || k.status) === 'Observasi'
    ).length;
    const sembuh = kesehatanList.filter(
      (k) => (k.kondisi || k.status) === 'Sembuh'
    ).length;
    const rujukan = kesehatanList.filter(
      (k) =>
        (k.kondisi || k.status) === 'Rujuk Medis' ||
        (k.rujukan && !k.rujukan.includes('Tidak Perlu Rujukan'))
    ).length;
    return { rawat, observasi, sembuh, rujukan };
  }, [kesehatanList]);

  // Statistics for CKG
  const statsCKG = useMemo(() => {
    const total = ckgList.length;
    if (total === 0) return { total: 0, avgTB: 0, avgBB: 0, kariesCount: 0, kacamataCount: 0 };
    const avgTB = Math.round(ckgList.reduce((acc, c) => acc + c.tinggiBadan, 0) / total);
    const avgBB = (ckgList.reduce((acc, c) => acc + c.beratBadan, 0) / total).toFixed(1);
    const kariesCount = ckgList.filter((c) => c.kondisiGigi.includes('Berlubang')).length;
    const kacamataCount = ckgList.filter((c) => c.penglihatan.includes('Kacamata') || c.penglihatan.includes('Rabun')).length;
    return { total, avgTB, avgBB, kariesCount, kacamataCount };
  }, [ckgList]);

  // Export Pemeriksaan Kesehatan to Excel
  const exportPemeriksaanToExcel = () => {
    const rows = filteredKesehatanList.map((item, idx) => {
      const siswa = getSiswa(item.siswaId);
      const kamar = getKamar(siswa?.kamarId);
      const wali = getWaliAsuh(siswa?.waliAsuhId);
      return {
        No: idx + 1,
        Tanggal: item.tanggal,
        'Nama Santri': siswa?.nama || item.namaSiswa || '-',
        Kelas: siswa?.kelas || '-',
        Kamar: item.kamar || kamar?.nama || '-',
        'Wali Asuh': item.waliAsuh || wali?.nama || '-',
        Kondisi: item.kondisi || item.status || '-',
        'Keluhan / Gejala': item.keluhan,
        'Suhu Tubuh': item.suhuTubuh || '-',
        Penanganan: item.penanganan || item.penangananObat || '-',
        'Lokasi Perawatan': item.lokasiPerawatan || '-',
        'Rujukan Faskes': item.rujukan || 'Tidak Perlu Rujukan',
        'Catatan Pemantauan': item.catatan || item.catatanPerkembangan || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 25 },
      { wch: 8 },
      { wch: 14 },
      { wch: 20 },
      { wch: 16 },
      { wch: 30 },
      { wch: 12 },
      { wch: 35 },
      { wch: 18 },
      { wch: 30 },
      { wch: 35 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pemeriksaan Kesehatan');
    XLSX.writeFile(wb, `SIPASRA_Pemeriksaan_Kesehatan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export CKG to Excel
  const exportCKGToExcel = () => {
    const rows = filteredCKGList.map((item, idx) => {
      const siswa = getSiswa(item.siswaId);
      const kamar = getKamar(siswa?.kamarId);
      const wali = getWaliAsuh(siswa?.waliAsuhId);
      const bmi = (item.beratBadan / Math.pow(item.tinggiBadan / 100, 2)).toFixed(1);
      return {
        No: idx + 1,
        Tanggal: item.tanggal,
        'Nama Santri': siswa?.nama || '-',
        Kelas: siswa?.kelas || '-',
        Kamar: kamar?.nama || '-',
        'Wali Asuh': wali?.nama || '-',
        'Berat Badan (kg)': item.beratBadan,
        'Tinggi Badan (cm)': item.tinggiBadan,
        'BMI / IMT': bmi,
        Penglihatan: item.penglihatan,
        'Kondisi Gigi': item.kondisiGigi,
        'Kondisi Kuku': item.kondisiKuku,
        'Kebersihan Diri': item.kebersihanDiri,
        'Catatan / Rekomendasi': item.catatan || '-',
        'Pemeriksa Medis': item.pemeriksa || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 25 },
      { wch: 8 },
      { wch: 14 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 10 },
      { wch: 24 },
      { wch: 28 },
      { wch: 22 },
      { wch: 25 },
      { wch: 40 },
      { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pemeriksaan Berkala CKG');
    XLSX.writeFile(wb, `SIPASRA_Pemeriksaan_Berkala_CKG_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Helper for BMI status calculation
  const getBMIInfo = (bb: number, tb: number) => {
    if (!bb || !tb) return { bmi: 0, label: '-', color: 'text-slate-600' };
    const val = bb / Math.pow(tb / 100, 2);
    const rounded = Math.round(val * 10) / 10;
    if (rounded < 14) return { bmi: rounded, label: 'Gizi Kurang', color: 'text-amber-700 bg-amber-50' };
    if (rounded <= 18.5) return { bmi: rounded, label: 'Ideal / Baik', color: 'text-emerald-700 bg-emerald-50' };
    if (rounded <= 22) return { bmi: rounded, label: 'Bagus & Padat', color: 'text-teal-700 bg-teal-50' };
    return { bmi: rounded, label: 'Kelebihan BB', color: 'text-rose-700 bg-rose-50' };
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Editorial Header */}
      <div className="bg-[#006b54] text-white border-[2px] border-[#1a1c1a] neo-shadow-md p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Stethoscope className="w-56 h-56 text-white" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white text-[#1a1c1a] text-[10px] font-mono-custom font-extrabold uppercase mb-2 border border-[#1a1c1a]">
            <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
            UNIT KESEHATAN SANTRI (UKS) SEKOLAH RAKYAT 1 JEPARA
          </div>
          <h1 className="font-syne text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Layanan & Rekam Kesehatan Santri
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-mono-custom mt-1.5 leading-relaxed">
            Pusat pemantauan medis santri asrama: penanganan sakit harian, rujukan faskes, serta pemeriksaan kesehatan berkala (CKG) bersama Puskesmas Tahunan.
          </p>

          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={() => setActiveTab('pemeriksaan')}
              className={`px-4 py-2 font-mono-custom text-xs font-bold uppercase transition-all border-[1.5px] border-[#1a1c1a] flex items-center gap-2 ${
                activeTab === 'pemeriksaan'
                  ? 'bg-[#1a1c1a] text-white shadow-[2px_2px_0px_0px_#fff]'
                  : 'bg-white text-[#1a1c1a] hover:bg-emerald-50'
              }`}
            >
              <HeartPulse className="w-4 h-4 text-rose-500" />
              1. PEMERIKSAAN KESEHATAN ({kesehatanList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ckg')}
              className={`px-4 py-2 font-mono-custom text-xs font-bold uppercase transition-all border-[1.5px] border-[#1a1c1a] flex items-center gap-2 ${
                activeTab === 'ckg'
                  ? 'bg-[#1a1c1a] text-white shadow-[2px_2px_0px_0px_#fff]'
                  : 'bg-white text-[#1a1c1a] hover:bg-emerald-50'
              }`}
            >
              <Activity className="w-4 h-4 text-teal-600" />
              2. PEMERIKSAAN BERKALA / CKG ({ckgList.length})
            </button>
          </div>
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

      {/* ========================================================= */}
      {/* TAB 1: PEMERIKSAAN KESEHATAN (Rekam Medis & Sakit Santri) */}
      {/* ========================================================= */}
      {activeTab === 'pemeriksaan' && (
        <div className="space-y-5">
          {/* Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 border-[1.5px] border-[#1a1c1a] neo-shadow-sm flex items-center justify-between">
              <div>
                <span className="font-mono-custom text-[11px] text-[#1a1c1a]/60 uppercase font-bold block">
                  Dalam Rawat UKS
                </span>
                <span className="text-2xl font-extrabold font-syne text-rose-600">
                  {statsPemeriksaan.rawat} Anak
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold border border-rose-200">
                <Thermometer className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 border-[1.5px] border-[#1a1c1a] neo-shadow-sm flex items-center justify-between">
              <div>
                <span className="font-mono-custom text-[11px] text-[#1a1c1a]/60 uppercase font-bold block">
                  Dalam Observasi
                </span>
                <span className="text-2xl font-extrabold font-syne text-amber-600">
                  {statsPemeriksaan.observasi} Anak
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold border border-amber-200">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 border-[1.5px] border-[#1a1c1a] neo-shadow-sm flex items-center justify-between">
              <div>
                <span className="font-mono-custom text-[11px] text-[#1a1c1a]/60 uppercase font-bold block">
                  Sudah Sembuh
                </span>
                <span className="text-2xl font-extrabold font-syne text-[#006b54]">
                  {statsPemeriksaan.sembuh} Anak
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-[#006b54] font-bold border border-emerald-200">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 border-[1.5px] border-[#1a1c1a] neo-shadow-sm flex items-center justify-between">
              <div>
                <span className="font-mono-custom text-[11px] text-[#1a1c1a]/60 uppercase font-bold block">
                  Rujukan Faskes
                </span>
                <span className="text-2xl font-extrabold font-syne text-purple-700">
                  {statsPemeriksaan.rujukan} Kasus
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold border border-purple-200">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Action Toolbar & Filters */}
          <div className="bg-white p-4 border-[1.5px] border-[#1a1c1a] neo-shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#1a1c1a] font-syne flex items-center gap-1.5 uppercase tracking-wide">
                  <Stethoscope className="w-4 h-4 text-[#006b54]" />
                  Daftar Pemeriksaan & Rekam Medis Santri
                </h2>
                <p className="text-[11px] text-[#1a1c1a]/60 font-mono-custom">
                  Format: Tanggal, Nama Anak, Kamar, Wali Asuh, Kondisi, Keluhan, Penanganan, Rujukan, Catatan
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={exportPemeriksaanToExcel}
                  className="neo-btn-outline flex items-center gap-1.5 text-xs py-2 px-3"
                  title="Unduh seluruh rekap pemeriksaan ke Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>EXPORT EXCEL</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    isKesFormOpen && !editingKes ? setIsKesFormOpen(false) : handleOpenAddKes()
                  }
                  className="neo-btn-primary flex items-center gap-1.5 text-xs py-2 px-3.5 cursor-pointer"
                >
                  {isKesFormOpen && !editingKes ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{isKesFormOpen && !editingKes ? 'TUTUP FORM' : 'CATAT PEMERIKSAAN BARU'}</span>
                </button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="pt-3 border-t border-[#1a1c1a]/15 flex flex-wrap items-center gap-2 text-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#1a1c1a]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama anak, keluhan sakit, atau rujukan..."
                  value={searchPemeriksaan}
                  onChange={(e) => setSearchPemeriksaan(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:ring-1 focus:ring-[#006b54]"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="font-mono-custom text-[11px] font-bold text-[#1a1c1a]/70 uppercase">
                  Kondisi:
                </span>
                <select
                  value={filterKondisi}
                  onChange={(e) => setFilterKondisi(e.target.value)}
                  className="px-2.5 py-1.5 border-[1.5px] border-[#1a1c1a] bg-white font-mono-custom text-xs"
                >
                  <option value="Semua">Semua Kondisi</option>
                  <option value="Dalam Perawatan">Dalam Perawatan (Rawat)</option>
                  <option value="Observasi">Observasi</option>
                  <option value="Sembuh">Sembuh</option>
                  <option value="Rujuk Medis">Rujuk Medis</option>
                </select>
              </div>
            </div>
          </div>

          {/* INLINE FORM CATATAN PEMERIKSAAN BARU / EDIT */}
          <div ref={kesFormRef}>
            {isKesFormOpen && (
              <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#006b54] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
                  <div>
                    <span className="text-[10px] font-mono-custom font-bold uppercase tracking-wider text-[#006b54] block">
                      // UNIT KESEHATAN SANTRI (UKS)
                    </span>
                    <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                      {editingKes ? 'Form Edit Pemeriksaan Kesehatan' : 'Form Catatan Pemeriksaan Baru'}
                    </h2>
                    <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                      Catat tanggal pemeriksaan, identitas anak, keluhan, suhu tubuh, penanganan UKS, dan rujukan faskes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsKesFormOpen(false);
                      setEditingKes(null);
                    }}
                    className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                    aria-label="Tutup form catatan pemeriksaan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {kesFormError && (
                  <div
                    role="alert"
                    className="mb-4 p-3 bg-rose-50 border border-rose-400 text-rose-900 text-xs font-medium flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{kesFormError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveKes} className="space-y-4 text-xs sm:text-sm">
                  {/* Row 1: Tanggal & Nama Anak */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                        1. Tanggal Pemeriksaan *
                      </label>
                      <input
                        type="date"
                        required
                        value={kesFormData.tanggal}
                        onChange={(e) => setKesFormData({ ...kesFormData, tanggal: e.target.value })}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-mono-custom focus:outline-none focus:border-[#006b54]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                        2. Nama Anak (Santri) *
                      </label>
                      {siswaList.length > 0 ? (
                        <select
                          value={kesFormData.siswaId}
                          onChange={(e) => {
                            handleSiswaChangeInKesForm(e.target.value);
                            if (kesFormError) setKesFormError(null);
                          }}
                          className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-mono-custom focus:outline-none focus:border-[#006b54]"
                        >
                          <option value="">-- Input Manual / Santri Belum Terdaftar --</option>
                          {siswaList.map((s) => {
                            const k = getKamar(s.kamarId);
                            return (
                              <option key={s.id} value={s.id}>
                                {s.nama} ({s.kelas} - Kamar {k?.nama || '-'})
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="Ketik nama santri yang diperiksa..."
                          value={kesFormData.namaSiswa}
                          onChange={(e) => {
                            setKesFormData({ ...kesFormData, namaSiswa: e.target.value });
                            if (kesFormError) setKesFormError(null);
                          }}
                          className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-sans focus:outline-none focus:border-[#006b54]"
                        />
                      )}
                    </div>
                  </div>

                  {/* Manual Name Input if user selects manual option when siswaList > 0 */}
                  {siswaList.length > 0 && !kesFormData.siswaId && (
                    <div>
                      <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                        Nama Anak (Input Manual) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ketik nama santri..."
                        value={kesFormData.namaSiswa}
                        onChange={(e) => {
                          setKesFormData({ ...kesFormData, namaSiswa: e.target.value });
                          if (kesFormError) setKesFormError(null);
                        }}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-sans focus:outline-none focus:border-[#006b54]"
                      />
                    </div>
                  )}

                  {/* Row 2: Kamar & Wali Asuh */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                        3. Kamar Asrama
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Kamar 01 / Neptunus"
                        value={kesFormData.kamar}
                        onChange={(e) => setKesFormData({ ...kesFormData, kamar: e.target.value })}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                        4. Wali Asuh / Pamong Pendamping
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Ust. Jendral, S.Pd.I"
                        value={kesFormData.waliAsuh}
                        onChange={(e) => setKesFormData({ ...kesFormData, waliAsuh: e.target.value })}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
                      />
                    </div>
                  </div>

                  {/* Row 3: Kondisi & Suhu Tubuh */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                        5. Kondisi Santri *
                      </label>
                      <select
                        value={kesFormData.kondisi}
                        onChange={(e) => setKesFormData({ ...kesFormData, kondisi: e.target.value })}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:border-[#006b54] bg-[#fdfcf9] font-bold"
                      >
                        <option value="Dalam Perawatan">Dalam Perawatan (Rawat di UKS / Kamar)</option>
                        <option value="Observasi">Observasi (Perlu Pemantauan Rutin)</option>
                        <option value="Sembuh">Sembuh (Pulih & Bugar Kembali)</option>
                        <option value="Perlu Istirahat">Perlu Istirahat Ekstra</option>
                        <option value="Rujuk Medis">Rujuk Medis ke Puskesmas / RS</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                        Suhu Tubuh (Termometer)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 38.2 °C"
                        value={kesFormData.suhuTubuh}
                        onChange={(e) => setKesFormData({ ...kesFormData, suhuTubuh: e.target.value })}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-mono-custom focus:outline-none focus:border-[#006b54]"
                      />
                    </div>
                  </div>

                  {/* Row 4: Keluhan & Penanganan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                        6. Keluhan & Gejala Sakit *
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Contoh: Demam tinggi sejak subuh, pusing kepala, batuk..."
                        value={kesFormData.keluhan}
                        onChange={(e) => {
                          setKesFormData({ ...kesFormData, keluhan: e.target.value });
                          if (kesFormError) setKesFormError(null);
                        }}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-sans focus:outline-none focus:border-[#006b54]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                        7. Penanganan & Tindakan Medis *
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Contoh: Diberikan sirup Paracetamol, kompres hangat, istirahat di UKS..."
                        value={kesFormData.penanganan}
                        onChange={(e) => {
                          setKesFormData({ ...kesFormData, penanganan: e.target.value });
                          if (kesFormError) setKesFormError(null);
                        }}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-sans focus:outline-none focus:border-[#006b54]"
                      />
                    </div>
                  </div>

                  {/* Row 5: Rujukan & Lokasi Perawatan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                        8. Rujukan Medis
                      </label>
                      <select
                        value={kesFormData.rujukan}
                        onChange={(e) => setKesFormData({ ...kesFormData, rujukan: e.target.value })}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:border-[#006b54] bg-[#fdfcf9]"
                      >
                        <option value="Tidak Perlu Rujukan (Cukup Rawat UKS Asrama)">Tidak Perlu Rujukan (Cukup UKS)</option>
                        <option value="Puskesmas Tahunan Jepara">Puskesmas Tahunan Jepara</option>
                        <option value="RSUD R.A. Kartini Jepara">RSUD R.A. Kartini Jepara</option>
                        <option value="Klinik Pratama Jepara">Klinik Pratama Jepara</option>
                        <option value="Dokter Spesialis Anak">Dokter Spesialis Anak</option>
                        <option value="Dokter Gigi Puskesmas">Dokter Gigi Puskesmas</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                        Lokasi Perawatan Asrama
                      </label>
                      <select
                        value={kesFormData.lokasiPerawatan}
                        onChange={(e) =>
                          setKesFormData({
                            ...kesFormData,
                            lokasiPerawatan: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:border-[#006b54] bg-[#fdfcf9]"
                      >
                        <option value="Ruang UKS">Ruang UKS Asrama (Ranjang Medis)</option>
                        <option value="Kamar Asrama">Kamar Asrama Santri</option>
                        <option value="Puskesmas Tahunan">Puskesmas Tahunan</option>
                        <option value="RSUD RA Kartini Jepara">RSUD RA Kartini Jepara</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 6: Catatan */}
                  <div>
                    <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                      9. Catatan Pemantauan & Instruksi
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: Suhu tubuh dipantau setiap 4 jam. Orang tua santri sudah dihubungi via WA."
                      value={kesFormData.catatan}
                      onChange={(e) => setKesFormData({ ...kesFormData, catatan: e.target.value })}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-xs font-sans focus:outline-none focus:border-[#006b54]"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-[#1a1c1a]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsKesFormOpen(false);
                        setEditingKes(null);
                      }}
                      className="neo-btn-outline py-2 px-4 text-xs cursor-pointer"
                    >
                      BATAL
                    </button>
                    <button
                      type="submit"
                      className="neo-btn-primary py-2 px-5 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingKes ? 'SIMPAN PERUBAHAN' : 'SIMPAN CATATAN PEMERIKSAAN'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Inline Delete Confirmation for Pemeriksaan Kesehatan */}
          {deleteKesTarget && (
            <div className="p-4 bg-rose-50 border-[1.5px] border-rose-700 shadow-[3px_3px_0px_#9f1239] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono-custom text-xs">
              <div className="text-rose-950">
                <span className="font-bold block">Konfirmasi Hapus Catatan Pemeriksaan</span>
                <span className="font-sans">
                  Yakin ingin menghapus catatan pemeriksaan untuk <strong>{deleteKesTarget.nama}</strong>?
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDeleteKesTarget(null)}
                  className="px-3 py-1.5 bg-white border-[1.5px] border-[#1a1c1a] font-bold uppercase cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteKes}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white border-[1.5px] border-[#1a1c1a] font-bold uppercase cursor-pointer"
                >
                  YA, HAPUS
                </button>
              </div>
            </div>
          )}

          {/* Table of Pemeriksaan Kesehatan */}
          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a1c1a] text-[#fdfcf9] font-mono-custom text-[0.68rem] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3">TANGGAL</th>
                    <th className="p-3">NAMA ANAK</th>
                    <th className="p-3">KAMAR</th>
                    <th className="p-3">WALI ASUH</th>
                    <th className="p-3">KONDISI</th>
                    <th className="p-3">KELUHAN</th>
                    <th className="p-3">PENANGANAN</th>
                    <th className="p-3">RUJUKAN</th>
                    <th className="p-3">CATATAN</th>
                    <th className="p-3 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1c1a]/15">
                  {filteredKesehatanList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500 font-mono-custom space-y-3">
                        <p>
                          {kesehatanList.length === 0
                            ? 'Belum ada catatan pemeriksaan kesehatan santri.'
                            : 'Tidak ada catatan pemeriksaan kesehatan yang cocok dengan filter.'}
                        </p>
                        {kesehatanList.length === 0 && !isKesFormOpen && (
                          <button
                            type="button"
                            onClick={handleOpenAddKes}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] text-white font-bold text-xs border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Catat Pemeriksaan Baru</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredKesehatanList.map((item) => {
                      const siswa = getSiswa(item.siswaId);
                      const kamar = getKamar(siswa?.kamarId);
                      const wali = getWaliAsuh(siswa?.waliAsuhId);
                      const kondisi = item.kondisi || item.status || 'Dalam Perawatan';
                      const isRawat = kondisi === 'Dalam Perawatan';
                      const isObservasi = kondisi === 'Observasi';
                      const isSembuh = kondisi === 'Sembuh';

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-[#1a1c1a]/[0.02] transition-colors ${
                            isRawat ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          {/* Tanggal */}
                          <td className="p-3 font-mono-custom font-semibold text-[#1a1c1a] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#1a1c1a]/50" />
                              {item.tanggal}
                            </div>
                          </td>

                          {/* Nama Anak */}
                          <td className="p-3">
                            <div className="font-bold text-sm text-[#1a1c1a]">
                              {siswa?.nama || item.namaSiswa || 'Santri'}
                            </div>
                            <div className="font-mono-custom text-[11px] text-[#1a1c1a]/60">
                              {siswa
                                ? `${siswa.kelas} · ${siswa.panggilan} (NISN: ${siswa.nisn})`
                                : 'Input Manual UKS'}
                            </div>
                          </td>

                          {/* Kamar */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-800">
                              {item.kamar || kamar?.nama || '-'}
                            </span>
                          </td>

                          {/* Wali Asuh */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-medium text-[#1a1c1a]">
                              {item.waliAsuh || wali?.nama || '-'}
                            </div>
                          </td>

                          {/* Kondisi */}
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`status-badge ${
                                isRawat
                                  ? 'danger'
                                  : isObservasi
                                  ? 'warning'
                                  : isSembuh
                                  ? 'accent'
                                  : 'bg-purple-100 text-purple-900 border-purple-300'
                              }`}
                            >
                              {kondisi}
                            </span>
                          </td>

                          {/* Keluhan */}
                          <td className="p-3 min-w-[200px]">
                            <div className="font-medium text-slate-900">{item.keluhan}</div>
                            {item.suhuTubuh && (
                              <div className="text-[11px] text-rose-700 font-mono-custom font-bold mt-0.5 flex items-center gap-1">
                                <Thermometer className="w-3 h-3" />
                                Suhu: {item.suhuTubuh}
                              </div>
                            )}
                          </td>

                          {/* Penanganan */}
                          <td className="p-3 min-w-[200px]">
                            <div className="text-slate-800">{item.penanganan || item.penangananObat || '-'}</div>
                            {item.lokasiPerawatan && (
                              <div className="text-[10px] text-slate-500 font-mono-custom mt-0.5">
                                Rawat: {item.lokasiPerawatan}
                              </div>
                            )}
                          </td>

                          {/* Rujukan */}
                          <td className="p-3 min-w-[170px]">
                            <div
                              className={`text-[11px] font-semibold px-2 py-1 rounded inline-block ${
                                item.rujukan && !item.rujukan.includes('Tidak Perlu Rujukan')
                                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {item.rujukan || 'Tidak Perlu Rujukan'}
                            </div>
                          </td>

                          {/* Catatan */}
                          <td className="p-3 min-w-[180px]">
                            <div className="text-slate-700 italic text-[11px]">
                              {item.catatan || item.catatanPerkembangan || '-'}
                            </div>
                          </td>

                          {/* Aksi */}
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {/* Quick Mark as Sembuh / Observasi */}
                              {isRawat && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRecordToUpdate(item);
                                    setQuickUpdateKondisi('Sembuh');
                                    setQuickUpdateCatatan('Kondisi sudah pulih, demam reda, siap kembali aktif di kelas.');
                                  }}
                                  className="neo-btn-primary text-[10px] py-1 px-2 font-mono-custom cursor-pointer"
                                  title="Tandai sembuh dan pulih"
                                >
                                  TANDAI SEMBUH
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEditKes(item)}
                                className="neo-btn-outline p-1.5 cursor-pointer"
                                title="Edit pemeriksaan ini"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-700" />
                              </button>

                              {siswa?.orangTua?.noHp && (
                                <a
                                  href={`https://wa.me/${siswa.orangTua.noHp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="neo-btn-outline p-1.5"
                                  title="Hubungi Orang Tua Santri"
                                >
                                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteKesTarget({
                                    id: item.id,
                                    nama: siswa?.nama || item.namaSiswa || 'Santri',
                                  })
                                }
                                className="neo-btn-outline p-1.5 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                                title="Hapus catatan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PEMERIKSAAN BERKALA (CKG)                          */}
      {/* Indikator: Berat Badan, Tinggi Badan, Penglihatan, Gigi, Kuku, Kebersihan */}
      {/* ========================================================= */}
      {activeTab === 'ckg' && (
        <div className="space-y-5">
          {/* CKG Info & Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 border-[1.5px] border-[#1a1c1a] neo-shadow-sm">
              <span className="font-mono-custom text-[11px] text-[#1a1c1a]/60 uppercase font-bold block">
                Total Diperiksa CKG
              </span>
              <span className="text-2xl font-extrabold font-syne text-[#006b54]">
                {statsCKG.total} Santri
              </span>
            </div>

            <div className="bg-white p-3.5 border-[1.5px] border-[#1a1c1a] neo-shadow-sm">
              <span className="font-mono-custom text-[11px] text-[#1a1c1a]/60 uppercase font-bold block">
                Rata-rata TB / BB
              </span>
              <span className="text-xl font-extrabold font-syne text-slate-800">
                {statsCKG.avgTB} cm / {statsCKG.avgBB} kg
              </span>
            </div>

            <div className="bg-white p-3.5 border-[1.5px] border-[#1a1c1a] neo-shadow-sm">
              <span className="font-mono-custom text-[11px] text-[#1a1c1a]/60 uppercase font-bold block">
                Karies / Berlubang
              </span>
              <span className="text-2xl font-extrabold font-syne text-amber-600">
                {statsCKG.kariesCount} Kasus
              </span>
            </div>

            <div className="bg-white p-3.5 border-[1.5px] border-[#1a1c1a] neo-shadow-sm">
              <span className="font-mono-custom text-[11px] text-[#1a1c1a]/60 uppercase font-bold block">
                Perlu Kacamata
              </span>
              <span className="text-2xl font-extrabold font-syne text-rose-600">
                {statsCKG.kacamataCount} Santri
              </span>
            </div>

            <div className="bg-white p-3.5 border-[1.5px] border-[#1a1c1a] neo-shadow-sm">
              <span className="font-mono-custom text-[11px] text-[#1a1c1a]/60 uppercase font-bold block">
                Mitra Medis
              </span>
              <span className="text-xs font-bold font-mono-custom text-emerald-800 block mt-1">
                Puskesmas Tahunan
              </span>
            </div>
          </div>

          {/* Action Toolbar & Filters */}
          <div className="bg-white p-4 border-[1.5px] border-[#1a1c1a] neo-shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#1a1c1a] font-syne flex items-center gap-1.5 uppercase tracking-wide">
                  <Activity className="w-4 h-4 text-[#006b54]" />
                  Pemeriksaan Berkala (CKG - Cek Kesehatan Berkala Santri)
                </h2>
                <p className="text-[11px] text-[#1a1c1a]/60 font-mono-custom">
                  Indikator: Berat Badan, Tinggi Badan, Penglihatan, Kondisi Gigi, Kondisi Kuku, Kebersihan Diri
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={exportCKGToExcel}
                  className="neo-btn-outline flex items-center gap-1.5 text-xs py-2 px-3"
                  title="Unduh seluruh rekap CKG ke Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>EXPORT EXCEL CKG</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddCKG}
                  className="neo-btn-primary flex items-center gap-1.5 text-xs py-2 px-3.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>INPUT CKG BARU</span>
                </button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="pt-3 border-t border-[#1a1c1a]/15 flex flex-wrap items-center gap-2 text-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#1a1c1a]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari santri atau catatan CKG..."
                  value={searchCKG}
                  onChange={(e) => setSearchCKG(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:ring-1 focus:ring-[#006b54]"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="font-mono-custom text-[11px] font-bold text-[#1a1c1a]/70 uppercase">
                  Gigi:
                </span>
                <select
                  value={filterGigiCKG}
                  onChange={(e) => setFilterGigiCKG(e.target.value)}
                  className="px-2 py-1.5 border-[1.5px] border-[#1a1c1a] bg-white font-mono-custom text-xs"
                >
                  <option value="Semua">Semua Kondisi Gigi</option>
                  <option value="Bebas Karies">Bebas Karies (Sehat)</option>
                  <option value="Berlubang">Gigi Berlubang (Karies)</option>
                  <option value="Plak">Plak / Karang Gigi</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="font-mono-custom text-[11px] font-bold text-[#1a1c1a]/70 uppercase">
                  Mata:
                </span>
                <select
                  value={filterPenglihatanCKG}
                  onChange={(e) => setFilterPenglihatanCKG(e.target.value)}
                  className="px-2 py-1.5 border-[1.5px] border-[#1a1c1a] bg-white font-mono-custom text-xs"
                >
                  <option value="Semua">Semua Penglihatan</option>
                  <option value="Normal">Normal (6/6)</option>
                  <option value="Rabun">Rabun / Perlu Kacamata</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inline Delete Confirmation for CKG */}
          {deleteCKGTarget && (
            <div className="p-4 bg-rose-50 border-[1.5px] border-rose-700 shadow-[3px_3px_0px_#9f1239] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono-custom text-xs">
              <div className="text-rose-950">
                <span className="font-bold block">Konfirmasi Hapus Data CKG</span>
                <span className="font-sans">
                  Yakin ingin menghapus data CKG untuk <strong>{deleteCKGTarget.nama}</strong>?
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDeleteCKGTarget(null)}
                  className="px-3 py-1.5 bg-white border-[1.5px] border-[#1a1c1a] font-bold uppercase cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCKG}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white border-[1.5px] border-[#1a1c1a] font-bold uppercase cursor-pointer"
                >
                  YA, HAPUS
                </button>
              </div>
            </div>
          )}

          {/* Table of CKG */}
          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a1c1a] text-[#fdfcf9] font-mono-custom text-[0.68rem] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3">TANGGAL</th>
                    <th className="p-3">SANTRI (KAMAR)</th>
                    <th className="p-3">BERAT BADAN</th>
                    <th className="p-3">TINGGI BADAN</th>
                    <th className="p-3">STATUS BMI</th>
                    <th className="p-3">PENGLIHATAN</th>
                    <th className="p-3">KONDISI GIGI</th>
                    <th className="p-3">KONDISI KUKU</th>
                    <th className="p-3">KEBERSIHAN DIRI</th>
                    <th className="p-3">CATATAN & PEMERIKSA</th>
                    <th className="p-3 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1c1a]/15">
                  {filteredCKGList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-500 font-mono-custom">
                        Belum ada data pemeriksaan berkala (CKG) yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCKGList.map((item) => {
                      const siswa = getSiswa(item.siswaId);
                      const kamar = getKamar(siswa?.kamarId);
                      const bmiInfo = getBMIInfo(item.beratBadan, item.tinggiBadan);

                      return (
                        <tr key={item.id} className="hover:bg-[#1a1c1a]/[0.02] transition-colors">
                          {/* Tanggal */}
                          <td className="p-3 font-mono-custom font-semibold text-[#1a1c1a] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#1a1c1a]/50" />
                              {item.tanggal}
                            </div>
                          </td>

                          {/* Santri */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-bold text-sm text-[#1a1c1a]">
                              {siswa?.nama || 'Santri'}
                            </div>
                            <div className="font-mono-custom text-[11px] text-[#1a1c1a]/60">
                              {siswa?.kelas} · Kamar: {kamar?.nama || '-'}
                            </div>
                          </td>

                          {/* Berat Badan */}
                          <td className="p-3 font-mono-custom whitespace-nowrap font-bold text-slate-800">
                            {item.beratBadan} kg
                          </td>

                          {/* Tinggi Badan */}
                          <td className="p-3 font-mono-custom whitespace-nowrap font-bold text-slate-800">
                            {item.tinggiBadan} cm
                          </td>

                          {/* BMI */}
                          <td className="p-3 whitespace-nowrap font-mono-custom">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${bmiInfo.color}`}>
                              BMI {bmiInfo.bmi} ({bmiInfo.label})
                            </span>
                          </td>

                          {/* Penglihatan */}
                          <td className="p-3 min-w-[140px]">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span
                                className={`text-[11px] ${
                                  item.penglihatan.includes('Rabun')
                                    ? 'text-rose-700 font-bold'
                                    : 'text-slate-800'
                                }`}
                              >
                                {item.penglihatan}
                              </span>
                            </div>
                          </td>

                          {/* Gigi */}
                          <td className="p-3 min-w-[160px]">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Smile className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span
                                className={`text-[11px] ${
                                  item.kondisiGigi.includes('Berlubang')
                                    ? 'text-amber-700 font-bold'
                                    : item.kondisiGigi.includes('Bebas Karies')
                                    ? 'text-emerald-700 font-semibold'
                                    : 'text-slate-800'
                                }`}
                              >
                                {item.kondisiGigi}
                              </span>
                            </div>
                          </td>

                          {/* Kuku */}
                          <td className="p-3 min-w-[140px]">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Scissors className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span
                                className={`text-[11px] ${
                                  item.kondisiKuku.includes('Panjang') || item.kondisiKuku.includes('Kotor')
                                    ? 'text-rose-700 font-bold'
                                    : 'text-slate-800'
                                }`}
                              >
                                {item.kondisiKuku}
                              </span>
                            </div>
                          </td>

                          {/* Kebersihan Diri */}
                          <td className="p-3 min-w-[150px]">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Sparkles className="w-3.5 h-3.5 text-[#006b54] shrink-0" />
                              <span
                                className={`text-[11px] ${
                                  item.kebersihanDiri.includes('Sangat Bersih')
                                    ? 'text-[#006b54] font-bold'
                                    : 'text-slate-800'
                                }`}
                              >
                                {item.kebersihanDiri}
                              </span>
                            </div>
                          </td>

                          {/* Catatan & Pemeriksa */}
                          <td className="p-3 min-w-[200px]">
                            <div className="text-slate-700 italic text-[11px]">
                              {item.catatan || '-'}
                            </div>
                            {item.pemeriksa && (
                              <div className="text-[10px] text-slate-500 font-mono-custom mt-0.5">
                                Oleh: {item.pemeriksa}
                              </div>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCKG(item)}
                                className="neo-btn-outline p-1.5"
                                title="Edit CKG ini"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteCKGTarget({
                                    id: item.id,
                                    nama: siswa?.nama || 'Santri',
                                  })
                                }
                                className="neo-btn-outline p-1.5 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                                title="Hapus catatan CKG"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}



      {/* ========================================================= */}
      {/* MODAL 2: FORM INPUT / EDIT PEMERIKSAAN BERKALA (CKG)     */}
      {/* ========================================================= */}
      <Modal
        isOpen={isAddCKGModalOpen}
        onClose={() => setIsAddCKGModalOpen(false)}
        title={editingCKG ? 'Edit Pemeriksaan Berkala (CKG)' : 'Input Pemeriksaan Berkala (CKG) Baru'}
        subtitle="Cek Kesehatan Gigi, Fisik, Kuku & Kebersihan Diri Santri"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveCKG} className="space-y-4 text-xs sm:text-sm">
          {/* Row 1: Tanggal & Siswa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                Tanggal Pemeriksaan CKG *
              </label>
              <input
                type="date"
                required
                value={ckgFormData.tanggal}
                onChange={(e) => setCkgFormData({ ...ckgFormData, tanggal: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:ring-1 focus:ring-[#006b54]"
              />
            </div>

            <div>
              <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                Pilih Santri *
              </label>
              <select
                required
                value={ckgFormData.siswaId}
                onChange={(e) => setCkgFormData({ ...ckgFormData, siswaId: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:ring-1 focus:ring-[#006b54] bg-white"
              >
                {siswaList.map((s) => {
                  const k = getKamar(s.kamarId);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas} - Kamar {k?.nama || '-'})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Row 2: Berat Badan & Tinggi Badan + Auto BMI preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                1. Berat Badan (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="10"
                max="80"
                required
                placeholder="Contoh: 28.5"
                value={ckgFormData.beratBadan}
                onChange={(e) =>
                  setCkgFormData({ ...ckgFormData, beratBadan: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:ring-1 focus:ring-[#006b54]"
              />
            </div>

            <div>
              <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                2. Tinggi Badan (cm) *
              </label>
              <input
                type="number"
                step="1"
                min="80"
                max="180"
                required
                placeholder="Contoh: 126"
                value={ckgFormData.tinggiBadan}
                onChange={(e) =>
                  setCkgFormData({ ...ckgFormData, tinggiBadan: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:ring-1 focus:ring-[#006b54]"
              />
            </div>

            <div>
              <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                Estimasi IMT / BMI
              </label>
              <div className="px-3 py-2 bg-slate-100 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom font-bold text-slate-800">
                {(() => {
                  const info = getBMIInfo(ckgFormData.beratBadan, ckgFormData.tinggiBadan);
                  return `${info.bmi} (${info.label})`;
                })()}
              </div>
            </div>
          </div>

          {/* Row 3: Penglihatan & Kondisi Gigi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                3. Penglihatan (Mata) *
              </label>
              <select
                value={ckgFormData.penglihatan}
                onChange={(e) => setCkgFormData({ ...ckgFormData, penglihatan: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:ring-1 focus:ring-[#006b54] bg-white"
              >
                <option value="Normal (6/6)">Normal (6/6) - Tajam & Jelas</option>
                <option value="Rabun Jauh / Perlu Kacamata">Rabun Jauh / Perlu Kacamata</option>
                <option value="Iritasi Mata Ringan">Iritasi Mata Ringan / Konjungtivitis</option>
                <option value="Perlu Pemeriksaan Visus Lanjut">Perlu Pemeriksaan Visus Lanjut</option>
              </select>
            </div>

            <div>
              <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                4. Kondisi Gigi *
              </label>
              <select
                value={ckgFormData.kondisiGigi}
                onChange={(e) => setCkgFormData({ ...ckgFormData, kondisiGigi: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:ring-1 focus:ring-[#006b54] bg-white"
              >
                <option value="Bersih & Sehat (Bebas Karies)">Bersih & Sehat (Bebas Karies)</option>
                <option value="Gigi Berlubang (Karies)">Gigi Berlubang (Karies)</option>
                <option value="Plak / Karang Gigi">Plak / Karang Gigi</option>
                <option value="Gigi Goyang">Gigi Goyang (Proses Pergantian Gigi Susu)</option>
                <option value="Gusi Bengkak / Radang">Gusi Bengkak / Radang</option>
              </select>
            </div>
          </div>

          {/* Row 4: Kondisi Kuku & Kebersihan Diri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                5. Kondisi Kuku *
              </label>
              <select
                value={ckgFormData.kondisiKuku}
                onChange={(e) => setCkgFormData({ ...ckgFormData, kondisiKuku: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:ring-1 focus:ring-[#006b54] bg-white"
              >
                <option value="Pendek & Bersih">Pendek & Bersih</option>
                <option value="Panjang / Perlu Dipotong">Panjang / Perlu Dipotong Segera</option>
                <option value="Kotor / Kurang Bersih">Kotor / Kurang Bersih</option>
              </select>
            </div>

            <div>
              <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                6. Kebersihan Diri *
              </label>
              <select
                value={ckgFormData.kebersihanDiri}
                onChange={(e) => setCkgFormData({ ...ckgFormData, kebersihanDiri: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:ring-1 focus:ring-[#006b54] bg-white"
              >
                <option value="Sangat Bersih & Mandiri">Sangat Bersih & Mandiri (Rapi, Wangi)</option>
                <option value="Bersih">Bersih</option>
                <option value="Cukup / Perlu Bimbingan">Cukup / Perlu Bimbingan Mandi Tertib</option>
                <option value="Kurang">Kurang (Perlu Perhatian Khusus Pamong)</option>
              </select>
            </div>
          </div>

          {/* Row 5: Catatan & Pemeriksa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                Catatan / Rekomendasi Medis
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Diberi edukasi cara menyikat gigi yang benar. Rekomendasi penambalan karies ke Puskesmas Tahunan."
                value={ckgFormData.catatan}
                onChange={(e) => setCkgFormData({ ...ckgFormData, catatan: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:ring-1 focus:ring-[#006b54]"
              />
            </div>

            <div>
              <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                Dokter / Petugas Pemeriksa
              </label>
              <input
                type="text"
                placeholder="Contoh: dr. Nurul Hidayah & Tim UKS"
                value={ckgFormData.pemeriksa}
                onChange={(e) => setCkgFormData({ ...ckgFormData, pemeriksa: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:ring-1 focus:ring-[#006b54]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1a1c1a]/15">
            <button
              type="button"
              onClick={() => setIsAddCKGModalOpen(false)}
              className="neo-btn-outline py-2 px-4 text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="neo-btn-primary py-2 px-5 text-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingCKG ? 'Simpan Perubahan CKG' : 'Simpan Data CKG'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: QUICK UPDATE KONDISI / STATUS SEMBUH            */}
      {/* ========================================================= */}
      <Modal
        isOpen={!!selectedRecordToUpdate}
        onClose={() => setSelectedRecordToUpdate(null)}
        title="Update Perkembangan Kondisi Santri"
        subtitle={getSiswa(selectedRecordToUpdate?.siswaId)?.nama || selectedRecordToUpdate?.namaSiswa}
        maxWidth="md"
      >
        <form onSubmit={handleSaveQuickUpdate} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
              Pilih Status Perkembangan Baru *
            </label>
            <select
              value={quickUpdateKondisi}
              onChange={(e) => setQuickUpdateKondisi(e.target.value)}
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom bg-white font-bold"
            >
              <option value="Sembuh">Sembuh (Kembali Aktif Belajar di Kelas)</option>
              <option value="Observasi">Observasi (Masih Perlu Dipantau di UKS)</option>
              <option value="Dalam Perawatan">Dalam Perawatan Lanjutan</option>
              <option value="Rujuk Medis">Rujuk ke Puskesmas / RS</option>
            </select>
          </div>

          <div>
            <label className="block font-mono-custom text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
              Catatan Pemulihan / Kondisi Terkini
            </label>
            <textarea
              rows={3}
              value={quickUpdateCatatan}
              onChange={(e) => setQuickUpdateCatatan(e.target.value)}
              placeholder="Contoh: Suhu tubuh normal 36.6 °C, nafsu makan sudah baik, santri ceria dan diizinkan kembali ke kamar."
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1a1c1a]/15">
            <button
              type="button"
              onClick={() => setSelectedRecordToUpdate(null)}
              className="neo-btn-outline py-1.5 px-3 text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="neo-btn-primary py-1.5 px-4 text-xs flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simpan Pembaruan</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
