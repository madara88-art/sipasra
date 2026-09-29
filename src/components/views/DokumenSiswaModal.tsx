import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Trash2,
  Eye,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  FileCheck,
  Image as ImageIcon,
  User,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Siswa, DokumenSiswa, Kamar, WaliAsuh } from '../../types';

interface DokumenSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswa: Siswa | null;
  kamar?: Kamar;
  waliAsuh?: WaliAsuh;
  onSave: (siswaId: string, updatedDokumen: DokumenSiswa) => void;
  showToast?: (msg: string) => void;
}

type TabType = 'ringkasan' | 'foto' | 'ktp' | 'kk' | 'akte';

export const DokumenSiswaModal: React.FC<DokumenSiswaModalProps> = ({
  isOpen,
  onClose,
  siswa,
  kamar,
  waliAsuh,
  onSave,
  showToast = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ringkasan');
  const [dokumen, setDokumen] = useState<DokumenSiswa>({});
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    imageUrl: string;
    fileType: 'image' | 'pdf' | 'doc';
  }>({
    isOpen: false,
    title: '',
    imageUrl: '',
    fileType: 'image',
  });

  const fotoInputRef = useRef<HTMLInputElement>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);
  const kkInputRef = useRef<HTMLInputElement>(null);
  const akteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (siswa) {
      setDokumen(siswa.dokumen || {});
      setActiveTab('ringkasan');
    }
  }, [siswa, isOpen]);

  if (!isOpen || !siswa) return null;

  // File to Base64 reader helper
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'foto' | 'ktp' | 'kk' | 'akte'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size max 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ Ukuran file melebihi batas 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const nowStr = new Date().toISOString();

      if (type === 'foto') {
        setDokumen((prev) => ({
          ...prev,
          foto: base64,
          fotoNama: file.name,
          fotoUpdatedAt: nowStr,
        }));
        showToast('✓ Pas foto santri berhasil diunggah.');
      } else if (type === 'ktp') {
        setDokumen((prev) => ({
          ...prev,
          ktp: base64,
          ktpNama: file.name,
          ktpUpdatedAt: nowStr,
        }));
        showToast('✓ Berkas KTP Orang Tua berhasil diunggah.');
      } else if (type === 'kk') {
        setDokumen((prev) => ({
          ...prev,
          kk: base64,
          kkNama: file.name,
          kkUpdatedAt: nowStr,
        }));
        showToast('✓ Berkas Kartu Keluarga (KK) berhasil diunggah.');
      } else if (type === 'akte') {
        setDokumen((prev) => ({
          ...prev,
          akte: base64,
          akteNama: file.name,
          akteUpdatedAt: nowStr,
        }));
        showToast('✓ Berkas Akta Kelahiran berhasil diunggah.');
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleDownload = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Mengunduh berkas: ${fileName}`);
  };

  const handleSaveAll = () => {
    onSave(siswa.id, dokumen);
    showToast(`✓ Seluruh berkas santri ${siswa.nama} berhasil disimpan.`);
    onClose();
  };

  // Document fulfillment calculation
  const hasFoto = Boolean(dokumen.foto);
  const hasKtp = Boolean(dokumen.ktp || dokumen.ktpNomor);
  const hasKk = Boolean(dokumen.kk || dokumen.kkNomor);
  const hasAkte = Boolean(dokumen.akte || dokumen.akteNomor);

  const completedCount = [hasFoto, hasKtp, hasKk, hasAkte].filter(Boolean).length;
  const percentage = Math.round((completedCount / 4) * 100);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-mono-custom animate-in fade-in duration-150">
        <div className="bg-[#fdfcf9] border-2 border-[#1a1c1a] shadow-[8px_8px_0px_#1a1c1a] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-[#1a1c1a]">
          
          {/* Header */}
          <div className="bg-[#1a1c1a] text-[#fdfcf9] px-4 py-3 sm:px-6 flex items-center justify-between border-b-2 border-[#1a1c1a]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-none border border-white/20 bg-white/10 flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-[#4ade80]" />
              </div>
              <div>
                <div className="text-[10px] tracking-widest text-[#fdfcf9]/70 uppercase font-bold">
                  // KELOLA BERKAS & DOKUMEN SANTRI
                </div>
                <h2 className="font-syne text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                  {siswa.nama} ({siswa.panggilan})
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-white/20 transition-colors text-white"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student Info & Completion Bar */}
          <div className="bg-amber-50/70 border-b-[1.5px] border-[#1a1c1a] px-4 py-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  <strong className="text-[#1a1c1a]/60">NISN:</strong> {siswa.nisn}
                </span>
                <span>
                  <strong className="text-[#1a1c1a]/60">KELAS:</strong> {siswa.kelas}
                </span>
                <span>
                  <strong className="text-[#1a1c1a]/60">KAMAR:</strong> {kamar?.nama || '-'}
                </span>
                <span>
                  <strong className="text-[#1a1c1a]/60">WALI ASUH:</strong> {waliAsuh?.nama || '-'}
                </span>
              </div>

              {/* Progress pill */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-bold">
                  Kelengkapan: {completedCount}/4 ({percentage}%)
                </span>
                <div className="w-24 sm:w-32 h-2.5 bg-gray-200 border border-[#1a1c1a] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      percentage === 100
                        ? 'bg-[#006b54]'
                        : percentage >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b-[1.5px] border-[#1a1c1a] bg-[#1a1c1a]/5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('ringkasan')}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors border-r border-[#1a1c1a]/20 flex items-center gap-1.5 ${
                activeTab === 'ringkasan'
                  ? 'bg-[#fdfcf9] text-[#006b54] border-b-2 border-b-[#006b54] -mb-[1.5px]'
                  : 'hover:bg-black/5 text-[#1a1c1a]/70'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ringkasan Berkas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('foto')}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors border-r border-[#1a1c1a]/20 flex items-center gap-1.5 ${
                activeTab === 'foto'
                  ? 'bg-[#fdfcf9] text-[#006b54] border-b-2 border-b-[#006b54] -mb-[1.5px]'
                  : 'hover:bg-black/5 text-[#1a1c1a]/70'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Foto Santri</span>
              {hasFoto ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ktp')}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors border-r border-[#1a1c1a]/20 flex items-center gap-1.5 ${
                activeTab === 'ktp'
                  ? 'bg-[#fdfcf9] text-[#006b54] border-b-2 border-b-[#006b54] -mb-[1.5px]'
                  : 'hover:bg-black/5 text-[#1a1c1a]/70'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>KTP Orang Tua</span>
              {hasKtp ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('kk')}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors border-r border-[#1a1c1a]/20 flex items-center gap-1.5 ${
                activeTab === 'kk'
                  ? 'bg-[#fdfcf9] text-[#006b54] border-b-2 border-b-[#006b54] -mb-[1.5px]'
                  : 'hover:bg-black/5 text-[#1a1c1a]/70'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Kartu Keluarga (KK)</span>
              {hasKk ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('akte')}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'akte'
                  ? 'bg-[#fdfcf9] text-[#006b54] border-b-2 border-b-[#006b54] -mb-[1.5px]'
                  : 'hover:bg-black/5 text-[#1a1c1a]/70'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Akta Kelahiran</span>
              {hasAkte ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              )}
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* TAB: RINGKASAN */}
            {activeTab === 'ringkasan' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Foto */}
                  <div
                    onClick={() => setActiveTab('foto')}
                    className="p-4 bg-white border-[1.5px] border-[#1a1c1a] shadow-[3px_3px_0px_#1a1c1a] cursor-pointer hover:-translate-y-0.5 transition-transform flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a1c1a]/60">
                          Berkas 1
                        </span>
                        {hasFoto ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Ada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 border border-rose-300">
                            <AlertCircle className="w-3 h-3" /> Belum
                          </span>
                        )}
                      </div>
                      <h4 className="font-syne font-bold text-sm mb-1">Foto Santri</h4>
                      <p className="text-[11px] text-[#1a1c1a]/70 mb-3">
                        Pas foto resmi seragam santri asrama.
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-center h-28 bg-[#1a1c1a]/5 border border-dashed border-[#1a1c1a]/30">
                      {dokumen.foto ? (
                        <img
                          src={dokumen.foto}
                          alt="Foto Santri"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-[#1a1c1a]/40">
                          <User className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <span className="text-[10px]">Klik untuk unggah</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: KTP Orang Tua */}
                  <div
                    onClick={() => setActiveTab('ktp')}
                    className="p-4 bg-white border-[1.5px] border-[#1a1c1a] shadow-[3px_3px_0px_#1a1c1a] cursor-pointer hover:-translate-y-0.5 transition-transform flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a1c1a]/60">
                          Berkas 2
                        </span>
                        {hasKtp ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Ada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 border border-rose-300">
                            <AlertCircle className="w-3 h-3" /> Belum
                          </span>
                        )}
                      </div>
                      <h4 className="font-syne font-bold text-sm mb-1">KTP Orang Tua</h4>
                      <p className="text-[11px] text-[#1a1c1a]/70 mb-3">
                        NIK & berkas scan KTP Ayah / Ibu / Wali.
                      </p>
                    </div>

                    <div className="mt-2 p-2 bg-[#1a1c1a]/5 border border-dashed border-[#1a1c1a]/30 text-[11px] space-y-1">
                      <div>
                        <span className="text-[10px] text-[#1a1c1a]/50 uppercase font-bold block">
                          NIK KTP:
                        </span>
                        <span className="font-bold">
                          {dokumen.ktpNomor || 'Belum diisi'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#1a1c1a]/50 uppercase font-bold block">
                          Berkas Scan:
                        </span>
                        <span>{dokumen.ktp ? '✓ File Terunggah' : '✗ Belum ada berkas'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Kartu Keluarga */}
                  <div
                    onClick={() => setActiveTab('kk')}
                    className="p-4 bg-white border-[1.5px] border-[#1a1c1a] shadow-[3px_3px_0px_#1a1c1a] cursor-pointer hover:-translate-y-0.5 transition-transform flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a1c1a]/60">
                          Berkas 3
                        </span>
                        {hasKk ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Ada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 border border-rose-300">
                            <AlertCircle className="w-3 h-3" /> Belum
                          </span>
                        )}
                      </div>
                      <h4 className="font-syne font-bold text-sm mb-1">Kartu Keluarga</h4>
                      <p className="text-[11px] text-[#1a1c1a]/70 mb-3">
                        Nomor KK & scan lembar Kartu Keluarga.
                      </p>
                    </div>

                    <div className="mt-2 p-2 bg-[#1a1c1a]/5 border border-dashed border-[#1a1c1a]/30 text-[11px] space-y-1">
                      <div>
                        <span className="text-[10px] text-[#1a1c1a]/50 uppercase font-bold block">
                          Nomor KK:
                        </span>
                        <span className="font-bold">
                          {dokumen.kkNomor || 'Belum diisi'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#1a1c1a]/50 uppercase font-bold block">
                          Berkas Scan:
                        </span>
                        <span>{dokumen.kk ? '✓ File Terunggah' : '✗ Belum ada berkas'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Akta Kelahiran */}
                  <div
                    onClick={() => setActiveTab('akte')}
                    className="p-4 bg-white border-[1.5px] border-[#1a1c1a] shadow-[3px_3px_0px_#1a1c1a] cursor-pointer hover:-translate-y-0.5 transition-transform flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a1c1a]/60">
                          Berkas 4
                        </span>
                        {hasAkte ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Ada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 border border-rose-300">
                            <AlertCircle className="w-3 h-3" /> Belum
                          </span>
                        )}
                      </div>
                      <h4 className="font-syne font-bold text-sm mb-1">Akta Kelahiran</h4>
                      <p className="text-[11px] text-[#1a1c1a]/70 mb-3">
                        Nomor registrasi akta & berkas kelahiran.
                      </p>
                    </div>

                    <div className="mt-2 p-2 bg-[#1a1c1a]/5 border border-dashed border-[#1a1c1a]/30 text-[11px] space-y-1">
                      <div>
                        <span className="text-[10px] text-[#1a1c1a]/50 uppercase font-bold block">
                          No. Registrasi:
                        </span>
                        <span className="font-bold">
                          {dokumen.akteNomor || 'Belum diisi'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#1a1c1a]/50 uppercase font-bold block">
                          Berkas Scan:
                        </span>
                        <span>{dokumen.akte ? '✓ File Terunggah' : '✗ Belum ada berkas'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions Box */}
                <div className="p-4 bg-[#f4ebd0]/30 border-[1.5px] border-[#1a1c1a] text-xs space-y-1">
                  <span className="font-bold block text-[#1a1c1a]">
                    💡 Petunjuk Pengelolaan Berkas Administrasi Santri:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[#1a1c1a]/80">
                    <li>
                      Pilih tab menu di atas untuk mengunggah atau mengganti berkas (Foto Santri, KTP Orang Tua, KK, Akta Kelahiran).
                    </li>
                    <li>
                      Format berkas yang didukung: <strong>JPG, JPEG, PNG, WebP</strong> (maksimal 5MB per berkas).
                    </li>
                    <li>
                      Berkas yang diunggah dapat dilihat pratinjaunya secara penuh maupun diunduh sewaktu-waktu oleh pamong/pengelola asrama.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB: FOTO SANTRI */}
            {activeTab === 'foto' && (
              <div className="space-y-4">
                <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Photo Box */}
                    <div className="w-36 h-48 bg-[#1a1c1a]/5 border-2 border-[#1a1c1a] shadow-[3px_3px_0px_#1a1c1a] flex items-center justify-center overflow-hidden relative group shrink-0">
                      {dokumen.foto ? (
                        <>
                          <img
                            src={dokumen.foto}
                            alt="Pas Foto Santri"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewModal({
                                  isOpen: true,
                                  title: `Pas Foto - ${siswa.nama}`,
                                  imageUrl: dokumen.foto!,
                                  fileType: 'image',
                                })
                              }
                              className="p-1.5 bg-white text-[#1a1c1a] hover:bg-emerald-500 hover:text-white"
                              title="Lihat Penuh"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDownload(dokumen.foto!, `Foto_${siswa.nisn}_${siswa.panggilan}.jpg`)
                              }
                              className="p-1.5 bg-white text-[#1a1c1a] hover:bg-emerald-500 hover:text-white"
                              title="Download Foto"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-3 text-[#1a1c1a]/40">
                          <User className="w-12 h-12 mx-auto mb-1" />
                          <span className="text-[10px] font-bold block uppercase">
                            Belum Ada Foto
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Photo Controls */}
                    <div className="space-y-3 flex-1 text-xs">
                      <div>
                        <h3 className="font-syne font-bold text-base text-[#1a1c1a]">
                          Pas Foto Resmi Santri
                        </h3>
                        <p className="text-[11px] text-[#1a1c1a]/70">
                          Gunakan foto santri berseragam asrama Sekolah Rakyat 1 Jepara dengan latar belakang polos.
                        </p>
                      </div>

                      {dokumen.fotoNama && (
                        <div className="text-[11px] font-mono text-[#1a1c1a]/70">
                          Nama berkas: <strong>{dokumen.fotoNama}</strong>
                          {dokumen.fotoUpdatedAt && (
                            <span className="block text-[10px] text-[#1a1c1a]/50">
                              Diperbarui: {new Date(dokumen.fotoUpdatedAt).toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <input
                          ref={fotoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'foto')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fotoInputRef.current?.click()}
                          className="neo-btn-primary inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{dokumen.foto ? 'Ganti Foto' : 'Unggah Foto Santri'}</span>
                        </button>

                        {dokumen.foto && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewModal({
                                  isOpen: true,
                                  title: `Pas Foto - ${siswa.nama}`,
                                  imageUrl: dokumen.foto!,
                                  fileType: 'image',
                                })
                              }
                              className="neo-btn-outline inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Penuh</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDownload(dokumen.foto!, `Foto_${siswa.nisn}_${siswa.panggilan}.jpg`)
                              }
                              className="neo-btn-outline inline-flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Hapus foto santri ini?')) {
                                  setDokumen((prev) => ({
                                    ...prev,
                                    foto: undefined,
                                    fotoNama: undefined,
                                    fotoUpdatedAt: undefined,
                                  }));
                                  showToast('Foto santri dihapus.');
                                }
                              }}
                              className="neo-btn-outline inline-flex items-center gap-1 text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: KTP ORANG TUA */}
            {activeTab === 'ktp' && (
              <div className="space-y-4">
                <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 sm:p-6 space-y-4">
                  <div>
                    <h3 className="font-syne font-bold text-base text-[#1a1c1a]">
                      KTP Orang Tua / Wali Santri
                    </h3>
                    <p className="text-[11px] text-[#1a1c1a]/70">
                      Identitas resmi kependudukan orang tua santri ({siswa.orangTua.namaAyah} / {siswa.orangTua.namaIbu}).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-xs mb-1">
                        Nomor Induk Kependudukan (NIK KTP Orang Tua)
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        placeholder="Contoh: 332012xxxxxxxxxx (16 digit)"
                        value={dokumen.ktpNomor || ''}
                        onChange={(e) =>
                          setDokumen({
                            ...dokumen,
                            ktpNomor: e.target.value.replace(/\D/g, ''),
                          })
                        }
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-mono"
                      />
                      <span className="text-[10px] text-[#1a1c1a]/60 block mt-1">
                        * NIK 16 digit sesuai e-KTP kepala keluarga atau orang tua santri.
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-xs mb-1">Nama Pemilik KTP</label>
                      <input
                        type="text"
                        disabled
                        value={`${siswa.orangTua.namaAyah} (Ayah) / ${siswa.orangTua.namaIbu} (Ibu)`}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-gray-100 text-xs text-[#1a1c1a]/70 font-sans"
                      />
                    </div>
                  </div>

                  {/* Upload Box for KTP Scan */}
                  <div className="border-[1.5px] border-[#1a1c1a] p-4 bg-[#fdfcf9] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-xs">// BERKAS SCAN / FOTO E-KTP</span>
                      <div className="flex items-center gap-2">
                        <input
                          ref={ktpInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'ktp')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => ktpInputRef.current?.click()}
                          className="neo-btn-primary text-xs inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{dokumen.ktp ? 'Ganti File KTP' : 'Unggah Scan KTP'}</span>
                        </button>
                      </div>
                    </div>

                    {dokumen.ktp ? (
                      <div className="border border-[#1a1c1a]/30 p-3 bg-white flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-44 h-28 bg-[#1a1c1a]/5 border border-[#1a1c1a] flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={dokumen.ktp}
                            alt="Scan KTP"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="space-y-1.5 text-xs flex-1">
                          <div className="font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Berkas KTP Berhasil Terunggah</span>
                          </div>
                          <div className="text-[11px] text-[#1a1c1a]/70">
                            Nama berkas: <strong>{dokumen.ktpNama || 'Scan_KTP.jpg'}</strong>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewModal({
                                  isOpen: true,
                                  title: `Scan KTP Orang Tua - ${siswa.nama}`,
                                  imageUrl: dokumen.ktp!,
                                  fileType: 'image',
                                })
                              }
                              className="neo-btn-outline text-xs inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Ukuran Penuh</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDownload(
                                  dokumen.ktp!,
                                  `KTP_${siswa.orangTua.namaAyah.replace(/\s+/g, '_')}_${siswa.nisn}.jpg`
                                )
                              }
                              className="neo-btn-outline text-xs inline-flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Hapus berkas KTP ini?')) {
                                  setDokumen((prev) => ({
                                    ...prev,
                                    ktp: undefined,
                                    ktpNama: undefined,
                                    ktpUpdatedAt: undefined,
                                  }));
                                  showToast('Berkas KTP dihapus.');
                                }
                              }}
                              className="neo-btn-outline text-xs text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 border border-dashed border-[#1a1c1a]/30 text-center text-xs text-[#1a1c1a]/60">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-bold">Belum ada file scan KTP orang tua yang diunggah.</p>
                        <p className="text-[11px] mt-1">
                          Klik tombol "Unggah Scan KTP" di atas untuk menambahkan foto/scan e-KTP.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: KARTU KELUARGA (KK) */}
            {activeTab === 'kk' && (
              <div className="space-y-4">
                <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 sm:p-6 space-y-4">
                  <div>
                    <h3 className="font-syne font-bold text-base text-[#1a1c1a]">
                      Kartu Keluarga (KK)
                    </h3>
                    <p className="text-[11px] text-[#1a1c1a]/70">
                      Nomor Kartu Keluarga dan berkas scan KK untuk verifikasi anggota keluarga santri.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-xs mb-1">
                        Nomor Kartu Keluarga (Nomor KK)
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        placeholder="Contoh: 332001xxxxxxxxxx (16 digit)"
                        value={dokumen.kkNomor || ''}
                        onChange={(e) =>
                          setDokumen({
                            ...dokumen,
                            kkNomor: e.target.value.replace(/\D/g, ''),
                          })
                        }
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-mono"
                      />
                      <span className="text-[10px] text-[#1a1c1a]/60 block mt-1">
                        * Nomor Kartu Keluarga 16 digit yang tertera di bagian atas berkas KK.
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-xs mb-1">Alamat Kartu Keluarga</label>
                      <input
                        type="text"
                        disabled
                        value={`${siswa.orangTua.alamat}, ${siswa.orangTua.kotaAsal}`}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-gray-100 text-xs text-[#1a1c1a]/70 font-sans"
                      />
                    </div>
                  </div>

                  {/* Upload Box for KK Scan */}
                  <div className="border-[1.5px] border-[#1a1c1a] p-4 bg-[#fdfcf9] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-xs">// BERKAS SCAN / FOTO KARTU KELUARGA</span>
                      <div className="flex items-center gap-2">
                        <input
                          ref={kkInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'kk')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => kkInputRef.current?.click()}
                          className="neo-btn-primary text-xs inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{dokumen.kk ? 'Ganti File KK' : 'Unggah Scan KK'}</span>
                        </button>
                      </div>
                    </div>

                    {dokumen.kk ? (
                      <div className="border border-[#1a1c1a]/30 p-3 bg-white flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-44 h-28 bg-[#1a1c1a]/5 border border-[#1a1c1a] flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={dokumen.kk}
                            alt="Scan Kartu Keluarga"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="space-y-1.5 text-xs flex-1">
                          <div className="font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Berkas Kartu Keluarga Terunggah</span>
                          </div>
                          <div className="text-[11px] text-[#1a1c1a]/70">
                            Nama berkas: <strong>{dokumen.kkNama || 'Scan_KK.jpg'}</strong>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewModal({
                                  isOpen: true,
                                  title: `Scan Kartu Keluarga - ${siswa.nama}`,
                                  imageUrl: dokumen.kk!,
                                  fileType: 'image',
                                })
                              }
                              className="neo-btn-outline text-xs inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Ukuran Penuh</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDownload(
                                  dokumen.kk!,
                                  `KK_${siswa.orangTua.namaAyah.replace(/\s+/g, '_')}_${siswa.nisn}.jpg`
                                )
                              }
                              className="neo-btn-outline text-xs inline-flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Hapus berkas KK ini?')) {
                                  setDokumen((prev) => ({
                                    ...prev,
                                    kk: undefined,
                                    kkNama: undefined,
                                    kkUpdatedAt: undefined,
                                  }));
                                  showToast('Berkas KK dihapus.');
                                }
                              }}
                              className="neo-btn-outline text-xs text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 border border-dashed border-[#1a1c1a]/30 text-center text-xs text-[#1a1c1a]/60">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-bold">Belum ada file scan Kartu Keluarga yang diunggah.</p>
                        <p className="text-[11px] mt-1">
                          Klik tombol "Unggah Scan KK" di atas untuk menambahkan berkas KK.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AKTA KELAHIRAN */}
            {activeTab === 'akte' && (
              <div className="space-y-4">
                <div className="bg-white border-[1.5px] border-[#1a1c1a] p-4 sm:p-6 space-y-4">
                  <div>
                    <h3 className="font-syne font-bold text-base text-[#1a1c1a]">
                      Akta Kelahiran (Akte)
                    </h3>
                    <p className="text-[11px] text-[#1a1c1a]/70">
                      Nomor Registrasi Akta Kelahiran resmi dari Dinas Kependudukan dan Catatan Sipil.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-xs mb-1">
                        Nomor Registrasi Akta Kelahiran
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 3320-LT-xxxxxx-xxxx"
                        value={dokumen.akteNomor || ''}
                        onChange={(e) =>
                          setDokumen({
                            ...dokumen,
                            akteNomor: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-mono"
                      />
                      <span className="text-[10px] text-[#1a1c1a]/60 block mt-1">
                        * Nomor registrasi / nomor surat akta kelahiran anak.
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-xs mb-1">Nama Lengkap Santri di Akta</label>
                      <input
                        type="text"
                        disabled
                        value={siswa.nama}
                        className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-gray-100 text-xs text-[#1a1c1a]/70 font-sans"
                      />
                    </div>
                  </div>

                  {/* Upload Box for Akte Scan */}
                  <div className="border-[1.5px] border-[#1a1c1a] p-4 bg-[#fdfcf9] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-xs">// BERKAS SCAN / FOTO AKTA KELAHIRAN</span>
                      <div className="flex items-center gap-2">
                        <input
                          ref={akteInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'akte')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => akteInputRef.current?.click()}
                          className="neo-btn-primary text-xs inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{dokumen.akte ? 'Ganti File Akta' : 'Unggah Scan Akta'}</span>
                        </button>
                      </div>
                    </div>

                    {dokumen.akte ? (
                      <div className="border border-[#1a1c1a]/30 p-3 bg-white flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-44 h-28 bg-[#1a1c1a]/5 border border-[#1a1c1a] flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={dokumen.akte}
                            alt="Scan Akta Kelahiran"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="space-y-1.5 text-xs flex-1">
                          <div className="font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Berkas Akta Kelahiran Terunggah</span>
                          </div>
                          <div className="text-[11px] text-[#1a1c1a]/70">
                            Nama berkas: <strong>{dokumen.akteNama || 'Scan_Akta_Kelahiran.jpg'}</strong>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewModal({
                                  isOpen: true,
                                  title: `Scan Akta Kelahiran - ${siswa.nama}`,
                                  imageUrl: dokumen.akte!,
                                  fileType: 'image',
                                })
                              }
                              className="neo-btn-outline text-xs inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Ukuran Penuh</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDownload(
                                  dokumen.akte!,
                                  `Akta_Kelahiran_${siswa.nisn}_${siswa.panggilan}.jpg`
                                )
                              }
                              className="neo-btn-outline text-xs inline-flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Hapus berkas akta kelahiran ini?')) {
                                  setDokumen((prev) => ({
                                    ...prev,
                                    akte: undefined,
                                    akteNama: undefined,
                                    akteUpdatedAt: undefined,
                                  }));
                                  showToast('Berkas akta kelahiran dihapus.');
                                }
                              }}
                              className="neo-btn-outline text-xs text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 border border-dashed border-[#1a1c1a]/30 text-center text-xs text-[#1a1c1a]/60">
                        <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-bold">Belum ada file scan Akta Kelahiran yang diunggah.</p>
                        <p className="text-[11px] mt-1">
                          Klik tombol "Unggah Scan Akta" di atas untuk menambahkan berkas akte.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t-[1.5px] border-[#1a1c1a] flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-[#1a1c1a]/70 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#006b54]"></span>
              <span>
                Status: {completedCount === 4 ? '🟢 Dokumen Lengkap (4/4)' : `🟡 ${completedCount}/4 Berkas Terpenuhi`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="neo-btn-outline"
              >
                TUTUP
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                className="neo-btn-primary"
              >
                SIMPAN SEMUA BERKAS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#fdfcf9] border-2 border-[#1a1c1a] shadow-[8px_8px_0px_#000] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#1a1c1a] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="font-mono text-xs font-bold truncate">
                {previewModal.title}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDownload(previewModal.imageUrl, `${previewModal.title.replace(/\s+/g, '_')}.jpg`)
                  }
                  className="px-2 py-1 text-[11px] bg-white/20 hover:bg-[#006b54] text-white transition-colors"
                  title="Unduh Berkas"
                >
                  <Download className="w-3.5 h-3.5 inline mr-1" />
                  Unduh
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModal({ ...previewModal, isOpen: false })}
                  className="p-1 text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-900 flex-1 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={previewModal.imageUrl}
                alt={previewModal.title}
                className="max-h-full max-w-full object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
