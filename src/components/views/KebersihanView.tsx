import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Award,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  Download,
  Filter,
  Check,
  UserCheck,
  BedDouble,
  Shirt,
  Brush,
  Smile,
  LayoutGrid,
  Table as TableIcon,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { KebersihanKamar, KebersihanSantriRecord } from '../../types';
import { Modal } from '../common/Modal';

export const KebersihanView: React.FC = () => {
  const {
    kebersihanList,
    kamarList,
    waliAsuhList,
    siswaList,
    addKebersihan,
    updateKamar,
    getKamar,
    getWaliAsuh,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'kamar' | 'santri'>('kamar');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedKamarFilter, setSelectedKamarFilter] = useState<string>('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form for New Room Inspection
  const initialForm: Omit<KebersihanKamar, 'id'> = {
    tanggal: selectedDate,
    kamarId: kamarList[0]?.id || '',
    pemeriksaId: waliAsuhList[0]?.id || '',
    kebersihanDiri: true, // 1. Kebersihan diri (ya / tidak)
    tempatTidur: true,    // 2. Tempat tidur (ya / tidak)
    locketLemari: true,   // 3. Locket lemari (ya / tidak)
    piket: true,          // 4. Piket (ya / tidak)
    skorRanjang: 5,
    skorLemari: 5,
    skorLantai: 5,
    skorKerapianDiri: 5,
    catatan: '',
    tindakanEdukasi: '',
  };

  const [formData, setFormData] = useState<Omit<KebersihanKamar, 'id'>>(initialForm);

  // Per-Student Checklist State (stored in memory/localStorage for daily routine)
  const [santriChecklistState, setSantriChecklistState] = useState<
    Record<string, { kebersihanDiri: boolean; tempatTidur: boolean; locketLemari: boolean; piket: boolean; catatan?: string }>
  >(() => {
    const saved = localStorage.getItem('sipasra_santri_kebersihan_checklist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    // Default: all true
    const init: Record<string, { kebersihanDiri: boolean; tempatTidur: boolean; locketLemari: boolean; piket: boolean }> = {};
    siswaList.forEach((s) => {
      init[s.id] = {
        kebersihanDiri: true,
        tempatTidur: true,
        locketLemari: true,
        piket: true,
      };
    });
    return init;
  });

  // Toggle student checklist item
  const handleToggleSantriItem = (
    siswaId: string,
    field: 'kebersihanDiri' | 'tempatTidur' | 'locketLemari' | 'piket'
  ) => {
    setSantriChecklistState((prev) => {
      const current = prev[siswaId] || {
        kebersihanDiri: true,
        tempatTidur: true,
        locketLemari: true,
        piket: true,
      };
      const updated = {
        ...prev,
        [siswaId]: {
          ...current,
          [field]: !current[field],
        },
      };
      localStorage.setItem('sipasra_santri_kebersihan_checklist', JSON.stringify(updated));
      return updated;
    });
  };

  // Quick mark student all true or all false
  const handleSetAllSantriStatus = (siswaId: string, value: boolean) => {
    setSantriChecklistState((prev) => {
      const updated = {
        ...prev,
        [siswaId]: {
          kebersihanDiri: value,
          tempatTidur: value,
          locketLemari: value,
          piket: value,
        },
      };
      localStorage.setItem('sipasra_santri_kebersihan_checklist', JSON.stringify(updated));
      return updated;
    });
  };

  // Quick bulk for entire room
  const handleSetRoomAllStatus = (kamarId: string, value: boolean) => {
    const studentsInRoom = siswaList.filter((s) => s.kamarId === kamarId);
    setSantriChecklistState((prev) => {
      const updated = { ...prev };
      studentsInRoom.forEach((s) => {
        updated[s.id] = {
          kebersihanDiri: value,
          tempatTidur: value,
          locketLemari: value,
          piket: value,
        };
      });
      localStorage.setItem('sipasra_santri_kebersihan_checklist', JSON.stringify(updated));
      return updated;
    });
  };

  // Calculate score from 4 aspects
  const calcScore = (item: {
    kebersihanDiri: boolean;
    tempatTidur: boolean;
    locketLemari: boolean;
    piket: boolean;
  }) => {
    let count = 0;
    if (item.kebersihanDiri) count++;
    if (item.tempatTidur) count++;
    if (item.locketLemari) count++;
    if (item.piket) count++;
    return {
      count,
      total: 4,
      percentage: Math.round((count / 4) * 100),
      rating: ((count / 4) * 5).toFixed(1),
    };
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addKebersihan(formData);

    // Update room average score
    const { count } = calcScore(formData);
    const scoreVal = (count / 4) * 5;
    updateKamar(formData.kamarId, { nilaiKebersihan: scoreVal });

    setIsAddModalOpen(false);
  };

  // Filtered Inspections
  const filteredInspeksi = useMemo(() => {
    return kebersihanList.filter((item) => {
      const matchKamar =
        selectedKamarFilter === 'Semua' || item.kamarId === selectedKamarFilter;
      return matchKamar;
    });
  }, [kebersihanList, selectedKamarFilter]);

  // Filtered Students
  const filteredSiswa = useMemo(() => {
    return siswaList.filter((s) => {
      return selectedKamarFilter === 'Semua' || s.kamarId === selectedKamarFilter;
    });
  }, [siswaList, selectedKamarFilter]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (activeTab === 'kamar') {
      const rows = filteredInspeksi.map((item, index) => {
        const kamar = getKamar(item.kamarId);
        const pemeriksa = getWaliAsuh(item.pemeriksaId);
        const { count, percentage } = calcScore(item);

        return {
          'No': index + 1,
          'Tanggal': item.tanggal,
          'Kamar': kamar?.nama || '-',
          'Gedung': kamar?.gedung || '-',
          'Wali Asuh Pemeriksa': pemeriksa ? `${pemeriksa.nama}, ${pemeriksa.gelar}` : '-',
          '1. Kebersihan Diri': item.kebersihanDiri ? 'Ya (Rapi)' : 'Tidak',
          '2. Tempat Tidur': item.tempatTidur ? 'Ya (Rapi)' : 'Tidak',
          '3. Locket Lemari': item.locketLemari ? 'Ya (Rapi)' : 'Tidak',
          '4. Piket': item.piket ? 'Ya (Rapi)' : 'Tidak',
          'Hasil Kerapian': `${count} / 4 Aspek (${percentage}%)`,
          'Catatan': item.catatan || '-',
          'Bimbingan Edukasi': item.tindakanEdukasi || '-',
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 5 },
        { wch: 14 },
        { wch: 18 },
        { wch: 16 },
        { wch: 26 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 22 },
        { wch: 35 },
        { wch: 35 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inspeksi Kamar');
      XLSX.writeFile(wb, `Rekap_Kebersihan_Kamar_Asrama_${selectedDate}.xlsx`);
    } else {
      const rows = filteredSiswa.map((siswa, index) => {
        const kamar = getKamar(siswa.kamarId);
        const wali = getWaliAsuh(siswa.waliAsuhId);
        const chk = santriChecklistState[siswa.id] || {
          kebersihanDiri: true,
          tempatTidur: true,
          locketLemari: true,
          piket: true,
        };
        const { count, percentage } = calcScore(chk);

        return {
          'No': index + 1,
          'NISN': siswa.nisn,
          'Nama Santri': siswa.nama,
          'Panggilan': siswa.panggilan,
          'Kelas': siswa.kelas,
          'Kamar': kamar?.nama || '-',
          'Wali Asuh': wali?.nama || '-',
          '1. Kebersihan Diri': chk.kebersihanDiri ? 'Ya (Rapi)' : 'Tidak',
          '2. Tempat Tidur': chk.tempatTidur ? 'Ya (Rapi)' : 'Tidak',
          '3. Locket Lemari': chk.locketLemari ? 'Ya (Rapi)' : 'Tidak',
          '4. Piket': chk.piket ? 'Ya (Rapi)' : 'Tidak',
          'Kepatuhan Kerapian': `${count}/4 (${percentage}%)`,
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 5 },
        { wch: 14 },
        { wch: 26 },
        { wch: 14 },
        { wch: 10 },
        { wch: 18 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Checklist Santri');
      XLSX.writeFile(wb, `Checklist_Kerapian_Santri_${selectedDate}.xlsx`);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner / Header in Variation 2 */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b-[1.5px] border-[#1a1c1a] pb-4">
        <div>
          <span className="status-badge mb-2">
            STANDAR 4 ASPEK KEBERSIHAN & KERAPIAN
          </span>
          <h1 className="font-syne text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.04em] text-[#1a1c1a] leading-none">
            Kebersihan & Kerapian
          </h1>
          <p className="text-xs text-[#1a1c1a]/65 font-mono-custom mt-2 uppercase tracking-wider">
            Format Resmi: 1. Kebersihan Diri · 2. Tempat Tidur · 3. Locket Lemari · 4. Piket
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
            title="Download hasil inspeksi ke Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#006b54]" />
            <span>Export Excel</span>
          </button>

          {/* Input Nilai Inspeksi */}
          <button
            type="button"
            onClick={() => {
              setFormData({ ...initialForm, tanggal: selectedDate });
              setIsAddModalOpen(true);
            }}
            className="neo-btn-primary flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>INPUT INSPEKSI KAMAR</span>
          </button>
        </div>
      </div>

      {/* 4 KRITERIA RESMI BANNER (Directly answering the user's specification) */}
      <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 neo-shadow">
        <div className="flex items-center justify-between border-b border-[#1a1c1a]/15 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#006b54]" />
            <h2 className="font-syne font-bold text-sm text-[#1a1c1a] uppercase tracking-wide">
              FORM STANDAR INSPEKSI KEBERSIHAN & KERAPIAN ASRAMA
            </h2>
          </div>
          <span className="text-[11px] font-mono-custom text-[#006b54] font-bold bg-emerald-50 px-2.5 py-0.5 border border-[#006b54]">
            STATUS: RESMI DIAWASI WALI ASUH
          </span>
        </div>

        {/* 4 Aspect Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono-custom text-xs">
          {/* 1. Kebersihan diri */}
          <div className="p-3 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-[#1a1c1a] text-white font-bold text-[10px]">
                NO. 1
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-[#006b54] font-bold text-[10px] border border-[#006b54]">
                YA / TIDAK
              </span>
            </div>
            <div className="font-syne font-bold text-sm text-[#1a1c1a] flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-[#006b54]" />
              <span>Kebersihan Diri</span>
            </div>
            <p className="text-[11px] text-[#1a1c1a]/70 font-sans leading-relaxed">
              Mandi pagi & sore tertib, kuku dipotong bersih, pakaian wangi & bersih, gigi digosok.
            </p>
          </div>

          {/* 2. Tempat tidur */}
          <div className="p-3 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-[#1a1c1a] text-white font-bold text-[10px]">
                NO. 2
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-[#006b54] font-bold text-[10px] border border-[#006b54]">
                YA / TIDAK
              </span>
            </div>
            <div className="font-syne font-bold text-sm text-[#1a1c1a] flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-[#006b54]" />
              <span>Tempat Tidur</span>
            </div>
            <p className="text-[11px] text-[#1a1c1a]/70 font-sans leading-relaxed">
              Kasur disapu, sprei ditarik kencang tanpa kerutan, bantal tertata, selimut terlipat rapi.
            </p>
          </div>

          {/* 3. Locket lemari */}
          <div className="p-3 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-[#1a1c1a] text-white font-bold text-[10px]">
                NO. 3
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-[#006b54] font-bold text-[10px] border border-[#006b54]">
                YA / TIDAK
              </span>
            </div>
            <div className="font-syne font-bold text-sm text-[#1a1c1a] flex items-center gap-1.5">
              <Shirt className="w-4 h-4 text-[#006b54]" />
              <span>Locket Lemari</span>
            </div>
            <p className="text-[11px] text-[#1a1c1a]/70 font-sans leading-relaxed">
              Pakaian seragam dan santai dilipat berdasar jenis di lemari loker, pintu tertutup tertib.
            </p>
          </div>

          {/* 4. Piket */}
          <div className="p-3 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-[#1a1c1a] text-white font-bold text-[10px]">
                NO. 4
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-[#006b54] font-bold text-[10px] border border-[#006b54]">
                YA / TIDAK
              </span>
            </div>
            <div className="font-syne font-bold text-sm text-[#1a1c1a] flex items-center gap-1.5">
              <Brush className="w-4 h-4 text-[#006b54]" />
              <span>Piket</span>
            </div>
            <p className="text-[11px] text-[#1a1c1a]/70 font-sans leading-relaxed">
              Lantai disapu & dipel, tempat sampah dikosongkan, ventilasi dibuka, teras kamar rapi.
            </p>
          </div>
        </div>
      </div>

      {/* View Switcher & Kamar Filter Bar */}
      <div className="p-3 sm:p-4 bg-[#1a1c1a]/[0.05] border-[1.5px] border-[#1a1c1a] rounded flex flex-wrap gap-2.5 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs */}
          <div className="inline-flex border-[1.5px] border-[#1a1c1a] bg-white">
            <button
              type="button"
              onClick={() => setActiveTab('kamar')}
              className={`px-3 py-1.5 font-mono-custom text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
                activeTab === 'kamar'
                  ? 'bg-[#1a1c1a] text-white'
                  : 'text-[#1a1c1a] hover:bg-[#1a1c1a]/10'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Inspeksi Kamar (8 Kamar)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('santri')}
              className={`px-3 py-1.5 font-mono-custom text-xs font-bold uppercase transition-colors border-l-[1.5px] border-[#1a1c1a] flex items-center gap-1.5 ${
                activeTab === 'santri'
                  ? 'bg-[#1a1c1a] text-white'
                  : 'text-[#1a1c1a] hover:bg-[#1a1c1a]/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Checklist Harian Santri (75 Anak)</span>
            </button>
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
        </div>

        <div className="text-xs font-mono-custom text-[#1a1c1a]/70">
          Tanggal: <span className="font-bold text-[#1a1c1a]">{selectedDate}</span>
        </div>
      </div>

      {/* TAB 1: INSPEKSI KAMAR ASRAMA DENGAN 4 ASPEK */}
      {activeTab === 'kamar' && (
        <div className="space-y-4">
          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow overflow-hidden">
            <div className="p-3.5 bg-[#fdfcf9] border-b-[1.5px] border-[#1a1c1a] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-mono-custom text-[11px] font-bold text-[#006b54] uppercase tracking-wider block">
                  // REKAP PENILAIAN 4 ASPEK KERAPIAN PER KAMAR
                </span>
                <p className="font-syne font-bold text-base text-[#1a1c1a]">
                  Daftar Inspeksi Kamar & Status Checklist (Ya / Tidak)
                </p>
              </div>
              <div className="text-xs font-mono-custom text-[#1a1c1a]/70">
                {filteredInspeksi.length} catatan inspeksi
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-custom">
                <thead className="bg-[#1a1c1a] text-[#fdfcf9] uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3 text-center w-12">No</th>
                    <th className="p-3">KAMAR & GEDUNG</th>
                    <th className="p-3">WALI ASUH PEMERIKSA</th>
                    <th className="p-3 text-center">1. KEBERSIHAN DIRI</th>
                    <th className="p-3 text-center">2. TEMPAT TIDUR</th>
                    <th className="p-3 text-center">3. LOCKET LEMARI</th>
                    <th className="p-3 text-center">4. PIKET</th>
                    <th className="p-3 text-center">STATUS KERAPIAN</th>
                    <th className="p-3">CATATAN & BIMBINGAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1c1a]/15">
                  {filteredInspeksi.map((item, index) => {
                    const kamar = getKamar(item.kamarId);
                    const pemeriksa = getWaliAsuh(item.pemeriksaId);
                    const { count, percentage } = calcScore(item);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#1a1c1a]/[0.02] transition-colors"
                      >
                        <td className="p-3 text-center font-bold text-[#1a1c1a]/60">
                          {index + 1}
                        </td>

                        <td className="p-3">
                          <div className="font-syne font-bold text-sm text-[#1a1c1a]">
                            {kamar?.nama}
                          </div>
                          <div className="text-[10px] text-[#1a1c1a]/60">
                            {kamar?.gedung} · Kapasitas: {kamar?.kapasitas} Santri
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-[#1a1c1a]">
                            {pemeriksa?.nama}, {pemeriksa?.gelar}
                          </div>
                          <div className="text-[10px] text-[#1a1c1a]/60">
                            {item.tanggal}
                          </div>
                        </td>

                        {/* 1. Kebersihan diri */}
                        <td className="p-3 text-center">
                          {item.kebersihanDiri ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-[#006b54] border border-[#006b54] font-bold text-[10px]">
                              <Check className="w-3 h-3" /> YA / RAPI
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-700 font-bold text-[10px]">
                              <XCircle className="w-3 h-3" /> TIDAK
                            </span>
                          )}
                        </td>

                        {/* 2. Tempat tidur */}
                        <td className="p-3 text-center">
                          {item.tempatTidur ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-[#006b54] border border-[#006b54] font-bold text-[10px]">
                              <Check className="w-3 h-3" /> YA / RAPI
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-700 font-bold text-[10px]">
                              <XCircle className="w-3 h-3" /> TIDAK
                            </span>
                          )}
                        </td>

                        {/* 3. Locket lemari */}
                        <td className="p-3 text-center">
                          {item.locketLemari ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-[#006b54] border border-[#006b54] font-bold text-[10px]">
                              <Check className="w-3 h-3" /> YA / RAPI
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-700 font-bold text-[10px]">
                              <XCircle className="w-3 h-3" /> TIDAK
                            </span>
                          )}
                        </td>

                        {/* 4. Piket */}
                        <td className="p-3 text-center">
                          {item.piket ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-[#006b54] border border-[#006b54] font-bold text-[10px]">
                              <Check className="w-3 h-3" /> YA / RAPI
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-700 font-bold text-[10px]">
                              <XCircle className="w-3 h-3" /> TIDAK
                            </span>
                          )}
                        </td>

                        {/* Total Kerapian */}
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 font-bold text-[11px] border ${
                              percentage === 100
                                ? 'bg-emerald-50 text-[#006b54] border-[#006b54]'
                                : percentage >= 75
                                ? 'bg-amber-50 text-amber-900 border-amber-500'
                                : 'bg-rose-50 text-rose-800 border-rose-500'
                            }`}
                          >
                            {count} / 4 ({percentage}%)
                          </span>
                        </td>

                        {/* Catatan */}
                        <td className="p-3 text-[11px] font-sans">
                          {item.catatan && (
                            <div className="text-[#1a1c1a]/80">"{item.catatan}"</div>
                          )}
                          {item.tindakanEdukasi && (
                            <div className="text-[10px] text-[#006b54] font-semibold mt-0.5">
                              💡 {item.tindakanEdukasi}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHECKLIST HARIAN PER SANTRI (75 ANAK) */}
      {activeTab === 'santri' && (
        <div className="space-y-4">
          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow overflow-hidden">
            <div className="p-3.5 bg-[#fdfcf9] border-b-[1.5px] border-[#1a1c1a] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-mono-custom text-[11px] font-bold text-[#006b54] uppercase tracking-wider block">
                  // CHECKLIST 4 ASPEK KERAPIAN TIAP SANTRI CILIK
                </span>
                <p className="font-syne font-bold text-base text-[#1a1c1a]">
                  Inspeksi Mandiri Per Siswa: Klik Ya / Tidak untuk Mengubah Status
                </p>
              </div>

              {/* Bulk Action for selected room */}
              {selectedKamarFilter !== 'Semua' && (
                <div className="flex items-center gap-2 font-mono-custom text-xs">
                  <button
                    type="button"
                    onClick={() => handleSetRoomAllStatus(selectedKamarFilter, true)}
                    className="px-2.5 py-1 bg-[#006b54] text-white font-bold border border-[#1a1c1a] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    ✓ Tandai Rapi Semua (Ya)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetRoomAllStatus(selectedKamarFilter, false)}
                    className="px-2.5 py-1 bg-rose-700 text-white font-bold border border-[#1a1c1a] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    ✕ Reset (Tidak)
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-custom">
                <thead className="bg-[#1a1c1a] text-[#fdfcf9] uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3 text-center w-12">No</th>
                    <th className="p-3">NAMA SANTRI & KAMAR</th>
                    <th className="p-3 text-center w-40">1. KEBERSIHAN DIRI</th>
                    <th className="p-3 text-center w-40">2. TEMPAT TIDUR</th>
                    <th className="p-3 text-center w-40">3. LOCKET LEMARI</th>
                    <th className="p-3 text-center w-40">4. PIKET</th>
                    <th className="p-3 text-center w-28">SKOR HASIL</th>
                    <th className="p-3 text-right w-36">AKSI CEPAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1c1a]/15">
                  {filteredSiswa.map((siswa, index) => {
                    const kamar = getKamar(siswa.kamarId);
                    const chk = santriChecklistState[siswa.id] || {
                      kebersihanDiri: true,
                      tempatTidur: true,
                      locketLemari: true,
                      piket: true,
                    };
                    const { count, percentage } = calcScore(chk);

                    return (
                      <tr
                        key={siswa.id}
                        className="hover:bg-[#1a1c1a]/[0.02] transition-colors"
                      >
                        <td className="p-3 text-center font-bold text-[#1a1c1a]/60">
                          {index + 1}
                        </td>

                        <td className="p-3">
                          <div className="font-syne font-bold text-sm text-[#1a1c1a]">
                            {siswa.nama}
                          </div>
                          <div className="text-[10px] text-[#1a1c1a]/60">
                            NISN: {siswa.nisn} · {siswa.kelas} ({siswa.panggilan}) · Kamar {kamar?.nama}
                          </div>
                        </td>

                        {/* 1. Kebersihan diri button toggle */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSantriItem(siswa.id, 'kebersihanDiri')}
                            className={`w-full py-1.5 px-2 font-bold text-[11px] border transition-all active:scale-95 ${
                              chk.kebersihanDiri
                                ? 'bg-emerald-50 text-[#006b54] border-[#006b54]'
                                : 'bg-rose-50 text-rose-700 border-rose-600'
                            }`}
                          >
                            {chk.kebersihanDiri ? '✓ YA (RAPI)' : '✕ TIDAK'}
                          </button>
                        </td>

                        {/* 2. Tempat tidur button toggle */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSantriItem(siswa.id, 'tempatTidur')}
                            className={`w-full py-1.5 px-2 font-bold text-[11px] border transition-all active:scale-95 ${
                              chk.tempatTidur
                                ? 'bg-emerald-50 text-[#006b54] border-[#006b54]'
                                : 'bg-rose-50 text-rose-700 border-rose-600'
                            }`}
                          >
                            {chk.tempatTidur ? '✓ YA (RAPI)' : '✕ TIDAK'}
                          </button>
                        </td>

                        {/* 3. Locket lemari button toggle */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSantriItem(siswa.id, 'locketLemari')}
                            className={`w-full py-1.5 px-2 font-bold text-[11px] border transition-all active:scale-95 ${
                              chk.locketLemari
                                ? 'bg-emerald-50 text-[#006b54] border-[#006b54]'
                                : 'bg-rose-50 text-rose-700 border-rose-600'
                            }`}
                          >
                            {chk.locketLemari ? '✓ YA (RAPI)' : '✕ TIDAK'}
                          </button>
                        </td>

                        {/* 4. Piket button toggle */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSantriItem(siswa.id, 'piket')}
                            className={`w-full py-1.5 px-2 font-bold text-[11px] border transition-all active:scale-95 ${
                              chk.piket
                                ? 'bg-emerald-50 text-[#006b54] border-[#006b54]'
                                : 'bg-rose-50 text-rose-700 border-rose-600'
                            }`}
                          >
                            {chk.piket ? '✓ YA (RAPI)' : '✕ TIDAK'}
                          </button>
                        </td>

                        {/* Total Score */}
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 font-bold text-[11px] border ${
                              percentage === 100
                                ? 'bg-emerald-50 text-[#006b54] border-[#006b54]'
                                : percentage >= 75
                                ? 'bg-amber-50 text-amber-900 border-amber-500'
                                : 'bg-rose-50 text-rose-800 border-rose-500'
                            }`}
                          >
                            {count} / 4
                          </span>
                        </td>

                        {/* Quick action: Rapi Semua */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleSetAllSantriStatus(siswa.id, true)}
                              title="Tandai semua Ya/Rapi"
                              className="px-2 py-1 bg-white hover:bg-emerald-50 border border-[#1a1c1a] text-[10px] font-bold text-[#006b54]"
                            >
                              Semua Ya
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetAllSantriStatus(siswa.id, false)}
                              title="Tandai semua Tidak"
                              className="px-2 py-1 bg-white hover:bg-rose-50 border border-[#1a1c1a] text-[10px] font-bold text-rose-700"
                            >
                              Reset
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
        </div>
      )}

      {/* MODAL INPUT HASIL INSPEKSI KAMAR */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="CATAT INSPEKSI KEBERSIHAN & KERAPIAN"
        subtitle="Sekolah Rakyat 1 Jepara · Format 4 Kriteria Resmi"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 font-mono-custom text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">Tanggal Inspeksi</label>
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">Pilih Kamar Asrama</label>
              <select
                value={formData.kamarId}
                onChange={(e) => setFormData({ ...formData, kamarId: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
              >
                {kamarList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama} ({k.kapasitas} Santri)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">Wali Asuh Pemeriksa</label>
            <select
              value={formData.pemeriksaId}
              onChange={(e) => setFormData({ ...formData, pemeriksaId: e.target.value })}
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
            >
              {waliAsuhList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nama}, {w.gelar}
                </option>
              ))}
            </select>
          </div>

          {/* 4 CHECKLIST ITEMS (YA / TIDAK) - EXACT USER SPECIFICATION */}
          <div className="p-3 border-[1.5px] border-[#1a1c1a] bg-[#1a1c1a]/[0.02] space-y-3">
            <span className="font-bold text-[#1a1c1a] block border-b border-[#1a1c1a]/15 pb-1">
              CHECKLIST 4 ASPEK KERAPIAN (YA / TIDAK):
            </span>

            {/* Item 1: Kebersihan diri */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white border border-[#1a1c1a]">
              <div>
                <span className="font-bold text-sm text-[#1a1c1a] block">
                  1. Kebersihan diri
                </span>
                <span className="text-[11px] text-[#1a1c1a]/65 font-sans">
                  Kemandirian mandi, kebersihan kuku, pakaian wangi & rambut disisir rapi.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kebersihanDiri: true })}
                  className={`px-3 py-1.5 font-bold text-xs border ${
                    formData.kebersihanDiri
                      ? 'bg-[#006b54] text-white border-[#1a1c1a] neo-shadow-sm'
                      : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40'
                  }`}
                >
                  ✓ YA / RAPI
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kebersihanDiri: false })}
                  className={`px-3 py-1.5 font-bold text-xs border ${
                    !formData.kebersihanDiri
                      ? 'bg-rose-700 text-white border-[#1a1c1a] neo-shadow-sm'
                      : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40'
                  }`}
                >
                  ✕ TIDAK
                </button>
              </div>
            </div>

            {/* Item 2: Tempat tidur */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white border border-[#1a1c1a]">
              <div>
                <span className="font-bold text-sm text-[#1a1c1a] block">
                  2. Tempat tidur
                </span>
                <span className="text-[11px] text-[#1a1c1a]/65 font-sans">
                  Sprei kencang, bantal tertata, selimut terlipat rapi dan bersih.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tempatTidur: true })}
                  className={`px-3 py-1.5 font-bold text-xs border ${
                    formData.tempatTidur
                      ? 'bg-[#006b54] text-white border-[#1a1c1a] neo-shadow-sm'
                      : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40'
                  }`}
                >
                  ✓ YA / RAPI
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tempatTidur: false })}
                  className={`px-3 py-1.5 font-bold text-xs border ${
                    !formData.tempatTidur
                      ? 'bg-rose-700 text-white border-[#1a1c1a] neo-shadow-sm'
                      : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40'
                  }`}
                >
                  ✕ TIDAK
                </button>
              </div>
            </div>

            {/* Item 3: Locket lemari */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white border border-[#1a1c1a]">
              <div>
                <span className="font-bold text-sm text-[#1a1c1a] block">
                  3. Locket lemari
                </span>
                <span className="text-[11px] text-[#1a1c1a]/65 font-sans">
                  Pakaian terlipat tertib di lemari loker masing-masing santri, pintu tertutup rapi.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, locketLemari: true })}
                  className={`px-3 py-1.5 font-bold text-xs border ${
                    formData.locketLemari
                      ? 'bg-[#006b54] text-white border-[#1a1c1a] neo-shadow-sm'
                      : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40'
                  }`}
                >
                  ✓ YA / RAPI
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, locketLemari: false })}
                  className={`px-3 py-1.5 font-bold text-xs border ${
                    !formData.locketLemari
                      ? 'bg-rose-700 text-white border-[#1a1c1a] neo-shadow-sm'
                      : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40'
                  }`}
                >
                  ✕ TIDAK
                </button>
              </div>
            </div>

            {/* Item 4: Piket */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white border border-[#1a1c1a]">
              <div>
                <span className="font-bold text-sm text-[#1a1c1a] block">
                  4. Piket
                </span>
                <span className="text-[11px] text-[#1a1c1a]/65 font-sans">
                  Menyapu, mengepel lantai kamar, membuang sampah dan merapikan teras kamar.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, piket: true })}
                  className={`px-3 py-1.5 font-bold text-xs border ${
                    formData.piket
                      ? 'bg-[#006b54] text-white border-[#1a1c1a] neo-shadow-sm'
                      : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40'
                  }`}
                >
                  ✓ YA / RAPI
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, piket: false })}
                  className={`px-3 py-1.5 font-bold text-xs border ${
                    !formData.piket
                      ? 'bg-rose-700 text-white border-[#1a1c1a] neo-shadow-sm'
                      : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40'
                  }`}
                >
                  ✕ TIDAK
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">Catatan Evaluasi Inspeksi</label>
            <textarea
              rows={2}
              placeholder="Contoh: Sangat rapi, seprei kencang, bantal tertata rapi..."
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">
              Bimbingan Edukasi (Bila ada yang belum rapi)
            </label>
            <input
              type="text"
              placeholder="Contoh: Mengajarkan cara melipat selimut dan menata pakaian di loker"
              value={formData.tindakanEdukasi || ''}
              onChange={(e) =>
                setFormData({ ...formData, tindakanEdukasi: e.target.value })
              }
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1a1c1a]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="neo-btn-outline"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="neo-btn-primary"
            >
              SIMPAN HASIL INSPEKSI
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
