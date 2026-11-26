import React, { useState, useRef } from 'react';
import {
  Plus,
  Users,
  Sparkles,
  Trash2,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
  Home,
  UserPlus,
  UserMinus,
  Crown,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Kamar } from '../../types';

const GEDUNG_NAMES_STORAGE_KEY = 'sipasra_gedung_names_v1';

const extractGedungInfo = (gedungStr: string): { kategori: 'Putra' | 'Putri'; namaGedung: string } => {
  const lower = (gedungStr || '').toLowerCase();
  const kategori: 'Putra' | 'Putri' = lower.includes('putri') ? 'Putri' : 'Putra';
  const parenMatch = (gedungStr || '').match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1].trim()) {
    return { kategori, namaGedung: parenMatch[1].trim() };
  }
  const stripped = (gedungStr || '')
    .replace(/^gedung\s+(putra|putri)\s*[-:–]?\s*/i, '')
    .trim();
  return { kategori, namaGedung: stripped };
};

const buildGedungLabel = (kategori: 'Putra' | 'Putri', namaManual: string): string => {
  const trimmed = namaManual.trim();
  if (!trimmed) return `Gedung ${kategori}`;
  if (/^gedung\s+(putra|putri)/i.test(trimmed)) {
    return trimmed;
  }
  return `Gedung ${kategori} (${trimmed})`;
};

export const DataKamarView: React.FC = () => {
  const {
    kamarList,
    siswaList,
    waliAsuhList,
    addKamar,
    updateKamar,
    deleteKamar,
    clearAllKamar,
    updateSiswa,
    getWaliAsuh,
    getSiswa,
    setSelectedSiswaId,
    setActiveMenu,
  } = useApp();

  type ActiveKamarPanel = 'none' | 'add' | 'edit' | 'hapus' | 'penghuni' | 'gedung';
  const [activePanel, setActivePanel] = useState<ActiveKamarPanel>('none');
  const [selectedGedungFilter, setSelectedGedungFilter] = useState<string>('Semua');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Saved default manual names for Gedung Putra & Gedung Putri
  const [gedungNames, setGedungNames] = useState<{ putra: string; putri: string }>(() => {
    try {
      const saved = localStorage.getItem(GEDUNG_NAMES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            putra: typeof parsed.putra === 'string' ? parsed.putra : '',
            putri: typeof parsed.putri === 'string' ? parsed.putri : '',
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    const existingPutra = kamarList.find((k) => k.gedung.toLowerCase().includes('putra'));
    const existingPutri = kamarList.find((k) => k.gedung.toLowerCase().includes('putri'));
    return {
      putra: existingPutra ? extractGedungInfo(existingPutra.gedung).namaGedung : 'Sultan Hadlirin',
      putri: existingPutri ? extractGedungInfo(existingPutri.gedung).namaGedung : 'Ratu Shima',
    };
  });

  // Inline "Atur Nama Gedung" form state
  const [gedungPutraInput, setGedungPutraInput] = useState<string>(gedungNames.putra);
  const [gedungPutriInput, setGedungPutriInput] = useState<string>(gedungNames.putri);
  const [applyGedungToExisting, setApplyGedungToExisting] = useState<boolean>(true);

  // Per-room gedung category & manual building name state (synced into formData.gedung)
  const [formGedungKategori, setFormGedungKategori] = useState<'Putra' | 'Putri'>('Putra');
  const [formGedungNamaManual, setFormGedungNamaManual] = useState<string>(gedungNames.putra);

  // Edit & Hapus state
  const [editTargetId, setEditTargetId] = useState<string>('');
  const [hapusMode, setHapusMode] = useState<'single' | 'all'>('single');
  const [hapusSingleId, setHapusSingleId] = useState<string>('');
  const [hapusAllConfirmed, setHapusAllConfirmed] = useState(false);

  // Form Penghuni Kamar state
  const [penghuniKamarId, setPenghuniKamarId] = useState<string>('');
  const [penghuniSearchQuery, setPenghuniSearchQuery] = useState('');
  const [assignSiswaId, setAssignSiswaId] = useState<string>('');

  const formSectionRef = useRef<HTMLDivElement>(null);

  const initialFormState: Omit<Kamar, 'id'> = {
    nama: '',
    gedung: buildGedungLabel('Putra', gedungNames.putra),
    lantai: 'Lantai 1',
    kapasitas: 9,
    waliAsuhId: waliAsuhList[0]?.id || '',
    ketuaKamarId: '',
    nilaiKebersihan: 5.0,
    kondisiFasilitas: 'Baik',
  };

  const [formData, setFormData] = useState<Omit<Kamar, 'id'>>(initialFormState);

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

  const persistGedungNames = (next: { putra: string; putri: string }) => {
    setGedungNames(next);
    try {
      localStorage.setItem(GEDUNG_NAMES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const handleSelectFormKategori = (kategori: 'Putra' | 'Putri', useDefaultOnSwitch = false) => {
    let nextNama = formGedungNamaManual;
    if (useDefaultOnSwitch) {
      const prevDefault = formGedungKategori === 'Putra' ? gedungNames.putra : gedungNames.putri;
      if (!formGedungNamaManual.trim() || formGedungNamaManual.trim() === prevDefault.trim()) {
        nextNama = kategori === 'Putra' ? gedungNames.putra : gedungNames.putri;
      }
    }
    setFormGedungKategori(kategori);
    setFormGedungNamaManual(nextNama);
    setFormData((prev) => ({
      ...prev,
      gedung: buildGedungLabel(kategori, nextNama),
    }));
  };

  const handleChangeFormGedungManual = (value: string) => {
    setFormGedungNamaManual(value);
    setFormData((prev) => ({
      ...prev,
      gedung: buildGedungLabel(formGedungKategori, value),
    }));
  };

  const populateEditForm = (kamar: Kamar) => {
    setEditTargetId(kamar.id);
    setFormError(null);
    const { kategori, namaGedung } = extractGedungInfo(kamar.gedung);
    setFormGedungKategori(kategori);
    setFormGedungNamaManual(namaGedung);
    setFormData({
      nama: kamar.nama,
      gedung: buildGedungLabel(kategori, namaGedung),
      lantai: kamar.lantai,
      kapasitas: kamar.kapasitas,
      waliAsuhId: kamar.waliAsuhId,
      ketuaKamarId: kamar.ketuaKamarId || '',
      nilaiKebersihan: kamar.nilaiKebersihan,
      kondisiFasilitas: kamar.kondisiFasilitas,
    });
  };

  const handleOpenAdd = () => {
    const defaultKategori: 'Putra' | 'Putri' =
      selectedGedungFilter === 'Putri' ? 'Putri' : 'Putra';
    const defaultNama =
      defaultKategori === 'Putra' ? gedungNames.putra : gedungNames.putri;
    setFormGedungKategori(defaultKategori);
    setFormGedungNamaManual(defaultNama);
    setFormData({
      ...initialFormState,
      gedung: buildGedungLabel(defaultKategori, defaultNama),
      waliAsuhId: waliAsuhList[0]?.id || '',
    });
    setFormError(null);
    setActivePanel('add');
    scrollToFormPanel();
  };

  const handleOpenGedung = () => {
    setGedungPutraInput(gedungNames.putra);
    setGedungPutriInput(gedungNames.putri);
    setApplyGedungToExisting(true);
    setFormError(null);
    setActivePanel('gedung');
    scrollToFormPanel();
  };

  const handleSaveGedungSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const nextPutra = gedungPutraInput.trim();
    const nextPutri = gedungPutriInput.trim();
    const updatedNames = { putra: nextPutra, putri: nextPutri };
    persistGedungNames(updatedNames);

    if (applyGedungToExisting) {
      kamarList.forEach((k) => {
        const isPutri = k.gedung.toLowerCase().includes('putri');
        const newLabel = isPutri
          ? buildGedungLabel('Putri', nextPutri)
          : buildGedungLabel('Putra', nextPutra);
        if (k.gedung !== newLabel) {
          updateKamar(k.id, { gedung: newLabel });
        }
      });
    }

    setActivePanel('none');
    showToast(
      `✓ Nama Gedung disimpan: ${buildGedungLabel('Putra', nextPutra)} & ${buildGedungLabel('Putri', nextPutri)}.`
    );
  };

  const handleOpenEdit = (kamar?: Kamar) => {
    const target = kamar || kamarList.find((k) => k.id === editTargetId) || kamarList[0];
    if (target) {
      populateEditForm(target);
    } else {
      setEditTargetId('');
    }
    setActivePanel('edit');
    scrollToFormPanel();
  };

  const handleOpenHapus = (kamar?: Kamar, mode: 'single' | 'all' = 'single') => {
    setHapusMode(mode);
    setHapusAllConfirmed(false);
    if (kamar) {
      setHapusSingleId(kamar.id);
    } else {
      setHapusSingleId(kamarList[0]?.id || '');
    }
    setActivePanel('hapus');
    scrollToFormPanel();
  };

  const handleOpenPenghuni = (kamar?: Kamar) => {
    const targetId =
      kamar?.id ||
      (kamarList.some((k) => k.id === penghuniKamarId) ? penghuniKamarId : kamarList[0]?.id || '');
    setPenghuniKamarId(targetId);
    setPenghuniSearchQuery('');
    setAssignSiswaId('');
    setActivePanel('penghuni');
    scrollToFormPanel();
  };

  const filteredKamar = kamarList.filter((k) => {
    if (selectedGedungFilter === 'Semua') return true;
    return k.gedung.toLowerCase().includes(selectedGedungFilter.toLowerCase());
  });

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNama = formData.nama.trim();
    if (!trimmedNama) {
      setFormError('Nama kamar wajib diisi.');
      return;
    }
    const finalGedung = buildGedungLabel(formGedungKategori, formGedungNamaManual);
    const sameCategoryRooms = kamarList.filter((k) =>
      formGedungKategori === 'Putri'
        ? k.gedung.toLowerCase().includes('putri')
        : k.gedung.toLowerCase().includes('putra')
    );
    if (sameCategoryRooms.length === 0 && formGedungNamaManual.trim()) {
      persistGedungNames({
        ...gedungNames,
        [formGedungKategori === 'Putra' ? 'putra' : 'putri']: formGedungNamaManual.trim(),
      });
    }
    setFormError(null);
    addKamar({
      ...formData,
      nama: trimmedNama,
      gedung: finalGedung,
      kapasitas: Math.max(1, Number(formData.kapasitas) || 1),
    });
    setSelectedGedungFilter('Semua');
    setActivePanel('none');
    setFormData(initialFormState);
    showToast(`✓ Kamar "${trimmedNama}" (${finalGedung}) berhasil ditambahkan.`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = kamarList.find((k) => k.id === editTargetId);
    if (!target) {
      setFormError('Pilih kamar yang akan diperbarui.');
      return;
    }
    const trimmedNama = formData.nama.trim();
    if (!trimmedNama) {
      setFormError('Nama kamar wajib diisi.');
      return;
    }
    const finalGedung = buildGedungLabel(formGedungKategori, formGedungNamaManual);
    setFormError(null);
    updateKamar(target.id, {
      ...formData,
      nama: trimmedNama,
      gedung: finalGedung,
      kapasitas: Math.max(1, Number(formData.kapasitas) || 1),
    });
    setActivePanel('none');
    showToast(`✓ Data kamar "${trimmedNama}" (${finalGedung}) berhasil diperbarui.`);
  };

  const handleConfirmDeleteSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const target = kamarList.find((k) => k.id === hapusSingleId);
    if (!target) return;
    deleteKamar(target.id);
    const remaining = kamarList.filter((k) => k.id !== target.id);
    setHapusSingleId(remaining[0]?.id || '');
    if (penghuniKamarId === target.id) {
      setPenghuniKamarId(remaining[0]?.id || '');
    }
    if (remaining.length === 0) {
      setActivePanel('none');
    }
    showToast(`✓ Kamar "${target.nama}" berhasil dihapus.`);
  };

  const handleConfirmClearAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hapusAllConfirmed) return;
    clearAllKamar();
    setPenghuniKamarId('');
    setHapusAllConfirmed(false);
    setActivePanel('none');
    showToast('✓ Seluruh data kamar berhasil dihapus. Siap diisi ulang melalui Form Tambah Kamar.');
  };

  const activePenghuniRoom =
    kamarList.find((k) => k.id === penghuniKamarId) || kamarList[0] || null;
  const activeRoomPenghuni = activePenghuniRoom
    ? siswaList.filter((s) => s.kamarId === activePenghuniRoom.id)
    : [];
  const filteredRoomPenghuni = activeRoomPenghuni.filter(
    (s) =>
      !penghuniSearchQuery.trim() ||
      s.nama.toLowerCase().includes(penghuniSearchQuery.toLowerCase()) ||
      s.nisn.includes(penghuniSearchQuery)
  );
  const availableSiswaForRoom = activePenghuniRoom
    ? siswaList.filter((s) => s.kamarId !== activePenghuniRoom.id)
    : [];

  const handleAssignSiswaToRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePenghuniRoom || !assignSiswaId) return;
    const student = siswaList.find((s) => s.id === assignSiswaId);
    if (!student) return;
    updateSiswa(student.id, {
      kamarId: activePenghuniRoom.id,
      waliAsuhId: activePenghuniRoom.waliAsuhId || student.waliAsuhId,
    });
    setAssignSiswaId('');
    showToast(`✓ Santri ${student.nama} berhasil dimasukkan ke ${activePenghuniRoom.nama}.`);
  };

  const handleRemoveSiswaFromRoom = (siswaId: string, namaSiswa: string) => {
    if (!activePenghuniRoom) return;
    updateSiswa(siswaId, { kamarId: '' });
    if (activePenghuniRoom.ketuaKamarId === siswaId) {
      updateKamar(activePenghuniRoom.id, { ketuaKamarId: '' });
    }
    showToast(`✓ Santri ${namaSiswa} dikeluarkan dari ${activePenghuniRoom.nama}.`);
  };

  const handleSetKetuaKamar = (siswaId: string, namaSiswa: string) => {
    if (!activePenghuniRoom) return;
    updateKamar(activePenghuniRoom.id, { ketuaKamarId: siswaId });
    showToast(`✓ ${namaSiswa} ditetapkan sebagai Ketua ${activePenghuniRoom.nama}.`);
  };

  const handleCancelKetuaKamar = (namaSiswa?: string) => {
    if (!activePenghuniRoom) return;
    updateKamar(activePenghuniRoom.id, { ketuaKamarId: '' });
    showToast(
      namaSiswa
        ? `✓ Status Ketua ${activePenghuniRoom.nama} untuk ${namaSiswa} dibatalkan.`
        : `✓ Pemilihan Ketua ${activePenghuniRoom.nama} dibatalkan.`
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Editorial Header Banner */}
      <div className="bg-[#fdfcf9] p-5 border-[1.5px] border-[#1a1c1a] shadow-[3.5px_3.5px_0px_#1a1c1a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-custom text-[#006b54] font-bold uppercase tracking-wider mb-1">
            <span>// ASRAMA SEKOLAH RAKYAT 1 JEPARA</span>
            <span>·</span>
            <span>{kamarList.length} KAMAR TERDAFTAR</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-syne text-[#1a1c1a] tracking-tight">
            Data Kamar & Kapasitas Santri SD
          </h1>
          <p className="text-xs text-[#1a1c1a]/70 font-mono-custom mt-1">
            Total {kamarList.length} Kamar Asrama · {siswaList.length} Santri Terdaftar
          </p>
        </div>

        <button
          type="button"
          onClick={() => (activePanel === 'add' ? setActivePanel('none') : handleOpenAdd())}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2.5px_2.5px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider shrink-0 cursor-pointer whitespace-nowrap"
        >
          {activePanel === 'add' ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{activePanel === 'add' ? 'Tutup Form' : 'Tambah Kamar'}</span>
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

      {/* Menu Kelola Data Kamar */}
      <div className="bg-white border-[1.5px] border-[#1a1c1a] p-3.5 neo-shadow font-mono-custom">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#006b54] block">
              Menu Kelola Data Kamar
            </span>
            <p className="text-[11px] font-sans text-[#1a1c1a]/75">
              Tambahkan kamar baru, lihat & atur penghuni kamar, ubah data kamar, atau hapus kamar asrama.
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
              <span>Form Tambah Kamar</span>
            </button>
            <button
              type="button"
              onClick={() =>
                activePanel === 'penghuni' ? setActivePanel('none') : handleOpenPenghuni()
              }
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-[1.5px] border-[#1a1c1a] transition-all cursor-pointer whitespace-nowrap ${
                activePanel === 'penghuni'
                  ? 'bg-emerald-800 text-white shadow-none translate-x-0.5 translate-y-0.5'
                  : 'bg-emerald-50 text-[#006b54] shadow-[2px_2px_0px_#1a1c1a] hover:bg-[#006b54] hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Form Penghuni Kamar</span>
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
              onClick={() => (activePanel === 'gedung' ? setActivePanel('none') : handleOpenGedung())}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-[1.5px] border-[#1a1c1a] transition-all cursor-pointer whitespace-nowrap ${
                activePanel === 'gedung'
                  ? 'bg-amber-600 text-white shadow-none translate-x-0.5 translate-y-0.5'
                  : 'bg-amber-50 text-amber-900 shadow-[2px_2px_0px_#1a1c1a] hover:bg-amber-600 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Atur Nama Gedung</span>
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

      {/* INLINE FORM SECTION (TAMBAH / PENGHUNI / EDIT / GEDUNG / HAPUS KAMAR) */}
      <div ref={formSectionRef}>
        {/* FORM ATUR NAMA GEDUNG MANUAL */}
        {activePanel === 'gedung' && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#d97706] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  Pengaturan Nama Gedung Asrama
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Isi manual nama Gedung Putra dan Gedung Putri sesuai penamaan asrama Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup pengaturan nama gedung"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGedungSettings} className="space-y-4 font-mono-custom text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] space-y-2">
                  <label className="block font-bold text-[#006b54] uppercase">
                    Nama Gedung Putra (Isi Manual)
                  </label>
                  <input
                    type="text"
                    value={gedungPutraInput}
                    onChange={(e) => setGedungPutraInput(e.target.value)}
                    placeholder="Contoh: Sultan Hadlirin / Al-Fatih / Blok A"
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white focus:outline-none focus:border-[#006b54] font-sans text-sm"
                  />
                  <p className="text-[11px] text-[#1a1c1a]/65">
                    Tampilan label:{' '}
                    <strong className="text-[#1a1c1a]">
                      {buildGedungLabel('Putra', gedungPutraInput)}
                    </strong>
                  </p>
                </div>

                <div className="p-3.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] space-y-2">
                  <label className="block font-bold text-[#006b54] uppercase">
                    Nama Gedung Putri (Isi Manual)
                  </label>
                  <input
                    type="text"
                    value={gedungPutriInput}
                    onChange={(e) => setGedungPutriInput(e.target.value)}
                    placeholder="Contoh: Ratu Shima / Khadijah / Blok B"
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white focus:outline-none focus:border-[#006b54] font-sans text-sm"
                  />
                  <p className="text-[11px] text-[#1a1c1a]/65">
                    Tampilan label:{' '}
                    <strong className="text-[#1a1c1a]">
                      {buildGedungLabel('Putri', gedungPutriInput)}
                    </strong>
                  </p>
                </div>
              </div>

              {kamarList.length > 0 && (
                <label className="flex items-center gap-2.5 p-3 bg-amber-50/70 border border-amber-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyGedungToExisting}
                    onChange={(e) => setApplyGedungToExisting(e.target.checked)}
                    className="w-4 h-4 accent-[#006b54]"
                  />
                  <span className="font-sans text-xs font-semibold text-[#1a1c1a]">
                    Terapkan nama gedung baru ke seluruh kamar Putra &amp; Putri yang sudah terdaftar ({kamarList.length} kamar)
                  </span>
                </label>
              )}

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
                  <Building2 className="w-3.5 h-3.5" />
                  <span>SIMPAN NAMA GEDUNG</span>
                </button>
              </div>
            </form>
          </div>
        )}
        {/* FORM TAMBAH KAMAR */}
        {activePanel === 'add' && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#1a1c1a] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  Form Tambah Kamar Baru
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Lengkapi nama kamar, gedung asrama, lantai, kapasitas santri, dan wali asuh pembina.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form tambah kamar"
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">NAMA KAMAR *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kamar Neptunus / Kamar 01"
                    value={formData.nama}
                    onChange={(e) => {
                      setFormData({ ...formData, nama: e.target.value });
                      if (formError) setFormError(null);
                    }}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">GEDUNG ASRAMA *</label>
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectFormKategori('Putra', true)}
                        className={`px-2.5 py-1.5 text-[11px] font-bold border-[1.5px] border-[#1a1c1a] uppercase transition-colors cursor-pointer ${
                          formGedungKategori === 'Putra'
                            ? 'bg-[#006b54] text-white'
                            : 'bg-[#fdfcf9] text-[#1a1c1a] hover:bg-[#1a1c1a]/5'
                        }`}
                      >
                        Gedung Putra
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectFormKategori('Putri', true)}
                        className={`px-2.5 py-1.5 text-[11px] font-bold border-[1.5px] border-[#1a1c1a] uppercase transition-colors cursor-pointer ${
                          formGedungKategori === 'Putri'
                            ? 'bg-[#006b54] text-white'
                            : 'bg-[#fdfcf9] text-[#1a1c1a] hover:bg-[#1a1c1a]/5'
                        }`}
                      >
                        Gedung Putri
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formGedungNamaManual}
                      onChange={(e) => handleChangeFormGedungManual(e.target.value)}
                      placeholder={
                        formGedungKategori === 'Putra'
                          ? 'Isi manual nama gedung putra (cth: Sultan Hadlirin)'
                          : 'Isi manual nama gedung putri (cth: Ratu Shima)'
                      }
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                    />
                    <span className="block text-[10px] text-[#1a1c1a]/65">
                      Label: <strong className="text-[#006b54]">{buildGedungLabel(formGedungKategori, formGedungNamaManual)}</strong>
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">LANTAI</label>
                  <select
                    value={formData.lantai}
                    onChange={(e) =>
                      setFormData({ ...formData, lantai: e.target.value as Kamar['lantai'] })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
                  >
                    <option value="Lantai 1">Lantai 1</option>
                    <option value="Lantai 2">Lantai 2</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">KAPASITAS (ANAK) *</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    required
                    value={formData.kapasitas}
                    onChange={(e) => setFormData({ ...formData, kapasitas: Number(e.target.value) })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">WALI ASUH PEMBINA *</label>
                  <select
                    value={formData.waliAsuhId}
                    onChange={(e) => setFormData({ ...formData, waliAsuhId: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
                  >
                    <option value="">-- Pilih Wali Asuh --</option>
                    {waliAsuhList.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nama} ({w.shiftPiket})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">KONDISI FASILITAS</label>
                  <select
                    value={formData.kondisiFasilitas}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kondisiFasilitas: e.target.value as Kamar['kondisiFasilitas'],
                      })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  </select>
                </div>
              </div>

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
                  <span>SIMPAN KAMAR BARU</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FORM PENGHUNI KAMAR */}
        {activePanel === 'penghuni' && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#006b54] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  Form Data Penghuni Kamar
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Pilih kamar untuk melihat daftar santri penghuni, menetapkan ketua kamar, atau menambah/mengeluarkan santri.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form penghuni kamar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {kamarList.length === 0 ? (
              <div className="p-5 bg-[#fdfcf9] border border-[#1a1c1a]/30 text-center space-y-3">
                <p className="font-sans text-xs text-[#1a1c1a]/80">
                  Belum ada kamar asrama terdaftar. Silakan tambahkan kamar terlebih dahulu untuk melihat dan mengisi penghuni kamar.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] text-white text-xs font-bold font-mono-custom border border-[#1a1c1a] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buka Form Tambah Kamar</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 font-mono-custom text-xs">
                {/* Selector Kamar + Pencarian */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-emerald-50/60 border-[1.5px] border-[#006b54]">
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">
                      Pilih Kamar Asrama ({kamarList.length} kamar)
                    </label>
                    <select
                      value={activePenghuniRoom?.id || ''}
                      onChange={(e) => {
                        setPenghuniKamarId(e.target.value);
                        setPenghuniSearchQuery('');
                        setAssignSiswaId('');
                      }}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans font-bold text-[#1a1c1a]"
                    >
                      {kamarList.map((k) => {
                        const count = siswaList.filter((s) => s.kamarId === k.id).length;
                        return (
                          <option key={k.id} value={k.id}>
                            {k.nama} — {k.gedung} ({count}/{k.kapasitas} santri)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">
                      Cari Penghuni di Kamar Ini
                    </label>
                    <input
                      type="text"
                      value={penghuniSearchQuery}
                      onChange={(e) => setPenghuniSearchQuery(e.target.value)}
                      placeholder="Ketik nama atau NISN santri..."
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
                    />
                  </div>
                </div>

                {activePenghuniRoom && (
                  <>
                    {/* Info Ringkas Kamar */}
                    <div className="p-3 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <span className="text-[10px] text-[#1a1c1a]/60 block">GEDUNG & LANTAI</span>
                        <strong className="text-[#1a1c1a]">
                          {activePenghuniRoom.gedung} · {activePenghuniRoom.lantai}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#1a1c1a]/60 block">WALI ASUH PEMBINA</span>
                        <strong className="text-[#006b54]">
                          {getWaliAsuh(activePenghuniRoom.waliAsuhId)?.nama || '-'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#1a1c1a]/60 block">KETUA KAMAR</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <strong className="text-[#1a1c1a]">
                            {getSiswa(activePenghuniRoom.ketuaKamarId)?.nama || '- (Belum dipilih)'}
                          </strong>
                          {activePenghuniRoom.ketuaKamarId && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCancelKetuaKamar(
                                  getSiswa(activePenghuniRoom.ketuaKamarId)?.nama
                                )
                              }
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold border border-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white text-rose-800 uppercase cursor-pointer"
                              title="Batalkan Ketua Kamar"
                            >
                              <X className="w-2.5 h-2.5" />
                              <span>Batalkan</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#1a1c1a]/60 block">TERISI / KAPASITAS</span>
                        <strong className="text-[#1a1c1a]">
                          {activeRoomPenghuni.length} / {activePenghuniRoom.kapasitas} Santri
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#1a1c1a]/60 block">KONDISI FASILITAS</span>
                        <strong className="text-[#1a1c1a]">
                          {activePenghuniRoom.kondisiFasilitas}
                        </strong>
                      </div>
                    </div>

                    {/* Tambah / Tempatkan Santri ke Kamar Ini */}
                    <form
                      onSubmit={handleAssignSiswaToRoom}
                      className="p-3 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] flex flex-col sm:flex-row sm:items-end gap-2.5"
                    >
                      <div className="flex-1">
                        <label className="block font-bold text-[#1a1c1a] mb-1">
                          Masukkan Santri ke {activePenghuniRoom.nama}
                        </label>
                        <select
                          value={assignSiswaId}
                          onChange={(e) => setAssignSiswaId(e.target.value)}
                          className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans"
                        >
                          <option value="">
                            {availableSiswaForRoom.length === 0
                              ? '-- Semua santri sudah berada di kamar ini / belum ada data santri --'
                              : `-- Pilih santri (${availableSiswaForRoom.length} tersedia) --`}
                          </option>
                          {availableSiswaForRoom.map((s) => {
                            const currentKamar = kamarList.find((k) => k.id === s.kamarId);
                            return (
                              <option key={s.id} value={s.id}>
                                {s.nama} ({s.kelas}) —{' '}
                                {currentKamar ? `Saat ini: ${currentKamar.nama}` : 'Belum Ada Kamar'}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={!assignSiswaId}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#006b54] hover:bg-[#005240] disabled:opacity-40 text-white font-bold uppercase border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Masukkan ke Kamar</span>
                      </button>
                    </form>

                    {/* Daftar Penghuni Kamar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase text-[#1a1c1a]">
                          Daftar Penghuni {activePenghuniRoom.nama} ({filteredRoomPenghuni.length} Santri)
                        </span>
                      </div>

                      {filteredRoomPenghuni.length === 0 ? (
                        <div className="p-6 text-center bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a]/30 font-sans text-xs text-[#1a1c1a]/70">
                          {activeRoomPenghuni.length === 0
                            ? 'Belum ada santri yang menempati kamar ini. Gunakan pilihan di atas atau menu Data Siswa untuk menempatkan santri.'
                            : 'Tidak ada penghuni kamar yang cocok dengan pencarian.'}
                        </div>
                      ) : (
                        <div className="border-[1.5px] border-[#1a1c1a] divide-y divide-[#1a1c1a]/25">
                          {filteredRoomPenghuni.map((siswa, idx) => {
                            const isKetua = activePenghuniRoom.ketuaKamarId === siswa.id;
                            return (
                              <div
                                key={siswa.id}
                                className="p-3 bg-white hover:bg-[#fdfcf9] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="w-7 h-7 bg-[#1a1c1a] text-[#fdfcf9] text-[11px] font-bold flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-syne font-bold text-sm text-[#1a1c1a] truncate">
                                        {siswa.nama}
                                      </span>
                                      {isKetua && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-500 uppercase">
                                          <Crown className="w-2.5 h-2.5" />
                                          Ketua Kamar
                                        </span>
                                      )}
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 border border-[#1a1c1a] uppercase ${
                                          siswa.status === 'Aktif'
                                            ? 'bg-[#006b54] text-white'
                                            : siswa.status === 'Sakit' || siswa.status === 'Mutasi Keluar'
                                            ? 'bg-rose-100 text-rose-900'
                                            : 'bg-amber-200 text-[#1a1c1a]'
                                        }`}
                                      >
                                        {siswa.status}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-[#1a1c1a]/70 mt-0.5">
                                      NISN: {siswa.nisn} · {siswa.kelas} ·{' '}
                                      {siswa.jenisKelamin === 'L' ? 'Putra' : 'Putri'} · WA:{' '}
                                      {siswa.orangTua.noHp || '-'}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                  {isKetua ? (
                                    <button
                                      type="button"
                                      onClick={() => handleCancelKetuaKamar(siswa.nama)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold border border-amber-600 bg-amber-100 hover:bg-rose-700 hover:border-rose-700 hover:text-white text-amber-950 uppercase cursor-pointer whitespace-nowrap transition-colors"
                                      title="Batalkan status Ketua Kamar"
                                    >
                                      <X className="w-3 h-3" />
                                      <span>Batalkan Ketua</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSetKetuaKamar(siswa.id, siswa.nama)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold border border-[#1a1c1a] bg-amber-50 hover:bg-amber-200 text-[#1a1c1a] uppercase cursor-pointer whitespace-nowrap"
                                      title="Tetapkan sebagai Ketua Kamar"
                                    >
                                      <Crown className="w-3 h-3" />
                                      <span>Pilih Ketua</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSiswaId(siswa.id);
                                      setActiveMenu('siswa');
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold border border-[#1a1c1a] bg-[#1a1c1a] hover:bg-[#006b54] text-white uppercase cursor-pointer whitespace-nowrap"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Profil</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSiswaFromRoom(siswa.id, siswa.nama)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold border border-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white text-rose-800 uppercase cursor-pointer whitespace-nowrap"
                                    title="Keluarkan santri dari kamar ini"
                                  >
                                    <UserMinus className="w-3 h-3" />
                                    <span>Keluarkan</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="pt-2 border-t border-[#1a1c1a]/20 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActivePanel('none')}
                    className="px-4 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] font-bold uppercase cursor-pointer"
                  >
                    TUTUP FORM
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FORM EDIT KAMAR */}
        {activePanel === 'edit' && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#1a1c1a] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  Form Edit Data Kamar
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Pilih kamar yang ingin diperbarui lalu simpan perubahan data kamar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form edit kamar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {kamarList.length === 0 ? (
              <div className="p-5 bg-[#fdfcf9] border border-[#1a1c1a]/30 text-center space-y-3">
                <p className="font-sans text-xs text-[#1a1c1a]/80">
                  Belum ada data kamar untuk diedit. Silakan tambahkan kamar terlebih dahulu.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] text-white text-xs font-bold font-mono-custom border border-[#1a1c1a] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buka Form Tambah Kamar</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveEdit} className="space-y-4 font-mono-custom text-xs">
                <div className="p-3.5 bg-emerald-50/60 border-[1.5px] border-[#006b54] space-y-1.5">
                  <label className="block font-bold text-[#1a1c1a]">
                    Pilih Kamar yang Akan Diedit ({kamarList.length} kamar) *
                  </label>
                  <select
                    value={editTargetId}
                    onChange={(e) => {
                      const next = kamarList.find((k) => k.id === e.target.value);
                      if (next) populateEditForm(next);
                    }}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans font-bold"
                  >
                    {kamarList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama} — {k.gedung} ({k.lantai})
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">NAMA KAMAR *</label>
                    <input
                      type="text"
                      required
                      value={formData.nama}
                      onChange={(e) => {
                        setFormData({ ...formData, nama: e.target.value });
                        if (formError) setFormError(null);
                      }}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] font-sans"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">GEDUNG ASRAMA *</label>
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectFormKategori('Putra', true)}
                          className={`px-2.5 py-1.5 text-[11px] font-bold border-[1.5px] border-[#1a1c1a] uppercase transition-colors cursor-pointer ${
                            formGedungKategori === 'Putra'
                              ? 'bg-[#006b54] text-white'
                              : 'bg-[#fdfcf9] text-[#1a1c1a] hover:bg-[#1a1c1a]/5'
                          }`}
                        >
                          Gedung Putra
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectFormKategori('Putri', true)}
                          className={`px-2.5 py-1.5 text-[11px] font-bold border-[1.5px] border-[#1a1c1a] uppercase transition-colors cursor-pointer ${
                            formGedungKategori === 'Putri'
                              ? 'bg-[#006b54] text-white'
                              : 'bg-[#fdfcf9] text-[#1a1c1a] hover:bg-[#1a1c1a]/5'
                          }`}
                        >
                          Gedung Putri
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formGedungNamaManual}
                        onChange={(e) => handleChangeFormGedungManual(e.target.value)}
                        placeholder={
                          formGedungKategori === 'Putra'
                            ? 'Isi manual nama gedung putra (cth: Sultan Hadlirin)'
                            : 'Isi manual nama gedung putri (cth: Ratu Shima)'
                        }
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                      />
                      <span className="block text-[10px] text-[#1a1c1a]/65">
                        Label: <strong className="text-[#006b54]">{buildGedungLabel(formGedungKategori, formGedungNamaManual)}</strong>
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">LANTAI</label>
                    <select
                      value={formData.lantai}
                      onChange={(e) =>
                        setFormData({ ...formData, lantai: e.target.value as Kamar['lantai'] })
                      }
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9]"
                    >
                      <option value="Lantai 1">Lantai 1</option>
                      <option value="Lantai 2">Lantai 2</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">KAPASITAS (ANAK) *</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      required
                      value={formData.kapasitas}
                      onChange={(e) =>
                        setFormData({ ...formData, kapasitas: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">WALI ASUH PEMBINA</label>
                    <select
                      value={formData.waliAsuhId}
                      onChange={(e) => setFormData({ ...formData, waliAsuhId: e.target.value })}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9]"
                    >
                      <option value="">-- Pilih Wali Asuh --</option>
                      {waliAsuhList.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.nama} ({w.shiftPiket})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">KONDISI FASILITAS</label>
                    <select
                      value={formData.kondisiFasilitas}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kondisiFasilitas: e.target.value as Kamar['kondisiFasilitas'],
                        })
                      }
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9]"
                    >
                      <option value="Sangat Baik">Sangat Baik</option>
                      <option value="Baik">Baik</option>
                      <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    </select>
                  </div>
                </div>

                {/* Pemilihan & Pembatalan Ketua Kamar */}
                {(() => {
                  const editPenghuniOptions = siswaList.filter(
                    (s) => s.kamarId === editTargetId || (formData.ketuaKamarId && s.id === formData.ketuaKamarId)
                  );
                  return (
                    <div className="p-3.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="font-bold text-[#1a1c1a] flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-600" />
                          <span>KETUA KAMAR (OPSIONAL)</span>
                        </label>
                        {formData.ketuaKamarId && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, ketuaKamarId: '' })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border border-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white text-rose-800 uppercase cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            <span>Batalkan Ketua</span>
                          </button>
                        )}
                      </div>
                      <select
                        value={formData.ketuaKamarId}
                        onChange={(e) =>
                          setFormData({ ...formData, ketuaKamarId: e.target.value })
                        }
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white font-sans"
                      >
                        <option value="">-- Belum Dipilih / Tidak Ada Ketua --</option>
                        {editPenghuniOptions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nama} ({s.kelas})
                          </option>
                        ))}
                      </select>
                      {editPenghuniOptions.length === 0 && (
                        <p className="text-[11px] font-sans text-[#1a1c1a]/65">
                          Belum ada santri penghuni di kamar ini. Tambahkan penghuni melalui Form Penghuni Kamar terlebih dahulu.
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div className="pt-3 border-t border-[#1a1c1a] flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = kamarList.find((k) => k.id === editTargetId);
                      if (target) handleOpenHapus(target, 'single');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-700 border-[1.5px] border-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white font-bold uppercase cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Kamar Ini</span>
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

        {/* FORM HAPUS DATA KAMAR */}
        {activePanel === 'hapus' && (
          <div className="bg-white border-[1.5px] border-rose-700 shadow-[5px_5px_0px_#9f1239] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-rose-700">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-rose-900 tracking-tight">
                  Form Hapus Data Kamar
                </h2>
                <p className="text-xs font-mono-custom text-rose-900/75 mt-0.5">
                  Hapus satu kamar yang salah input atau kosongkan seluruh data kamar asrama.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form hapus kamar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {kamarList.length === 0 ? (
              <div className="p-5 bg-[#fdfcf9] border border-[#1a1c1a]/30 text-center space-y-2">
                <p className="font-sans text-xs text-[#1a1c1a]/80">
                  Saat ini tidak ada data kamar tersimpan (0 kamar).
                </p>
              </div>
            ) : (
              <div className="space-y-4 font-mono-custom text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHapusMode('single');
                      if (!hapusSingleId && kamarList[0]) setHapusSingleId(kamarList[0].id);
                    }}
                    className={`px-3 py-2 font-bold border-[1.5px] cursor-pointer transition-colors ${
                      hapusMode === 'single'
                        ? 'bg-rose-700 text-white border-[#1a1c1a]'
                        : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40 hover:border-[#1a1c1a]'
                    }`}
                  >
                    1. Hapus 1 Kamar
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
                    2. Hapus Semua Kamar ({kamarList.length})
                  </button>
                </div>

                {hapusMode === 'single' && (
                  <form onSubmit={handleConfirmDeleteSingle} className="space-y-3">
                    <div>
                      <label className="block font-bold text-[#1a1c1a] mb-1">
                        Pilih Kamar yang Akan Dihapus *
                      </label>
                      <select
                        value={hapusSingleId}
                        onChange={(e) => setHapusSingleId(e.target.value)}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] font-sans font-bold"
                      >
                        {kamarList.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.nama} — {k.gedung} ({k.lantai})
                          </option>
                        ))}
                      </select>
                    </div>

                    {(() => {
                      const target = kamarList.find((k) => k.id === hapusSingleId);
                      if (!target) return null;
                      const penghuniCount = siswaList.filter((s) => s.kamarId === target.id).length;
                      return (
                        <div className="p-3.5 bg-rose-50 border-[1.5px] border-rose-600 text-rose-950 space-y-1">
                          <div className="font-bold text-sm font-sans">{target.nama}</div>
                          <div>
                            Gedung: <strong>{target.gedung}</strong> · {target.lantai}
                          </div>
                          <div>
                            Kapasitas: <strong>{target.kapasitas} anak</strong> · Penghuni saat ini:{' '}
                            <strong>{penghuniCount} santri</strong>
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
                        <span>YA, HAPUS KAMAR INI</span>
                      </button>
                    </div>
                  </form>
                )}

                {hapusMode === 'all' && (
                  <form onSubmit={handleConfirmClearAll} className="space-y-3">
                    <div className="p-3.5 bg-rose-50 border-[1.5px] border-rose-600 text-rose-950 space-y-1.5">
                      <div className="font-bold">
                        Peringatan: Anda akan menghapus seluruh {kamarList.length} data kamar!
                      </div>
                      <p className="font-sans text-xs">
                        Catatan kebersihan kamar terkait juga akan dikosongkan. Data santri dan wali asuh tetap aman.
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
                        Saya yakin ingin menghapus seluruh data kamar asrama.
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
                        <span>YA, HAPUS SEMUA KAMAR</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Tabs + Quick Hapus Semua */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 font-mono-custom text-xs">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'Semua', label: `SEMUA KAMAR (${kamarList.length})` },
            {
              key: 'Putra',
              label: gedungNames.putra.trim()
                ? `GEDUNG PUTRA (${gedungNames.putra.trim().toUpperCase()})`
                : 'GEDUNG PUTRA',
            },
            {
              key: 'Putri',
              label: gedungNames.putri.trim()
                ? `GEDUNG PUTRI (${gedungNames.putri.trim().toUpperCase()})`
                : 'GEDUNG PUTRI',
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedGedungFilter(tab.key)}
              className={`px-3.5 py-1.5 border-[1.5px] border-[#1a1c1a] font-bold text-xs uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedGedungFilter === tab.key
                  ? 'bg-[#1a1c1a] text-[#fdfcf9] shadow-[2.5px_2.5px_0px_#006b54]'
                  : 'bg-[#fdfcf9] text-[#1a1c1a] hover:bg-[#1a1c1a]/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {kamarList.length > 0 && (
          <button
            type="button"
            onClick={() => handleOpenHapus(undefined, 'all')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-[1.5px] border-rose-700 bg-rose-50 text-rose-800 hover:bg-rose-700 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Semua Kamar</span>
          </button>
        )}
      </div>

      {/* Empty State when 0 Kamar */}
      {filteredKamar.length === 0 ? (
        <div className="p-8 text-center bg-white border-[1.5px] border-[#1a1c1a] neo-shadow space-y-4">
          <div className="w-12 h-12 mx-auto bg-emerald-50 border-[1.5px] border-[#1a1c1a] flex items-center justify-center">
            <Home className="w-6 h-6 text-[#006b54]" />
          </div>
          {kamarList.length === 0 ? (
            <>
              <div className="space-y-1">
                <h3 className="font-syne text-lg font-bold text-[#1a1c1a]">
                  Belum Ada Data Kamar Asrama
                </h3>
                <p className="font-sans text-xs text-[#1a1c1a]/70 max-w-md mx-auto">
                  Seluruh data kamar telah dikosongkan. Silakan tambahkan kamar asrama baru menggunakan Form Tambah Kamar di atas.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kamar Baru</span>
              </button>
            </>
          ) : (
            <p className="font-mono-custom text-xs text-[#1a1c1a]/60 uppercase">
              Tidak ada kamar di gedung yang dipilih.
            </p>
          )}
        </div>
      ) : (
        /* Kamar Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredKamar.map((kamar) => {
            const penghuni = siswaList.filter((s) => s.kamarId === kamar.id);
            const wali = getWaliAsuh(kamar.waliAsuhId);
            const ketua = getSiswa(kamar.ketuaKamarId);

            const isFull = penghuni.length >= kamar.kapasitas;

            return (
              <div
                key={kamar.id}
                className="bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] p-4 shadow-[3.5px_3.5px_0px_#1a1c1a] hover:shadow-[4.5px_4.5px_0px_#006b54] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header card */}
                  <div className="flex items-start justify-between gap-2 border-b-[1.5px] border-[#1a1c1a] pb-2.5 mb-3">
                    <div>
                      <span className="font-mono-custom text-[10px] text-[#006b54] font-bold uppercase tracking-wider block">
                        {kamar.gedung} · {kamar.lantai}
                      </span>
                      <h3 className="text-base font-bold font-syne text-[#1a1c1a] tracking-tight">
                        {kamar.nama}
                      </h3>
                    </div>

                    <span
                      className={`font-mono-custom text-[10px] font-bold px-2 py-0.5 border border-[#1a1c1a] uppercase shrink-0 ${
                        isFull
                          ? 'bg-[#1a1c1a] text-[#fdfcf9]'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {penghuni.length} ANAK
                    </span>
                  </div>

                  {/* Progress bar kapasitas */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] font-mono-custom text-[#1a1c1a]/70 mb-1">
                      <span>KAPASITAS:</span>
                      <span className="font-bold text-[#1a1c1a]">
                        {penghuni.length} / {kamar.kapasitas} Santri
                      </span>
                    </div>
                    <div className="w-full bg-[#1a1c1a]/10 border border-[#1a1c1a] h-2">
                      <div
                        className="h-full bg-[#006b54]"
                        style={{
                          width: `${Math.min((penghuni.length / Math.max(kamar.kapasitas, 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Metadata detail */}
                  <div className="space-y-1.5 text-xs font-mono-custom border border-[#1a1c1a]/20 bg-[#1a1c1a]/5 p-2.5 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[#1a1c1a]/60">WALI ASUH:</span>
                      <span className="font-bold text-[#006b54] truncate max-w-[130px]">
                        {wali?.nama || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#1a1c1a]/60">KETUA:</span>
                      <span className="font-bold text-[#1a1c1a] truncate max-w-[130px]">
                        {ketua?.nama?.split(' ')[0] || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#1a1c1a]/60">KEBERSIHAN:</span>
                      <span className="font-bold text-[#1a1c1a] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
                        {kamar.nilaiKebersihan.toFixed(1)} / 5.0
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-2 border-t-[1.5px] border-[#1a1c1a] space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenPenghuni(kamar)}
                    className="w-full py-1.5 px-3 bg-[#1a1c1a] hover:bg-[#006b54] text-[#fdfcf9] text-xs font-bold font-mono-custom uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    LIHAT {penghuni.length} PENGHUNI
                  </button>
                  <div className="grid grid-cols-2 gap-1.5 font-mono-custom">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(kamar)}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold border border-[#1a1c1a] bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenHapus(kamar, 'single')}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold border border-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white text-rose-800 transition-colors cursor-pointer"
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
      )}
    </div>
  );
};
