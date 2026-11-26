import React, { useState, useMemo, useRef } from 'react';
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
  Edit,
  ClipboardList,
  Trash2,
  Clock,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import {
  KebersihanKamar,
  CatatanAksiKamar,
  StatusAksiKebersihan,
} from '../../types';
import { Modal } from '../common/Modal';

const AKSI_PRESETS = [
  'Bimbingan melipat selimut & merapikan sprei',
  'Piket ulang lantai, tempat sampah & teras kamar',
  'Penataan ulang pakaian & locket lemari santri',
  'Pendampingan kebersihan diri & perlengkapan mandi',
  'Apresiasi & penguatan kebiasaan kamar rapi',
];

export const KebersihanView: React.FC = () => {
  const {
    kebersihanList,
    catatanAksiKebersihanList,
    kamarList,
    waliAsuhList,
    siswaList,
    addKebersihan,
    addCatatanAksiKebersihan,
    updateCatatanAksiKebersihan,
    deleteCatatanAksiKebersihan,
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
  const aksiFormRef = useRef<HTMLDivElement | null>(null);
  const [editingAksiId, setEditingAksiId] = useState<string | null>(null);
  const [aksiSavedNotice, setAksiSavedNotice] = useState<string | null>(null);

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

  // Form Catatan Aksi di Inspeksi Kamar
  const createEmptyAksiForm = (
    kamarIdParam?: string,
    tanggalParam?: string
  ): Omit<CatatanAksiKamar, 'id'> => {
    const targetKamarId = kamarIdParam || kamarList[0]?.id || '';
    const kamarObj = getKamar(targetKamarId);
    return {
      tanggal: tanggalParam || selectedDate,
      kamarId: targetKamarId,
      penanggungJawabId: kamarObj?.waliAsuhId || waliAsuhList[0]?.id || '',
      penanggungJawabManual: '',
      aspekTerkait: 'Umum / Semua Aspek',
      temuan: '',
      rencanaAksi: '',
      targetSelesai: '',
      status: 'Perlu Tindak Lanjut',
    };
  };

  const [aksiForm, setAksiForm] = useState<Omit<CatatanAksiKamar, 'id'>>(() =>
    createEmptyAksiForm()
  );

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

  // Ensure selected room filter still exists in kamarList
  const effectiveKamarFilter = useMemo(() => {
    if (selectedKamarFilter === 'Semua') return 'Semua';
    return kamarList.some((k) => k.id === selectedKamarFilter) ? selectedKamarFilter : 'Semua';
  }, [kamarList, selectedKamarFilter]);

  // Student count per room
  const penghuniPerKamar = useMemo(() => {
    const map: Record<string, number> = {};
    siswaList.forEach((s) => {
      if (s.kamarId) {
        map[s.kamarId] = (map[s.kamarId] || 0) + 1;
      }
    });
    return map;
  }, [siswaList]);

  // Helper to build modal form values for a given room & date
  const buildModalFormData = (kamarId: string, tanggal: string): Omit<KebersihanKamar, 'id'> => {
    const existing = kebersihanList.find(
      (item) => item.kamarId === kamarId && item.tanggal === tanggal
    );
    if (existing) {
      return {
        tanggal: existing.tanggal,
        kamarId: existing.kamarId,
        pemeriksaId: existing.pemeriksaId,
        kebersihanDiri: existing.kebersihanDiri,
        tempatTidur: existing.tempatTidur,
        locketLemari: existing.locketLemari,
        piket: existing.piket,
        skorRanjang: existing.skorRanjang,
        skorLemari: existing.skorLemari,
        skorLantai: existing.skorLantai,
        skorKerapianDiri: existing.skorKerapianDiri,
        catatan: existing.catatan || '',
        tindakanEdukasi: existing.tindakanEdukasi || '',
      };
    }
    const kamar = getKamar(kamarId);
    return {
      ...initialForm,
      tanggal,
      kamarId,
      pemeriksaId: kamar?.waliAsuhId || waliAsuhList[0]?.id || '',
    };
  };

  const openInspeksiModal = (kamarId?: string) => {
    const targetKamarId =
      kamarId ||
      (effectiveKamarFilter !== 'Semua' ? effectiveKamarFilter : kamarList[0]?.id || '');
    setFormData(buildModalFormData(targetKamarId, selectedDate));
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kamarId) return;
    addKebersihan(formData);

    // Update room average score
    const { count } = calcScore(formData);
    const scoreVal = (count / 4) * 5;
    updateKamar(formData.kamarId, { nilaiKebersihan: scoreVal });

    setIsAddModalOpen(false);
  };

  // Rooms filtered by selectedKamarFilter (synced directly with Menu Data Kamar)
  const filteredKamarList = useMemo(() => {
    return kamarList.filter((k) => {
      return effectiveKamarFilter === 'Semua' || k.id === effectiveKamarFilter;
    });
  }, [kamarList, effectiveKamarFilter]);

  // Map room id -> inspection for selectedDate
  const inspeksiByKamarOnDate = useMemo(() => {
    const map: Record<string, KebersihanKamar> = {};
    kebersihanList.forEach((item) => {
      if (item.tanggal === selectedDate && !map[item.kamarId]) {
        map[item.kamarId] = item;
      }
    });
    return map;
  }, [kebersihanList, selectedDate]);

  // Historical inspections on other dates (filtered to existing rooms in Data Kamar)
  const riwayatInspeksiLainnya = useMemo(() => {
    const validKamarIds = new Set(kamarList.map((k) => k.id));
    return kebersihanList.filter((item) => {
      if (!validKamarIds.has(item.kamarId)) return false;
      const matchKamar =
        effectiveKamarFilter === 'Semua' || item.kamarId === effectiveKamarFilter;
      return matchKamar && item.tanggal !== selectedDate;
    });
  }, [kebersihanList, kamarList, effectiveKamarFilter, selectedDate]);

  // Filtered Catatan Aksi (synced with Data Kamar & kamar filter)
  const filteredCatatanAksi = useMemo(() => {
    const validKamarIds = new Set(kamarList.map((k) => k.id));
    return catatanAksiKebersihanList.filter((item) => {
      if (!validKamarIds.has(item.kamarId)) return false;
      return effectiveKamarFilter === 'Semua' || item.kamarId === effectiveKamarFilter;
    });
  }, [catatanAksiKebersihanList, kamarList, effectiveKamarFilter]);

  const aksiCountPerKamar = useMemo(() => {
    const map: Record<string, number> = {};
    catatanAksiKebersihanList.forEach((item) => {
      if (item.kamarId && item.status !== 'Selesai') {
        map[item.kamarId] = (map[item.kamarId] || 0) + 1;
      }
    });
    return map;
  }, [catatanAksiKebersihanList]);

  const handleFocusAksiFormForKamar = (kamarId: string) => {
    setEditingAksiId(null);
    const kamarObj = getKamar(kamarId);
    const inspeksiHariIni = inspeksiByKamarOnDate[kamarId];
    setAksiForm({
      tanggal: selectedDate,
      kamarId,
      penanggungJawabId:
        inspeksiHariIni?.pemeriksaId || kamarObj?.waliAsuhId || waliAsuhList[0]?.id || '',
      penanggungJawabManual: '',
      aspekTerkait: 'Umum / Semua Aspek',
      temuan: inspeksiHariIni?.catatan || '',
      rencanaAksi: inspeksiHariIni?.tindakanEdukasi || '',
      targetSelesai: '',
      status: 'Perlu Tindak Lanjut',
    });
    setTimeout(() => {
      aksiFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleSaveAksiForm = (e: React.FormEvent) => {
    e.preventDefault();
    const targetKamarId = aksiForm.kamarId || kamarList[0]?.id || '';
    if (!targetKamarId || !aksiForm.rencanaAksi.trim()) return;

    const payload: Omit<CatatanAksiKamar, 'id'> = {
      ...aksiForm,
      kamarId: targetKamarId,
      temuan: aksiForm.temuan.trim(),
      rencanaAksi: aksiForm.rencanaAksi.trim(),
      penanggungJawabManual: aksiForm.penanggungJawabManual?.trim() || '',
    };

    if (editingAksiId) {
      updateCatatanAksiKebersihan(editingAksiId, payload);
      setEditingAksiId(null);
      setAksiSavedNotice('Catatan aksi berhasil diperbarui.');
    } else {
      addCatatanAksiKebersihan(payload);
      setAksiSavedNotice('Catatan aksi baru berhasil disimpan.');
    }

    setAksiForm(
      createEmptyAksiForm(
        effectiveKamarFilter !== 'Semua' ? effectiveKamarFilter : targetKamarId,
        selectedDate
      )
    );
    setTimeout(() => setAksiSavedNotice(null), 3000);
  };

  const handleEditAksi = (item: CatatanAksiKamar) => {
    setEditingAksiId(item.id);
    setAksiForm({
      tanggal: item.tanggal,
      kamarId: item.kamarId,
      penanggungJawabId: item.penanggungJawabId,
      penanggungJawabManual: item.penanggungJawabManual || '',
      aspekTerkait: item.aspekTerkait,
      temuan: item.temuan,
      rencanaAksi: item.rencanaAksi,
      targetSelesai: item.targetSelesai || '',
      status: item.status,
    });
    setTimeout(() => {
      aksiFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Filtered Students (synced directly with Menu Data Siswa)
  const filteredSiswa = useMemo(() => {
    return siswaList.filter((s) => {
      return effectiveKamarFilter === 'Semua' || s.kamarId === effectiveKamarFilter;
    });
  }, [siswaList, effectiveKamarFilter]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (activeTab === 'kamar') {
      const rows = filteredKamarList.map((kamar, index) => {
        const item = inspeksiByKamarOnDate[kamar.id];
        const pemeriksa = item ? getWaliAsuh(item.pemeriksaId) : getWaliAsuh(kamar.waliAsuhId);
        const penghuniCount = penghuniPerKamar[kamar.id] || 0;

        if (!item) {
          return {
            'No': index + 1,
            'Tanggal': selectedDate,
            'Kamar': kamar.nama,
            'Gedung': kamar.gedung || '-',
            'Penghuni': `${penghuniCount} / ${kamar.kapasitas} Santri`,
            'Wali Asuh Pemeriksa': pemeriksa
              ? `${pemeriksa.nama}${pemeriksa.gelar ? `, ${pemeriksa.gelar}` : ''}`
              : '-',
            '1. Kebersihan Diri': 'Belum Diinspeksi',
            '2. Tempat Tidur': 'Belum Diinspeksi',
            '3. Locket Lemari': 'Belum Diinspeksi',
            '4. Piket': 'Belum Diinspeksi',
            'Hasil Kerapian': 'Belum Diinspeksi',
            'Catatan': '-',
            'Bimbingan Edukasi': '-',
          };
        }

        const { count, percentage } = calcScore(item);

        return {
          'No': index + 1,
          'Tanggal': item.tanggal,
          'Kamar': kamar.nama,
          'Gedung': kamar.gedung || '-',
          'Penghuni': `${penghuniCount} / ${kamar.kapasitas} Santri`,
          'Wali Asuh Pemeriksa': pemeriksa
            ? `${pemeriksa.nama}${pemeriksa.gelar ? `, ${pemeriksa.gelar}` : ''}`
            : '-',
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
        { wch: 18 },
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

      if (filteredCatatanAksi.length > 0) {
        const aksiRows = filteredCatatanAksi.map((aksi, idx) => {
          const kamar = getKamar(aksi.kamarId);
          const pj = getWaliAsuh(aksi.penanggungJawabId);
          const pjLabel =
            aksi.penanggungJawabManual ||
            (pj ? `${pj.nama}${pj.gelar ? `, ${pj.gelar}` : ''}` : '-');
          return {
            'No': idx + 1,
            'Tanggal': aksi.tanggal,
            'Kamar': kamar?.nama || '-',
            'Aspek Terkait': aksi.aspekTerkait,
            'Temuan / Kondisi': aksi.temuan || '-',
            'Catatan Aksi / Tindak Lanjut': aksi.rencanaAksi,
            'Penanggung Jawab': pjLabel,
            'Target Selesai': aksi.targetSelesai || '-',
            'Status': aksi.status,
          };
        });
        const wsAksi = XLSX.utils.json_to_sheet(aksiRows);
        wsAksi['!cols'] = [
          { wch: 5 },
          { wch: 14 },
          { wch: 18 },
          { wch: 22 },
          { wch: 30 },
          { wch: 36 },
          { wch: 24 },
          { wch: 14 },
          { wch: 20 },
        ];
        XLSX.utils.book_append_sheet(wb, wsAksi, 'Catatan Aksi Kamar');
      }

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
          'NISN': siswa.nisn || '-',
          'Nama Santri': siswa.nama,
          'Panggilan': siswa.panggilan || '-',
          'Kelas': siswa.kelas || '-',
          'Kamar': kamar?.nama || 'Belum Ada Kamar',
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
            onClick={() => openInspeksiModal()}
            disabled={kamarList.length === 0}
            className="neo-btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span>Inspeksi Kamar ({kamarList.length} Kamar)</span>
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
              <span>Checklist Harian Santri ({siswaList.length} Anak)</span>
            </button>
          </div>

          {/* Filter Kamar */}
          <select
            value={effectiveKamarFilter}
            onChange={(e) => setSelectedKamarFilter(e.target.value)}
            className="bg-white border-[1.5px] border-[#1a1c1a] px-3 py-1.5 text-xs font-mono-custom font-semibold text-[#1a1c1a] focus:outline-none"
          >
            <option value="Semua">Semua Kamar Asrama ({kamarList.length} Kamar)</option>
            {kamarList.map((k) => {
              const penghuniCount = penghuniPerKamar[k.id] || 0;
              return (
                <option key={k.id} value={k.id}>
                  {k.nama} ({penghuniCount}/{k.kapasitas} Santri)
                </option>
              );
            })}
          </select>
        </div>

        <div className="text-xs font-mono-custom text-[#1a1c1a]/70">
          Tanggal: <span className="font-bold text-[#1a1c1a]">{selectedDate}</span>
        </div>
      </div>

      {/* TAB 1: INSPEKSI KAMAR ASRAMA DENGAN 4 ASPEK (SESUAI DATA KAMAR) */}
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
                <span className="font-bold text-[#1a1c1a]">{filteredKamarList.length}</span> kamar terdaftar ·{' '}
                <span className="font-bold text-[#006b54]">
                  {filteredKamarList.filter((k) => Boolean(inspeksiByKamarOnDate[k.id])).length}
                </span>{' '}
                sudah diinspeksi
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
                    <th className="p-3 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1c1a]/15">
                  {filteredKamarList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-[#1a1c1a]/60 font-sans text-sm">
                        Belum ada kamar terdaftar di menu Data Kamar. Tambahkan kamar terlebih dahulu untuk melakukan inspeksi.
                      </td>
                    </tr>
                  ) : (
                    filteredKamarList.map((kamar, index) => {
                      const item = inspeksiByKamarOnDate[kamar.id];
                      const pemeriksa = item
                        ? getWaliAsuh(item.pemeriksaId)
                        : getWaliAsuh(kamar.waliAsuhId);
                      const penghuniCount = penghuniPerKamar[kamar.id] || 0;

                      if (!item) {
                        return (
                          <tr
                            key={kamar.id}
                            className="hover:bg-[#1a1c1a]/[0.02] transition-colors bg-[#fdfcf9]/50"
                          >
                            <td className="p-3 text-center font-bold text-[#1a1c1a]/60">
                              {index + 1}
                            </td>
                            <td className="p-3">
                              <div className="font-syne font-bold text-sm text-[#1a1c1a]">
                                {kamar.nama}
                              </div>
                              <div className="text-[10px] text-[#1a1c1a]/60">
                                {kamar.gedung || '-'} · Penghuni: {penghuniCount}/{kamar.kapasitas} Santri
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-[#1a1c1a]/75">
                                {pemeriksa
                                  ? `${pemeriksa.nama}${pemeriksa.gelar ? `, ${pemeriksa.gelar}` : ''}`
                                  : '-'}
                              </div>
                              <div className="text-[10px] text-amber-700 font-bold">
                                Belum diinspeksi ({selectedDate})
                              </div>
                            </td>
                            <td className="p-3 text-center text-[#1a1c1a]/40">-</td>
                            <td className="p-3 text-center text-[#1a1c1a]/40">-</td>
                            <td className="p-3 text-center text-[#1a1c1a]/40">-</td>
                            <td className="p-3 text-center text-[#1a1c1a]/40">-</td>
                            <td className="p-3 text-center">
                              <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-500">
                                BELUM DINILAI
                              </span>
                            </td>
                            <td className="p-3 text-[11px] font-sans text-[#1a1c1a]/50">
                              Belum ada catatan inspeksi untuk tanggal ini.
                            </td>
                            <td className="p-3 text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openInspeksiModal(kamar.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#006b54] text-white font-bold text-[10px] border border-[#1a1c1a] hover:bg-[#005542] transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  Catat
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFocusAksiFormForKamar(kamar.id)}
                                  title="Buat catatan aksi untuk kamar ini"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-200 text-amber-950 font-bold text-[10px] border border-[#1a1c1a] transition-colors"
                                >
                                  <ClipboardList className="w-3 h-3" />
                                  Aksi
                                  {(aksiCountPerKamar[kamar.id] || 0) > 0 && (
                                    <span className="px-1 bg-[#1a1c1a] text-white text-[9px] leading-tight">
                                      {aksiCountPerKamar[kamar.id]}
                                    </span>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const { count, percentage } = calcScore(item);

                      return (
                        <tr
                          key={kamar.id}
                          className="hover:bg-[#1a1c1a]/[0.02] transition-colors"
                        >
                          <td className="p-3 text-center font-bold text-[#1a1c1a]/60">
                            {index + 1}
                          </td>

                          <td className="p-3">
                            <div className="font-syne font-bold text-sm text-[#1a1c1a]">
                              {kamar.nama}
                            </div>
                            <div className="text-[10px] text-[#1a1c1a]/60">
                              {kamar.gedung || '-'} · Penghuni: {penghuniCount}/{kamar.kapasitas} Santri
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-semibold text-[#1a1c1a]">
                              {pemeriksa
                                ? `${pemeriksa.nama}${pemeriksa.gelar ? `, ${pemeriksa.gelar}` : ''}`
                                : '-'}
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
                            {item.catatan ? (
                              <div className="text-[#1a1c1a]/80">"{item.catatan}"</div>
                            ) : (
                              <span className="text-[#1a1c1a]/40">-</span>
                            )}
                            {item.tindakanEdukasi && (
                              <div className="text-[10px] text-[#006b54] font-semibold mt-0.5">
                                💡 {item.tindakanEdukasi}
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openInspeksiModal(kamar.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] font-bold text-[10px] border border-[#1a1c1a] transition-colors"
                              >
                                <Edit className="w-3 h-3" />
                                Ubah
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFocusAksiFormForKamar(kamar.id)}
                                title="Buat catatan aksi untuk kamar ini"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-200 text-amber-950 font-bold text-[10px] border border-[#1a1c1a] transition-colors"
                              >
                                <ClipboardList className="w-3 h-3" />
                                Aksi
                                {(aksiCountPerKamar[kamar.id] || 0) > 0 && (
                                  <span className="px-1 bg-[#1a1c1a] text-white text-[9px] leading-tight">
                                    {aksiCountPerKamar[kamar.id]}
                                  </span>
                                )}
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

          {/* FORM CATATAN AKSI INSPEKSI KAMAR */}
          <div
            ref={aksiFormRef}
            className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow overflow-hidden"
          >
            <div className="p-3.5 bg-[#fdfcf9] border-b-[1.5px] border-[#1a1c1a] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-mono-custom text-[11px] font-bold text-[#006b54] uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5" />
                  // FORM CATATAN AKSI & TINDAK LANJUT INSPEKSI KAMAR
                </span>
                <p className="font-syne font-bold text-base text-[#1a1c1a]">
                  {editingAksiId
                    ? 'Edit Catatan Aksi Perbaikan Kamar'
                    : 'Catat Rencana Aksi, Pembinaan & Tindak Lanjut Per Kamar'}
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono-custom text-xs">
                <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-500 font-bold">
                  {filteredCatatanAksi.filter((a) => a.status !== 'Selesai').length} Aktif
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-[#006b54] border border-[#006b54] font-bold">
                  {filteredCatatanAksi.filter((a) => a.status === 'Selesai').length} Selesai
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveAksiForm} className="p-4 space-y-4 font-mono-custom text-xs">
              {aksiSavedNotice && (
                <div className="p-2.5 bg-emerald-50 border border-[#006b54] text-[#006b54] font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{aksiSavedNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Kamar Asrama <span className="text-rose-600">*</span>
                  </label>
                  <select
                    required
                    value={aksiForm.kamarId || kamarList[0]?.id || ''}
                    onChange={(e) => {
                      const nextKamarId = e.target.value;
                      const kamarObj = getKamar(nextKamarId);
                      setAksiForm((prev) => ({
                        ...prev,
                        kamarId: nextKamarId,
                        penanggungJawabId:
                          kamarObj?.waliAsuhId || prev.penanggungJawabId || waliAsuhList[0]?.id || '',
                      }));
                    }}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
                  >
                    {kamarList.length === 0 ? (
                      <option value="">Belum ada kamar di Data Kamar</option>
                    ) : (
                      kamarList.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama} ({penghuniPerKamar[k.id] || 0}/{k.kapasitas} Santri)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">Tanggal Catatan</label>
                  <input
                    type="date"
                    required
                    value={aksiForm.tanggal}
                    onChange={(e) => setAksiForm({ ...aksiForm, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">Aspek Terkait</label>
                  <select
                    value={aksiForm.aspekTerkait}
                    onChange={(e) =>
                      setAksiForm({
                        ...aksiForm,
                        aspekTerkait: e.target.value as CatatanAksiKamar['aspekTerkait'],
                      })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
                  >
                    <option value="Umum / Semua Aspek">Umum / Semua Aspek</option>
                    <option value="1. Kebersihan Diri">1. Kebersihan Diri</option>
                    <option value="2. Tempat Tidur">2. Tempat Tidur</option>
                    <option value="3. Locket Lemari">3. Locket Lemari</option>
                    <option value="4. Piket">4. Piket</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">Status Tindak Lanjut</label>
                  <select
                    value={aksiForm.status}
                    onChange={(e) =>
                      setAksiForm({
                        ...aksiForm,
                        status: e.target.value as StatusAksiKebersihan,
                      })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-bold focus:outline-none"
                  >
                    <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Wali Asuh Penanggung Jawab
                  </label>
                  <select
                    value={aksiForm.penanggungJawabId}
                    onChange={(e) =>
                      setAksiForm({ ...aksiForm, penanggungJawabId: e.target.value })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
                  >
                    <option value="">-- Pilih Wali Asuh --</option>
                    {waliAsuhList.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nama}
                        {w.gelar ? `, ${w.gelar}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Petugas Lain / Ketua Kamar (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Isi jika penanggung jawab manual"
                    value={aksiForm.penanggungJawabManual || ''}
                    onChange={(e) =>
                      setAksiForm({ ...aksiForm, penanggungJawabManual: e.target.value })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Target Selesai (Opsional)
                  </label>
                  <input
                    type="date"
                    value={aksiForm.targetSelesai || ''}
                    onChange={(e) =>
                      setAksiForm({ ...aksiForm, targetSelesai: e.target.value })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#1a1c1a]">Temuan / Kondisi Lapangan</label>
                    {inspeksiByKamarOnDate[aksiForm.kamarId || kamarList[0]?.id || '']?.catatan && (
                      <button
                        type="button"
                        onClick={() => {
                          const insp =
                            inspeksiByKamarOnDate[aksiForm.kamarId || kamarList[0]?.id || ''];
                          if (insp?.catatan) {
                            setAksiForm((prev) => ({ ...prev, temuan: insp.catatan }));
                          }
                        }}
                        className="text-[10px] text-[#006b54] underline font-bold"
                      >
                        Salin dari catatan inspeksi
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Beberapa loker masih belum terlipat rapi dan tempat sampah penuh..."
                    value={aksiForm.temuan}
                    onChange={(e) => setAksiForm({ ...aksiForm, temuan: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Catatan Aksi / Tindakan Perbaikan <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Contoh: Pendampingan santri menata loker bersama ketua kamar sebelum jam mengaji..."
                    value={aksiForm.rencanaAksi}
                    onChange={(e) => setAksiForm({ ...aksiForm, rencanaAksi: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#1a1c1a]/60 uppercase mr-1">
                  Template Cepat:
                </span>
                {AKSI_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setAksiForm((prev) => ({
                        ...prev,
                        rencanaAksi: prev.rencanaAksi
                          ? `${prev.rencanaAksi}; ${preset}`
                          : preset,
                      }))
                    }
                    className="px-2 py-1 bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-white border border-[#1a1c1a]/50 text-[10px] font-sans transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#1a1c1a]/15">
                {editingAksiId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAksiId(null);
                      setAksiForm(
                        createEmptyAksiForm(
                          effectiveKamarFilter !== 'Semua'
                            ? effectiveKamarFilter
                            : kamarList[0]?.id,
                          selectedDate
                        )
                      );
                    }}
                    className="neo-btn-outline"
                  >
                    BATAL EDIT
                  </button>
                )}
                <button
                  type="submit"
                  disabled={kamarList.length === 0}
                  className="neo-btn-primary inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingAksiId ? 'SIMPAN PERUBAHAN AKSI' : 'SIMPAN CATATAN AKSI'}</span>
                </button>
              </div>
            </form>

            {/* Daftar Catatan Aksi Tersimpan */}
            <div className="border-t-[1.5px] border-[#1a1c1a]">
              <div className="p-3 bg-[#1a1c1a]/[0.03] border-b border-[#1a1c1a]/15 flex items-center justify-between">
                <span className="font-mono-custom text-[11px] font-bold text-[#1a1c1a] uppercase tracking-wider">
                  // DAFTAR CATATAN AKSI INSPEKSI KAMAR ({filteredCatatanAksi.length})
                </span>
              </div>

              {filteredCatatanAksi.length === 0 ? (
                <div className="p-6 text-center text-xs font-sans text-[#1a1c1a]/55">
                  Belum ada catatan aksi inspeksi kamar. Isi form di atas untuk mencatat tindak lanjut pembinaan kamar.
                </div>
              ) : (
                <div className="divide-y divide-[#1a1c1a]/15">
                  {filteredCatatanAksi.map((aksi) => {
                    const kamar = getKamar(aksi.kamarId);
                    const pj = getWaliAsuh(aksi.penanggungJawabId);
                    const pjName =
                      aksi.penanggungJawabManual ||
                      (pj ? `${pj.nama}${pj.gelar ? `, ${pj.gelar}` : ''}` : '-');

                    return (
                      <div
                        key={aksi.id}
                        className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-[#1a1c1a]/[0.02]"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2 font-mono-custom text-[11px]">
                            <span className="px-2 py-0.5 bg-[#1a1c1a] text-white font-bold">
                              {kamar?.nama || '-'}
                            </span>
                            <span className="px-2 py-0.5 bg-[#fdfcf9] border border-[#1a1c1a] font-bold">
                              {aksi.aspekTerkait}
                            </span>
                            <span className="text-[#1a1c1a]/65 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {aksi.tanggal}
                            </span>
                            {aksi.targetSelesai && (
                              <span className="text-[#1a1c1a]/65 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Target: {aksi.targetSelesai}
                              </span>
                            )}
                          </div>

                          {aksi.temuan && (
                            <p className="text-xs font-sans text-[#1a1c1a]/75">
                              <span className="font-bold text-[#1a1c1a]">Temuan:</span> {aksi.temuan}
                            </p>
                          )}

                          <p className="text-xs font-sans text-[#1a1c1a]">
                            <span className="font-bold text-[#006b54]">Catatan Aksi:</span>{' '}
                            {aksi.rencanaAksi}
                          </p>

                          <p className="text-[11px] font-mono-custom text-[#1a1c1a]/65">
                            Penanggung Jawab: <span className="font-semibold text-[#1a1c1a]">{pjName}</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0 font-mono-custom text-[11px]">
                          <select
                            value={aksi.status}
                            onChange={(e) =>
                              updateCatatanAksiKebersihan(aksi.id, {
                                status: e.target.value as StatusAksiKebersihan,
                              })
                            }
                            className={`px-2.5 py-1 font-bold border-[1.5px] focus:outline-none ${
                              aksi.status === 'Selesai'
                                ? 'bg-emerald-50 text-[#006b54] border-[#006b54]'
                                : aksi.status === 'Dalam Proses'
                                ? 'bg-sky-50 text-sky-800 border-sky-700'
                                : 'bg-amber-50 text-amber-900 border-amber-600'
                            }`}
                          >
                            <option value="Perlu Tindak Lanjut">Perlu Tindak Lanjut</option>
                            <option value="Dalam Proses">Dalam Proses</option>
                            <option value="Selesai">Selesai</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleEditAksi(aksi)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#1a1c1a] hover:text-white border border-[#1a1c1a] font-bold"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteCatatanAksiKebersihan(aksi.id)}
                            title="Hapus catatan aksi"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-rose-700 hover:text-white text-rose-700 border border-rose-700 font-bold"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {riwayatInspeksiLainnya.length > 0 && (
            <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow overflow-hidden">
              <div className="p-3 bg-[#fdfcf9] border-b-[1.5px] border-[#1a1c1a] flex items-center justify-between">
                <span className="font-mono-custom text-[11px] font-bold text-[#1a1c1a] uppercase tracking-wider">
                  // RIWAYAT INSPEKSI TANGGAL LAINNYA ({riwayatInspeksiLainnya.length} CATATAN)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono-custom">
                  <thead className="bg-[#1a1c1a]/10 text-[#1a1c1a] uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-2.5">Tanggal</th>
                      <th className="p-2.5">Kamar</th>
                      <th className="p-2.5">Pemeriksa</th>
                      <th className="p-2.5 text-center">Skor</th>
                      <th className="p-2.5">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1c1a]/10">
                    {riwayatInspeksiLainnya.slice(0, 10).map((item) => {
                      const kamar = getKamar(item.kamarId);
                      const pemeriksa = getWaliAsuh(item.pemeriksaId);
                      const { count, percentage } = calcScore(item);
                      return (
                        <tr key={item.id} className="hover:bg-[#1a1c1a]/[0.02]">
                          <td className="p-2.5 font-semibold">{item.tanggal}</td>
                          <td className="p-2.5 font-bold">{kamar?.nama || '-'}</td>
                          <td className="p-2.5">
                            {pemeriksa
                              ? `${pemeriksa.nama}${pemeriksa.gelar ? `, ${pemeriksa.gelar}` : ''}`
                              : '-'}
                          </td>
                          <td className="p-2.5 text-center font-bold">
                            {count}/4 ({percentage}%)
                          </td>
                          <td className="p-2.5 font-sans text-[#1a1c1a]/75">
                            {item.catatan || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CHECKLIST HARIAN PER SANTRI (SESUAI DATA SISWA) */}
      {activeTab === 'santri' && (
        <div className="space-y-4">
          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow overflow-hidden">
            <div className="p-3.5 bg-[#fdfcf9] border-b-[1.5px] border-[#1a1c1a] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-mono-custom text-[11px] font-bold text-[#006b54] uppercase tracking-wider block">
                  // CHECKLIST 4 ASPEK KERAPIAN TIAP SANTRI ({filteredSiswa.length} DARI {siswaList.length} SISWA TERDAFTAR)
                </span>
                <p className="font-syne font-bold text-base text-[#1a1c1a]">
                  Inspeksi Mandiri Per Siswa: Klik Ya / Tidak untuk Mengubah Status
                </p>
              </div>

              {/* Bulk Action for selected room */}
              {effectiveKamarFilter !== 'Semua' && filteredSiswa.length > 0 && (
                <div className="flex items-center gap-2 font-mono-custom text-xs">
                  <button
                    type="button"
                    onClick={() => handleSetRoomAllStatus(effectiveKamarFilter, true)}
                    className="px-2.5 py-1 bg-[#006b54] text-white font-bold border border-[#1a1c1a] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    ✓ Tandai Rapi Semua (Ya)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetRoomAllStatus(effectiveKamarFilter, false)}
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
                  {filteredSiswa.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#1a1c1a]/60 font-sans text-sm">
                        {siswaList.length === 0
                          ? 'Belum ada data santri di menu Data Siswa.'
                          : 'Belum ada santri yang menempati kamar ini.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSiswa.map((siswa, index) => {
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
                              NISN: {siswa.nisn || '-'} · {siswa.kelas || '-'} ({siswa.panggilan || '-'}) ·{' '}
                              {kamar ? `Kamar ${kamar.nama}` : 'Belum Ada Kamar'}
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
                    })
                  )}
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
                onChange={(e) => setFormData(buildModalFormData(formData.kamarId, e.target.value))}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">Pilih Kamar Asrama</label>
              <select
                required
                value={formData.kamarId}
                onChange={(e) => setFormData(buildModalFormData(e.target.value, formData.tanggal))}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs focus:outline-none"
              >
                {kamarList.length === 0 ? (
                  <option value="">Belum ada kamar di Data Kamar</option>
                ) : (
                  kamarList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} ({penghuniPerKamar[k.id] || 0}/{k.kapasitas} Santri)
                    </option>
                  ))
                )}
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
              <option value="">-- Pilih Wali Asuh Pemeriksa --</option>
              {waliAsuhList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nama}{w.gelar ? `, ${w.gelar}` : ''}
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
