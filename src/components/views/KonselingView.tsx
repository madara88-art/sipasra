import React, { useState, useRef, useMemo } from 'react';
import {
  MessageSquareHeart,
  Plus,
  Heart,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SesiKonseling } from '../../types';

export const KonselingView: React.FC = () => {
  const {
    konselingList,
    siswaList,
    waliAsuhList,
    addKonseling,
    updateKonseling,
    deleteKonseling,
    getSiswa,
    getKamar,
    getWaliAsuh,
  } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SesiKonseling | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nama: string } | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const formSectionRef = useRef<HTMLDivElement>(null);

  const defaultKonselor =
    waliAsuhList[0]?.nama || 'Ustzh. Nur Lailatul Hidayah, S.Psi';

  const initialForm: Omit<SesiKonseling, 'id'> = {
    tanggal: new Date().toISOString().split('T')[0],
    siswaId: siswaList[0]?.id || '',
    namaSiswa: siswaList[0]?.nama || '',
    kamar: getKamar(siswaList[0]?.kamarId)?.nama || '',
    kategori: 'Homesick / Rindu Rumah',
    uraianMasalah: '',
    pendekatanSolusi: '',
    rencanaTindakLanjut: '',
    status: 'Perlu Pemantauan',
    konselor: defaultKonselor,
  };

  const [formData, setFormData] = useState<Omit<SesiKonseling, 'id'>>(initialForm);

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

  const handleSiswaChange = (siswaId: string) => {
    const s = getSiswa(siswaId);
    const k = getKamar(s?.kamarId);
    const w = getWaliAsuh(s?.waliAsuhId);
    setFormData((prev) => ({
      ...prev,
      siswaId,
      namaSiswa: s?.nama || (siswaId ? '' : prev.namaSiswa),
      kamar: k?.nama || (siswaId ? '' : prev.kamar),
      konselor: w?.nama || prev.konselor,
    }));
  };

  const handleOpenAdd = () => {
    const first = siswaList[0];
    const k = getKamar(first?.kamarId);
    const w = getWaliAsuh(first?.waliAsuhId);
    setFormData({
      ...initialForm,
      tanggal: new Date().toISOString().split('T')[0],
      siswaId: first?.id || '',
      namaSiswa: first?.nama || '',
      kamar: k?.nama || '',
      konselor: w?.nama || defaultKonselor,
    });
    setEditingItem(null);
    setFormError(null);
    setIsFormOpen(true);
    scrollToForm();
  };

  const handleOpenEdit = (item: SesiKonseling) => {
    const s = getSiswa(item.siswaId);
    const k = getKamar(s?.kamarId);
    setEditingItem(item);
    setFormError(null);
    setFormData({
      tanggal: item.tanggal,
      siswaId: item.siswaId,
      namaSiswa: item.namaSiswa || s?.nama || '',
      kamar: item.kamar || k?.nama || '',
      kategori: item.kategori,
      uraianMasalah: item.uraianMasalah,
      pendekatanSolusi: item.pendekatanSolusi,
      rencanaTindakLanjut: item.rencanaTindakLanjut,
      status: item.status,
      konselor: item.konselor,
    });
    setIsFormOpen(true);
    scrollToForm();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedSiswa = formData.siswaId ? getSiswa(formData.siswaId) : undefined;
    const resolvedNama = resolvedSiswa?.nama || formData.namaSiswa?.trim() || '';

    if (!resolvedNama) {
      setFormError('Pilih santri atau isi nama anak terlebih dahulu.');
      return;
    }
    if (!formData.uraianMasalah.trim()) {
      setFormError('Uraian cerita & masalah anak wajib diisi.');
      return;
    }
    setFormError(null);

    const payload: Omit<SesiKonseling, 'id'> = {
      tanggal: formData.tanggal,
      siswaId: formData.siswaId,
      namaSiswa: resolvedNama,
      kamar: formData.kamar?.trim() || '',
      kategori: formData.kategori,
      uraianMasalah: formData.uraianMasalah.trim(),
      pendekatanSolusi: formData.pendekatanSolusi.trim(),
      rencanaTindakLanjut: formData.rencanaTindakLanjut.trim(),
      status: formData.status,
      konselor: formData.konselor.trim() || 'Wali Asuh / Konselor',
    };

    if (editingItem) {
      updateKonseling(editingItem.id, payload);
      showToast(`✓ Catatan sesi bimbingan ${resolvedNama} berhasil diperbarui.`);
    } else {
      addKonseling(payload);
      showToast(`✓ Catatan sesi bimbingan baru untuk ${resolvedNama} berhasil disimpan.`);
    }

    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteKonseling(deleteTarget.id);
    if (editingItem?.id === deleteTarget.id) {
      setIsFormOpen(false);
      setEditingItem(null);
    }
    showToast(`✓ Catatan sesi bimbingan ${deleteTarget.nama} berhasil dihapus.`);
    setDeleteTarget(null);
  };

  const filteredKonseling = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return konselingList.filter((k) => {
      const matchStatus = selectedFilter === 'Semua' || k.status === selectedFilter;
      const siswa = getSiswa(k.siswaId);
      const displayNama = (siswa?.nama || k.namaSiswa || '').toLowerCase();
      const matchSearch =
        !q ||
        displayNama.includes(q) ||
        k.kategori.toLowerCase().includes(q) ||
        k.uraianMasalah.toLowerCase().includes(q) ||
        k.konselor.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [konselingList, selectedFilter, searchTerm, siswaList]);

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Banner */}
      <div className="bg-[#fdfcf9] p-5 border-[1.5px] border-[#1a1c1a] shadow-[3.5px_3.5px_0px_#1a1c1a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-custom text-[#006b54] font-bold uppercase tracking-wider mb-1">
            <span>// BIMBINGAN & KONSELING RAMAH ANAK</span>
            <span>·</span>
            <span>{konselingList.length} SESI TERCATAT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-syne text-[#1a1c1a] tracking-tight">
            Bimbingan Konseling & Pendampingan Santri
          </h1>
          <p className="text-xs text-[#1a1c1a]/70 font-mono-custom mt-1">
            Pendampingan ramah anak untuk mengatasi homesick, adaptasi asrama, dan motivasi belajar
          </p>
        </div>

        <button
          type="button"
          onClick={() => (isFormOpen && !editingItem ? setIsFormOpen(false) : handleOpenAdd())}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2.5px_2.5px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider shrink-0 cursor-pointer whitespace-nowrap"
        >
          {isFormOpen && !editingItem ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isFormOpen && !editingItem ? 'Tutup Form' : 'Catat Sesi Bimbingan'}</span>
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

      {/* INLINE FORM CATATAN SESI BIMBINGAN (TAMBAH / EDIT) */}
      <div ref={formSectionRef}>
        {isFormOpen && (
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#006b54] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <span className="text-[10px] font-mono-custom font-bold uppercase tracking-wider text-[#006b54] block">
                  // CATATAN SESI BIMBINGAN & KONSELING
                </span>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  {editingItem ? 'Form Edit Sesi Bimbingan' : 'Form Catatan Sesi Bimbingan Baru'}
                </h2>
                <p className="text-xs font-mono-custom text-[#1a1c1a]/65 mt-0.5">
                  Isi identitas anak, kategori bimbingan, uraian cerita/masalah, pendekatan solusi, dan tindak lanjut wali asuh.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingItem(null);
                }}
                className="p-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Tutup form catatan sesi bimbingan"
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

            <form onSubmit={handleSave} className="space-y-4 font-mono-custom text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">TANGGAL SESI *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">NAMA ANAK (SANTRI) *</label>
                  {siswaList.length > 0 ? (
                    <select
                      value={formData.siswaId}
                      onChange={(e) => {
                        handleSiswaChange(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                    >
                      <option value="">-- Input Manual / Santri Belum Terdaftar --</option>
                      {siswaList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nama} ({s.kelas})
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
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">KATEGORI BIMBINGAN *</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kategori: e.target.value as SesiKonseling['kategori'],
                      })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
                  >
                    <option value="Homesick / Rindu Rumah">Homesick / Rindu Rumah</option>
                    <option value="Adaptasi Teman Sekamar">Adaptasi Teman Sekamar</option>
                    <option value="Motivasi Belajar">Motivasi Belajar & Kerapian Buku</option>
                    <option value="Nafsu Makan & Kebiasaan Mandiri">
                      Nafsu Makan & Kebiasaan Mandiri
                    </option>
                    <option value="Kecemasan / Emosi">Kecemasan / Emosi Santri</option>
                    <option value="Kedisiplinan">Kedisiplinan Bangun Pagi / Tidur</option>
                  </select>
                </div>
              </div>

              {siswaList.length > 0 && !formData.siswaId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">
                      NAMA ANAK (INPUT MANUAL) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ketik nama santri..."
                      value={formData.namaSiswa || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, namaSiswa: e.target.value });
                        if (formError) setFormError(null);
                      }}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">KAMAR ASRAMA</label>
                    <input
                      type="text"
                      placeholder="Contoh: Kamar 01"
                      value={formData.kamar || ''}
                      onChange={(e) => setFormData({ ...formData, kamar: e.target.value })}
                      className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#1a1c1a] mb-1">
                  URAIAN CERITA & MASALAH ANAK *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Menangis malam hari teringat orang tua di rumah, belum terbiasa tidur sendiri..."
                  value={formData.uraianMasalah}
                  onChange={(e) => {
                    setFormData({ ...formData, uraianMasalah: e.target.value });
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    PENDEKATAN SOLUSI & NASEHAT RAMAH ANAK
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Diajak bercerita santai, ditemani makan malam, difasilitasi telepon orang tua..."
                    value={formData.pendekatanSolusi}
                    onChange={(e) => setFormData({ ...formData, pendekatanSolusi: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    RENCANA TINDAK LANJUT WALI ASUH
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Melibatkan dalam permainan kelompok sore hari & pemantauan teman sekamar"
                    value={formData.rencanaTindakLanjut}
                    onChange={(e) =>
                      setFormData({ ...formData, rencanaTindakLanjut: e.target.value })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">STATUS BIMBINGAN</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as SesiKonseling['status'],
                      })
                    }
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
                  >
                    <option value="Perlu Pemantauan">Perlu Pemantauan</option>
                    <option value="Bimbingan Lanjutan">Bimbingan Lanjutan</option>
                    <option value="Selesai">Selesai (Sudah Nyaman)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1a1c1a] mb-1">KONSELOR / WALI ASUH</label>
                  <input
                    type="text"
                    list="konselor-suggestions"
                    placeholder="Nama konselor / wali asuh..."
                    value={formData.konselor}
                    onChange={(e) => setFormData({ ...formData, konselor: e.target.value })}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54] font-sans"
                  />
                  <datalist id="konselor-suggestions">
                    {waliAsuhList.map((w) => (
                      <option key={w.id} value={w.nama} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-[#1a1c1a]">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-[#1a1c1a] font-bold uppercase cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 border-[1.5px] border-[#1a1c1a] bg-[#006b54] hover:bg-[#005240] text-white font-bold uppercase shadow-[2.5px_2.5px_0px_#1a1c1a] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? 'SIMPAN PERUBAHAN' : 'SIMPAN SESI BIMBINGAN'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Inline Delete Confirmation */}
      {deleteTarget && (
        <div className="p-4 bg-rose-50 border-[1.5px] border-rose-700 shadow-[3px_3px_0px_#9f1239] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono-custom text-xs">
          <div className="text-rose-950">
            <span className="font-bold block">Konfirmasi Hapus Catatan Bimbingan</span>
            <span className="font-sans">
              Yakin ingin menghapus catatan sesi bimbingan untuk <strong>{deleteTarget.nama}</strong>?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-3 py-1.5 bg-white border-[1.5px] border-[#1a1c1a] font-bold uppercase cursor-pointer"
            >
              BATAL
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white border-[1.5px] border-[#1a1c1a] font-bold uppercase cursor-pointer"
            >
              YA, HAPUS
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono-custom text-xs">
        <div className="flex flex-wrap gap-2">
          {['Semua', 'Perlu Pemantauan', 'Bimbingan Lanjutan', 'Selesai'].map((status) => {
            const count =
              status === 'Semua'
                ? konselingList.length
                : konselingList.filter((k) => k.status === status).length;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedFilter(status)}
                className={`px-3 py-1.5 border-[1.5px] border-[#1a1c1a] font-bold uppercase whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === status
                    ? 'bg-[#1a1c1a] text-[#fdfcf9] shadow-[2.5px_2.5px_0px_#006b54]'
                    : 'bg-[#fdfcf9] text-[#1a1c1a] hover:bg-[#1a1c1a]/5'
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-[#1a1c1a]/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, kategori, konselor..."
            className="w-full pl-8 pr-3 py-1.5 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
          />
        </div>
      </div>

      {/* Empty State or Counseling Cards */}
      {filteredKonseling.length === 0 ? (
        <div className="p-8 text-center bg-white border-[1.5px] border-[#1a1c1a] neo-shadow space-y-4">
          <div className="w-12 h-12 mx-auto bg-emerald-50 border-[1.5px] border-[#1a1c1a] flex items-center justify-center">
            <MessageSquareHeart className="w-6 h-6 text-[#006b54]" />
          </div>
          {konselingList.length === 0 ? (
            <>
              <div className="space-y-1">
                <h3 className="font-syne text-lg font-bold text-[#1a1c1a]">
                  Belum Ada Catatan Sesi Bimbingan
                </h3>
                <p className="font-sans text-xs text-[#1a1c1a]/70 max-w-md mx-auto">
                  Silakan catat sesi bimbingan dan konseling santri melalui Form Catatan Sesi Bimbingan Baru.
                </p>
              </div>
              {!isFormOpen && (
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Sesi Bimbingan Baru</span>
                </button>
              )}
            </>
          ) : (
            <p className="font-mono-custom text-xs text-[#1a1c1a]/60 uppercase">
              Tidak ada sesi bimbingan yang cocok dengan filter atau pencarian.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredKonseling.map((item) => {
            const siswa = getSiswa(item.siswaId);
            const kamar = getKamar(siswa?.kamarId);
            const displayNama = siswa?.nama || item.namaSiswa || 'Santri';
            const displayKamar = kamar?.nama || item.kamar || '-';

            return (
              <div
                key={item.id}
                className="bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] p-4 sm:p-5 shadow-[3.5px_3.5px_0px_#1a1c1a] hover:shadow-[4.5px_4.5px_0px_#006b54] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-[1.5px] border-[#1a1c1a]/20 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1a1c1a] text-white font-bold flex items-center justify-center border border-[#1a1c1a] shrink-0">
                      <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold font-syne text-[#1a1c1a]">
                          {displayNama}
                        </h3>
                        {siswa?.kelas && (
                          <span className="text-xs font-mono-custom text-[#1a1c1a]/60">
                            ({siswa.kelas})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono-custom text-[#1a1c1a]/65">
                        Kamar: {displayKamar} · Tanggal: {item.tanggal}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 font-mono-custom">
                    <span className="text-[11px] font-bold px-2.5 py-1 bg-white border border-[#1a1c1a] text-[#1a1c1a]">
                      {item.kategori}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 border border-[#1a1c1a] uppercase ${
                        item.status === 'Selesai'
                          ? 'bg-[#006b54] text-white'
                          : item.status === 'Bimbingan Lanjutan'
                          ? 'bg-amber-200 text-[#1a1c1a]'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Uraian Masalah & Solusi */}
                <div className="mt-3.5 space-y-2.5 text-xs">
                  <div className="bg-white p-3 border border-[#1a1c1a]/20">
                    <span className="font-mono-custom font-bold text-[#1a1c1a] block mb-1 uppercase text-[10px]">
                      Uraian Masalah Anak:
                    </span>
                    <p className="text-[#1a1c1a]/85 leading-relaxed">{item.uraianMasalah}</p>
                  </div>

                  {item.pendekatanSolusi && (
                    <div className="bg-emerald-50/70 p-3 border border-[#006b54]/30">
                      <span className="font-mono-custom font-bold text-[#006b54] block mb-1 uppercase text-[10px]">
                        Pendekatan & Solusi Kasih Sayang:
                      </span>
                      <p className="text-[#1a1c1a]/85 leading-relaxed">{item.pendekatanSolusi}</p>
                    </div>
                  )}

                  {item.rencanaTindakLanjut && (
                    <div className="bg-amber-50/70 p-3 border border-amber-400/50">
                      <span className="font-mono-custom font-bold text-amber-900 block mb-1 uppercase text-[10px]">
                        Rencana Tindak Lanjut Asrama:
                      </span>
                      <p className="text-[#1a1c1a]/85 leading-relaxed">
                        {item.rencanaTindakLanjut}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-3.5 pt-2.5 border-t-[1.5px] border-[#1a1c1a]/15 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-custom">
                  <span className="text-[#1a1c1a]/70">
                    Konselor: <strong className="text-[#1a1c1a]">{item.konselor}</strong>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.status !== 'Selesai' && (
                      <button
                        type="button"
                        onClick={() => {
                          updateKonseling(item.id, { status: 'Selesai' });
                          showToast(`✓ Sesi bimbingan ${displayNama} ditandai selesai.`);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border border-[#006b54] bg-emerald-50 hover:bg-[#006b54] hover:text-white text-[#006b54] transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Tandai Tuntas</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border border-[#1a1c1a] bg-white hover:bg-[#1a1c1a] hover:text-white text-[#1a1c1a] transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: item.id, nama: displayNama })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border border-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white text-rose-800 transition-colors cursor-pointer"
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
