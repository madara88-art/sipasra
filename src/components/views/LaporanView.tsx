import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  Calendar,
  Award,
  Sparkles,
  TrendingUp,
  Scale,
  HeartPulse,
  CheckCircle2,
  RotateCcw,
  Edit3,
  User,
  ShieldCheck,
  Send,
  FileDown,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ASPEK_LIST,
  calculateAutoRaport,
  getPredikat,
  getPredikatBadgeClass,
} from '../../utils/raportUtils';
import {
  RadarChart8Aspects,
  BarChart8Aspects,
} from './raport/RaportCharts';
import {
  DailyPrayerAttendanceChart,
  WeeklyCleanlinessComparisonChart,
  MonthlyCharacterGrowthChart,
} from './raport/LaporanPeriodikCharts';
import { RaportPengasuhan, Siswa } from '../../types';

type LaporanTab = 'harian' | 'mingguan' | 'bulanan' | 'raport' | 'cetak';
type PrintDocType = 'raport' | 'harian' | 'mingguan' | 'bulanan' | 'rekap-santri';
type PaperSize = 'A4' | 'F4' | 'Letter';
type PaperOrientation = 'portrait' | 'landscape';

export const LaporanView: React.FC = () => {
  const {
    siswaList,
    kamarList,
    waliAsuhList,
    kebersihanList,
    ibadahList,
    kesehatanList,
    konselingList,
    pelanggaranList,
    perkembanganList,
    getSiswa,
    getKamar,
    getWaliAsuh,
  } = useApp();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<LaporanTab>('raport');

  // Daily report controls
  const [selectedDateHarian, setSelectedDateHarian] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Weekly report controls
  const [selectedPekan, setSelectedPekan] = useState<string>('Pekan 3 (15 - 21 September 2026)');

  // Monthly report controls
  const [selectedBulan, setSelectedBulan] = useState<string>('September 2026');

  // Raport controls
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>(siswaList[0]?.id || '');
  const [skalaNilai, setSkalaNilai] = useState<'1-4' | '1-10'>('1-4');
  const [isEditRaportOpen, setIsEditRaportOpen] = useState(false);
  const [isEditTtdOpen, setIsEditTtdOpen] = useState(false);
  const [copiedWA, setCopiedWA] = useState(false);

  const SIGNATURE_STORAGE_KEY = 'sipasra_raport_signatures_v1';

  const loadSavedSignatures = () => {
    try {
      const raw = localStorage.getItem(SIGNATURE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const savedSig = useMemo(() => loadSavedSignatures(), []);

  // Print Submenu States
  const [printDocType, setPrintDocType] = useState<PrintDocType>('raport');
  const [raportPrintMode, setRaportPrintMode] = useState<'single' | 'all'>('single');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [paperOrientation, setPaperOrientation] = useState<PaperOrientation>('portrait');
  const [showKopSurat, setShowKopSurat] = useState(true);
  const [showChartsOnPrint, setShowChartsOnPrint] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);

  const [kepalaSekolahNama, setKepalaSekolahNama] = useState<string>(
    savedSig.kepalaSekolahNama ?? 'Dr. H. Solikhin, M.Pd'
  );
  const [kepalaSekolahNip, setKepalaSekolahNip] = useState<string>(
    savedSig.kepalaSekolahNip ?? '19750810 200003 1 002'
  );
  const [waliAsramaNama, setWaliAsramaNama] = useState<string>(
    savedSig.waliAsramaNama ?? 'Ust. Ahmad Fauzi, S.Pd.I'
  );
  const [waliAsramaNip, setWaliAsramaNip] = useState<string>(
    savedSig.waliAsramaNip ?? '19880412 201201 1 003'
  );
  const [defaultWaliAsuhNama, setDefaultWaliAsuhNama] = useState<string>(
    savedSig.defaultWaliAsuhNama ?? 'Ust. Farid, S.Pd'
  );
  const [customOrangTuaTtd, setCustomOrangTuaTtd] = useState<Record<string, string>>(
    savedSig.customOrangTuaTtd ?? {}
  );
  const [customWaliAsuhTtd, setCustomWaliAsuhTtd] = useState<
    Record<string, { nama?: string; nip?: string }>
  >(savedSig.customWaliAsuhTtd ?? {});

  const [tempatTanggalCetak, setTempatTanggalCetak] = useState<string>(
    savedSig.tempatTanggalCetak ??
      `Jepara, ${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`
  );
  const [printToast, setPrintToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        SIGNATURE_STORAGE_KEY,
        JSON.stringify({
          kepalaSekolahNama,
          kepalaSekolahNip,
          waliAsramaNama,
          waliAsramaNip,
          defaultWaliAsuhNama,
          customOrangTuaTtd,
          customWaliAsuhTtd,
          tempatTanggalCetak,
        })
      );
    } catch {
      // ignore storage quota error
    }
  }, [
    kepalaSekolahNama,
    kepalaSekolahNip,
    waliAsramaNama,
    waliAsramaNip,
    defaultWaliAsuhNama,
    customOrangTuaTtd,
    customWaliAsuhTtd,
    tempatTanggalCetak,
  ]);

  const printSectionRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const ttdEditorRef = useRef<HTMLDivElement>(null);

  // Custom overrides stored in local state for the student report card
  const [customRaportOverrides, setCustomRaportOverrides] = useState<
    Record<string, Partial<RaportPengasuhan>>
  >({});

  const getOrangTuaTtdName = (siswa?: Siswa) => {
    if (!siswa) return '';
    if (customOrangTuaTtd[siswa.id] !== undefined) {
      return customOrangTuaTtd[siswa.id];
    }
    return siswa.orangTua?.namaAyah || siswa.orangTua?.namaIbu || '';
  };

  const getWaliAsuhTtd = (siswa?: Siswa) => {
    if (!siswa) {
      return { nama: defaultWaliAsuhNama, nip: '' };
    }
    const w = getWaliAsuh(siswa.waliAsuhId);
    const custom = customWaliAsuhTtd[siswa.id];
    return {
      nama:
        custom?.nama !== undefined
          ? custom.nama
          : formatWaliName(w) || defaultWaliAsuhNama,
      nip: custom?.nip !== undefined ? custom.nip : w?.nip || '',
    };
  };

  const formatWaliName = (wali?: { nama: string; gelar?: string }) => {
    if (!wali) return '';
    return wali.gelar ? `${wali.nama}, ${wali.gelar}` : wali.nama;
  };

  const selectedSiswa = siswaList.find((s) => s.id === selectedSiswaId) || siswaList[0];
  const selectedKamar = getKamar(selectedSiswa?.kamarId);
  const selectedWali = getWaliAsuh(selectedSiswa?.waliAsuhId);

  const buildRaportForSiswa = (siswa: Siswa): RaportPengasuhan => {
    const kamar = getKamar(siswa.kamarId);
    const wali = getWaliAsuh(siswa.waliAsuhId);
    const base = calculateAutoRaport(
      siswa,
      kamar,
      wali,
      ibadahList,
      kebersihanList,
      kesehatanList,
      konselingList,
      pelanggaranList,
      perkembanganList,
      skalaNilai
    );

    const override = customRaportOverrides[siswa.id];
    if (override) {
      return {
        ...base,
        ...override,
        aspek: {
          ...base.aspek,
          ...(override.aspek || {}),
        },
      };
    }
    return base;
  };

  // Auto-calculated Raport for selected student
  const autoRaport = useMemo(() => {
    if (!selectedSiswa) return null;
    return buildRaportForSiswa(selectedSiswa);
  }, [
    selectedSiswa,
    kamarList,
    waliAsuhList,
    ibadahList,
    kebersihanList,
    kesehatanList,
    konselingList,
    pelanggaranList,
    perkembanganList,
    skalaNilai,
    customRaportOverrides,
  ]);

  // Form state for Editing Raport
  const [editRaportForm, setEditRaportForm] = useState<RaportPengasuhan | null>(null);

  const handleOpenEditRaport = () => {
    if (!autoRaport) return;
    setEditRaportForm(JSON.parse(JSON.stringify(autoRaport)));
    setIsEditRaportOpen(true);
  };

  const handleSaveEditRaport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRaportForm || !selectedSiswa) return;
    setCustomRaportOverrides((prev) => ({
      ...prev,
      [selectedSiswa.id]: editRaportForm,
    }));
    setIsEditRaportOpen(false);
    showPrintNotice(`✓ Penyesuaian nilai raport ${selectedSiswa.nama} berhasil disimpan.`);
  };

  const handleResetToAutoRaport = () => {
    if (!selectedSiswa) return;
    setCustomRaportOverrides((prev) => {
      const next = { ...prev };
      delete next[selectedSiswa.id];
      return next;
    });
    setIsEditRaportOpen(false);
    showPrintNotice(`✓ Nilai raport ${selectedSiswa.nama} dikembalikan ke kalkulasi otomatis.`);
  };

  const showPrintNotice = (msg: string) => {
    setPrintToast(msg);
    setTimeout(() => {
      setPrintToast(null);
    }, 5500);
  };

  // -------------------------------------------------------------
  // DATA PULL: LAPORAN HARIAN
  // -------------------------------------------------------------
  const harianIbadah = useMemo(() => {
    const list = ibadahList.filter((i) => i.tanggal === selectedDateHarian);
    if (list.length === 0) {
      return {
        subuh: 0,
        dhuha: 0,
        duhur: 0,
        ashar: 0,
        maghrib: 0,
        isya: 0,
        diniyah: 0,
      };
    }
    const countTotal = list.length;
    const getPct = (key: string) => {
      const hadir = list.filter((i) => (i as any)[key] === 'Melaksanakan').length;
      return Math.round((hadir / countTotal) * 100);
    };

    return {
      subuh: getPct('subuh'),
      dhuha: getPct('dhuha'),
      duhur: getPct('duhur'),
      ashar: getPct('ashar'),
      maghrib: getPct('maghrib'),
      isya: getPct('isya'),
      diniyah: getPct('diniyah'),
    };
  }, [ibadahList, selectedDateHarian]);

  const harianKesehatan = useMemo(() => {
    return kesehatanList.filter(
      (k) =>
        k.tanggal === selectedDateHarian ||
        k.status === 'Dalam Perawatan' ||
        k.status === 'Observasi'
    );
  }, [kesehatanList, selectedDateHarian]);

  const harianPelanggaran = useMemo(() => {
    return pelanggaranList.filter((p) => p.tanggal === selectedDateHarian);
  }, [pelanggaranList, selectedDateHarian]);

  // -------------------------------------------------------------
  // DATA PULL: LAPORAN MINGGUAN
  // -------------------------------------------------------------
  const weeklyKamarRanking = useMemo(() => {
    return kamarList
      .map((k) => ({
        nama: k.nama,
        score: k.nilaiKebersihan,
        gedung: k.gedung,
      }))
      .sort((a, b) => b.score - a.score);
  }, [kamarList]);

  // -------------------------------------------------------------
  // DATA PULL: LAPORAN BULANAN
  // -------------------------------------------------------------
  const monthlyStats = useMemo(() => {
    let sangatBaik = 0;
    let berkembang = 0;
    let stabil = 0;
    let perluPendampingan = 0;
    let menurun = 0;

    perkembanganList.forEach((p) => {
      const st = p.kemandirian?.status || '📈 Berkembang';
      if (st.includes('Sangat Baik')) sangatBaik++;
      else if (st.includes('Berkembang')) berkembang++;
      else if (st.includes('Stabil')) stabil++;
      else if (st.includes('Perlu Pendampingan')) perluPendampingan++;
      else if (st.includes('Menurun')) menurun++;
    });

    if (perkembanganList.length === 0 && siswaList.length > 0) {
      sangatBaik = Math.round(siswaList.length * 0.35);
      berkembang = Math.round(siswaList.length * 0.45);
      stabil = Math.round(siswaList.length * 0.15);
      perluPendampingan = Math.max(0, siswaList.length - (sangatBaik + berkembang + stabil));
    }

    return {
      sangatBaik,
      berkembang,
      stabil,
      perluPendampingan,
      menurun,
    };
  }, [perkembanganList, siswaList]);

  // -------------------------------------------------------------
  // PRINT & EXPORT ENGINE
  // -------------------------------------------------------------
  const getPageCssSize = () => {
    const sizeSpec =
      paperSize === 'F4'
        ? '215mm 330mm'
        : paperSize === 'Letter'
        ? 'letter'
        : 'A4';
    return `${sizeSpec} ${paperOrientation}`;
  };

  const getDocumentTitle = () => {
    switch (printDocType) {
      case 'raport':
        return raportPrintMode === 'all'
          ? `Raport_Pengasuhan_Semua_Santri_${new Date().toISOString().split('T')[0]}`
          : `Raport_Pengasuhan_${(selectedSiswa?.nama || 'Santri').replace(/\s+/g, '_')}`;
      case 'harian':
        return `Laporan_Harian_Asrama_${selectedDateHarian}`;
      case 'mingguan':
        return `Laporan_Mingguan_Asrama_${selectedPekan.replace(/[^a-zA-Z0-9]+/g, '_')}`;
      case 'bulanan':
        return `Laporan_Bulanan_Asrama_${selectedBulan.replace(/\s+/g, '_')}`;
      case 'rekap-santri':
        return `Rekap_Santri_Dan_Kamar_${new Date().toISOString().split('T')[0]}`;
    }
  };

  const buildStandalonePrintHtml = (contentHtml: string, includeToolbar: boolean) => {
    const styleNodes = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((el) => el.outerHTML)
      .join('\n');

    const toolbarHtml = includeToolbar
      ? `
      <div class="no-print" style="position:sticky;top:0;z-index:50;background:#1a1c1a;color:#fdfcf9;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-family:monospace;border-bottom:2px solid #006b54;">
        <div>
          <strong style="font-size:13px;">PRATINJAU CETAK — SI-PASRA SEKOLAH RAKYAT 1 JEPARA</strong>
          <div style="font-size:11px;opacity:0.75;">Ukuran: ${paperSize} (${paperOrientation.toUpperCase()}) · Klik tombol di kanan untuk mencetak atau simpan sebagai PDF</div>
        </div>
        <button onclick="window.print()" style="background:#006b54;color:#fff;border:1.5px solid #fff;padding:8px 16px;font-weight:bold;font-size:12px;cursor:pointer;text-transform:uppercase;">
          🖨️ CETAK / SIMPAN PDF
        </button>
      </div>`
      : '';

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${getDocumentTitle()}</title>
  ${styleNodes}
  <style>
    @page {
      size: ${getPageCssSize()};
      margin: 12mm;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }
    body {
      background: ${includeToolbar ? '#f3f2ee' : '#ffffff'} !important;
      color: #1a1c1a !important;
      margin: 0;
      padding: 0;
    }
    .print-sheet-wrapper {
      max-width: ${paperOrientation === 'landscape' ? '280mm' : '200mm'};
      margin: ${includeToolbar ? '20px auto' : '0 auto'};
      background: #ffffff;
      padding: ${includeToolbar ? '20px' : '0'};
      ${includeToolbar ? 'border: 1.5px solid #1a1c1a;' : ''}
    }
    @media print {
      body {
        background: #ffffff !important;
      }
      .no-print {
        display: none !important;
      }
      .print-sheet-wrapper {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
      }
      .neo-shadow, .neo-shadow-sm, .neo-shadow-md {
        box-shadow: none !important;
      }
      .print-page-break {
        page-break-after: always;
        break-after: page;
      }
      .print-avoid-break {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${toolbarHtml}
  <div class="print-sheet-wrapper">
    ${contentHtml}
  </div>
</body>
</html>`;
  };

  const handleOpenPrintSubmenu = (defaultType?: PrintDocType) => {
    if (defaultType) {
      setPrintDocType(defaultType);
    } else if (activeTab !== 'cetak') {
      setPrintDocType(activeTab);
    }
    setActiveTab('cetak');
    setTimeout(() => {
      printSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleExecutePrint = () => {
    const contentEl = printAreaRef.current;
    if (!contentEl) {
      try {
        window.print();
      } catch {
        showPrintNotice(
          'Gunakan tombol Unduh Siap Cetak (.HTML) untuk mencetak dari tab browser baru.'
        );
      }
      return;
    }

    const htmlString = buildStandalonePrintHtml(contentEl.innerHTML, false);
    let iframePrinted = false;

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlString);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            iframePrinted = true;
          } catch {
            try {
              window.print();
            } catch {
              // handled by notice below
            }
          } finally {
            setTimeout(() => {
              if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
              }
            }, 1500);
          }
        }, 250);
      }
    } catch {
      try {
        window.print();
      } catch {
        // handled by notice below
      }
    }

    showPrintNotice(
      iframePrinted
        ? '✓ Perintah cetak dikirim. Jika dialog cetak tidak muncul pada preview iframe, klik "Unduh Siap Cetak (.HTML)" lalu cetak di browser.'
        : '✓ Menyiapkan dialog cetak... Jika browser preview membatasi cetak langsung, klik "Unduh Siap Cetak (.HTML)" atau tekan Ctrl+P / Cmd+P.'
    );
  };

  const handleDownloadPrintableHtml = () => {
    const contentEl = printAreaRef.current;
    if (!contentEl) return;

    const fullHtml = buildStandalonePrintHtml(contentEl.innerHTML, true);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getDocumentTitle()}.html`;
    link.click();
    URL.revokeObjectURL(url);
    showPrintNotice(
      `✓ File "${getDocumentTitle()}.html" berhasil diunduh. Buka file untuk langsung mencetak atau simpan PDF.`
    );
  };

  const handleDownloadWordDoc = () => {
    const contentEl = printAreaRef.current;
    if (!contentEl) return;

    const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40" lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${getDocumentTitle()}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1c1a; font-size: 11pt; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; }
    th, td { border: 1px solid #1a1c1a; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #1a1c1a; color: #ffffff; font-weight: bold; }
    h2, h3 { margin: 4px 0; }
    .no-print { display: none; }
  </style>
</head>
<body>
  ${contentEl.innerHTML}
</body>
</html>`;

    const blob = new Blob(['\ufeff', wordHtml], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getDocumentTitle()}.doc`;
    link.click();
    URL.revokeObjectURL(url);
    showPrintNotice(`✓ Dokumen Word "${getDocumentTitle()}.doc" berhasil diunduh.`);
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const backupData = {
      app: 'SI-PASRA (Sistem Pengasuhan Sekolah Rakyat 1 Jepara)',
      exportDate: new Date().toISOString(),
      activeTab,
      selectedSiswa: selectedSiswa?.nama,
      raport: autoRaport,
      siswa: siswaList,
      kamar: kamarList,
      waliAsuh: waliAsuhList,
      kesehatan: kesehatanList,
      ibadah: ibadahList,
      konseling: konselingList,
      pelanggaran: pelanggaranList,
      perkembangan: perkembanganList,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RAPORT_PENGASUHAN_${(selectedSiswa?.nama || 'ASRAMA').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // WhatsApp template generator for parents
  const generateWAText = () => {
    if (!selectedSiswa || !autoRaport) return '';

    return `*RAPORT PERKEMBANGAN PENGASUHAN*
*SEKOLAH RAKYAT TERINTEGRASI 1 JEPARA*
---------------------------------------
*Nama:* ${selectedSiswa.nama} (${selectedSiswa.panggilan})
*Kelas:* ${selectedSiswa.kelas}
*Kamar:* ${selectedKamar?.nama || '-'}
*Periode:* ${autoRaport.periode}
*Wali Asuh:* ${getWaliAsuhTtd(selectedSiswa).nama || '-'}

*CAPAIAN 8 ASPEK PENGASUHAN (Skala ${skalaNilai}):*
1. Kemandirian: ${autoRaport.aspek.kemandirian.nilai.toString().replace('.', ',')} (${autoRaport.aspek.kemandirian.predikat})
2. Kebersihan & Kerapian: ${autoRaport.aspek.kebersihan.nilai.toString().replace('.', ',')} (${autoRaport.aspek.kebersihan.predikat})
3. Ibadah & Adab: ${autoRaport.aspek.ibadah.nilai.toString().replace('.', ',')} (${autoRaport.aspek.ibadah.predikat})
4. Kedisiplinan: ${autoRaport.aspek.kedisiplinan.nilai.toString().replace('.', ',')} (${autoRaport.aspek.kedisiplinan.predikat})
5. Belajar: ${autoRaport.aspek.belajar.nilai.toString().replace('.', ',')} (${autoRaport.aspek.belajar.predikat})
6. Sosial: ${autoRaport.aspek.sosial.nilai.toString().replace('.', ',')} (${autoRaport.aspek.sosial.predikat})
7. Pengendalian Emosi: ${autoRaport.aspek.emosi.nilai.toString().replace('.', ',')} (${autoRaport.aspek.emosi.predikat})
8. Tanggung Jawab: ${autoRaport.aspek.tanggungJawab.nilai.toString().replace('.', ',')} (${autoRaport.aspek.tanggungJawab.predikat})

*Pedoman Predikat:*
${
  skalaNilai === '1-4'
    ? '3.6-4.0: Sangat Baik | 3.0-3.5: Baik | 2.0-2.9: Cukup | 1.0-1.9: Pembinaan Khusus'
    : '8-10: Sangat Baik | 5-7: Baik | 3-5: Cukup | 1-2: Pembinaan Khusus'
}

*Catatan Wali Asuh:*
"${autoRaport.catatanWaliAsuh || 'Ananda menunjukkan perkembangan karakter yang sangat baik di asrama.'}"

*Pesan untuk Ayah/Bunda:*
"${autoRaport.pesanOrangTua || 'Mohon doa dan dukungan Ayah/Bunda untuk pembiasaan mandiri di rumah.'}"

Wassalamu'alaikum Wr. Wb.
*Wali Asuh Sekolah Rakyat 1 Jepara*`;
  };

  const handleCopyWA = () => {
    const text = generateWAText();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  // Helper renderer for single student Raport Sheet (reused in Tab Raport & Tab Cetak)
  const renderRaportDocumentBody = (
    siswa: Siswa,
    raport: RaportPengasuhan,
    opts?: {
      withKop?: boolean;
      withCharts?: boolean;
      withSign?: boolean;
      allowInlineTtdShortcut?: boolean;
      signDateText?: string;
    }
  ) => {
    const k = getKamar(siswa.kamarId);
    const withKop = opts?.withKop ?? true;
    const withCharts = opts?.withCharts ?? true;
    const withSign = opts?.withSign ?? true;
    const orangTuaDisplay = getOrangTuaTtdName(siswa);
    const waliAsuhInfo = getWaliAsuhTtd(siswa);
    const signDateText = opts?.signDateText || tempatTanggalCetak;

    return (
      <div className="space-y-6">
        {withKop && (
          <div className="border-b-2 border-[#1a1c1a] pb-4 text-center">
            <h2 className="text-base sm:text-xl font-syne font-extrabold uppercase tracking-wide text-[#1a1c1a]">
              RAPORT PERKEMBANGAN PENGASUHAN
            </h2>
            <p className="text-xs sm:text-sm font-syne font-bold text-[#006b54] italic mt-0.5">
              Sekolah Rakyat Terintegrasi 1 Jepara
            </p>
            <p className="text-[11px] font-mono-custom text-[#1a1c1a]/70 mt-1">
              Unit Bimbingan Asrama, Karakter, Akhlak & Kemandirian Santri Cilik (SD)
            </p>
            <p className="text-[10px] text-[#1a1c1a]/55 font-sans">
              Jl. Pemuda No. 45, Kecamatan Tahunan, Kabupaten Jepara, Jawa Tengah
            </p>
          </div>
        )}

        {/* Identitas Santri */}
        <div className="bg-[#1a1c1a]/[0.03] border-[1.5px] border-[#1a1c1a] p-4 font-mono-custom text-xs print-avoid-break">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1a1c1a]/70">Nama:</span>
              <strong className="text-sm text-[#1a1c1a] font-syne">{siswa.nama}</strong>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1a1c1a]/70">Kelas:</span>
              <strong className="text-[#1a1c1a]">{siswa.kelas}</strong>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1a1c1a]/70">Kamar:</span>
              <strong className="text-[#1a1c1a]">{k?.nama || '-'}</strong>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1a1c1a]/70">Periode:</span>
              <strong className="text-[#1a1c1a]">{raport.periode}</strong>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <span className="font-bold text-[#1a1c1a]/70">Wali Asuh:</span>
              <strong className="text-[#1a1c1a]">{waliAsuhInfo.nama || '-'}</strong>
            </div>
          </div>
        </div>

        {/* Tabel 8 Aspek */}
        <div className="space-y-2 print-avoid-break">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono-custom font-bold uppercase text-[#1a1c1a]">
              // TABEL CAPAIAN 8 ASPEK PENGASUHAN (SKALA {skalaNilai})
            </span>
            <span className="text-[10px] font-mono-custom text-[#1a1c1a]/60">
              Otomatis dikalkulasi dari aktivitas harian santri
            </span>
          </div>

          <div className="overflow-x-auto border-[1.5px] border-[#1a1c1a]">
            <table className="w-full text-left text-xs font-mono-custom">
              <thead className="bg-[#1a1c1a] text-white font-bold border-b border-[#1a1c1a]">
                <tr>
                  <th className="p-2.5 w-10 text-center">No</th>
                  <th className="p-2.5">Aspek</th>
                  <th className="p-2.5 text-right w-24">Nilai</th>
                  <th className="p-2.5 w-36">Predikat</th>
                  <th className="p-2.5 hidden sm:table-cell">Deskripsi & Catatan Capaian Karakter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1c1a]/20 bg-white">
                {ASPEK_LIST.map((item, idx) => {
                  const data = raport.aspek[item.key] || {
                    nilai: skalaNilai === '1-4' ? 3.5 : 8.5,
                    predikat: 'Baik',
                    catatan: item.deskripsi,
                  };

                  return (
                    <tr key={item.key}>
                      <td className="p-2.5 text-center text-[#1a1c1a]/60 font-bold">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-[#1a1c1a]">
                        <div className="font-sans font-bold text-xs">{item.label}</div>
                        <div className="text-[10px] text-[#1a1c1a]/60 sm:hidden mt-0.5">
                          {data.catatan || item.deskripsi}
                        </div>
                      </td>
                      <td className="p-2.5 text-right font-bold font-syne text-sm text-[#1a1c1a]">
                        {data.nilai.toString().replace('.', ',')}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10.5px] border ${getPredikatBadgeClass(
                            data.predikat
                          )}`}
                        >
                          {data.predikat}
                        </span>
                      </td>
                      <td className="p-2.5 text-xs text-[#1a1c1a]/85 font-sans leading-relaxed hidden sm:table-cell">
                        {data.catatan || item.deskripsi}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pedoman Konversi */}
        <div className="p-3 bg-stone-50 border-[1.5px] border-[#1a1c1a] font-mono-custom text-xs space-y-2 print-avoid-break">
          <span className="font-bold text-[#1a1c1a] block uppercase text-[11px]">
            Pedoman Konversi Nilai & Kategori Predikat:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-950">
              <span className="font-bold block">8 - 10 (atau 3.6 - 4.0)</span>
              <span className="text-[11px]">Sangat Baik</span>
            </div>
            <div className="p-2 bg-teal-50 border border-teal-300 text-teal-950">
              <span className="font-bold block">5 - 7 (atau 3.0 - 3.5)</span>
              <span className="text-[11px]">Baik</span>
            </div>
            <div className="p-2 bg-amber-50 border border-amber-300 text-amber-950">
              <span className="font-bold block">3 - 5 (atau 2.0 - 2.9)</span>
              <span className="text-[11px]">Cukup</span>
            </div>
            <div className="p-2 bg-rose-50 border border-rose-300 text-rose-950">
              <span className="font-bold block">1 - 2 (atau 1.0 - 1.9)</span>
              <span className="text-[11px]">Pembinaan Khusus</span>
            </div>
          </div>
        </div>

        {/* Diagram Radar & Batang */}
        {withCharts && (
          <div className="pt-2 print-avoid-break">
            <div className="mb-2">
              <span className="text-xs font-mono-custom font-bold uppercase text-[#1a1c1a]">
                // VISUALISASI DIAGRAM PERKEMBANGAN 8 ASPEK PENGASUHAN
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              <div className="md:col-span-6 flex">
                <RadarChart8Aspects
                  aspekData={raport.aspek}
                  skala={skalaNilai}
                  size={380}
                />
              </div>
              <div className="md:col-span-6 flex flex-col">
                <BarChart8Aspects aspekData={raport.aspek} skala={skalaNilai} />
              </div>
            </div>
          </div>
        )}

        {/* Catatan Evaluasi Wali Asuh & Pesan Orang Tua */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans print-avoid-break">
          <div className="p-4 bg-white border border-[#1a1c1a]">
            <strong className="font-mono-custom text-[11px] uppercase text-[#1a1c1a] mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#006b54]" />
              Catatan Evaluasi Pamong / Wali Asuh
            </strong>
            <p className="text-[#1a1c1a]/85 leading-relaxed italic bg-stone-50 p-2.5 border-l-2 border-[#006b54]">
              "{raport.catatanWaliAsuh}"
            </p>
          </div>

          <div className="p-4 bg-white border border-[#1a1c1a]">
            <strong className="font-mono-custom text-[11px] uppercase text-[#1a1c1a] mb-1.5 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-amber-700" />
              Pesan Untuk Ayah / Bunda
            </strong>
            <p className="text-[#1a1c1a]/85 leading-relaxed italic bg-amber-50/70 p-2.5 border-l-2 border-amber-600">
              "{raport.pesanOrangTua}"
            </p>
          </div>
        </div>

        {/* Kolom Tanda Tangan Resmi: Orang Tua/Wali, Wali Asuh, Wali Asrama, Mengetahui Kepala Sekolah */}
        {withSign && (
          <div className="pt-6 border-t border-[#1a1c1a]/20 space-y-4 print-avoid-break">
            {opts?.allowInlineTtdShortcut && (
              <div className="flex items-center justify-between gap-2 no-print">
                <span className="text-[10px] font-mono-custom font-bold uppercase text-[#1a1c1a]/60">
                  // KOLOM TANDA TANGAN RESMI RAPORT
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditTtdOpen(true);
                    setTimeout(() => {
                      ttdEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-amber-50 text-[#1a1c1a] border border-[#1a1c1a] text-[10.5px] font-mono-custom font-bold cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-[#006b54]" />
                  <span>Edit Nama Penandatangan</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-8 gap-y-8 text-center text-xs font-mono-custom">
              {/* 1. Orang Tua / Wali */}
              <div>
                <p className="text-[#1a1c1a]/70">&nbsp;</p>
                <p className="font-bold text-[#1a1c1a]">Orang Tua / Wali,</p>
                <div className="h-14" />
                <p className="font-bold underline text-[#1a1c1a]">
                  {orangTuaDisplay ? `(${orangTuaDisplay})` : '(......................................)'}
                </p>
                <p className="text-[10px] text-[#1a1c1a]/60">Orang Tua / Wali Santri</p>
              </div>

              {/* 2. Wali Asuh */}
              <div>
                <p className="text-[#1a1c1a]/70">{signDateText}</p>
                <p className="font-bold text-[#1a1c1a]">Wali Asuh,</p>
                <div className="h-14" />
                <p className="font-bold underline text-[#1a1c1a]">
                  {waliAsuhInfo.nama || '......................................'}
                </p>
                {waliAsuhInfo.nip && (
                  <p className="text-[10px] text-[#1a1c1a]/60">NIP. {waliAsuhInfo.nip}</p>
                )}
              </div>

              {/* 3. Wali Asrama */}
              <div>
                <p className="text-[#1a1c1a]/70">&nbsp;</p>
                <p className="font-bold text-[#1a1c1a]">Wali Asrama,</p>
                <div className="h-14" />
                <p className="font-bold underline text-[#1a1c1a]">
                  {waliAsramaNama || '......................................'}
                </p>
                {waliAsramaNip && (
                  <p className="text-[10px] text-[#1a1c1a]/60">NIP. {waliAsramaNip}</p>
                )}
              </div>

              {/* 4. Mengetahui, Kepala Sekolah */}
              <div>
                <p className="text-[#1a1c1a]/70">Mengetahui,</p>
                <p className="font-bold text-[#1a1c1a]">Kepala Sekolah,</p>
                <div className="h-14" />
                <p className="font-bold underline text-[#1a1c1a]">
                  {kepalaSekolahNama || '......................................'}
                </p>
                {kepalaSekolahNip && (
                  <p className="text-[10px] text-[#1a1c1a]/60">NIP. {kepalaSekolahNip}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Banner Neo-Brutalist */}
      <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-[#006b54] inline-block"></span>
            <span className="text-[10px] font-mono-custom uppercase tracking-wider font-bold text-[#1a1c1a]/60">
              PUSAT LAPORAN & RAPORT PENGASUHAN TERINTEGRASI
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-syne font-bold text-[#1a1c1a] tracking-tight">
            Laporan & Raport Perkembangan Pengasuhan
          </h1>
          <p className="text-xs text-[#1a1c1a]/70 font-sans mt-0.5 max-w-2xl">
            Tersinkronisasi otomatis dari kegiatan harian, kebersihan, ibadah, kesehatan, konseling, perkembangan anak, dan kedisiplinan. Lengkap dengan visual diagram dan sub menu cetak dokumen resmi.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 text-[#1a1c1a] border-[1.5px] border-[#1a1c1a] shadow-[1.5px_1.5px_0px_#1a1c1a] font-bold text-xs transition-all cursor-pointer"
            title="Download JSON Backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor JSON</span>
          </button>
          <button
            type="button"
            onClick={() =>
              activeTab === 'cetak' ? handleExecutePrint() : handleOpenPrintSubmenu()
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] hover:bg-[#005240] text-white border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] font-bold text-xs uppercase transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{activeTab === 'cetak' ? 'Cetak Sekarang' : 'Cetak Dokumen'}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {printToast && (
        <div className="p-3 bg-emerald-50 border-[1.5px] border-[#006b54] text-[#006b54] font-mono-custom text-xs font-bold flex items-center justify-between shadow-[2.5px_2.5px_0px_#1a1c1a] no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#006b54]" />
            <span>{printToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setPrintToast(null)}
            className="text-[10px] uppercase font-bold hover:underline ml-3 cursor-pointer"
          >
            TUTUP
          </button>
        </div>
      )}

      {/* 5 Sub-Menu Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 no-print">
        <button
          type="button"
          onClick={() => setActiveTab('harian')}
          className={`px-3 py-2.5 border-[1.5px] border-[#1a1c1a] text-left transition-all cursor-pointer ${
            activeTab === 'harian'
              ? 'bg-[#1a1c1a] text-[#fdfcf9] font-bold shadow-[2px_2px_0px_#006b54]'
              : 'bg-white text-[#1a1c1a] hover:bg-stone-50 font-semibold shadow-[1.5px_1.5px_0px_#1a1c1a]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-custom opacity-70 uppercase">BAGIAN A</span>
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-syne font-bold mt-1">A. Laporan Harian</div>
          <span className="text-[9.5px] opacity-70 font-sans block">Ibadah, UKS, & Disiplin</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mingguan')}
          className={`px-3 py-2.5 border-[1.5px] border-[#1a1c1a] text-left transition-all cursor-pointer ${
            activeTab === 'mingguan'
              ? 'bg-[#1a1c1a] text-[#fdfcf9] font-bold shadow-[2px_2px_0px_#006b54]'
              : 'bg-white text-[#1a1c1a] hover:bg-stone-50 font-semibold shadow-[1.5px_1.5px_0px_#1a1c1a]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-custom opacity-70 uppercase">BAGIAN B</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-syne font-bold mt-1">B. Laporan Mingguan</div>
          <span className="text-[9.5px] opacity-70 font-sans block">Rating Kamar & Pembinaan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bulanan')}
          className={`px-3 py-2.5 border-[1.5px] border-[#1a1c1a] text-left transition-all cursor-pointer ${
            activeTab === 'bulanan'
              ? 'bg-[#1a1c1a] text-[#fdfcf9] font-bold shadow-[2px_2px_0px_#006b54]'
              : 'bg-white text-[#1a1c1a] hover:bg-stone-50 font-semibold shadow-[1.5px_1.5px_0px_#1a1c1a]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-custom opacity-70 uppercase">BAGIAN C</span>
            <Award className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-syne font-bold mt-1">C. Laporan Bulanan</div>
          <span className="text-[9.5px] opacity-70 font-sans block">Tren Karakter & Evaluasi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('raport')}
          className={`px-3 py-2.5 border-[1.5px] border-[#1a1c1a] text-left transition-all cursor-pointer ${
            activeTab === 'raport'
              ? 'bg-[#006b54] text-white font-bold shadow-[2px_2px_0px_#1a1c1a]'
              : 'bg-white text-[#1a1c1a] hover:bg-emerald-50/60 font-semibold shadow-[1.5px_1.5px_0px_#1a1c1a]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-custom opacity-80 uppercase">RESMI</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-syne font-bold mt-1">D. RAPORT PENGASUHAN</div>
          <span className="text-[9.5px] opacity-80 font-sans block">8 Aspek & Radar Diagram</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenPrintSubmenu()}
          className={`col-span-2 sm:col-span-1 px-3 py-2.5 border-[1.5px] border-[#1a1c1a] text-left transition-all cursor-pointer ${
            activeTab === 'cetak'
              ? 'bg-[#006b54] text-white font-bold shadow-[2px_2px_0px_#1a1c1a]'
              : 'bg-amber-50 text-[#1a1c1a] hover:bg-amber-100 font-semibold shadow-[1.5px_1.5px_0px_#1a1c1a]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-custom opacity-80 uppercase">PUSAT CETAK</span>
            <Printer className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-syne font-bold mt-1">E. CETAK DOKUMEN</div>
          <span className="text-[9.5px] opacity-80 font-sans block">Print, PDF, HTML & Word</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB A: LAPORAN HARIAN                                         */}
      {/* ============================================================= */}
      {activeTab === 'harian' && (
        <div className="space-y-4">
          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-3 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#006b54]" />
              <span className="text-xs font-mono-custom font-bold text-[#1a1c1a]">
                PILIH TANGGAL LAPORAN:
              </span>
              <input
                type="date"
                value={selectedDateHarian}
                onChange={(e) => setSelectedDateHarian(e.target.value)}
                className="px-2.5 py-1 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom font-semibold bg-white"
              />
            </div>
            <button
              type="button"
              onClick={() => handleOpenPrintSubmenu('harian')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-mono-custom font-bold border border-[#1a1c1a] uppercase cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Buka Pratinjau Cetak</span>
            </button>
          </div>

          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-5 sm:p-6 space-y-6 print:border-none print:shadow-none print:p-0">
            <div className="border-b-2 border-[#1a1c1a] pb-3 text-center">
              <h2 className="text-base sm:text-lg font-syne font-bold uppercase tracking-wider text-[#1a1c1a]">
                SEKOLAH RAKYAT TERINTEGRASI 1 JEPARA
              </h2>
              <p className="text-xs text-[#1a1c1a]/70 font-semibold font-mono-custom">
                LAPORAN HARIAN PENGASUHAN ASRAMA SANTRI CILIK (SD)
              </p>
              <div className="inline-block mt-2 px-3 py-1 bg-amber-50 border border-amber-300 text-xs font-mono-custom font-bold text-amber-950">
                TANGGAL: {new Date(selectedDateHarian).toLocaleDateString('id-ID', { dateStyle: 'full' })}
              </div>
            </div>

            <DailyPrayerAttendanceChart stats={harianIbadah} />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-custom">
              <div className="p-3 bg-stone-50 border border-[#1a1c1a]">
                <span className="text-[#1a1c1a]/60 text-[10px] block font-bold uppercase">
                  TOTAL SANTRI ASRAMA
                </span>
                <span className="text-xl font-bold font-syne text-[#1a1c1a]">
                  {siswaList.length} Santri
                </span>
              </div>
              <div className="p-3 bg-rose-50 border border-[#1a1c1a]">
                <span className="text-rose-900 text-[10px] block font-bold uppercase">
                  SANTRI RAWAT UKS
                </span>
                <span className="text-xl font-bold font-syne text-rose-900">
                  {harianKesehatan.length} Anak
                </span>
              </div>
              <div className="p-3 bg-amber-50 border border-[#1a1c1a]">
                <span className="text-amber-900 text-[10px] block font-bold uppercase">
                  KASUS DISIPLIN POSITIF
                </span>
                <span className="text-xl font-bold font-syne text-amber-900">
                  {harianPelanggaran.length} Kasus
                </span>
              </div>
              <div className="p-3 bg-teal-50 border border-[#1a1c1a]">
                <span className="text-teal-900 text-[10px] block font-bold uppercase">
                  PAMONG PIKET AKTIF
                </span>
                <span className="text-xl font-bold font-syne text-teal-900">
                  {waliAsuhList.filter((w) => w.status === 'Bertugas').length} Wali Asuh
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-mono-custom font-bold uppercase tracking-wider text-[#1a1c1a] flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                Catatan Rawat Kesehatan & UKS ({harianKesehatan.length} santri)
              </h3>
              <div className="overflow-x-auto border border-[#1a1c1a]">
                <table className="w-full text-left text-xs font-mono-custom">
                  <thead className="bg-[#1a1c1a]/[0.04] border-b border-[#1a1c1a] font-bold text-[#1a1c1a]">
                    <tr>
                      <th className="p-2">No</th>
                      <th className="p-2">Nama Santri</th>
                      <th className="p-2">Kelas / Kamar</th>
                      <th className="p-2">Keluhan</th>
                      <th className="p-2">Penanganan / Obat</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1c1a]/15">
                    {harianKesehatan.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-stone-500 italic">
                          Alhamdulillah tidak ada santri yang sakit / dirawat pada tanggal ini.
                        </td>
                      </tr>
                    ) : (
                      harianKesehatan.map((item, idx) => {
                        const s = getSiswa(item.siswaId);
                        const k = getKamar(s?.kamarId);
                        return (
                          <tr key={item.id} className="hover:bg-stone-50">
                            <td className="p-2">{idx + 1}</td>
                            <td className="p-2 font-bold text-[#1a1c1a]">
                              {s?.nama || item.namaSiswa || '-'}
                            </td>
                            <td className="p-2">
                              {s?.kelas || '-'} · {item.kamar || k?.nama || '-'}
                            </td>
                            <td className="p-2 text-rose-700">
                              {item.keluhan} ({item.suhuTubuh || '-'})
                            </td>
                            <td className="p-2">{item.penanganan || item.penangananObat || '-'}</td>
                            <td className="p-2 font-bold text-rose-800">
                              {item.status || item.kondisi}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-2 text-center text-xs font-mono-custom">
              <div>
                <p className="text-[#1a1c1a]/60">Mengetahui,</p>
                <p className="font-bold text-[#1a1c1a] mt-1">Kepala Sekolah</p>
                <div className="h-14" />
                <p className="font-bold underline text-[#1a1c1a]">{kepalaSekolahNama}</p>
                {kepalaSekolahNip && (
                  <p className="text-[10px] text-[#1a1c1a]/60">NIP. {kepalaSekolahNip}</p>
                )}
              </div>
              <div>
                <p className="text-[#1a1c1a]/60">
                  Jepara, {new Date(selectedDateHarian).toLocaleDateString('id-ID')}
                </p>
                <p className="font-bold text-[#1a1c1a] mt-1">Wali Asrama</p>
                <div className="h-14" />
                <p className="font-bold underline text-[#1a1c1a]">{waliAsramaNama}</p>
                {waliAsramaNip && (
                  <p className="text-[10px] text-[#1a1c1a]/60">NIP. {waliAsramaNip}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB B: LAPORAN MINGGUAN                                       */}
      {/* ============================================================= */}
      {activeTab === 'mingguan' && (
        <div className="space-y-4">
          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-3 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#006b54]" />
              <span className="text-xs font-mono-custom font-bold text-[#1a1c1a]">
                PILIH PEKAN EVALUASI:
              </span>
              <select
                value={selectedPekan}
                onChange={(e) => setSelectedPekan(e.target.value)}
                className="px-2.5 py-1 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom font-semibold bg-white"
              >
                <option value="Pekan 1 (01 - 07 September 2026)">Pekan 1 (01 - 07 September 2026)</option>
                <option value="Pekan 2 (08 - 14 September 2026)">Pekan 2 (08 - 14 September 2026)</option>
                <option value="Pekan 3 (15 - 21 September 2026)">Pekan 3 (15 - 21 September 2026)</option>
                <option value="Pekan 4 (22 - 28 September 2026)">Pekan 4 (22 - 28 September 2026)</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => handleOpenPrintSubmenu('mingguan')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-mono-custom font-bold border border-[#1a1c1a] uppercase cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Buka Pratinjau Cetak</span>
            </button>
          </div>

          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-5 sm:p-6 space-y-6 print:border-none print:shadow-none print:p-0">
            <div className="border-b-2 border-[#1a1c1a] pb-3 text-center">
              <h2 className="text-base sm:text-lg font-syne font-bold uppercase tracking-wider text-[#1a1c1a]">
                SEKOLAH RAKYAT TERINTEGRASI 1 JEPARA
              </h2>
              <p className="text-xs text-[#1a1c1a]/70 font-semibold font-mono-custom">
                LAPORAN MINGGUAN PENGASUHAN & DINAMIKA ASRAMA
              </p>
              <div className="inline-block mt-2 px-3 py-1 bg-teal-50 border border-teal-300 text-xs font-mono-custom font-bold text-teal-950">
                PERIODE: {selectedPekan}
              </div>
            </div>

            <WeeklyCleanlinessComparisonChart kamarScores={weeklyKamarRanking} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-amber-50/70 border border-[#1a1c1a] space-y-2">
                <span className="text-xs font-mono-custom font-bold text-amber-950 flex items-center gap-1.5 uppercase">
                  <Award className="w-4 h-4 text-amber-600" />
                  Kamar Teladan / Terbersih Minggu Ini
                </span>
                <div className="text-base font-syne font-bold text-[#1a1c1a]">
                  {weeklyKamarRanking.length > 0
                    ? `🏆 ${weeklyKamarRanking[0].nama} (Skor: ${weeklyKamarRanking[0].score.toFixed(1)} / 5.0)`
                    : 'Belum ada data peringkat kamar'}
                </div>
                <p className="text-xs text-[#1a1c1a]/80 font-sans">
                  Kamar ini menunjukkan konsistensi merapikan ranjang mandiri, locket bersih, lantai terbebas dari debu, dan regu piket aktif tepat waktu.
                </p>
              </div>

              <div className="p-3.5 bg-sky-50/70 border border-[#1a1c1a] space-y-2">
                <span className="text-xs font-mono-custom font-bold text-sky-950 flex items-center gap-1.5 uppercase">
                  <Scale className="w-4 h-4 text-sky-700" />
                  Rekapitulasi Restitusi Pembinaan
                </span>
                <div className="text-base font-syne font-bold text-[#1a1c1a]">
                  {pelanggaranList.filter((p) => p.status === 'Selesai').length} Tuntas dari {pelanggaranList.length} Kasus Disiplin
                </div>
                <p className="text-xs text-[#1a1c1a]/80 font-sans">
                  Sebagian besar santri menyambut pembinaan edukatif ramah anak dengan positif dan telah menyelesaikan tugas restitusi bersama wali asuh pendamping.
                </p>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-2 text-center text-xs font-mono-custom">
              <div>
                <p className="text-[#1a1c1a]/60">Wali Asrama,</p>
                <div className="h-14" />
                <p className="font-bold underline text-[#1a1c1a]">{waliAsramaNama}</p>
                {waliAsramaNip && (
                  <p className="text-[10px] text-[#1a1c1a]/60">NIP. {waliAsramaNip}</p>
                )}
              </div>
              <div>
                <p className="text-[#1a1c1a]/60">Mengetahui, Kepala Sekolah</p>
                <div className="h-14" />
                <p className="font-bold underline text-[#1a1c1a]">{kepalaSekolahNama}</p>
                {kepalaSekolahNip && (
                  <p className="text-[10px] text-[#1a1c1a]/60">NIP. {kepalaSekolahNip}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB C: LAPORAN BULANAN                                        */}
      {/* ============================================================= */}
      {activeTab === 'bulanan' && (
        <div className="space-y-4">
          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-3 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#006b54]" />
              <span className="text-xs font-mono-custom font-bold text-[#1a1c1a]">
                PILIH BULAN EVALUASI:
              </span>
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(e.target.value)}
                className="px-2.5 py-1 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom font-semibold bg-white"
              >
                <option value="September 2026">September 2026</option>
                <option value="Agustus 2026">Agustus 2026</option>
                <option value="Juli 2026">Juli 2026</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => handleOpenPrintSubmenu('bulanan')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006b54] hover:bg-[#005240] text-white text-xs font-mono-custom font-bold border border-[#1a1c1a] uppercase cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Buka Pratinjau Cetak</span>
            </button>
          </div>

          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-5 sm:p-6 space-y-6 print:border-none print:shadow-none print:p-0">
            <div className="border-b-2 border-[#1a1c1a] pb-3 text-center">
              <h2 className="text-base sm:text-lg font-syne font-bold uppercase tracking-wider text-[#1a1c1a]">
                SEKOLAH RAKYAT TERINTEGRASI 1 JEPARA
              </h2>
              <p className="text-xs text-[#1a1c1a]/70 font-semibold font-mono-custom">
                LAPORAN BULANAN PENGASUHAN, AKHLAK & KEMANDIRIAN SANTRI
              </p>
              <div className="inline-block mt-2 px-3 py-1 bg-stone-100 border border-[#1a1c1a]/30 text-xs font-mono-custom font-bold text-[#1a1c1a]">
                BULAN: {selectedBulan}
              </div>
            </div>

            <MonthlyCharacterGrowthChart
              statusCounts={monthlyStats}
              totalSiswa={siswaList.length}
            />

            <div className="p-4 bg-stone-50 border border-[#1a1c1a] space-y-2 text-xs font-sans">
              <h3 className="font-mono-custom font-bold text-[#1a1c1a] uppercase text-[11px]">
                // CATATAN EVALUASI & REKOMENDASI WALI ASUH BULANAN
              </h3>
              <p className="leading-relaxed text-[#1a1c1a]/90">
                1. <strong>Adaptasi & Homesick:</strong> Santri baru kelas 1 dan 2 telah menunjukkan adaptasi sosial yang sangat baik. Kasus rindu rumah (homesick) menurun berkat pendampingan rutin wali asuh.
              </p>
              <p className="leading-relaxed text-[#1a1c1a]/90">
                2. <strong>Kemandirian & Kebersihan:</strong> Pembiasaan melipat selimut, merapikan loker, dan mencuci alat makan sendiri terus berjalan konsisten di kamar asrama.
              </p>
              <p className="leading-relaxed text-[#1a1c1a]/90">
                3. <strong>Target Bulan Depan:</strong> Fokus penguatan tajwid pada halaqah tahfidz sore, literasi membaca sebelum tidur, serta bimbingan adab bertutur kata santun.
              </p>
            </div>

            <div className="pt-6 grid grid-cols-2 text-center text-xs font-mono-custom">
              <div>
                <p className="text-[#1a1c1a]/60">Wali Asrama,</p>
                <div className="h-14" />
                <p className="font-bold underline text-[#1a1c1a]">{waliAsramaNama}</p>
                {waliAsramaNip && (
                  <p className="text-[10px] text-[#1a1c1a]/60">NIP. {waliAsramaNip}</p>
                )}
              </div>
              <div>
                <p className="text-[#1a1c1a]/60">Mengetahui, Kepala Sekolah</p>
                <div className="h-14" />
                <p className="font-bold underline text-[#1a1c1a]">{kepalaSekolahNama}</p>
                {kepalaSekolahNip && (
                  <p className="text-[10px] text-[#1a1c1a]/60">NIP. {kepalaSekolahNip}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB D: RAPORT PERKEMBANGAN PENGASUHAN                         */}
      {/* ============================================================= */}
      {activeTab === 'raport' && (!selectedSiswa || !autoRaport) && (
        <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-8 text-center space-y-3">
          <h3 className="font-syne text-lg font-bold text-[#1a1c1a]">
            Belum Ada Data Santri untuk Raport
          </h3>
          <p className="text-xs font-sans text-[#1a1c1a]/70 max-w-md mx-auto">
            Tambahkan data santri melalui menu Data Siswa terlebih dahulu untuk mencetak Raport Pengasuhan, atau buka sub menu <strong>Cetak Dokumen</strong> untuk mencetak Laporan Harian, Mingguan, Bulanan, dan Rekap Asrama.
          </p>
          <button
            type="button"
            onClick={() => handleOpenPrintSubmenu('harian')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006b54] hover:bg-[#005240] text-white font-bold text-xs border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] uppercase cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Buka Sub Menu Cetak Dokumen</span>
          </button>
        </div>
      )}

      {activeTab === 'raport' && selectedSiswa && autoRaport && (
        <div className="space-y-4">
          {/* Santri Selector & Raport Configuration Bar */}
          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#006b54]" />
                <label className="text-xs font-mono-custom font-bold text-[#1a1c1a]">
                  PILIH SANTRI:
                </label>
              </div>
              <select
                value={selectedSiswa.id}
                onChange={(e) => {
                  setSelectedSiswaId(e.target.value);
                  setIsEditRaportOpen(false);
                }}
                className="px-3 py-1.5 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans font-bold text-[#1a1c1a] min-w-[240px]"
              >
                {siswaList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kelas} · {getKamar(s.kamarId)?.nama || '-'})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                <span className="text-[11px] font-mono-custom text-[#1a1c1a]/70">Skala:</span>
                <div className="inline-flex border border-[#1a1c1a]">
                  <button
                    type="button"
                    onClick={() => setSkalaNilai('1-4')}
                    className={`px-2 py-1 text-xs font-mono-custom font-bold cursor-pointer ${
                      skalaNilai === '1-4'
                        ? 'bg-[#006b54] text-white'
                        : 'bg-white text-[#1a1c1a] hover:bg-stone-100'
                    }`}
                  >
                    1 - 4 (Sesuai Contoh)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkalaNilai('1-10')}
                    className={`px-2 py-1 text-xs font-mono-custom font-bold border-l border-[#1a1c1a] cursor-pointer ${
                      skalaNilai === '1-10'
                        ? 'bg-[#006b54] text-white'
                        : 'bg-white text-[#1a1c1a] hover:bg-stone-100'
                    }`}
                  >
                    1 - 10 (Skala Puluhan)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  isEditRaportOpen ? setIsEditRaportOpen(false) : handleOpenEditRaport()
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#1a1c1a] border border-[#1a1c1a] font-bold text-xs font-mono-custom shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditRaportOpen ? 'Tutup Edit Nilai' : 'Sesuaikan Nilai Rapor'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditTtdOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1a1c1a] font-bold text-xs font-mono-custom shadow-xs cursor-pointer ${
                  isEditTtdOpen
                    ? 'bg-amber-200 text-[#1a1c1a]'
                    : 'bg-amber-50 hover:bg-amber-100 text-[#1a1c1a]'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#006b54]" />
                <span>{isEditTtdOpen ? 'Tutup Edit Tanda Tangan' : 'Edit Tanda Tangan'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyWA}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs font-mono-custom border border-[#1a1c1a] shadow-[1.5px_1.5px_0px_#1a1c1a] uppercase cursor-pointer"
              >
                {copiedWA ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Format WA Ortu</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOpenPrintSubmenu('raport')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#006b54] hover:bg-[#005240] text-white font-bold text-xs font-mono-custom border border-[#1a1c1a] shadow-[1.5px_1.5px_0px_#1a1c1a] uppercase cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Raport Ini</span>
              </button>
            </div>
          </div>

          {/* Inline Form Edit Tanda Tangan Raport */}
          {isEditTtdOpen && (
            <div
              ref={ttdEditorRef}
              className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#006b54] p-5 space-y-4 no-print"
            >
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#1a1c1a]">
                <div>
                  <span className="text-[10px] font-mono-custom font-bold uppercase text-[#006b54] block">
                    // PENGATURAN PENANDATANGAN RAPORT PENGASUHAN
                  </span>
                  <h3 className="font-syne text-lg font-bold text-[#1a1c1a]">
                    Edit Nama Tanda Tangan (Orang Tua/Wali, Wali Asuh, Wali Asrama, Kepala Sekolah)
                  </h3>
                  <p className="text-xs font-sans text-[#1a1c1a]/70 mt-0.5">
                    Perubahan nama langsung tampil pada dokumen Raport dan tersimpan otomatis untuk pencetakan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditTtdOpen(false)}
                  className="p-1.5 border border-[#1a1c1a] bg-stone-50 hover:bg-rose-50 text-[#1a1c1a] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-custom">
                {/* 1. Orang Tua / Wali */}
                <div className="p-3 bg-[#fdfcf9] border border-[#1a1c1a] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1a1c1a] uppercase">
                      1. Orang Tua / Wali ({selectedSiswa.nama})
                    </span>
                    {customOrangTuaTtd[selectedSiswa.id] !== undefined && (
                      <button
                        type="button"
                        onClick={() =>
                          setCustomOrangTuaTtd((prev) => {
                            const next = { ...prev };
                            delete next[selectedSiswa.id];
                            return next;
                          })
                        }
                        className="text-[10px] text-rose-700 hover:underline font-bold cursor-pointer"
                      >
                        Reset Default
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Nama Orang Tua / Wali Santri..."
                    value={getOrangTuaTtdName(selectedSiswa)}
                    onChange={(e) =>
                      setCustomOrangTuaTtd((prev) => ({
                        ...prev,
                        [selectedSiswa.id]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-[#1a1c1a] bg-white text-xs font-sans font-semibold"
                  />
                </div>

                {/* 2. Wali Asuh */}
                <div className="p-3 bg-[#fdfcf9] border border-[#1a1c1a] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1a1c1a] uppercase">
                      2. Wali Asuh ({selectedSiswa.nama})
                    </span>
                    {customWaliAsuhTtd[selectedSiswa.id] !== undefined && (
                      <button
                        type="button"
                        onClick={() =>
                          setCustomWaliAsuhTtd((prev) => {
                            const next = { ...prev };
                            delete next[selectedSiswa.id];
                            return next;
                          })
                        }
                        className="text-[10px] text-rose-700 hover:underline font-bold cursor-pointer"
                      >
                        Reset Default
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      list="raport-wali-suggestions"
                      placeholder="Nama Wali Asuh..."
                      value={getWaliAsuhTtd(selectedSiswa).nama}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomWaliAsuhTtd((prev) => ({
                          ...prev,
                          [selectedSiswa.id]: {
                            nama: val,
                            nip: prev[selectedSiswa.id]?.nip ?? getWaliAsuhTtd(selectedSiswa).nip,
                          },
                        }));
                      }}
                      className="w-full px-3 py-2 border border-[#1a1c1a] bg-white text-xs font-sans font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="NIP Wali Asuh (opsional)"
                      value={getWaliAsuhTtd(selectedSiswa).nip}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomWaliAsuhTtd((prev) => ({
                          ...prev,
                          [selectedSiswa.id]: {
                            nama: prev[selectedSiswa.id]?.nama ?? getWaliAsuhTtd(selectedSiswa).nama,
                            nip: val,
                          },
                        }));
                      }}
                      className="w-full px-3 py-2 border border-[#1a1c1a] bg-white text-xs"
                    />
                  </div>
                  <datalist id="raport-wali-suggestions">
                    {waliAsuhList.map((w) => (
                      <option key={w.id} value={formatWaliName(w)} />
                    ))}
                  </datalist>
                </div>

                {/* 3. Wali Asrama */}
                <div className="p-3 bg-[#fdfcf9] border border-[#1a1c1a] space-y-2">
                  <span className="font-bold text-[#1a1c1a] uppercase block">
                    3. Wali Asrama
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      list="raport-wali-suggestions"
                      placeholder="Nama Wali Asrama..."
                      value={waliAsramaNama}
                      onChange={(e) => setWaliAsramaNama(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1a1c1a] bg-white text-xs font-sans font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="NIP Wali Asrama (opsional)"
                      value={waliAsramaNip}
                      onChange={(e) => setWaliAsramaNip(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1a1c1a] bg-white text-xs"
                    />
                  </div>
                </div>

                {/* 4. Mengetahui: Kepala Sekolah */}
                <div className="p-3 bg-[#fdfcf9] border border-[#1a1c1a] space-y-2">
                  <span className="font-bold text-[#1a1c1a] uppercase block">
                    4. Mengetahui, Kepala Sekolah
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nama Kepala Sekolah..."
                      value={kepalaSekolahNama}
                      onChange={(e) => setKepalaSekolahNama(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1a1c1a] bg-white text-xs font-sans font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="NIP Kepala Sekolah (opsional)"
                      value={kepalaSekolahNip}
                      onChange={(e) => setKepalaSekolahNip(e.target.value)}
                      className="w-full px-3 py-2 border border-[#1a1c1a] bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2 border-t border-[#1a1c1a]/20 text-xs font-mono-custom">
                <div className="flex-1 max-w-sm">
                  <label className="block font-bold text-[#1a1c1a] mb-1">
                    Tempat & Tanggal Tanda Tangan:
                  </label>
                  <input
                    type="text"
                    value={tempatTanggalCetak}
                    onChange={(e) => setTempatTanggalCetak(e.target.value)}
                    className="w-full px-3 py-2 border border-[#1a1c1a] bg-white text-xs font-sans"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditTtdOpen(false);
                    showPrintNotice('✓ Nama penandatangan raport telah diperbarui.');
                  }}
                  className="px-4 py-2 bg-[#006b54] hover:bg-[#005240] text-white font-bold border border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] uppercase cursor-pointer"
                >
                  Selesai Edit Tanda Tangan
                </button>
              </div>
            </div>
          )}

          {/* Inline Form Edit Nilai Raport */}
          {isEditRaportOpen && editRaportForm && (
            <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#006b54] p-5 space-y-4 no-print">
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#1a1c1a]">
                <div>
                  <span className="text-[10px] font-mono-custom font-bold uppercase text-[#006b54] block">
                    // FORM PENYESUAIAN 8 ASPEK PENGASUHAN
                  </span>
                  <h3 className="font-syne text-lg font-bold text-[#1a1c1a]">
                    Sesuaikan Nilai Raport: {selectedSiswa.nama}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditRaportOpen(false)}
                  className="p-1.5 border border-[#1a1c1a] bg-stone-50 hover:bg-rose-50 text-[#1a1c1a] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditRaport} className="space-y-4 text-xs font-mono-custom">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ASPEK_LIST.map((item) => {
                    const curVal =
                      editRaportForm.aspek[item.key]?.nilai || (skalaNilai === '1-4' ? 3.5 : 8.5);
                    const curNote = editRaportForm.aspek[item.key]?.catatan || item.deskripsi;

                    return (
                      <div key={item.key} className="p-3 bg-stone-50 border border-[#1a1c1a] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#1a1c1a] text-xs">{item.label}</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.1"
                              min={1.0}
                              max={skalaNilai === '1-4' ? 4.0 : 10.0}
                              value={curVal}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setEditRaportForm({
                                  ...editRaportForm,
                                  aspek: {
                                    ...editRaportForm.aspek,
                                    [item.key]: {
                                      nilai: val,
                                      predikat: getPredikat(val, skalaNilai),
                                      catatan: curNote,
                                    },
                                  },
                                });
                              }}
                              className="w-16 px-2 py-1 bg-white border border-[#1a1c1a] font-bold text-center text-xs"
                            />
                            <span className="px-2 py-0.5 text-[10px] bg-white border border-[#1a1c1a]">
                              {getPredikat(curVal, skalaNilai)}
                            </span>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Catatan capaian spesifik santri..."
                          value={curNote}
                          onChange={(e) => {
                            const note = e.target.value;
                            setEditRaportForm({
                              ...editRaportForm,
                              aspek: {
                                ...editRaportForm.aspek,
                                [item.key]: {
                                  ...editRaportForm.aspek[item.key],
                                  catatan: note,
                                },
                              },
                            });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#1a1c1a] text-xs font-sans"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#1a1c1a]/20">
                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">
                      Catatan Evaluasi Wali Asuh:
                    </label>
                    <textarea
                      rows={2}
                      value={editRaportForm.catatanWaliAsuh || ''}
                      onChange={(e) =>
                        setEditRaportForm({
                          ...editRaportForm,
                          catatanWaliAsuh: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-[#1a1c1a] text-xs font-sans"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1a1c1a] mb-1">
                      Pesan Untuk Orang Tua:
                    </label>
                    <textarea
                      rows={2}
                      value={editRaportForm.pesanOrangTua || ''}
                      onChange={(e) =>
                        setEditRaportForm({
                          ...editRaportForm,
                          pesanOrangTua: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-[#1a1c1a] text-xs font-sans"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1a1c1a]">
                  <button
                    type="button"
                    onClick={handleResetToAutoRaport}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-700 hover:underline font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset ke Kalkulasi Otomatis</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditRaportOpen(false)}
                      className="neo-btn-outline"
                    >
                      BATAL
                    </button>
                    <button type="submit" className="neo-btn-primary">
                      SIMPAN RAPORT
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Dokumen Raport */}
          <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-5 sm:p-8 print:border-none print:shadow-none print:p-0">
            {renderRaportDocumentBody(selectedSiswa, autoRaport, {
              allowInlineTtdShortcut: true,
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB E: SUB MENU CETAK DOKUMEN (PUSAT CETAK & PRATINJAU RESMI) */}
      {/* ============================================================= */}
      {activeTab === 'cetak' && (
        <div ref={printSectionRef} className="space-y-5">
          {/* Panel Pengaturan & Aksi Cetak (.no-print) */}
          <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[5px_5px_0px_#006b54] p-5 sm:p-6 space-y-5 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-[1.5px] border-[#1a1c1a]">
              <div>
                <span className="text-[10px] font-mono-custom font-bold uppercase tracking-wider text-[#006b54] block">
                  // SUB MENU CETAK DOKUMEN & PRATINJAU KERTAS RESMI
                </span>
                <h2 className="font-syne text-xl font-extrabold text-[#1a1c1a] tracking-tight">
                  Pusat Cetak Laporan & Raport Asrama
                </h2>
                <p className="text-xs font-sans text-[#1a1c1a]/70 mt-0.5">
                  Pilih dokumen yang ingin dicetak, atur ukuran kertas serta pejabat penandatangan, lalu cetak langsung atau unduh versi siap cetak.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExecutePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#006b54] hover:bg-[#005240] text-white font-bold text-xs font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2.5px_2.5px_0px_#1a1c1a] uppercase cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPrintableHtml}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-100 hover:bg-amber-200 text-[#1a1c1a] font-bold text-xs font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] uppercase cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Unduh Siap Cetak (.HTML)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadWordDoc}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-stone-100 text-[#1a1c1a] font-bold text-xs font-mono-custom border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] uppercase cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Unduh Word (.DOC)</span>
                </button>
              </div>
            </div>

            {/* Grid Pilihan Dokumen & Pengaturan Cetak */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs font-mono-custom">
              {/* Kolom 1: Jenis Dokumen & Parameter Sumber */}
              <div className="lg:col-span-5 space-y-3 bg-[#fdfcf9] p-3.5 border border-[#1a1c1a]">
                <span className="font-bold text-[#1a1c1a] uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#006b54]" />
                  1. Pilih Dokumen Sumber
                </span>

                <div>
                  <label className="block font-bold text-[11px] text-[#1a1c1a]/80 mb-1">
                    Jenis Dokumen Cetak:
                  </label>
                  <select
                    value={printDocType}
                    onChange={(e) => setPrintDocType(e.target.value as PrintDocType)}
                    className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-bold"
                  >
                    <option value="raport">Raport Perkembangan Pengasuhan (8 Aspek)</option>
                    <option value="harian">Laporan Harian Pengasuhan (Ibadah, UKS & Disiplin)</option>
                    <option value="mingguan">Laporan Mingguan (Rating Kamar & Pembinaan)</option>
                    <option value="bulanan">Laporan Bulanan (Tren Karakter & Evaluasi)</option>
                    <option value="rekap-santri">Rekapitulasi Daftar Santri, Kamar & Wali Asuh</option>
                  </select>
                </div>

                {printDocType === 'raport' && (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="block font-bold text-[11px] text-[#1a1c1a]/80 mb-1">
                        Mode Cetak Raport:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRaportPrintMode('single')}
                          className={`px-2.5 py-1.5 border border-[#1a1c1a] font-bold text-[11px] cursor-pointer ${
                            raportPrintMode === 'single'
                              ? 'bg-[#006b54] text-white'
                              : 'bg-white text-[#1a1c1a]'
                          }`}
                        >
                          1 Santri Terpilih
                        </button>
                        <button
                          type="button"
                          onClick={() => setRaportPrintMode('all')}
                          className={`px-2.5 py-1.5 border border-[#1a1c1a] font-bold text-[11px] cursor-pointer ${
                            raportPrintMode === 'all'
                              ? 'bg-[#006b54] text-white'
                              : 'bg-white text-[#1a1c1a]'
                          }`}
                        >
                          Semua Santri ({siswaList.length})
                        </button>
                      </div>
                    </div>

                    {raportPrintMode === 'single' && siswaList.length > 0 && (
                      <div>
                        <label className="block font-bold text-[11px] text-[#1a1c1a]/80 mb-1">
                          Pilih Santri:
                        </label>
                        <select
                          value={selectedSiswa?.id || ''}
                          onChange={(e) => setSelectedSiswaId(e.target.value)}
                          className="w-full px-3 py-1.5 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-sans font-semibold"
                        >
                          {siswaList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nama} ({s.kelas} · {getKamar(s.kamarId)?.nama || '-'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-[11px] text-[#1a1c1a]/80 mb-1">
                        Skala Penilaian:
                      </label>
                      <select
                        value={skalaNilai}
                        onChange={(e) => setSkalaNilai(e.target.value as '1-4' | '1-10')}
                        className="w-full px-3 py-1.5 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-bold"
                      >
                        <option value="1-4">Skala 1 - 4 (Standar Rapor)</option>
                        <option value="1-10">Skala 1 - 10 (Puluhan)</option>
                      </select>
                    </div>
                  </div>
                )}

                {printDocType === 'harian' && (
                  <div>
                    <label className="block font-bold text-[11px] text-[#1a1c1a]/80 mb-1">
                      Tanggal Laporan Harian:
                    </label>
                    <input
                      type="date"
                      value={selectedDateHarian}
                      onChange={(e) => setSelectedDateHarian(e.target.value)}
                      className="w-full px-3 py-1.5 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
                    />
                  </div>
                )}

                {printDocType === 'mingguan' && (
                  <div>
                    <label className="block font-bold text-[11px] text-[#1a1c1a]/80 mb-1">
                      Periode Pekan:
                    </label>
                    <select
                      value={selectedPekan}
                      onChange={(e) => setSelectedPekan(e.target.value)}
                      className="w-full px-3 py-1.5 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
                    >
                      <option value="Pekan 1 (01 - 07 September 2026)">Pekan 1 (01 - 07 September 2026)</option>
                      <option value="Pekan 2 (08 - 14 September 2026)">Pekan 2 (08 - 14 September 2026)</option>
                      <option value="Pekan 3 (15 - 21 September 2026)">Pekan 3 (15 - 21 September 2026)</option>
                      <option value="Pekan 4 (22 - 28 September 2026)">Pekan 4 (22 - 28 September 2026)</option>
                    </select>
                  </div>
                )}

                {printDocType === 'bulanan' && (
                  <div>
                    <label className="block font-bold text-[11px] text-[#1a1c1a]/80 mb-1">
                      Bulan Evaluasi:
                    </label>
                    <select
                      value={selectedBulan}
                      onChange={(e) => setSelectedBulan(e.target.value)}
                      className="w-full px-3 py-1.5 border-[1.5px] border-[#1a1c1a] bg-white text-xs"
                    >
                      <option value="September 2026">September 2026</option>
                      <option value="Agustus 2026">Agustus 2026</option>
                      <option value="Juli 2026">Juli 2026</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Kolom 2: Pengaturan Kertas & Opsi Tampilan */}
              <div className="lg:col-span-3 space-y-3 bg-[#fdfcf9] p-3.5 border border-[#1a1c1a]">
                <span className="font-bold text-[#1a1c1a] uppercase flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#006b54]" />
                  2. Kertas & Opsi
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[11px] text-[#1a1c1a]/80 mb-1">
                      Ukuran:
                    </label>
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                      className="w-full px-2.5 py-1.5 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-bold"
                    >
                      <option value="A4">A4</option>
                      <option value="F4">F4 (Folio)</option>
                      <option value="Letter">Letter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[11px] text-[#1a1c1a]/80 mb-1">
                      Orientasi:
                    </label>
                    <select
                      value={paperOrientation}
                      onChange={(e) => setPaperOrientation(e.target.value as PaperOrientation)}
                      className="w-full px-2.5 py-1.5 border-[1.5px] border-[#1a1c1a] bg-white text-xs font-bold"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-1 font-sans">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showKopSurat}
                      onChange={(e) => setShowKopSurat(e.target.checked)}
                      className="accent-[#006b54] w-4 h-4"
                    />
                    <span className="text-xs font-medium text-[#1a1c1a]">
                      Tampilkan Kop Surat Resmi
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showChartsOnPrint}
                      onChange={(e) => setShowChartsOnPrint(e.target.checked)}
                      className="accent-[#006b54] w-4 h-4"
                    />
                    <span className="text-xs font-medium text-[#1a1c1a]">
                      Sertakan Grafik & Radar
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSignatures}
                      onChange={(e) => setShowSignatures(e.target.checked)}
                      className="accent-[#006b54] w-4 h-4"
                    />
                    <span className="text-xs font-medium text-[#1a1c1a]">
                      Sertakan Blok Tanda Tangan
                    </span>
                  </label>
                </div>
              </div>

              {/* Kolom 3: Pejabat Penandatangan & Tanggal Cetak */}
              <div className="lg:col-span-4 space-y-2.5 bg-[#fdfcf9] p-3.5 border border-[#1a1c1a]">
                <span className="font-bold text-[#1a1c1a] uppercase flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#006b54]" />
                  3. Penandatangan & Tanggal
                </span>

                {printDocType === 'raport' && raportPrintMode === 'single' && selectedSiswa && (
                  <>
                    <div>
                      <label className="block font-bold text-[10px] text-[#1a1c1a]/75 mb-0.5">
                        Orang Tua / Wali ({selectedSiswa.nama}):
                      </label>
                      <input
                        type="text"
                        placeholder="Nama Orang Tua / Wali..."
                        value={getOrangTuaTtdName(selectedSiswa)}
                        onChange={(e) =>
                          setCustomOrangTuaTtd((prev) => ({
                            ...prev,
                            [selectedSiswa.id]: e.target.value,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-[10px] text-[#1a1c1a]/75 mb-0.5">
                          Wali Asuh:
                        </label>
                        <input
                          type="text"
                          list="cetak-wali-suggestions"
                          value={getWaliAsuhTtd(selectedSiswa).nama}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomWaliAsuhTtd((prev) => ({
                              ...prev,
                              [selectedSiswa.id]: {
                                nama: val,
                                nip: prev[selectedSiswa.id]?.nip ?? getWaliAsuhTtd(selectedSiswa).nip,
                              },
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[10px] text-[#1a1c1a]/75 mb-0.5">
                          NIP Wali Asuh:
                        </label>
                        <input
                          type="text"
                          placeholder="Opsional"
                          value={getWaliAsuhTtd(selectedSiswa).nip}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomWaliAsuhTtd((prev) => ({
                              ...prev,
                              [selectedSiswa.id]: {
                                nama: prev[selectedSiswa.id]?.nama ?? getWaliAsuhTtd(selectedSiswa).nama,
                                nip: val,
                              },
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}

                {printDocType === 'raport' && raportPrintMode === 'all' && (
                  <div className="grid grid-cols-1 gap-1.5">
                    <label className="block font-bold text-[10px] text-[#1a1c1a]/75">
                      Wali Asuh Default (jika santri belum punya wali asuh):
                    </label>
                    <input
                      type="text"
                      list="cetak-wali-suggestions"
                      value={defaultWaliAsuhNama}
                      onChange={(e) => setDefaultWaliAsuhNama(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[10px] text-[#1a1c1a]/75 mb-0.5">
                      Wali Asrama:
                    </label>
                    <input
                      type="text"
                      list="cetak-wali-suggestions"
                      value={waliAsramaNama}
                      onChange={(e) => setWaliAsramaNama(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                    />
                    <datalist id="cetak-wali-suggestions">
                      {waliAsuhList.map((w) => (
                        <option key={w.id} value={formatWaliName(w)} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block font-bold text-[10px] text-[#1a1c1a]/75 mb-0.5">
                      NIP Wali Asrama:
                    </label>
                    <input
                      type="text"
                      value={waliAsramaNip}
                      onChange={(e) => setWaliAsramaNip(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[10px] text-[#1a1c1a]/75 mb-0.5">
                      Mengetahui (Kepala Sekolah):
                    </label>
                    <input
                      type="text"
                      value={kepalaSekolahNama}
                      onChange={(e) => setKepalaSekolahNama(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[10px] text-[#1a1c1a]/75 mb-0.5">
                      NIP Kepala Sekolah:
                    </label>
                    <input
                      type="text"
                      value={kepalaSekolahNip}
                      onChange={(e) => setKepalaSekolahNip(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#1a1c1a] bg-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[10px] text-[#1a1c1a]/75 mb-0.5">
                    Tempat & Tanggal Tanda Tangan:
                  </label>
                  <input
                    type="text"
                    value={tempatTanggalCetak}
                    onChange={(e) => setTempatTanggalCetak(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#1a1c1a] bg-white text-xs font-sans"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Label Pratinjau */}
          <div className="flex items-center justify-between text-xs font-mono-custom text-[#1a1c1a]/70 px-1 no-print">
            <span className="font-bold uppercase">
              // PRATINJAU DOKUMEN SIAP CETAK ({paperSize} · {paperOrientation.toUpperCase()})
            </span>
            <span>Klik "Cetak / Simpan PDF" di atas untuk langsung mencetak</span>
          </div>

          {/* AREA DOKUMEN CETAK */}
          <div
            className={`mx-auto bg-white border-[1.5px] border-[#1a1c1a] neo-shadow p-6 sm:p-8 print:border-none print:shadow-none print:p-0 ${
              paperOrientation === 'landscape' ? 'max-w-[297mm]' : 'max-w-[210mm]'
            }`}
          >
            <div ref={printAreaRef}>
              {/* PRINT TYPE 1: RAPORT PENGASUHAN */}
              {printDocType === 'raport' && (
                <>
                  {siswaList.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-[#1a1c1a]/40 space-y-2">
                      <p className="font-syne font-bold text-base text-[#1a1c1a]">
                        Belum Ada Data Santri untuk Dicetak Sebagai Raport
                      </p>
                      <p className="text-xs font-sans text-[#1a1c1a]/70">
                        Tambahkan santri di menu Data Siswa terlebih dahulu, atau pilih jenis dokumen lain (Laporan Harian, Mingguan, Bulanan, atau Rekapitulasi Santri & Kamar).
                      </p>
                    </div>
                  ) : raportPrintMode === 'single' && selectedSiswa && autoRaport ? (
                    renderRaportDocumentBody(selectedSiswa, autoRaport, {
                      withKop: showKopSurat,
                      withCharts: showChartsOnPrint,
                      withSign: showSignatures,
                      signDateText: tempatTanggalCetak,
                    })
                  ) : (
                    <div className="space-y-10">
                      {siswaList.map((s, idx) => {
                        const r = buildRaportForSiswa(s);
                        const isLast = idx === siswaList.length - 1;
                        return (
                          <div
                            key={s.id}
                            className={!isLast ? 'print-page-break pb-8 border-b-2 border-dashed border-[#1a1c1a]/30 print:border-none print:pb-0' : ''}
                          >
                            {renderRaportDocumentBody(s, r, {
                              withKop: showKopSurat,
                              withCharts: showChartsOnPrint,
                              withSign: showSignatures,
                              signDateText: tempatTanggalCetak,
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* PRINT TYPE 2: LAPORAN HARIAN */}
              {printDocType === 'harian' && (
                <div className="space-y-6">
                  {showKopSurat && (
                    <div className="border-b-2 border-[#1a1c1a] pb-3 text-center">
                      <h2 className="text-base sm:text-lg font-syne font-bold uppercase tracking-wider text-[#1a1c1a]">
                        SEKOLAH RAKYAT TERINTEGRASI 1 JEPARA
                      </h2>
                      <p className="text-xs text-[#1a1c1a]/70 font-semibold font-mono-custom">
                        LAPORAN HARIAN PENGASUHAN ASRAMA SANTRI CILIK (SD)
                      </p>
                      <div className="inline-block mt-2 px-3 py-1 bg-amber-50 border border-amber-300 text-xs font-mono-custom font-bold text-amber-950">
                        TANGGAL:{' '}
                        {new Date(selectedDateHarian).toLocaleDateString('id-ID', {
                          dateStyle: 'full',
                        })}
                      </div>
                    </div>
                  )}

                  {showChartsOnPrint && <DailyPrayerAttendanceChart stats={harianIbadah} />}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-custom print-avoid-break">
                    <div className="p-3 bg-stone-50 border border-[#1a1c1a]">
                      <span className="text-[#1a1c1a]/60 text-[10px] block font-bold uppercase">
                        TOTAL SANTRI ASRAMA
                      </span>
                      <span className="text-xl font-bold font-syne text-[#1a1c1a]">
                        {siswaList.length} Santri
                      </span>
                    </div>
                    <div className="p-3 bg-rose-50 border border-[#1a1c1a]">
                      <span className="text-rose-900 text-[10px] block font-bold uppercase">
                        SANTRI RAWAT UKS
                      </span>
                      <span className="text-xl font-bold font-syne text-rose-900">
                        {harianKesehatan.length} Anak
                      </span>
                    </div>
                    <div className="p-3 bg-amber-50 border border-[#1a1c1a]">
                      <span className="text-amber-900 text-[10px] block font-bold uppercase">
                        KASUS DISIPLIN POSITIF
                      </span>
                      <span className="text-xl font-bold font-syne text-amber-900">
                        {harianPelanggaran.length} Kasus
                      </span>
                    </div>
                    <div className="p-3 bg-teal-50 border border-[#1a1c1a]">
                      <span className="text-teal-900 text-[10px] block font-bold uppercase">
                        PAMONG PIKET AKTIF
                      </span>
                      <span className="text-xl font-bold font-syne text-teal-900">
                        {waliAsuhList.filter((w) => w.status === 'Bertugas').length} Wali Asuh
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 print-avoid-break">
                    <h3 className="text-xs font-mono-custom font-bold uppercase tracking-wider text-[#1a1c1a]">
                      Catatan Rawat Kesehatan & UKS ({harianKesehatan.length} santri)
                    </h3>
                    <table className="w-full text-left text-xs font-mono-custom border border-[#1a1c1a]">
                      <thead className="bg-[#1a1c1a]/[0.06] border-b border-[#1a1c1a] font-bold">
                        <tr>
                          <th className="p-2 border-r border-[#1a1c1a]/20">No</th>
                          <th className="p-2 border-r border-[#1a1c1a]/20">Nama Santri</th>
                          <th className="p-2 border-r border-[#1a1c1a]/20">Kelas / Kamar</th>
                          <th className="p-2 border-r border-[#1a1c1a]/20">Keluhan</th>
                          <th className="p-2 border-r border-[#1a1c1a]/20">Penanganan</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1c1a]/15">
                        {harianKesehatan.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-3 text-center text-stone-500 italic">
                              Alhamdulillah tidak ada santri yang sakit / dirawat pada tanggal ini.
                            </td>
                          </tr>
                        ) : (
                          harianKesehatan.map((item, idx) => {
                            const s = getSiswa(item.siswaId);
                            const k = getKamar(s?.kamarId);
                            return (
                              <tr key={item.id}>
                                <td className="p-2 border-r border-[#1a1c1a]/20">{idx + 1}</td>
                                <td className="p-2 border-r border-[#1a1c1a]/20 font-bold">
                                  {s?.nama || item.namaSiswa || '-'}
                                </td>
                                <td className="p-2 border-r border-[#1a1c1a]/20">
                                  {s?.kelas || '-'} · {item.kamar || k?.nama || '-'}
                                </td>
                                <td className="p-2 border-r border-[#1a1c1a]/20">
                                  {item.keluhan}
                                </td>
                                <td className="p-2 border-r border-[#1a1c1a]/20">
                                  {item.penanganan || item.penangananObat || '-'}
                                </td>
                                <td className="p-2 font-bold">{item.status || item.kondisi}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {showSignatures && (
                    <div className="pt-6 grid grid-cols-2 text-center text-xs font-mono-custom print-avoid-break">
                      <div>
                        <p className="text-[#1a1c1a]/60">Mengetahui,</p>
                        <p className="font-bold text-[#1a1c1a] mt-1">Kepala Sekolah</p>
                        <div className="h-14" />
                        <p className="font-bold underline text-[#1a1c1a]">{kepalaSekolahNama}</p>
                        {kepalaSekolahNip && (
                          <p className="text-[10px] text-[#1a1c1a]/60">NIP. {kepalaSekolahNip}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[#1a1c1a]/60">{tempatTanggalCetak}</p>
                        <p className="font-bold text-[#1a1c1a] mt-1">Wali Asrama</p>
                        <div className="h-14" />
                        <p className="font-bold underline text-[#1a1c1a]">{waliAsramaNama}</p>
                        {waliAsramaNip && (
                          <p className="text-[10px] text-[#1a1c1a]/60">NIP. {waliAsramaNip}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PRINT TYPE 3: LAPORAN MINGGUAN */}
              {printDocType === 'mingguan' && (
                <div className="space-y-6">
                  {showKopSurat && (
                    <div className="border-b-2 border-[#1a1c1a] pb-3 text-center">
                      <h2 className="text-base sm:text-lg font-syne font-bold uppercase tracking-wider text-[#1a1c1a]">
                        SEKOLAH RAKYAT TERINTEGRASI 1 JEPARA
                      </h2>
                      <p className="text-xs text-[#1a1c1a]/70 font-semibold font-mono-custom">
                        LAPORAN MINGGUAN PENGASUHAN & DINAMIKA ASRAMA
                      </p>
                      <div className="inline-block mt-2 px-3 py-1 bg-teal-50 border border-teal-300 text-xs font-mono-custom font-bold text-teal-950">
                        PERIODE: {selectedPekan}
                      </div>
                    </div>
                  )}

                  {showChartsOnPrint && (
                    <WeeklyCleanlinessComparisonChart kamarScores={weeklyKamarRanking} />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-avoid-break">
                    <div className="p-3.5 bg-amber-50/70 border border-[#1a1c1a] space-y-1.5">
                      <span className="text-xs font-mono-custom font-bold text-amber-950 uppercase block">
                        Kamar Teladan / Terbersih Minggu Ini
                      </span>
                      <div className="text-base font-syne font-bold text-[#1a1c1a]">
                        {weeklyKamarRanking.length > 0
                          ? `🏆 ${weeklyKamarRanking[0].nama} (Skor: ${weeklyKamarRanking[0].score.toFixed(1)} / 5.0)`
                          : 'Belum ada data kamar'}
                      </div>
                    </div>

                    <div className="p-3.5 bg-sky-50/70 border border-[#1a1c1a] space-y-1.5">
                      <span className="text-xs font-mono-custom font-bold text-sky-950 uppercase block">
                        Rekapitulasi Restitusi Pembinaan
                      </span>
                      <div className="text-base font-syne font-bold text-[#1a1c1a]">
                        {pelanggaranList.filter((p) => p.status === 'Selesai').length} Tuntas dari{' '}
                        {pelanggaranList.length} Kasus Disiplin
                      </div>
                    </div>
                  </div>

                  {showSignatures && (
                    <div className="pt-6 grid grid-cols-2 text-center text-xs font-mono-custom print-avoid-break">
                      <div>
                        <p className="text-[#1a1c1a]/60">Wali Asrama,</p>
                        <div className="h-14" />
                        <p className="font-bold underline text-[#1a1c1a]">{waliAsramaNama}</p>
                        {waliAsramaNip && (
                          <p className="text-[10px] text-[#1a1c1a]/60">NIP. {waliAsramaNip}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[#1a1c1a]/60">{tempatTanggalCetak}</p>
                        <p className="font-bold text-[#1a1c1a]">
                          Mengetahui, Kepala Sekolah
                        </p>
                        <div className="h-14" />
                        <p className="font-bold underline text-[#1a1c1a]">{kepalaSekolahNama}</p>
                        {kepalaSekolahNip && (
                          <p className="text-[10px] text-[#1a1c1a]/60">NIP. {kepalaSekolahNip}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PRINT TYPE 4: LAPORAN BULANAN */}
              {printDocType === 'bulanan' && (
                <div className="space-y-6">
                  {showKopSurat && (
                    <div className="border-b-2 border-[#1a1c1a] pb-3 text-center">
                      <h2 className="text-base sm:text-lg font-syne font-bold uppercase tracking-wider text-[#1a1c1a]">
                        SEKOLAH RAKYAT TERINTEGRASI 1 JEPARA
                      </h2>
                      <p className="text-xs text-[#1a1c1a]/70 font-semibold font-mono-custom">
                        LAPORAN BULANAN PENGASUHAN, AKHLAK & KEMANDIRIAN SANTRI
                      </p>
                      <div className="inline-block mt-2 px-3 py-1 bg-stone-100 border border-[#1a1c1a]/30 text-xs font-mono-custom font-bold text-[#1a1c1a]">
                        BULAN: {selectedBulan}
                      </div>
                    </div>
                  )}

                  {showChartsOnPrint && (
                    <MonthlyCharacterGrowthChart
                      statusCounts={monthlyStats}
                      totalSiswa={siswaList.length}
                    />
                  )}

                  <div className="p-4 bg-stone-50 border border-[#1a1c1a] space-y-2 text-xs font-sans print-avoid-break">
                    <h3 className="font-mono-custom font-bold text-[#1a1c1a] uppercase text-[11px]">
                      // CATATAN EVALUASI & REKOMENDASI WALI ASUH BULANAN
                    </h3>
                    <p className="leading-relaxed text-[#1a1c1a]/90">
                      1. <strong>Adaptasi & Homesick:</strong> Santri baru kelas 1 dan 2 terus menunjukkan adaptasi sosial yang positif bersama pendampingan wali asuh.
                    </p>
                    <p className="leading-relaxed text-[#1a1c1a]/90">
                      2. <strong>Kemandirian & Kebersihan:</strong> Pembiasaan merapikan ranjang, menjaga kebersihan loker, dan kemandirian makan berjalan konsisten.
                    </p>
                    <p className="leading-relaxed text-[#1a1c1a]/90">
                      3. <strong>Target Bulan Depan:</strong> Penguatan tajwid halaqah sore, literasi membaca, dan adab komunikasi santun antar teman asrama.
                    </p>
                  </div>

                  {showSignatures && (
                    <div className="pt-6 grid grid-cols-2 text-center text-xs font-mono-custom print-avoid-break">
                      <div>
                        <p className="text-[#1a1c1a]/60">Wali Asrama,</p>
                        <div className="h-14" />
                        <p className="font-bold underline text-[#1a1c1a]">{waliAsramaNama}</p>
                        {waliAsramaNip && (
                          <p className="text-[10px] text-[#1a1c1a]/60">NIP. {waliAsramaNip}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[#1a1c1a]/60">{tempatTanggalCetak}</p>
                        <p className="font-bold text-[#1a1c1a]">
                          Mengetahui, Kepala Sekolah
                        </p>
                        <div className="h-14" />
                        <p className="font-bold underline text-[#1a1c1a]">{kepalaSekolahNama}</p>
                        {kepalaSekolahNip && (
                          <p className="text-[10px] text-[#1a1c1a]/60">NIP. {kepalaSekolahNip}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PRINT TYPE 5: REKAPITULASI DAFTAR SANTRI & KAMAR */}
              {printDocType === 'rekap-santri' && (
                <div className="space-y-6">
                  {showKopSurat && (
                    <div className="border-b-2 border-[#1a1c1a] pb-3 text-center">
                      <h2 className="text-base sm:text-lg font-syne font-bold uppercase tracking-wider text-[#1a1c1a]">
                        SEKOLAH RAKYAT TERINTEGRASI 1 JEPARA
                      </h2>
                      <p className="text-xs text-[#1a1c1a]/70 font-semibold font-mono-custom">
                        REKAPITULASI DATA SANTRI, KAMAR ASRAMA & WALI ASUH
                      </p>
                      <div className="inline-block mt-2 px-3 py-1 bg-stone-100 border border-[#1a1c1a]/30 text-xs font-mono-custom font-bold text-[#1a1c1a]">
                        TOTAL: {siswaList.length} SANTRI · {kamarList.length} KAMAR · {waliAsuhList.length} WALI ASUH
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-xs font-mono-custom font-bold uppercase text-[#1a1c1a]">
                      // DAFTAR PENGHUNI ASRAMA SANTRI
                    </h3>
                    <table className="w-full text-left text-xs font-mono-custom border border-[#1a1c1a]">
                      <thead className="bg-[#1a1c1a] text-white font-bold">
                        <tr>
                          <th className="p-2 w-10 text-center">No</th>
                          <th className="p-2">NISN</th>
                          <th className="p-2">Nama Santri</th>
                          <th className="p-2">L/P</th>
                          <th className="p-2">Kelas</th>
                          <th className="p-2">Kamar</th>
                          <th className="p-2">Wali Asuh</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1c1a]/15">
                        {siswaList.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-4 text-center text-stone-500 italic">
                              Belum ada data santri yang terdaftar.
                            </td>
                          </tr>
                        ) : (
                          siswaList.map((s, idx) => {
                            const k = getKamar(s.kamarId);
                            const w = getWaliAsuh(s.waliAsuhId);
                            return (
                              <tr key={s.id}>
                                <td className="p-2 text-center">{idx + 1}</td>
                                <td className="p-2">{s.nisn}</td>
                                <td className="p-2 font-bold font-sans">{s.nama}</td>
                                <td className="p-2">{s.jenisKelamin}</td>
                                <td className="p-2">{s.kelas}</td>
                                <td className="p-2">{k?.nama || '-'}</td>
                                <td className="p-2">{formatWaliName(w) || '-'}</td>
                                <td className="p-2 font-bold">{s.status}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {showSignatures && (
                    <div className="pt-6 grid grid-cols-2 text-center text-xs font-mono-custom print-avoid-break">
                      <div>
                        <p className="text-[#1a1c1a]/60">Wali Asrama,</p>
                        <div className="h-14" />
                        <p className="font-bold underline text-[#1a1c1a]">{waliAsramaNama}</p>
                        {waliAsramaNip && (
                          <p className="text-[10px] text-[#1a1c1a]/60">NIP. {waliAsramaNip}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[#1a1c1a]/60">{tempatTanggalCetak}</p>
                        <p className="font-bold text-[#1a1c1a]">
                          Mengetahui, Kepala Sekolah
                        </p>
                        <div className="h-14" />
                        <p className="font-bold underline text-[#1a1c1a]">{kepalaSekolahNama}</p>
                        {kepalaSekolahNip && (
                          <p className="text-[10px] text-[#1a1c1a]/60">NIP. {kepalaSekolahNip}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
