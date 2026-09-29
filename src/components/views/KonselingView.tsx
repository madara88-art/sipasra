import React, { useState } from 'react';
import {
  MessageSquareHeart,
  Plus,
  Heart,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SesiKonseling } from '../../types';
import { Modal } from '../common/Modal';

export const KonselingView: React.FC = () => {
  const {
    konselingList,
    siswaList,
    waliAsuhList,
    addKonseling,
    updateKonseling,
    getSiswa,
    getKamar,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('Semua');

  const initialForm: Omit<SesiKonseling, 'id'> = {
    tanggal: new Date().toISOString().split('T')[0],
    siswaId: siswaList[0]?.id || '',
    kategori: 'Homesick / Rindu Rumah',
    uraianMasalah: '',
    pendekatanSolusi: '',
    rencanaTindakLanjut: '',
    status: 'Perlu Pemantauan',
    konselor: 'Ustzh. Nur Lailatul Hidayah, S.Psi',
  };

  const [formData, setFormData] = useState<Omit<SesiKonseling, 'id'>>(initialForm);

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.uraianMasalah) return;
    addKonseling(formData);
    setIsAddModalOpen(false);
  };

  const filteredKonseling = konselingList.filter((k) => {
    if (selectedFilter === 'Semua') return true;
    return k.status === selectedFilter;
  });

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900">
            Bimbingan Konseling & Pendampingan Anak SD
          </h1>
          <p className="text-xs text-slate-500">
            Pendampingan ramah anak untuk mengatasi homesick, adaptasi asrama, dan motivasi belajar
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormData(initialForm);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Catat Sesi Bimbingan
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-medium">
        {['Semua', 'Perlu Pemantauan', 'Bimbingan Lanjutan', 'Selesai'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setSelectedFilter(status)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              selectedFilter === status
                ? 'bg-pink-700 text-white font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Counseling Cards */}
      <div className="space-y-3.5">
        {filteredKonseling.map((item) => {
          const siswa = getSiswa(item.siswaId);
          const kamar = getKamar(siswa?.kamarId);

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-pink-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 font-bold flex items-center justify-center text-sm shrink-0">
                    <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {siswa?.nama}
                      </h3>
                      <span className="text-xs text-slate-500">({siswa?.kelas})</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {kamar?.nama} · Tanggal: {item.tanggal}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-pink-50 text-pink-800 border border-pink-200">
                    {item.kategori}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                      item.status === 'Selesai'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Uraian Masalah & Solusi */}
              <div className="mt-3.5 space-y-2.5 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-1">
                    Uraian Masalah Anak:
                  </span>
                  <p className="text-slate-600 leading-relaxed">{item.uraianMasalah}</p>
                </div>

                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <span className="font-bold text-emerald-900 block mb-1">
                    Pendekatan & Solusi Kasih Sayang:
                  </span>
                  <p className="text-slate-700 leading-relaxed">{item.pendekatanSolusi}</p>
                </div>

                {item.rencanaTindakLanjut && (
                  <div className="bg-teal-50/50 p-3 rounded-lg border border-teal-100">
                    <span className="font-bold text-teal-900 block mb-1">
                      Rencana Tindak Lanjut Asrama:
                    </span>
                    <p className="text-slate-700 leading-relaxed">{item.rencanaTindakLanjut}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Konselor: <strong className="text-slate-800">{item.konselor}</strong></span>
                {item.status !== 'Selesai' && (
                  <button
                    type="button"
                    onClick={() =>
                      updateKonseling(item.id, { status: 'Selesai' })
                    }
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    Tandai Masalah Tuntas
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Sesi Konseling */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Catat Sesi Bimbingan & Konseling Santri SD"
        subtitle="Sekolah Rakyat 1 Jepara"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Pilih Siswa *</label>
              <select
                value={formData.siswaId}
                onChange={(e) => setFormData({ ...formData, siswaId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                {siswaList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kelas})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Kategori Bimbingan</label>
            <select
              value={formData.kategori}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  kategori: e.target.value as SesiKonseling['kategori'],
                })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            >
              <option value="Homesick / Rindu Rumah">Homesick / Rindu Rumah</option>
              <option value="Adaptasi Teman Sekamar">Adaptasi Teman Sekamar</option>
              <option value="Motivasi Belajar">Motivasi Belajar & Kerapian Buku</option>
              <option value="Nafsu Makan & Kebiasaan Mandiri">
                Nafsu Makan & Kebiasaan Mandiri (Mandi/Makan)
              </option>
              <option value="Kecemasan / Emosi">Kecemasan / Emosi Santri</option>
              <option value="Kedisiplinan">Kedisiplinan Bangun Pagi / Tidur</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Uraian Cerita & Masalah Anak *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Contoh: Menangis malam hari teringat ibunya, belum terbiasa makan sayur..."
              value={formData.uraianMasalah}
              onChange={(e) =>
                setFormData({ ...formData, uraianMasalah: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Pendekatan Solusi & Nasehat Ramah Anak
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Diajak bercerita dongeng, ditemani saat makan malam, diizinkan telepon bunda..."
              value={formData.pendekatanSolusi}
              onChange={(e) =>
                setFormData({ ...formData, pendekatanSolusi: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Rencana Tindak Lanjut Wali Asuh
            </label>
            <input
              type="text"
              placeholder="Contoh: Melibatkan dalam permainan beregu sore hari"
              value={formData.rencanaTindakLanjut}
              onChange={(e) =>
                setFormData({ ...formData, rencanaTindakLanjut: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Status Bimbingan</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as SesiKonseling['status'],
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Perlu Pemantauan">Perlu Pemantauan</option>
                <option value="Bimbingan Lanjutan">Bimbingan Lanjutan</option>
                <option value="Selesai">Selesai (Sudah Nyaman)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Konselor</label>
              <input
                type="text"
                value={formData.konselor}
                onChange={(e) => setFormData({ ...formData, konselor: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-semibold"
            >
              Simpan Konseling
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
