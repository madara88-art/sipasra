import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  Home,
  Clock,
  ShieldCheck,
  Edit2,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WaliAsuh } from '../../types';
import { Modal } from '../common/Modal';

export const DataWaliAsuhView: React.FC = () => {
  const { waliAsuhList, kamarList, siswaList, addWaliAsuh, updateWaliAsuh, setActiveMenu } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const initialFormState: Omit<WaliAsuh, 'id'> = {
    nip: '',
    nama: '',
    gelar: 'S.Pd',
    jenisKelamin: 'L',
    noHp: '',
    email: '',
    kamarBinaanIds: [kamarList[0]?.id || ''],
    fokusBimbingan: 'Tahfidz Al-Qur\'an & Karakter Anak SD',
    shiftPiket: 'Pagi (05:00 - 13:00)',
    status: 'Bertugas',
  };

  const [formData, setFormData] = useState<Omit<WaliAsuh, 'id'>>(initialFormState);

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) {
      alert('Nama wali asuh wajib diisi');
      return;
    }
    addWaliAsuh(formData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Editorial Header Banner */}
      <div className="bg-[#fdfcf9] p-5 border-[1.5px] border-[#1a1c1a] shadow-[3.5px_3.5px_0px_#1a1c1a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-custom text-[#006b54] font-bold uppercase tracking-wider mb-1">
            <span>// TENAGA PENDIDIK & PENGASUHAN</span>
            <span>·</span>
            <span>8 WALI ASUH</span>
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
          onClick={() => {
            setFormData(initialFormState);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2.5px_2.5px_0px_#1a1c1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Wali Asuh
        </button>
      </div>

      {/* Grid Wali Asuh */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {waliAsuhList.map((wali) => {
          const binaanKamar = kamarList.filter(
            (k) => wali.kamarBinaanIds.includes(k.id) || k.waliAsuhId === wali.id
          );
          const totalSantriBinaan = siswaList.filter(
            (s) => binaanKamar.some((k) => k.id === s.kamarId) || s.waliAsuhId === wali.id
          ).length;

          const initials = wali.nama
            .replace('Ust. ', '')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={wali.id}
              className="bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] p-4 shadow-[3.5px_3.5px_0px_#1a1c1a] hover:shadow-[4.5px_4.5px_0px_#006b54] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header card with Avatar */}
                <div className="flex items-start justify-between gap-2 border-b-[1.5px] border-[#1a1c1a] pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-[#1a1c1a] text-[#fdfcf9] font-mono-custom font-bold text-xs flex items-center justify-center border border-[#1a1c1a]">
                      {initials}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-syne text-[#1a1c1a]">
                        {wali.nama}, {wali.gelar}
                      </h3>
                      <p className="text-[10px] font-mono-custom text-[#006b54] font-bold">
                        NIP: {wali.nip}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-mono-custom text-[9px] font-bold px-1.5 py-0.5 border border-[#1a1c1a] uppercase ${
                      wali.status === 'Bertugas'
                        ? 'bg-[#006b54] text-white'
                        : 'bg-[#1a1c1a]/10 text-[#1a1c1a]'
                    }`}
                  >
                    {wali.status}
                  </span>
                </div>

                {/* Detail Box */}
                <div className="space-y-2 text-xs font-mono-custom bg-[#1a1c1a]/5 p-2.5 border border-[#1a1c1a]/20 mb-3">
                  <div>
                    <span className="text-[#1a1c1a]/60 block text-[10px]">KAMAR BINAAN:</span>
                    <div className="font-bold text-[#1a1c1a] mt-0.5 flex items-center justify-between">
                      <span>{binaanKamar.map((k) => k.nama).join(', ') || '-'}</span>
                      <span className="text-[#006b54] font-bold bg-[#fdfcf9] border border-[#1a1c1a] px-1.5 py-0.2">
                        {totalSantriBinaan} ANAK
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#1a1c1a]/60 block text-[10px]">FOKUS PENGASUHAN:</span>
                    <span className="text-[#1a1c1a] text-[11px] block mt-0.5 line-clamp-2">
                      {wali.fokusBimbingan}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#1a1c1a]/60 block text-[10px]">SHIFT PIKET:</span>
                    <span className="font-bold text-[#006b54] text-[11px] block mt-0.5">
                      {wali.shiftPiket}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t-[1.5px] border-[#1a1c1a] flex gap-2">
                <a
                  href={`https://wa.me/${wali.noHp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-1.5 px-2 bg-[#006b54] hover:bg-[#005240] text-white text-[10px] font-bold font-mono-custom uppercase tracking-wider text-center border border-[#1a1c1a] transition-colors flex items-center justify-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  WA ({wali.noHp.slice(-4)})
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const newStatus: WaliAsuh['status'] =
                      wali.status === 'Bertugas' ? 'Libur / Lepas Piket' : 'Bertugas';
                    updateWaliAsuh(wali.id, { status: newStatus });
                  }}
                  className="py-1.5 px-2.5 bg-[#fdfcf9] hover:bg-[#1a1c1a]/10 text-[#1a1c1a] text-[10px] font-bold font-mono-custom uppercase border border-[#1a1c1a] transition-colors"
                  title="Ubah status tugas piket"
                >
                  STATUS
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Wali Asuh */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="TAMBAH WALI ASUH"
        subtitle="Sekolah Rakyat 1 Jepara"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAdd} className="space-y-3 font-mono-custom text-xs">
          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">NAMA LENGKAP & GELAR *</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                required
                placeholder="Ust. Fulan"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="col-span-2 px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none"
              />
              <input
                type="text"
                placeholder="S.Pd.I"
                value={formData.gelar}
                onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
                className="px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">NIP *</label>
              <input
                type="text"
                required
                placeholder="1995..."
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-[#1a1c1a] mb-1">NO. WHATSAPP *</label>
              <input
                type="tel"
                required
                placeholder="0812..."
                value={formData.noHp}
                onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">KAMAR BINAAN *</label>
            <select
              value={formData.kamarBinaanIds[0] || ''}
              onChange={(e) => setFormData({ ...formData, kamarBinaanIds: [e.target.value] })}
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none"
            >
              {kamarList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} ({k.kapasitas} Anak)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#1a1c1a] mb-1">FOKUS BIMBINGAN *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Tahfidz & Karakter Kemandirian"
              value={formData.fokusBimbingan}
              onChange={(e) => setFormData({ ...formData, fokusBimbingan: e.target.value })}
              className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] focus:outline-none"
            />
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
              SIMPAN WALI ASUH
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
