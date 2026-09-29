import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Siswa } from '../../types';
import {
  parseSiswaExcel,
  generateSiswaTemplateExcel,
  ParseResult,
} from '../../utils/excelUtils';
import { Modal } from '../common/Modal';

interface ImportSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (stats: { added: number; updated: number }) => void;
}

export const ImportSiswaModal: React.FC<ImportSiswaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { kamarList, waliAsuhList, importSiswaList } = useApp();

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importMode, setImportMode] = useState<'upsert' | 'append' | 'replace'>('upsert');
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [importStats, setImportStats] = useState<{ added: number; updated: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseResult(null);

    try {
      const res = await parseSiswaExcel(selectedFile, kamarList, waliAsuhList);
      setParseResult(res);
    } catch (err: any) {
      setParseResult({
        data: [],
        totalRows: 0,
        validRows: 0,
        errors: [`Gagal membaca berkas: ${err?.message || 'Format tidak valid'}`],
        warnings: [],
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileChange(droppedFile);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteImport = () => {
    if (!parseResult || parseResult.data.length === 0) return;

    const stats = importSiswaList(parseResult.data, importMode);
    setImportStats(stats);
    setIsSuccessModal(true);
    if (onSuccess) onSuccess(stats);
  };

  const handleCloseAll = () => {
    setIsSuccessModal(false);
    handleReset();
    onClose();
  };

  const getKamarName = (id: string) => kamarList.find((k) => k.id === id)?.nama || '-';
  const getWaliName = (id: string) => waliAsuhList.find((w) => w.id === id)?.nama || '-';

  return (
    <>
      <Modal
        isOpen={isOpen && !isSuccessModal}
        onClose={onClose}
        title="IMPORT DATA SISWA (EXCEL & CSV)"
        subtitle="Unggah berkas spreadsheet .xlsx, .xls, atau .csv santri Sekolah Rakyat 1 Jepara"
        maxWidth="2xl"
      >
        <div className="space-y-5 font-mono-custom text-xs">
          {/* Top Banner & Template Download */}
          <div className="p-3.5 bg-emerald-50 border-[1.5px] border-[#006b54] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-[#006b54] text-xs uppercase flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                Format Excel Resmi & Terstandar
              </div>
              <p className="text-[11px] text-[#1a1c1a]/70 mt-0.5">
                Unduh template berkas untuk panduan kolom (NISN, Nama, Kamar, Wali Asuh, Kontak).
              </p>
            </div>
            <button
              type="button"
              onClick={() => generateSiswaTemplateExcel(kamarList, waliAsuhList)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#fdfcf9] hover:bg-[#006b54] hover:text-white text-[#1a1c1a] border-[1.5px] border-[#1a1c1a] font-bold text-xs shadow-[2px_2px_0px_#1a1c1a] transition-all shrink-0 uppercase tracking-wider active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </button>
          </div>

          {/* File Upload Dropzone */}
          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#1a1c1a] p-8 text-center bg-[#1a1c1a]/[0.02] hover:bg-[#1a1c1a]/[0.05] cursor-pointer transition-colors rounded-none"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto bg-[#1a1c1a] text-[#fdfcf9] flex items-center justify-center border border-[#1a1c1a] mb-3 shadow-[2.5px_2.5px_0px_#006b54]">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-syne font-bold text-sm text-[#1a1c1a]">
                Klik atau Seret Berkas Excel ke Sini
              </p>
              <p className="text-[11px] text-[#1a1c1a]/60 mt-1">
                Mendukung berkas Excel (.xlsx, .xls) dan CSV
              </p>
            </div>
          ) : (
            <div className="p-3 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] flex items-center justify-between gap-3 shadow-[2.5px_2.5px_0px_#1a1c1a]">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-9 h-9 bg-[#006b54] text-white flex items-center justify-center shrink-0 border border-[#1a1c1a]">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-xs text-[#1a1c1a] truncate">{file.name}</div>
                  <div className="text-[10px] text-[#1a1c1a]/60">
                    {(file.size / 1024).toFixed(1)} KB · Siap diimpor
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-[11px] border border-[#1a1c1a] bg-[#1a1c1a]/5 hover:bg-[#1a1c1a]/10 font-bold uppercase"
                >
                  Ganti File
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1 border border-[#1a1c1a] hover:bg-rose-100 text-rose-700"
                  title="Batalkan file"
                >
                  <X className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Parsing State */}
          {isParsing && (
            <div className="p-4 border-[1.5px] border-[#1a1c1a] bg-amber-50 text-center flex items-center justify-center gap-2 text-xs font-bold text-amber-900">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-800" />
              Menganalisis dan memvalidasi lembar kerja Excel...
            </div>
          )}

          {/* Validation & Preview Result */}
          {parseResult && !isParsing && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a]">
                  <span className="text-[10px] text-[#1a1c1a]/60 block uppercase">Total Baris</span>
                  <span className="font-bold text-base text-[#1a1c1a]">{parseResult.totalRows}</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border-[1.5px] border-[#006b54]">
                  <span className="text-[10px] text-[#006b54] block uppercase font-bold">Siap Diimpor</span>
                  <span className="font-bold text-base text-[#006b54]">{parseResult.validRows} Siswa</span>
                </div>
                <div className="p-2.5 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-[#1a1c1a]/60 block uppercase">Peringatan / Catatan</span>
                  <span className="font-bold text-base text-[#1a1c1a]">
                    {parseResult.warnings.length} Catatan
                  </span>
                </div>
              </div>

              {/* Errors list if any */}
              {parseResult.errors.length > 0 && (
                <div className="p-3 bg-rose-50 border-[1.5px] border-rose-500 text-rose-900 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-700">
                    <AlertCircle className="w-4 h-4" />
                    Kendala Validasi Berkas ({parseResult.errors.length}):
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {parseResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings list if any */}
              {parseResult.warnings.length > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-400 text-amber-900 text-[11px] max-h-24 overflow-y-auto">
                  <div className="font-bold flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    Penyesuaian Otomatis ({parseResult.warnings.length}):
                  </div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {parseResult.warnings.slice(0, 5).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {parseResult.warnings.length > 5 && (
                      <li className="font-bold italic">
                        ...dan {parseResult.warnings.length - 5} penyesuaian lainnya.
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Preview Table (First 5 Rows) */}
              {parseResult.validRows > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-xs uppercase text-[#1a1c1a]">
                      // PRATINJAU DATA EXCEL (5 BARIS PERTAMA)
                    </span>
                    <span className="text-[10px] text-[#1a1c1a]/60">
                      Menampilkan {Math.min(parseResult.data.length, 5)} dari {parseResult.data.length} siswa
                    </span>
                  </div>

                  <div className="overflow-x-auto border-[1.5px] border-[#1a1c1a] bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#1a1c1a] text-[#fdfcf9] font-bold text-[10px] uppercase">
                        <tr>
                          <th className="p-2">NISN</th>
                          <th className="p-2">NAMA LENGKAP</th>
                          <th className="p-2">L/P</th>
                          <th className="p-2">KELAS</th>
                          <th className="p-2">KAMAR</th>
                          <th className="p-2">WALI ASUH</th>
                          <th className="p-2">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1c1a]/20">
                        {parseResult.data.slice(0, 5).map((s, idx) => (
                          <tr key={idx} className="hover:bg-[#1a1c1a]/5">
                            <td className="p-2 font-mono text-[10px] font-bold">{s.nisn}</td>
                            <td className="p-2 font-bold font-syne">{s.nama}</td>
                            <td className="p-2">{s.jenisKelamin}</td>
                            <td className="p-2">{s.kelas}</td>
                            <td className="p-2 font-medium">{getKamarName(s.kamarId)}</td>
                            <td className="p-2 text-[#006b54] font-medium">{getWaliName(s.waliAsuhId)}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 border border-[#1a1c1a] text-[9px] font-bold">
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mode Selection */}
              {parseResult.validRows > 0 && (
                <div className="p-3 bg-[#1a1c1a]/5 border-[1.5px] border-[#1a1c1a] space-y-2">
                  <span className="font-bold text-xs uppercase text-[#1a1c1a] block">
                    PILIH METODE IMPORT DATA:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label
                      className={`p-2.5 border-[1.5px] cursor-pointer flex flex-col justify-between transition-all ${
                        importMode === 'upsert'
                          ? 'border-[#006b54] bg-emerald-50 shadow-[2px_2px_0px_#006b54]'
                          : 'border-[#1a1c1a] bg-[#fdfcf9]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="importMode"
                          value="upsert"
                          checked={importMode === 'upsert'}
                          onChange={() => setImportMode('upsert')}
                          className="accent-[#006b54]"
                        />
                        <span className="font-bold text-xs text-[#1a1c1a]">Perbarui & Tambah</span>
                      </div>
                      <p className="text-[10px] text-[#1a1c1a]/70 mt-1 pl-5">
                        (Rekomendasi) Update siswa jika NISN sama, tambah jika baru.
                      </p>
                    </label>

                    <label
                      className={`p-2.5 border-[1.5px] cursor-pointer flex flex-col justify-between transition-all ${
                        importMode === 'append'
                          ? 'border-[#006b54] bg-emerald-50 shadow-[2px_2px_0px_#006b54]'
                          : 'border-[#1a1c1a] bg-[#fdfcf9]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="accent-[#006b54]"
                        />
                        <span className="font-bold text-xs text-[#1a1c1a]">Tambahkan Semua</span>
                      </div>
                      <p className="text-[10px] text-[#1a1c1a]/70 mt-1 pl-5">
                        Tambahkan semua baris Excel ke daftar santri yang sudah ada.
                      </p>
                    </label>

                    <label
                      className={`p-2.5 border-[1.5px] cursor-pointer flex flex-col justify-between transition-all ${
                        importMode === 'replace'
                          ? 'border-rose-600 bg-rose-50 shadow-[2px_2px_0px_#e11d48]'
                          : 'border-[#1a1c1a] bg-[#fdfcf9]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="accent-rose-600"
                        />
                        <span className="font-bold text-xs text-rose-700">Timpa Seluruh Data</span>
                      </div>
                      <p className="text-[10px] text-[#1a1c1a]/70 mt-1 pl-5">
                        Hapus data santri lama dan gantikan penuh dengan berkas ini.
                      </p>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="pt-3 border-t-[1.5px] border-[#1a1c1a] flex flex-col sm:flex-row justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-[1.5px] border-[#1a1c1a] bg-[#fdfcf9] hover:bg-[#1a1c1a]/5 text-[#1a1c1a] font-bold uppercase tracking-wider text-xs"
            >
              BATAL
            </button>

            <button
              type="button"
              disabled={!parseResult || parseResult.validRows === 0}
              onClick={handleExecuteImport}
              className={`px-5 py-2 border-[1.5px] border-[#1a1c1a] font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-[2.5px_2.5px_0px_#1a1c1a] transition-all ${
                !parseResult || parseResult.validRows === 0
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                  : 'bg-[#006b54] hover:bg-[#005240] text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              IMPORT {parseResult?.validRows ? `${parseResult.validRows} SISWA` : 'SEKARANG'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Success Notification Modal */}
      <Modal
        isOpen={isSuccessModal}
        onClose={handleCloseAll}
        title="IMPORT EXCEL BERHASIL"
        subtitle="Data Santri Sekolah Rakyat 1 Jepara Diperbarui"
        maxWidth="sm"
      >
        <div className="text-center py-4 space-y-4 font-mono-custom text-xs">
          <div className="w-14 h-14 mx-auto bg-emerald-100 text-[#006b54] border-[1.5px] border-[#006b54] flex items-center justify-center shadow-[3px_3px_0px_#1a1c1a]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-syne font-bold text-lg text-[#1a1c1a]">
              Proses Impor Selesai!
            </h3>
            <p className="text-[#1a1c1a]/70 text-xs mt-1">
              Data dari lembar Excel telah tersimpan ke dalam sistem SI-PASRA.
            </p>
          </div>

          {importStats && (
            <div className="p-3 bg-[#1a1c1a]/5 border-[1.5px] border-[#1a1c1a] text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#1a1c1a]/60">SANTRI BARU DITAMBAHKAN:</span>
                <span className="font-bold text-[#006b54]">{importStats.added} Anak</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1a1c1a]/60">DATA SANTRI DIPERBARUI:</span>
                <span className="font-bold text-[#1a1c1a]">{importStats.updated} Anak</span>
              </div>
              <div className="flex justify-between border-t border-[#1a1c1a]/20 pt-1">
                <span className="text-[#1a1c1a]/60">MODE PENYIMPANAN:</span>
                <span className="font-bold uppercase text-[#006b54]">{importMode}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleCloseAll}
            className="w-full py-2.5 bg-[#006b54] hover:bg-[#005240] text-white font-bold text-xs uppercase tracking-wider border-[1.5px] border-[#1a1c1a] shadow-[2.5px_2.5px_0px_#1a1c1a] transition-all"
          >
            LIHAT DATA SANTRI TERBARU
          </button>
        </div>
      </Modal>
    </>
  );
};
