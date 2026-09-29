import React, { useState } from 'react';
import {
  Home,
  Plus,
  Users,
  Sparkles,
  BedDouble,
  UserCheck,
  Building,
  CheckCircle2,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Kamar } from '../../types';
import { Modal } from '../common/Modal';

export const DataKamarView: React.FC = () => {
  const {
    kamarList,
    siswaList,
    waliAsuhList,
    addKamar,
    getWaliAsuh,
    getSiswa,
    setSelectedSiswaId,
  } = useApp();

  const [selectedGedungFilter, setSelectedGedungFilter] = useState<string>('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedKamarDetail, setSelectedKamarDetail] = useState<Kamar | null>(null);

  const initialFormState: Omit<Kamar, 'id'> = {
    nama: '',
    gedung: 'Gedung Putra (Sultan Hadlirin)',
    lantai: 'Lantai 1',
    kapasitas: 9,
    waliAsuhId: waliAsuhList[0]?.id || '',
    ketuaKamarId: '',
    nilaiKebersihan: 5.0,
    kondisiFasilitas: 'Baik',
  };

  const [formData, setFormData] = useState<Omit<Kamar, 'id'>>(initialFormState);

  const filteredKamar = kamarList.filter((k) => {
    if (selectedGedungFilter === 'Semua') return true;
    return k.gedung.includes(selectedGedungFilter);
  });

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) {
      alert('Nama kamar wajib diisi');
      return;
    }
    addKamar(formData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Editorial Header Banner */}
      <div className="bg-[#fdfcf9] p-5 border-[1.5px] border-[#1a1c1a] shadow-[3.5px_3.5px_0px_#1a1c1a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-custom text-[#006b54] font-bold uppercase tracking-wider mb-1">
            <span>// ASRAMA SEKOLAH RAKYAT 1 JEPARA</span>
            <span>·</span>
            <span>8 KAMAR RESMI</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-syne text-[#1a1c1a] tracking-tight">
            Data Kamar & Kapasitas Santri SD
          </h1>
          <p className="text-xs text-[#1a1c1a]/70 font-mono-custom mt-1">
            Total 8 Kamar Planet · 75 Santri Asrama Terbina
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormData(initialFormState);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2.5px_2.5px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Kamar
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 font-mono-custom text-xs">
        {[
          { key: 'Semua', label: `SEMUA KAMAR (${kamarList.length})` },
          { key: 'Putra', label: 'ASRAMA PUTRA (SULTAN HADLIRIN)' },
          { key: 'Putri', label: 'ASRAMA PUTRI (RATU SHIMA)' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedGedungFilter(tab.key)}
            className={`px-3.5 py-1.5 border-[1.5px] border-[#1a1c1a] font-bold text-xs uppercase transition-all whitespace-nowrap ${
              selectedGedungFilter === tab.key
                ? 'bg-[#1a1c1a] text-[#fdfcf9] shadow-[2.5px_2.5px_0px_#006b54]'
                : 'bg-[#fdfcf9] text-[#1a1c1a] hover:bg-[#1a1c1a]/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Kamar Cards Grid */}
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
                      {kamar.gedung.includes('Putra') ? 'Gedung Putra' : 'Gedung Putri'}
                    </span>
                    <h3 className="text-base font-bold font-syne text-[#1a1c1a] tracking-tight">
                      {kamar.nama}
                    </h3>
                  </div>

                  <span
                    className={`font-mono-custom text-[10px] font-bold px-2 py-0.5 border border-[#1a1c1a] uppercase ${
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
                        width: `${Math.min((penghuni.length / kamar.kapasitas) * 100, 100)}%`,
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
                      {ketua?.nama?.split(' ')[0] || (penghuni[0]?.nama?.split(' ')[0] ?? '-')}
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
              <div className="pt-2 border-t-[1.5px] border-[#1a1c1a]">
                <button
                  type="button"
                  onClick={() => setSelectedKamarDetail(kamar)}
                  className="w-full py-1.5 px-3 bg-[#1a1c1a] hover:bg-[#006b54] text-[#fdfcf9] text-xs font-bold font-mono-custom uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  LIHAT {penghuni.length} PENGHUNI
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Detail Penghuni Kamar */}
      <Modal
        isOpen={!!selectedKamarDetail}
        onClose={() => setSelectedKamarDetail(null)}
        title={selectedKamarDetail?.nama || 'Detail Kamar'}
        subtitle={`${selectedKamarDetail?.gedung} · ${selectedKamarDetail?.lantai}`}
        maxWidth="lg"
      >
        {selectedKamarDetail && (
          <div className="space-y-4">
            {/* Kamar Meta Bar */}
            <div className="p-3 bg-[#1a1c1a]/5 border-[1.5px] border-[#1a1c1a] flex flex-wrap justify-between items-center gap-2 font-mono-custom text-xs">
              <div>
                <span className="text-[#1a1c1a]/60">WALI ASUH:</span>{' '}
                <span className="font-bold text-[#006b54]">
                  {getWaliAsuh(selectedKamarDetail.waliAsuhId)?.nama}
                </span>
              </div>
              <div>
                <span className="text-[#1a1c1a]/60">TOTAL ANAK:</span>{' '}
                <span className="font-bold text-[#1a1c1a]">
                  {siswaList.filter((s) => s.kamarId === selectedKamarDetail.id).length} Anak
                </span>
              </div>
              <div>
                <span className="text-[#1a1c1a]/60">KAPASITAS:</span>{' '}
                <span className="font-bold text-[#1a1c1a]">
                  {selectedKamarDetail.kapasitas} Ranjang
                </span>
              </div>
            </div>

            {/* List Santri Penghuni */}
            <div>
              <div className="font-mono-custom text-xs font-bold uppercase text-[#1a1c1a] mb-2 flex items-center gap-1">
                <span>// DAFTAR SANTRI PENGHUNI KAMAR</span>
              </div>

              <div className="divide-y-[1.5px] divide-[#1a1c1a] border-[1.5px] border-[#1a1c1a]">
                {siswaList
                  .filter((s) => s.kamarId === selectedKamarDetail.id)
                  .map((siswa, idx) => (
                    <div
                      key={siswa.id}
                      className="p-3 flex items-center justify-between gap-3 bg-[#fdfcf9] hover:bg-[#1a1c1a]/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-[#1a1c1a] text-[#fdfcf9] text-[10px] font-bold font-mono-custom flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold font-syne text-sm text-[#1a1c1a]">
                            {siswa.nama}
                          </div>
                          <div className="text-[10px] font-mono-custom text-[#1a1c1a]/60">
                            NISN: {siswa.nisn} · KELAS: {siswa.kelas}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono-custom font-bold px-2 py-0.5 border border-[#1a1c1a] uppercase ${
                            siswa.status === 'Aktif'
                              ? 'bg-[#006b54] text-white'
                              : siswa.status === 'Sakit'
                              ? 'bg-amber-400 text-[#1a1c1a]'
                              : 'bg-blue-300 text-[#1a1c1a]'
                          }`}
                        >
                          {siswa.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedKamarDetail(null);
                            setSelectedSiswaId(siswa.id);
                          }}
                          className="px-2 py-1 bg-[#1a1c1a] hover:bg-[#006b54] text-[#fdfcf9] text-[10px] font-mono-custom font-bold uppercase transition-colors"
                        >
                          PROFIL
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tambah Kamar */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="TAMBAH KAMAR ASRAMA"
        subtitle="Sekolah Rakyat 1 Jepara"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAdd} className="space-y-3 font-mono-custom text-xs">
          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">NAMA KAMAR *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Kamar Pluto"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none focus:border-[#006b54]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">GEDUNG *</label>
              <select
                value={formData.gedung}
                onChange={(e) => setFormData({ ...formData, gedung: e.target.value as Kamar['gedung'] })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none"
              >
                <option value="Gedung Putra (Sultan Hadlirin)">Gedung Putra (Sultan Hadlirin)</option>
                <option value="Gedung Putri (Ratu Shima)">Gedung Putri (Ratu Shima)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">KAPASITAS (ANAK) *</label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={formData.kapasitas}
                onChange={(e) => setFormData({ ...formData, kapasitas: Number(e.target.value) })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">WALI ASUH PEMBINA *</label>
            <select
              value={formData.waliAsuhId}
              onChange={(e) => setFormData({ ...formData, waliAsuhId: e.target.value })}
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none"
            >
              {waliAsuhList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nama} ({w.shiftPiket})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t-[1.5px] border-[#1a1c1a] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] text-[#1a1c1a] font-bold uppercase"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="px-4 py-2 border-[1.5px] border-[#1a1c1a] bg-[#006b54] text-white font-bold uppercase shadow-[2px_2px_0px_#1a1c1a]"
            >
              SIMPAN KAMAR
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
