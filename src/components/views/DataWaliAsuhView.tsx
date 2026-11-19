import React, { useState, useRef } from 'react';
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WaliAsuh } from '../../types';

export const DataWaliAsuhView: React.FC = () => {
  const {
    waliAsuhList,
    kamarList,
    siswaList,
    addWaliAsuh,
    updateWaliAsuh,
    deleteWaliAsuh,
    clearAllWaliAsuh,
  } = useApp();

  type ActiveWaliPanel = 'none' | 'add' | 'edit' | 'hapus';
  const [activePanel, setActivePanel] = useState<ActiveWaliPanel>('none');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit & Hapus state
  const [editTargetId, setEditTargetId] = useState<string>('');
  const [hapusMode, setHapusMode] = useState<'single' | 'all'>('single');
  const [hapusSingleId, setHapusSingleId] = useState<string>('');
  const [hapusAllConfirmed, setHapusAllConfirmed] = useState(false);

  const formSectionRef = useRef<HTMLDivElement>(null);

  const initialFormState: Omit<WaliAsuh, 'id'> = {
    nip: '',
    nama: '',
    gelar: 'S.Pd',
    jenisKelamin: 'L',
    noHp: '',
    email: '',
    kamarBinaanIds: [],
    fokusBimbingan: "Tahfidz Al-Qur'an & Karakter Santri",
    shiftPiket: 'Pagi (05:00 - 13:00)',
    status: 'Bertugas',
  };

  const [formData, setFormData] = useState<Omit<WaliAsuh, 'id'>>(initialFormState);

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

  const populateEditForm = (wali: WaliAsuh) => {
    setEditTargetId(wali.id);
    setFormError(null);
    setFormData({
      nip: wali.nip,
      nama: wali.nama,
      gelar: wali.gelar,
      jenisKelamin: wali.jenisKelamin,
      noHp: wali.noHp,
      email: wali.email,
      kamarBinaanIds: wali.kamarBinaanIds || [],
      fokusBimbingan: wali.fokusBimbingan,
      shiftPiket: wali.shiftPiket,
      status: wali.status,
    });
  };

  const handleOpenAdd = () => {
    setFormData({
      ...initialFormState,
      kamarBinaanIds: [],
    });
    setFormError(null);
    setActivePanel('add');
    scrollToFormPanel();
  };

  const handleOpenEdit = (wali?: WaliAsuh) => {
    const target = wali || waliAsuhList.find((w) => w.id === editTargetId) || waliAsuhList[0];
    if (target) {
      populateEditForm(target);
    } else {
      setEditTargetId('');
    }
    setActivePanel('edit');
    scrollToFormPanel();
  };

  const handleOpenHapus = (wali?: WaliAsuh, mode: 'single' | 'all' = 'single') => {
    setHapusMode(mode);
    setHapusAllConfirmed(false);
    if (wali) {
      setHapusSingleId(wali.id);
    } else {
      setHapusSingleId(waliAsuhList[0]?.id || '');
    }
    setActivePanel('hapus');
    scrollToFormPanel();
  };

  const toggleKamarBinaan = (kamarId: string) => {
    setFormData((prev) => {
      const exists = prev.kamarBinaanIds.includes(kamarId);
      return {
        ...prev,
        kamarBinaanIds: exists
          ? prev.kamarBinaanIds.filter((id) => id !== kamarId)
          : [...prev.kamarBinaanIds, kamarId],
      };
    });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNama = formData.nama.trim();
    if (!trimmedNama) {
      setFormError('Nama wali asuh wajib diisi.');
      return;
    }
    setFormError(null);
    addWaliAsuh({
      ...formData,
      nama: trimmedNama,
      gelar: formData.gelar.trim(),
      nip: formData.nip.trim() || '-',
      noHp: formData.noHp.trim(),
      email: formData.email.trim(),
      fokusBimbingan: formData.fokusBimbingan.trim() || 'Pendampingan Karakter Santri',
    });
    setStatusFilter('Semua');
    setSearchTerm('');
    setActivePanel('none');
    setFormData(initialFormState);
    showToast(`✓ Wali Asuh "${trimmedNama}" berhasil ditambahkan.`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = waliAsuhList.find((w) => w.id === editTargetId);
    if (!target) {
      setFormError('Pilih wali asuh yang akan diperbarui.');
      return;
    }
    const trimmedNama = formData.nama.trim();
    if (!trimmedNama) {
      setFormError('Nama wali asuh wajib diisi.');
      return;
    }
    setFormError(null);
    updateWaliAsuh(target.id, {
      ...formData,
      nama: trimmedNama,
      gelar: formData.gelar.trim(),
      nip: formData.nip.trim() || '-',
      noHp: formData.noHp.trim(),
      email: formData.email.trim(),
      fokusBimbingan: formData.fokusBimbingan.trim() || 'Pendampingan Karakter Santri',
    });
    setActivePanel('none');
    showToast(`✓ Data Wali Asuh "${trimmedNama}" berhasil diperbarui.`);
  };

  const handleConfirmDeleteSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const target = waliAsuhList.find((w) => w.id === hapusSingleId);
    if (!target) return;
    deleteWaliAsuh(target.id);
    const remaining = waliAsuhList.filter((w) => w.id !== target.id);
    setHapusSingleId(remaining[0]?.id || '');
    if (remaining.length === 0) {
      setActivePanel('none');
    }
    showToast(`✓ Wali Asuh "${target.nama}" berhasil dihapus.`);
  };

  const handleConfirmClearAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hapusAllConfirmed) return;
    clearAllWaliAsuh();
    setHapusAllConfirmed(false);
    setActivePanel('none');
    showToast('✓ Seluruh data wali asuh berhasil dihapus. Siap diisi ulang melalui Form Tambah Wali.');
  };

  const filteredWali = waliAsuhList.filter((w) => {
    const matchesStatus = statusFilter === 'Semua' || w.status === statusFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      w.nama.toLowerCase().includes(q) ||
      w.nip.toLowerCase().includes(q) ||
      w.fokusBimbingan.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const renderFormFields = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="block font-bold text-[#1a1c1a] mb-1">NAMA LENGKAP *</label>
          <input
            type="text"
            required
            placeholder="Contoh: Ust. Ahmad Fulan / Ustdz. Siti Aminah"
            value={formData.nama}
            onChange={(e) => {
              setFormData({ ...formData, nama: e.target.value });
              if (formError) setFormError(null);
            }}
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
          />
        </div>
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">GELAR</label>
          <input
            type="text"
            placeholder="Contoh: S.Pd.I"
            value={formData.gelar}
            onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">NIP / NIY</label>
          <input
            type="text"
            placeholder="Contoh: 199508142023051008"
            value={formData.nip}
            onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
          />
        </div>
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">JENIS KELAMIN</label>
          <select
            value={formData.jenisKelamin}
            onChange={(e) =>
              setFormData({ ...formData, jenisKelamin: e.target.value as WaliAsuh['jenisKelamin'] })
            }
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
          >
            <option value="L">Laki-laki (Ustadz)</option>
            <option value="P">Perempuan (Ustadzah)</option>
          </select>
        </div>
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">NO. WHATSAPP</label>
          <input
            type="tel"
            placeholder="0812..."
            value={formData.noHp}
            onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">EMAIL</label>
          <input
            type="email"
            placeholder="nama@sekolahrakyat-jepara.sch.id"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
          />
        </div>
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">SHIFT PIKET</label>
          <select
            value={formData.shiftPiket}
            onChange={(e) =>
              setFormData({ ...formData, shiftPiket: e.target.value as WaliAsuh['shiftPiket'] })
            }
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
          >
            <option value="Pagi (05:00 - 13:00)">Pagi (05:00 - 13:00)</option>
            <option value="Sore (13:00 - 21:00)">Sore (13:00 - 21:00)</option>
            <option value="Malam (21:00 - 05:00)">Malam (21:00 - 05:00)</option>
            <option value="Pendamping Penuh">Pendamping Penuh</option>
          </select>
        </div>
        <div>
          <label className="block font-bold text-[#1a1c1a] mb-1">STATUS TUGAS</label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as WaliAsuh['status'] })
            }
            className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
          >
            <option value="Bertugas">Bertugas</option>
            <option value="Libur / Lepas Piket">Libur / Lepas Piket</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-bold text-[#1a1c1a] mb-1">FOKUS BIMBINGAN</label>
        <input
          type="text"
          placeholder="Contoh: Tahfidz Al-Qur'an & Karakter Kemandirian"
          value={formData.fokusBimbingan}
          onChange={(e) => setFormData({ ...formData, fokusBimbingan: e.target.value })}
          className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
        />
      </div>

      <div>
        <label className="block font-bold text-[#1a1c1a] mb-1">
          KAMAR BINAAN ({formData.kamarBinaanIds.length} dipilih)
        </label>
        {kamarList.length === 0 ? (
          <div className="p-2.5 bg-[#fdfcf9] border border-[#1a1c1a]/30 text-[#1a1c1a]/70 font-sans text-xs">
            Belum ada data kamar asrama. Kamar binaan dapat dipilih nanti setelah kamar ditambahkan.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a]">
            {kamarList.map((k) => {
              const checked = formData.kamarBinaanIds.includes(k.id);
              return (
                <label
                  key={k.id}
                  className={`flex items-center gap-2 p-2 border text-xs cursor-pointer select-none transition-colors ${
                    checked
                      ? 'bg-emerald-50 border-[#006b54] text-[#006b54] font-bold'
                      : 'bg-white border-[#1a1c1a]/25 text-[#1a1c1a]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleKamarBinaan(k.id)}
                    className="accent-[#006b54]"
                  />
                  <span className="truncate font-sans">{k.nama}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Editorial Header Banner */}
      <div className="bg-[#fdfcf9] p-5 border-[1.5px] border-[#1a1c1a] shadow-[3.5px_3.5px_0px_#1a1c1a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-custom text-[#006b54] font-bold uppercase tracking-wider mb-1">
            <span>// TENAGA PENDIDIK & PENGASUHAN</span>
            <span>·</span>
            <span>{waliAsuhList.length} WALI ASUH TERDAFTAR</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-syne text-[#1a1c1a] tracking-tight">
            Data Wali Asuh & Pamong Asrama
          </h1>
          <p className="text-xs text-[#1a1c1a]/70 font-mono-custom mt-1">
            Pendampingan 24 Jam Santri SD Sekolah Rakyat 1 Jepara
          </p>
        </div>

        <button
          type="button"
          onClick={() => (activePanel === 'add' ? setActivePanel('none') : handleOpenAdd())}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2.5px_2.5px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider shrink-0 cursor-pointer whitespace-nowrap"
        >
          {activePanel === 'add' ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{activePanel === 'add' ? 'Tutup Form' : 'Tambah Wali Asuh'}</span>
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

      {/* Menu Kelola Data Wali Asuh */}
      <div className="bg-white border-[1.5px] border-[#1a1c1a] p-3.5 neo-shadow font-mono-custom">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#006b54] block">
              Menu Kelola Data Wali Asuh
            </span>
            <p className="text-[11px] font-sans text-[#1a1c1a]/75">
              Tambahkan wali asuh baru, perbarui profil & jadwal piket, atau hapus data wali asuh yang tidak bertugas.
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
              <span>Form Tambah Wali</span>
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

      {/* INLINE FORM SECTION (TAMBAH / EDIT / HAPUS WALI ASUH) */}
      <div ref={formSectionRef}>
        {/* FORM TAMBAH WALI ASUH */}
        {activePanel === 'add' && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#1a1c1a] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  Form Tambah Wali Asuh Baru
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Lengkapi identitas pamong, kontak WhatsApp, jadwal shift piket, dan kamar binaan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form tambah wali asuh"
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
              {renderFormFields()}

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
                  <span>SIMPAN WALI ASUH</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FORM EDIT WALI ASUH */}
        {activePanel === 'edit' && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#1a1c1a] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  Form Edit Data Wali Asuh
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Pilih wali asuh yang ingin diperbarui lalu simpan perubahan datanya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form edit wali asuh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {waliAsuhList.length === 0 ? (
              <div className="p-5 bg-[#fdfcf9] border border-[#1a1c1a]/30 text-center space-y-3">
                <p className="font-sans text-xs text-[#1a1c1a]/80">
                  Belum ada data wali asuh untuk diedit. Silakan tambahkan wali asuh terlebih dahulu.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] text-white text-xs font-bold font-mono-custom border border-[#1a1c1a] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buka Form Tambah Wali</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveEdit} className="space-y-4 font-mono-custom text-xs">
                <div className="p-3.5 bg-emerald-50/60 border-[1.5px] border-[#006b54] space-y-1.5">
                  <label className="block font-bold text-[#1a1c1a]">
                    Pilih Wali Asuh yang Akan Diedit ({waliAsuhList.length} wali) *
                  </label>
                  <select
                    value={editTargetId}
                    onChange={(e) => {
                      const next = waliAsuhList.find((w) => w.id === e.target.value);
                      if (next) populateEditForm(next);
                    }}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans font-bold"
                  >
                    {waliAsuhList.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nama}
                        {w.gelar ? `, ${w.gelar}` : ''} — {w.shiftPiket} ({w.status})
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

                {renderFormFields()}

                <div className="pt-3 border-t border-[#1a1c1a] flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = waliAsuhList.find((w) => w.id === editTargetId);
                      if (target) handleOpenHapus(target, 'single');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-700 border-[1.5px] border-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white font-bold uppercase cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Wali Ini</span>
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

        {/* FORM HAPUS DATA WALI ASUH */}
        {activePanel === 'hapus' && (
          <div className="bg-white border-[1.5px] border-rose-700 shadow-[5px_5px_0px_#9f1239] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-rose-700">
              <div>
                <h2 className="font-syne text-xl font-extrabold text-rose-900 tracking-tight">
                  Form Hapus Data Wali Asuh
                </h2>
                <p className="text-xs font-mono-custom text-rose-900/75 mt-0.5">
                  Hapus satu wali asuh atau kosongkan seluruh daftar wali asuh.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form hapus wali asuh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {waliAsuhList.length === 0 ? (
              <div className="p-5 bg-[#fdfcf9] border border-[#1a1c1a]/30 text-center space-y-2">
                <p className="font-sans text-xs text-[#1a1c1a]/80">
                  Saat ini tidak ada data wali asuh tersimpan (0 wali asuh).
                </p>
              </div>
            ) : (
              <div className="space-y-4 font-mono-custom text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHapusMode('single');
                      if (!hapusSingleId && waliAsuhList[0]) setHapusSingleId(waliAsuhList[0].id);
                    }}
                    className={`px-3 py-2 font-bold border-[1.5px] cursor-pointer transition-colors ${
                      hapusMode === 'single'
                        ? 'bg-rose-700 text-white border-[#1a1c1a]'
                        : 'bg-[#fdfcf9] text-[#1a1c1a] border-[#1a1c1a]/40 hover:border-[#1a1c1a]'
                    }`}
                  >
                    1. Hapus 1 Wali Asuh
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
                    2. Hapus Semua Wali Asuh ({waliAsuhList.length})
                  </button>
                </div>

                {hapusMode === 'single' && (
                  <form onSubmit={handleConfirmDeleteSingle} className="space-y-3">
                    <div>
                      <label className="block font-bold text-[#1a1c1a] mb-1">
                        Pilih Wali Asuh yang Akan Dihapus *
                      </label>
                      <select
                        value={hapusSingleId}
                        onChange={(e) => setHapusSingleId(e.target.value)}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] font-sans font-bold"
                      >
                        {waliAsuhList.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.nama}
                            {w.gelar ? `, ${w.gelar}` : ''} — NIP: {w.nip} ({w.shiftPiket})
                          </option>
                        ))}
                      </select>
                    </div>

                    {(() => {
                      const target = waliAsuhList.find((w) => w.id === hapusSingleId);
                      if (!target) return null;
                      const binaanKamar = kamarList.filter(
                        (k) => target.kamarBinaanIds.includes(k.id) || k.waliAsuhId === target.id
                      );
                      return (
                        <div className="p-3.5 bg-rose-50 border-[1.5px] border-rose-600 text-rose-950 space-y-1">
                          <div className="font-bold text-sm font-sans">
                            {target.nama}
                            {target.gelar ? `, ${target.gelar}` : ''}
                          </div>
                          <div>
                            NIP: <strong>{target.nip || '-'}</strong> · Shift: <strong>{target.shiftPiket}</strong>
                          </div>
                          <div>
                            Kamar Binaan:{' '}
                            <strong>{binaanKamar.map((k) => k.nama).join(', ') || '-'}</strong>
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
                        <span>YA, HAPUS WALI INI</span>
                      </button>
                    </div>
                  </form>
                )}

                {hapusMode === 'all' && (
                  <form onSubmit={handleConfirmClearAll} className="space-y-3">
                    <div className="p-3.5 bg-rose-50 border-[1.5px] border-rose-600 text-rose-950 space-y-1.5">
                      <div className="font-bold">
                        Peringatan: Anda akan menghapus seluruh {waliAsuhList.length} data wali asuh!
                      </div>
                      <p className="font-sans text-xs">
                        Relasi pembina pada kamar & santri akan dikosongkan. Data kamar dan santri tetap aman.
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
                        Saya yakin ingin menghapus seluruh data wali asuh.
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
                        <span>YA, HAPUS SEMUA WALI</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter & Pencarian + Quick Hapus Semua */}
      {waliAsuhList.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono-custom text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'Semua', label: `SEMUA (${waliAsuhList.length})` },
              {
                key: 'Bertugas',
                label: `BERTUGAS (${waliAsuhList.filter((w) => w.status === 'Bertugas').length})`,
              },
              {
                key: 'Libur / Lepas Piket',
                label: `LEPAS PIKET (${
                  waliAsuhList.filter((w) => w.status === 'Libur / Lepas Piket').length
                })`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 border-[1.5px] border-[#1a1c1a] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-[#1a1c1a] text-[#fdfcf9] shadow-[2.5px_2.5px_0px_#006b54]'
                    : 'bg-[#fdfcf9] text-[#1a1c1a] hover:bg-[#1a1c1a]/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#1a1c1a]/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama / NIP / fokus..."
                className="w-full pl-8 pr-3 py-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
              />
            </div>

            <button
              type="button"
              onClick={() => handleOpenHapus(undefined, 'all')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-[1.5px] border-rose-700 bg-rose-50 text-rose-800 hover:bg-rose-700 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua Wali</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty State or Grid Wali Asuh */}
      {filteredWali.length === 0 ? (
        <div className="p-8 text-center bg-white border-[1.5px] border-[#1a1c1a] neo-shadow space-y-4">
          <div className="w-12 h-12 mx-auto bg-emerald-50 border-[1.5px] border-[#1a1c1a] flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-[#006b54]" />
          </div>
          {waliAsuhList.length === 0 ? (
            <>
              <div className="space-y-1">
                <h3 className="font-syne text-lg font-bold text-[#1a1c1a]">
                  Belum Ada Data Wali Asuh
                </h3>
                <p className="font-sans text-xs text-[#1a1c1a]/70 max-w-md mx-auto">
                  Daftar wali asuh masih kosong. Silakan tambahkan data wali asuh baru melalui Form Tambah Wali di atas.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Wali Asuh Baru</span>
              </button>
            </>
          ) : (
            <p className="font-mono-custom text-xs text-[#1a1c1a]/60 uppercase">
              Tidak ada wali asuh yang cocok dengan filter atau pencarian.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredWali.map((wali) => {
            const binaanKamar = kamarList.filter(
              (k) => wali.kamarBinaanIds.includes(k.id) || k.waliAsuhId === wali.id
            );
            const totalSantriBinaan = siswaList.filter(
              (s) => binaanKamar.some((k) => k.id === s.kamarId) || s.waliAsuhId === wali.id
            ).length;

            const cleanName = wali.nama.replace(/^(Ust\.|Ustdz\.|Ustadz|Ustadzah)\s+/i, '');
            const initials = (cleanName || wali.nama).slice(0, 2).toUpperCase();

            return (
              <div
                key={wali.id}
                className="bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] p-4 shadow-[3.5px_3.5px_0px_#1a1c1a] hover:shadow-[4.5px_4.5px_0px_#006b54] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header card with Avatar */}
                  <div className="flex items-start justify-between gap-2 border-b-[1.5px] border-[#1a1c1a] pb-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 bg-[#1a1c1a] text-[#fdfcf9] font-mono-custom font-bold text-xs flex items-center justify-center border border-[#1a1c1a] shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold font-syne text-[#1a1c1a] truncate">
                          {wali.nama}
                          {wali.gelar ? `, ${wali.gelar}` : ''}
                        </h3>
                        <p className="text-[10px] font-mono-custom text-[#006b54] font-bold truncate">
                          NIP: {wali.nip || '-'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`font-mono-custom text-[9px] font-bold px-1.5 py-0.5 border border-[#1a1c1a] uppercase shrink-0 ${
                        wali.status === 'Bertugas'
                          ? 'bg-[#006b54] text-white'
                          : 'bg-[#1a1c1a]/10 text-[#1a1c1a]'
                      }`}
                    >
                      {wali.status === 'Bertugas' ? 'Bertugas' : 'Lepas Piket'}
                    </span>
                  </div>

                  {/* Detail Box */}
                  <div className="space-y-2 text-xs font-mono-custom bg-[#1a1c1a]/5 p-2.5 border border-[#1a1c1a]/20 mb-3">
                    <div>
                      <span className="text-[#1a1c1a]/60 block text-[10px]">KAMAR BINAAN:</span>
                      <div className="font-bold text-[#1a1c1a] mt-0.5 flex items-center justify-between gap-1">
                        <span className="truncate">{binaanKamar.map((k) => k.nama).join(', ') || '-'}</span>
                        <span className="text-[#006b54] font-bold bg-[#fdfcf9] border border-[#1a1c1a] px-1.5 py-0.2 shrink-0">
                          {totalSantriBinaan} ANAK
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[#1a1c1a]/60 block text-[10px]">FOKUS PENGASUHAN:</span>
                      <span className="text-[#1a1c1a] text-[11px] block mt-0.5 line-clamp-2">
                        {wali.fokusBimbingan || '-'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#1a1c1a]/60 block text-[10px]">SHIFT PIKET:</span>
                      <span className="font-bold text-[#006b54] text-[11px] block mt-0.5">
                        {wali.shiftPiket}
                      </span>
                    </div>

                    {wali.email && (
                      <div className="flex items-center gap-1 text-[10px] text-[#1a1c1a]/75 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{wali.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-2 border-t-[1.5px] border-[#1a1c1a] space-y-1.5 font-mono-custom">
                  <div className="flex gap-1.5">
                    {wali.noHp ? (
                      <a
                        href={`https://wa.me/${wali.noHp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-2 bg-[#006b54] hover:bg-[#005240] text-white text-[10px] font-bold uppercase tracking-wider text-center border border-[#1a1c1a] transition-colors flex items-center justify-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        WA ({wali.noHp.slice(-4)})
                      </a>
                    ) : (
                      <span className="flex-1 py-1.5 px-2 bg-[#1a1c1a]/5 text-[#1a1c1a]/45 text-[10px] font-bold uppercase text-center border border-[#1a1c1a]/25 flex items-center justify-center gap-1">
                        <Phone className="w-3 h-3" />
                        NO WA -
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const newStatus: WaliAsuh['status'] =
                          wali.status === 'Bertugas' ? 'Libur / Lepas Piket' : 'Bertugas';
                        updateWaliAsuh(wali.id, { status: newStatus });
                      }}
                      className="py-1.5 px-2.5 bg-[#fdfcf9] hover:bg-[#1a1c1a]/10 text-[#1a1c1a] text-[10px] font-bold uppercase border border-[#1a1c1a] transition-colors cursor-pointer"
                      title="Ubah status tugas piket"
                    >
                      STATUS
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(wali)}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold border border-[#1a1c1a] bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenHapus(wali, 'single')}
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
