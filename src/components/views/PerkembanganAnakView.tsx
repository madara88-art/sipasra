import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Award,
  Calendar,
  Search,
  Filter,
  Download,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Phone,
  Edit3,
  Trash2,
  MessageCircle,
  User,
  Home,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  ChevronRight,
  TrendingDown,
  Minus,
  Star,
  Layers,
  Heart,
  BookOpen,
  Users as UsersIcon,
  Smile,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { PerkembanganAnak, StatusPerkembangan, Siswa } from '../../types';
import { Modal } from '../common/Modal';

// Status options requested by user
export const STATUS_PERKEMBANGAN_LIST: StatusPerkembangan[] = [
  '📈 Berkembang',
  '➡️ Stabil',
  '📉 Menurun',
  '⭐ Sangat Baik',
  '⚠️ Perlu Pendampingan',
];

// Helper to convert Status to numeric score (0 - 100) for charts
export const statusToScore = (status: StatusPerkembangan): number => {
  switch (status) {
    case '⭐ Sangat Baik':
      return 100;
    case '📈 Berkembang':
      return 80;
    case '➡️ Stabil':
      return 65;
    case '⚠️ Perlu Pendampingan':
      return 45;
    case '📉 Menurun':
      return 30;
    default:
      return 70;
  }
};

// Helper for status styling badge
export const getStatusBadgeClass = (status: StatusPerkembangan) => {
  switch (status) {
    case '⭐ Sangat Baik':
      return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    case '📈 Berkembang':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
    case '➡️ Stabil':
      return 'bg-blue-100 text-blue-900 border-blue-300 font-semibold';
    case '⚠️ Perlu Pendampingan':
      return 'bg-orange-100 text-orange-900 border-orange-300 font-bold';
    case '📉 Menurun':
      return 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
};

export const PerkembanganAnakView: React.FC = () => {
  const {
    perkembanganList,
    siswaList,
    addPerkembangan,
    updatePerkembangan,
    deletePerkembangan,
    getSiswa,
    getKamar,
    getWaliAsuh,
  } = useApp();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState<string>('Semua');
  const [selectedKamarFilter, setSelectedKamarFilter] = useState<string>('Semua');
  const [chartSiswaFilter, setChartSiswaFilter] = useState<string>('ALL'); // 'ALL' or specific siswaId

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PerkembanganAnak | null>(null);

  // Form State
  const defaultForm = {
    periodeEvaluasi: 'September 2026',
    tanggalEvaluasi: new Date().toISOString().split('T')[0],
    siswaId: siswaList[0]?.id || '',
    kamar: '',
    waliAsuh: '',
    kemandirian: {
      sebelumnya: 'Sering dibantu',
      sekarang: 'Mulai mandiri',
      status: '📈 Berkembang' as StatusPerkembangan,
    },
    kebersihan: {
      sebelumnya: 'Sering diingatkan',
      sekarang: 'Sesekali diingatkan',
      status: '📈 Berkembang' as StatusPerkembangan,
    },
    belajar: {
      sebelumnya: 'Mudah terdistraksi',
      sekarang: 'Mulai fokus',
      status: '📈 Berkembang' as StatusPerkembangan,
    },
    sosial: {
      sebelumnya: 'Sering konflik',
      sekarang: 'Lebih mampu bekerja sama',
      status: '📈 Berkembang' as StatusPerkembangan,
    },
    catatanEvaluasi: 'Menunjukkan perkembangan karakter yang baik dan aktif beradaptasi di asrama.',
    pesanUntukOrangTua: 'Ananda semakin mandiri dan percaya diri di asrama. Mohon terus diapresiasi.',
    dievaluasiOleh: 'Ust. Jendral, S.Pd.I & Pamong Pengasuhan',
  };

  const [formData, setFormData] = useState(defaultForm);

  // Unique periods list for filter
  const periodeOptions = useMemo(() => {
    const set = new Set<string>();
    perkembanganList.forEach((p) => {
      const per = p.periodeEvaluasi || p.periodeBulan;
      if (per) set.add(per);
    });
    // Ensure September, Agustus, Juli are present
    set.add('September 2026');
    set.add('Agustus 2026');
    set.add('Juli 2026');
    return Array.from(set);
  }, [perkembanganList]);

  // Sync kamar and wali asuh when siswaId changes in form
  const handleSiswaChange = (id: string) => {
    const s = getSiswa(id);
    const k = getKamar(s?.kamarId);
    const w = getWaliAsuh(s?.waliAsuhId);
    setFormData((prev) => ({
      ...prev,
      siswaId: id,
      kamar: k?.nama || '',
      waliAsuh: w?.nama || '',
    }));
  };

  // Open add modal
  const handleOpenAdd = () => {
    const s0 = siswaList[0];
    const k = getKamar(s0?.kamarId);
    const w = getWaliAsuh(s0?.waliAsuhId);
    setFormData({
      ...defaultForm,
      siswaId: s0?.id || '',
      kamar: k?.nama || '',
      waliAsuh: w?.nama || '',
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (item: PerkembanganAnak) => {
    const s = getSiswa(item.siswaId);
    const k = getKamar(s?.kamarId);
    const w = getWaliAsuh(s?.waliAsuhId);

    setEditingItem(item);
    setFormData({
      periodeEvaluasi: item.periodeEvaluasi || item.periodeBulan || 'September 2026',
      tanggalEvaluasi: item.tanggalEvaluasi || new Date().toISOString().split('T')[0],
      siswaId: item.siswaId,
      kamar: item.kamar || k?.nama || '',
      waliAsuh: item.waliAsuh || w?.nama || '',
      kemandirian: item.kemandirian || {
        sebelumnya: 'Sering dibantu',
        sekarang: 'Mulai mandiri',
        status: '📈 Berkembang',
      },
      kebersihan: item.kebersihan || {
        sebelumnya: 'Sering diingatkan',
        sekarang: 'Sesekali diingatkan',
        status: '📈 Berkembang',
      },
      belajar: item.belajar || {
        sebelumnya: 'Mudah terdistraksi',
        sekarang: 'Mulai fokus',
        status: '📈 Berkembang',
      },
      sosial: item.sosial || {
        sebelumnya: 'Sering konflik',
        sekarang: 'Lebih mampu bekerja sama',
        status: '📈 Berkembang',
      },
      catatanEvaluasi: item.catatanEvaluasi || item.catatanKemandirian || '',
      pesanUntukOrangTua: item.pesanUntukOrangTua || '',
      dievaluasiOleh: item.dievaluasiOleh || 'Pamong Pengasuhan',
    });
    setIsModalOpen(true);
  };

  // Save Add or Edit
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      periodeEvaluasi: formData.periodeEvaluasi,
      periodeBulan: formData.periodeEvaluasi,
      tanggalEvaluasi: formData.tanggalEvaluasi,
      siswaId: formData.siswaId,
      kamar: formData.kamar,
      waliAsuh: formData.waliAsuh,
      kemandirian: formData.kemandirian,
      kebersihan: formData.kebersihan,
      belajar: formData.belajar,
      sosial: formData.sosial,
      catatanEvaluasi: formData.catatanEvaluasi,
      pesanUntukOrangTua: formData.pesanUntukOrangTua,
      dievaluasiOleh: formData.dievaluasiOleh,
      // scores
      skorKemandirian: formData.kemandirian.status === '⭐ Sangat Baik' ? 4 : 3,
      skorSosialisasi: formData.sosial.status === '⭐ Sangat Baik' ? 4 : 3,
      skorIbadahAkhlak: 4,
      skorDisiplin: formData.kebersihan.status === '⭐ Sangat Baik' ? 4 : 3,
      skorBelajar: formData.belajar.status === '⭐ Sangat Baik' ? 4 : 3,
    };

    if (editingItem) {
      updatePerkembangan(editingItem.id, payload);
    } else {
      addPerkembangan(payload);
    }
    setIsModalOpen(false);
  };

  // Delete evaluation
  const handleDelete = (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus data evaluasi perkembangan ${nama}?`)) {
      deletePerkembangan(id);
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return perkembanganList.filter((item) => {
      const s = getSiswa(item.siswaId);
      const k = getKamar(s?.kamarId);
      const matchSearch =
        !searchQuery ||
        s?.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s?.panggilan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.catatanEvaluasi && item.catatanEvaluasi.toLowerCase().includes(searchQuery.toLowerCase()));

      const itemPeriode = item.periodeEvaluasi || item.periodeBulan;
      const matchPeriode = selectedPeriode === 'Semua' || itemPeriode === selectedPeriode;
      const matchKamar = selectedKamarFilter === 'Semua' || s?.kamarId === selectedKamarFilter;

      return matchSearch && matchPeriode && matchKamar;
    });
  }, [perkembanganList, searchQuery, selectedPeriode, selectedKamarFilter, siswaList]);

  // =========================================================
  // DATA CALCULATION FOR GRAFIK PERKEMBANGAN BULANAN
  // =========================================================
  const monthlyChartData = useMemo(() => {
    const months = ['Juli 2026', 'Agustus 2026', 'September 2026'];

    // If specific student selected or all
    const relevantRecords = (month: string) => {
      return perkembanganList.filter((item) => {
        const itemMonth = item.periodeEvaluasi || item.periodeBulan;
        const matchesMonth = itemMonth === month;
        const matchesSiswa = chartSiswaFilter === 'ALL' || item.siswaId === chartSiswaFilter;
        return matchesMonth && matchesSiswa;
      });
    };

    const dataPerMonth = months.map((month) => {
      const records = relevantRecords(month);
      if (records.length === 0) {
        return {
          month,
          count: 0,
          kemandirianAvg: 0,
          kebersihanAvg: 0,
          belajarAvg: 0,
          sosialAvg: 0,
          overallAvg: 0,
          statusCounts: {
            '⭐ Sangat Baik': 0,
            '📈 Berkembang': 0,
            '➡️ Stabil': 0,
            '⚠️ Perlu Pendampingan': 0,
            '📉 Menurun': 0,
          },
        };
      }

      let kemandirianSum = 0;
      let kebersihanSum = 0;
      let belajarSum = 0;
      let sosialSum = 0;

      const statusCounts = {
        '⭐ Sangat Baik': 0,
        '📈 Berkembang': 0,
        '➡️ Stabil': 0,
        '⚠️ Perlu Pendampingan': 0,
        '📉 Menurun': 0,
      };

      records.forEach((rec) => {
        const kScore = rec.kemandirian ? statusToScore(rec.kemandirian.status) : 70;
        const bScore = rec.kebersihan ? statusToScore(rec.kebersihan.status) : 70;
        const lScore = rec.belajar ? statusToScore(rec.belajar.status) : 70;
        const sScore = rec.sosial ? statusToScore(rec.sosial.status) : 70;

        kemandirianSum += kScore;
        kebersihanSum += bScore;
        belajarSum += lScore;
        sosialSum += sScore;

        if (rec.kemandirian?.status) statusCounts[rec.kemandirian.status]++;
        if (rec.kebersihan?.status) statusCounts[rec.kebersihan.status]++;
        if (rec.belajar?.status) statusCounts[rec.belajar.status]++;
        if (rec.sosial?.status) statusCounts[rec.sosial.status]++;
      });

      const count = records.length;
      const kemandirianAvg = Math.round(kemandirianSum / count);
      const kebersihanAvg = Math.round(kebersihanSum / count);
      const belajarAvg = Math.round(belajarSum / count);
      const sosialAvg = Math.round(sosialSum / count);
      const overallAvg = Math.round((kemandirianAvg + kebersihanAvg + belajarAvg + sosialAvg) / 4);

      return {
        month,
        count,
        kemandirianAvg,
        kebersihanAvg,
        belajarAvg,
        sosialAvg,
        overallAvg,
        statusCounts,
      };
    });

    return dataPerMonth;
  }, [perkembanganList, chartSiswaFilter]);

  // Export to Excel
  const exportToExcel = () => {
    const rows = filteredList.map((item, idx) => {
      const s = getSiswa(item.siswaId);
      const k = getKamar(s?.kamarId);
      const w = getWaliAsuh(s?.waliAsuhId);

      return {
        No: idx + 1,
        'Periode Evaluasi': item.periodeEvaluasi || item.periodeBulan || '-',
        'Tanggal Evaluasi': item.tanggalEvaluasi || '-',
        NISN: s?.nisn || '-',
        'Nama Siswa': s?.nama || '-',
        Kelas: s?.kelas || '-',
        Kamar: item.kamar || k?.nama || '-',
        'Wali Asuh': item.waliAsuh || w?.nama || '-',
        // 1. Kemandirian
        'Kemandirian (Sebelumnya)': item.kemandirian?.sebelumnya || '-',
        'Kemandirian (Sekarang)': item.kemandirian?.sekarang || '-',
        'Kemandirian (Status)': item.kemandirian?.status || '-',
        // 2. Kebersihan
        'Kebersihan (Sebelumnya)': item.kebersihan?.sebelumnya || '-',
        'Kebersihan (Sekarang)': item.kebersihan?.sekarang || '-',
        'Kebersihan (Status)': item.kebersihan?.status || '-',
        // 3. Belajar
        'Belajar (Sebelumnya)': item.belajar?.sebelumnya || '-',
        'Belajar (Sekarang)': item.belajar?.sekarang || '-',
        'Belajar (Status)': item.belajar?.status || '-',
        // 4. Sosial
        'Sosial (Sebelumnya)': item.sosial?.sebelumnya || '-',
        'Sosial (Sekarang)': item.sosial?.sekarang || '-',
        'Sosial (Status)': item.sosial?.status || '-',
        'Catatan Evaluasi': item.catatanEvaluasi || item.catatanKemandirian || '-',
        'Pesan untuk Orang Tua': item.pesanUntukOrangTua || '-',
        'Dievaluasi Oleh': item.dievaluasiOleh || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 14 },
      { wch: 14 },
      { wch: 24 },
      { wch: 8 },
      { wch: 16 },
      { wch: 22 },
      { wch: 25 },
      { wch: 25 },
      { wch: 18 },
      { wch: 25 },
      { wch: 25 },
      { wch: 18 },
      { wch: 25 },
      { wch: 25 },
      { wch: 18 },
      { wch: 25 },
      { wch: 25 },
      { wch: 18 },
      { wch: 35 },
      { wch: 35 },
      { wch: 22 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Perkembangan Santri');
    XLSX.writeFile(
      wb,
      `SIPASRA_Perkembangan_Anak_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  // Generate WhatsApp message text for parent
  const generateWAMessage = (item: PerkembanganAnak, siswa?: Siswa) => {
    if (!siswa) return '';
    const text = `*LAPORAN PERKEMBANGAN KARAKTER SANTRI*
Sekolah Rakyat 1 Jepara
-------------------------------------------
Nama Santri: *${siswa.nama}* (${siswa.kelas})
Kamar: *${item.kamar || getKamar(siswa.kamarId)?.nama || '-'}*
Wali Asuh: *${item.waliAsuh || getWaliAsuh(siswa.waliAsuhId)?.nama || '-'}*
Periode: *${item.periodeEvaluasi || item.periodeBulan}*
Tanggal Evaluasi: ${item.tanggalEvaluasi}

*1. KEMANDIRIAN*
- Sebelumnya: ${item.kemandirian?.sebelumnya}
- Sekarang: ${item.kemandirian?.sekarang}
- Status: ${item.kemandirian?.status}

*2. KEBERSIHAN*
- Sebelumnya: ${item.kebersihan?.sebelumnya}
- Sekarang: ${item.kebersihan?.sekarang}
- Status: ${item.kebersihan?.status}

*3. BELAJAR*
- Sebelumnya: ${item.belajar?.sebelumnya}
- Sekarang: ${item.belajar?.sekarang}
- Status: ${item.belajar?.status}

*4. SOSIAL*
- Sebelumnya: ${item.sosial?.sebelumnya}
- Sekarang: ${item.sosial?.sekarang}
- Status: ${item.sosial?.status}

*Catatan Wali Asuh:*
"${item.catatanEvaluasi || item.catatanKemandirian || '-'}"

*Pesan untuk Ayah & Bunda:*
"${item.pesanUntukOrangTua || '-'}"

Salam Takzim,
Pamong Pengasuhan Sekolah Rakyat 1 Jepara`;

    return encodeURIComponent(text);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Editorial Header */}
      <div className="bg-[#006b54] text-white border-[2px] border-[#1a1c1a] neo-shadow-md p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <TrendingUp className="w-56 h-56 text-white" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white text-[#1a1c1a] text-[10px] font-mono-custom font-extrabold uppercase mb-2 border border-[#1a1c1a]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            EVALUASI PERKEMBANGAN & PENGASUHAN KARAKTER SANTRI
          </div>
          <h1 className="font-syne text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Perkembangan Anak (Karakter & Kemandirian)
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-mono-custom mt-1.5 leading-relaxed">
            Pemantauan berkala 4 pilar perkembangan: <strong>Kemandirian</strong>, <strong>Kebersihan</strong>, <strong>Belajar</strong>, dan <strong>Sosial</strong> santri asrama Sekolah Rakyat 1 Jepara.
          </p>

          {/* Quick Legend of 5 Statuses */}
          <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center gap-2 text-[11px] font-mono-custom font-bold">
            <span className="text-white/70 text-[10px] uppercase">STATUS INDIKATOR:</span>
            {STATUS_PERKEMBANGAN_LIST.map((st) => (
              <span
                key={st}
                className="px-2 py-0.5 bg-white/15 text-white border border-white/20 rounded text-[10px]"
              >
                {st}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: GRAFIK PERKEMBANGAN BULANAN                   */}
      {/* ========================================================= */}
      <div className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1a1c1a]/15 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006b54] font-mono-custom uppercase">
              <BarChart3 className="w-4 h-4" />
              GRAFIK PERKEMBANGAN BULANAN
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1a1c1a] font-syne">
              Tren Evaluasi 4 Aspek (Juli - September 2026)
            </h2>
            <p className="text-[11px] text-[#1a1c1a]/60 font-mono-custom">
              Membandingkan skor rata-rata indeks capaian (0-100%) antar bulan
            </p>
          </div>

          {/* Filter Santri for Chart */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold font-mono-custom text-[#1a1c1a]/70 uppercase">
              Filter Grafik:
            </span>
            <select
              value={chartSiswaFilter}
              onChange={(e) => setChartSiswaFilter(e.target.value)}
              className="px-2.5 py-1.5 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-[#006b54]"
            >
              <option value="ALL">👥 Seluruh Santri Asrama (Agregat)</option>
              {siswaList.map((s) => (
                <option key={s.id} value={s.id}>
                  👤 {s.nama} ({s.kelas})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Bar Charts: Per-Month Breakdown for 4 Aspek */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {monthlyChartData.map((mData, idx) => {
            const isLatest = idx === monthlyChartData.length - 1;
            return (
              <div
                key={mData.month}
                className={`p-4 border-[1.5px] border-[#1a1c1a] transition-all ${
                  isLatest ? 'bg-emerald-50/50 neo-shadow-sm border-[#006b54]' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-[10px] font-mono-custom font-extrabold uppercase px-1.5 py-0.5 border border-[#1a1c1a] bg-white text-[#1a1c1a]">
                      {mData.month}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono-custom ml-2">
                      ({mData.count} Evaluasi)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono-custom text-slate-500 block">Indeks Capaian</span>
                    <span className="font-syne font-extrabold text-base text-[#006b54]">
                      {mData.overallAvg}%
                    </span>
                  </div>
                </div>

                {/* 4 Bars for the aspects */}
                <div className="space-y-2.5 text-xs font-mono-custom">
                  {/* 1. Kemandirian */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-emerald-600" />
                        Kemandirian
                      </span>
                      <span className="font-bold text-emerald-800">{mData.kemandirianAvg}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-[#1a1c1a]/30">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${mData.kemandirianAvg}%` }}
                      />
                    </div>
                  </div>

                  {/* 2. Kebersihan */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        Kebersihan
                      </span>
                      <span className="font-bold text-blue-800">{mData.kebersihanAvg}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-[#1a1c1a]/30">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${mData.kebersihanAvg}%` }}
                      />
                    </div>
                  </div>

                  {/* 3. Belajar */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-purple-600" />
                        Belajar & Fokus
                      </span>
                      <span className="font-bold text-purple-800">{mData.belajarAvg}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-[#1a1c1a]/30">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${mData.belajarAvg}%` }}
                      />
                    </div>
                  </div>

                  {/* 4. Sosial */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <UsersIcon className="w-3 h-3 text-amber-600" />
                        Sosial & Empati
                      </span>
                      <span className="font-bold text-amber-800">{mData.sosialAvg}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-[#1a1c1a]/30">
                      <div
                        className="bg-amber-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${mData.sosialAvg}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Status distribution mini badges */}
                <div className="mt-3 pt-2.5 border-t border-[#1a1c1a]/10 flex flex-wrap gap-1 text-[10px]">
                  <span className="text-slate-500">Distribusi:</span>
                  <span className="bg-amber-100 text-amber-800 px-1 rounded font-bold">
                    ⭐ {mData.statusCounts['⭐ Sangat Baik']}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 px-1 rounded font-bold">
                    📈 {mData.statusCounts['📈 Berkembang']}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-1 rounded font-bold">
                    ➡️ {mData.statusCounts['➡️ Stabil']}
                  </span>
                  {mData.statusCounts['⚠️ Perlu Pendampingan'] > 0 && (
                    <span className="bg-orange-100 text-orange-800 px-1 rounded font-bold">
                      ⚠️ {mData.statusCounts['⚠️ Perlu Pendampingan']}
                    </span>
                  )}
                  {mData.statusCounts['📉 Menurun'] > 0 && (
                    <span className="bg-rose-100 text-rose-800 px-1 rounded font-bold">
                      📉 {mData.statusCounts['📉 Menurun']}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Highlight Insights */}
        <div className="bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] p-3 text-xs font-mono-custom flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span className="font-bold text-slate-800">
              Insight Evaluasi Bulanan:
            </span>
            <span className="text-slate-600">
              Pertumbuhan paling signifikan terjadi pada aspek <strong>Kemandirian Diri</strong> (+25% dari Juli ke September), berkat pembiasaan rutin piket pagi dan penataan loker lemari santri.
            </span>
          </div>

          <div className="text-[11px] text-[#006b54] font-bold">
            Pamong Pendamping: Ust. Jendral & Ust. Saiful
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: DAFTAR EVALUASI PERKEMBANGAN ANAK             */}
      {/* ========================================================= */}
      <div className="space-y-4">
        {/* Toolbar & Filter Bar */}
        <div className="bg-white p-4 border-[1.5px] border-[#1a1c1a] neo-shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#1a1c1a] font-syne uppercase tracking-wide flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#006b54]" />
                Rekam Evaluasi Perkembangan Anak
              </h2>
              <p className="text-[11px] text-[#1a1c1a]/60 font-mono-custom">
                Informasi: Periode Evaluasi, Nama Siswa, Kamar, Wali Asuh, Tanggal Evaluasi, dan 4 Aspek Penilaian
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={exportToExcel}
                className="neo-btn-outline flex items-center gap-1.5 text-xs py-2 px-3"
                title="Ekspor rekap perkembangan ke file Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>EXPORT EXCEL</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="neo-btn-primary flex items-center gap-1.5 text-xs py-2 px-3.5"
              >
                <Plus className="w-4 h-4" />
                <span>INPUT EVALUASI BARU</span>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="pt-3 border-t border-[#1a1c1a]/15 flex flex-wrap items-center gap-2 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#1a1c1a]/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari santri, catatan perkembangan, atau wali asuh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border-[1.5px] border-[#1a1c1a] text-xs font-mono-custom focus:outline-none focus:ring-1 focus:ring-[#006b54]"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-mono-custom text-[11px] font-bold text-[#1a1c1a]/70 uppercase">
                Periode:
              </span>
              <select
                value={selectedPeriode}
                onChange={(e) => setSelectedPeriode(e.target.value)}
                className="px-2.5 py-1.5 border-[1.5px] border-[#1a1c1a] bg-white font-mono-custom text-xs"
              >
                <option value="Semua">Semua Periode</option>
                {periodeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="font-mono-custom text-[11px] font-bold text-[#1a1c1a]/70 uppercase">
                Kamar:
              </span>
              <select
                value={selectedKamarFilter}
                onChange={(e) => setSelectedKamarFilter(e.target.value)}
                className="px-2.5 py-1.5 border-[1.5px] border-[#1a1c1a] bg-white font-mono-custom text-xs"
              >
                <option value="Semua">Semua Kamar</option>
                <option value="kam-1">Neptunus</option>
                <option value="kam-2">Jupiter</option>
                <option value="kam-3">Mars</option>
                <option value="kam-4">Venus</option>
                <option value="kam-5">Merkurius</option>
                <option value="kam-6">Bumi</option>
                <option value="kam-7">Saturnus</option>
                <option value="kam-8">Uranus</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cards of Child Development */}
        <div className="space-y-4">
          {filteredList.length === 0 ? (
            <div className="bg-white border-[1.5px] border-[#1a1c1a] p-10 text-center text-slate-500 font-mono-custom neo-shadow-sm">
              Tidak ada data evaluasi perkembangan santri yang sesuai filter.
            </div>
          ) : (
            filteredList.map((item) => {
              const siswa = getSiswa(item.siswaId);
              const kamar = getKamar(siswa?.kamarId);
              const wali = getWaliAsuh(siswa?.waliAsuhId);

              // 4 aspects requested
              const kemandirian = item.kemandirian || {
                sebelumnya: 'Sering dibantu',
                sekarang: 'Mulai mandiri',
                status: '📈 Berkembang' as StatusPerkembangan,
              };
              const kebersihan = item.kebersihan || {
                sebelumnya: 'Sering diingatkan',
                sekarang: 'Sesekali diingatkan',
                status: '📈 Berkembang' as StatusPerkembangan,
              };
              const belajar = item.belajar || {
                sebelumnya: 'Mudah terdistraksi',
                sekarang: 'Mulai fokus',
                status: '📈 Berkembang' as StatusPerkembangan,
              };
              const sosial = item.sosial || {
                sebelumnya: 'Sering konflik',
                sekarang: 'Lebih mampu bekerja sama',
                status: '📈 Berkembang' as StatusPerkembangan,
              };

              return (
                <div
                  key={item.id}
                  className="bg-white border-[1.5px] border-[#1a1c1a] neo-shadow-sm p-4 sm:p-5 space-y-4 hover:border-[#006b54] transition-all"
                >
                  {/* Card Header: Periode, Nama Siswa, Kamar, Wali Asuh, Tanggal Evaluasi */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#1a1c1a]/15 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#006b54] text-white font-syne font-bold text-base flex items-center justify-center shrink-0 border border-[#1a1c1a]">
                        {siswa?.panggilan?.slice(0, 2).toUpperCase() || 'SR'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-[#1a1c1a] font-syne">
                            {siswa?.nama || 'Santri'}
                          </h3>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 border border-slate-300 font-mono-custom font-semibold">
                            {siswa?.kelas} (NISN: {siswa?.nisn})
                          </span>
                        </div>

                        {/* Metadata row requested: Kamar & Wali Asuh */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-mono-custom text-slate-600 mt-1">
                          <div className="flex items-center gap-1.5">
                            <Home className="w-3.5 h-3.5 text-slate-500" />
                            <span>Kamar: <strong>{item.kamar || kamar?.nama || '-'}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Wali Asuh: <strong>{item.waliAsuh || wali?.nama || '-'}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Periode & Tanggal Evaluasi Badge */}
                    <div className="flex flex-wrap sm:flex-col items-end gap-1.5 font-mono-custom">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1a1c1a] text-white text-xs font-bold rounded">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        Periode: {item.periodeEvaluasi || item.periodeBulan || 'September 2026'}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Tanggal Evaluasi: <strong>{item.tanggalEvaluasi || '-'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* ASPEK YANG DINILAI: TABEL RESMI FORMAT PENGGUNA          */}
                  {/* | Aspek | Sebelumnya | Sekarang | Status |              */}
                  {/* ========================================================= */}
                  <div>
                    <div className="border-[1.5px] border-[#1a1c1a] overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono-custom">
                        <thead className="bg-[#1a1c1a] text-white text-[11px] uppercase tracking-wider font-bold">
                          <tr>
                            <th className="p-2.5 w-1/5">Aspek</th>
                            <th className="p-2.5 w-1/3">Sebelumnya</th>
                            <th className="p-2.5 w-1/3">Sekarang</th>
                            <th className="p-2.5 w-1/6 whitespace-nowrap">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1c1a]/15 bg-white">
                          {/* 1. Kemandirian */}
                          <tr className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                              <Heart className="w-3.5 h-3.5 text-emerald-600" />
                              Kemandirian
                            </td>
                            <td className="p-2.5 text-slate-600">{kemandirian.sebelumnya}</td>
                            <td className="p-2.5 text-slate-900 font-semibold">{kemandirian.sekarang}</td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[11px] border ${getStatusBadgeClass(kemandirian.status)}`}>
                                {kemandirian.status}
                              </span>
                            </td>
                          </tr>

                          {/* 2. Kebersihan */}
                          <tr className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                              Kebersihan
                            </td>
                            <td className="p-2.5 text-slate-600">{kebersihan.sebelumnya}</td>
                            <td className="p-2.5 text-slate-900 font-semibold">{kebersihan.sekarang}</td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[11px] border ${getStatusBadgeClass(kebersihan.status)}`}>
                                {kebersihan.status}
                              </span>
                            </td>
                          </tr>

                          {/* 3. Belajar */}
                          <tr className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                              Belajar
                            </td>
                            <td className="p-2.5 text-slate-600">{belajar.sebelumnya}</td>
                            <td className="p-2.5 text-slate-900 font-semibold">{belajar.sekarang}</td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[11px] border ${getStatusBadgeClass(belajar.status)}`}>
                                {belajar.status}
                              </span>
                            </td>
                          </tr>

                          {/* 4. Sosial */}
                          <tr className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                              <UsersIcon className="w-3.5 h-3.5 text-amber-600" />
                              Sosial
                            </td>
                            <td className="p-2.5 text-slate-600">{sosial.sebelumnya}</td>
                            <td className="p-2.5 text-slate-900 font-semibold">{sosial.sekarang}</td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[11px] border ${getStatusBadgeClass(sosial.status)}`}>
                                {sosial.status}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Catatan Evaluasi & Pesan Orang Tua */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono-custom">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                      <span className="font-bold text-slate-800 block mb-1">
                        📝 Catatan Wali Asuh / Pamong:
                      </span>
                      <p className="text-slate-700 leading-relaxed">
                        {item.catatanEvaluasi || item.catatanKemandirian || 'Ananda menunjukkan peningkatan adab dan kemandirian yang menggembirakan.'}
                      </p>
                    </div>

                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded">
                      <span className="font-bold text-amber-900 block mb-1 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-amber-700" />
                        Pesan untuk Orang Tua (Ayah & Bunda):
                      </span>
                      <p className="text-amber-950 italic leading-relaxed">
                        "{item.pesanUntukOrangTua || 'Mohon terus memberikan motivasi positif kepada ananda saat berkomunikasi.'}"
                      </p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1a1c1a]/15 text-xs font-mono-custom">
                    <div className="text-[11px] text-slate-500">
                      Dievaluasi oleh: <strong>{item.dievaluasiOleh || 'Pamong Pengasuhan'}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Parent */}
                      {siswa?.orangTua?.noHp && (
                        <a
                          href={`https://wa.me/${siswa.orangTua.noHp.replace(/\D/g, '')}?text=${generateWAMessage(item, siswa)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="neo-btn-outline py-1.5 px-3 flex items-center gap-1.5 text-emerald-800 hover:bg-emerald-50"
                          title="Kirimkan hasil evaluasi ke WhatsApp Orang Tua"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>KIRIM WA ORTU</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="neo-btn-outline py-1.5 px-3 flex items-center gap-1"
                        title="Edit data evaluasi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>EDIT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, siswa?.nama || 'Santri')}
                        className="neo-btn-outline py-1.5 px-2.5 text-rose-700 hover:bg-rose-50"
                        title="Hapus evaluasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: INPUT / EDIT EVALUASI PERKEMBANGAN ANAK            */}
      {/* ========================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Evaluasi Perkembangan Anak' : 'Input Evaluasi Perkembangan Anak'}
        subtitle="Evaluasi Karakter, Kemandirian, Kebersihan, Belajar & Sosial"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveForm} className="space-y-4 text-xs sm:text-sm font-mono-custom">
          {/* Row 1: Periode & Tanggal Evaluasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                1. Periode Evaluasi *
              </label>
              <select
                value={formData.periodeEvaluasi}
                onChange={(e) => setFormData({ ...formData, periodeEvaluasi: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006b54]"
              >
                <option value="September 2026">September 2026</option>
                <option value="Oktober 2026">Oktober 2026</option>
                <option value="November 2026">November 2026</option>
                <option value="Desember 2026">Desember 2026</option>
                <option value="Agustus 2026">Agustus 2026</option>
                <option value="Juli 2026">Juli 2026</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                2. Tanggal Evaluasi *
              </label>
              <input
                type="date"
                required
                value={formData.tanggalEvaluasi}
                onChange={(e) => setFormData({ ...formData, tanggalEvaluasi: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs focus:outline-none focus:ring-1 focus:ring-[#006b54]"
              />
            </div>
          </div>

          {/* Row 2: Nama Siswa, Kamar, Wali Asuh */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                3. Nama Siswa *
              </label>
              <select
                required
                value={formData.siswaId}
                onChange={(e) => handleSiswaChange(e.target.value)}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#006b54]"
              >
                {siswaList.map((s) => {
                  const k = getKamar(s.kamarId);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas} - {k?.nama})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                4. Kamar Asrama
              </label>
              <input
                type="text"
                value={formData.kamar}
                onChange={(e) => setFormData({ ...formData, kamar: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                5. Wali Asuh
              </label>
              <input
                type="text"
                value={formData.waliAsuh}
                onChange={(e) => setFormData({ ...formData, waliAsuh: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs bg-slate-50"
              />
            </div>
          </div>

          {/* ASPEK 1: KEMANDIRIAN */}
          <div className="p-3 border-[1.5px] border-[#1a1c1a] bg-emerald-50/30 space-y-2">
            <span className="font-bold text-slate-900 block uppercase text-xs flex items-center gap-1.5 text-emerald-800">
              <Heart className="w-3.5 h-3.5" />
              Aspek 1: Kemandirian
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Sebelumnya</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sering dibantu"
                  value={formData.kemandirian.sebelumnya}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kemandirian: { ...formData.kemandirian, sebelumnya: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-[#1a1c1a] text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Sekarang</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mulai mandiri"
                  value={formData.kemandirian.sekarang}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kemandirian: { ...formData.kemandirian, sekarang: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-[#1a1c1a] text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Status Evaluasi</label>
                <select
                  value={formData.kemandirian.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kemandirian: {
                        ...formData.kemandirian,
                        status: e.target.value as StatusPerkembangan,
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-[#1a1c1a] text-xs bg-white font-bold"
                >
                  {STATUS_PERKEMBANGAN_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ASPEK 2: KEBERSIHAN */}
          <div className="p-3 border-[1.5px] border-[#1a1c1a] bg-blue-50/30 space-y-2">
            <span className="font-bold text-slate-900 block uppercase text-xs flex items-center gap-1.5 text-blue-800">
              <Sparkles className="w-3.5 h-3.5" />
              Aspek 2: Kebersihan
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Sebelumnya</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sering diingatkan"
                  value={formData.kebersihan.sebelumnya}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kebersihan: { ...formData.kebersihan, sebelumnya: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-[#1a1c1a] text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Sekarang</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sesekali diingatkan"
                  value={formData.kebersihan.sekarang}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kebersihan: { ...formData.kebersihan, sekarang: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-[#1a1c1a] text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Status Evaluasi</label>
                <select
                  value={formData.kebersihan.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kebersihan: {
                        ...formData.kebersihan,
                        status: e.target.value as StatusPerkembangan,
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-[#1a1c1a] text-xs bg-white font-bold"
                >
                  {STATUS_PERKEMBANGAN_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ASPEK 3: BELAJAR */}
          <div className="p-3 border-[1.5px] border-[#1a1c1a] bg-purple-50/30 space-y-2">
            <span className="font-bold text-slate-900 block uppercase text-xs flex items-center gap-1.5 text-purple-800">
              <BookOpen className="w-3.5 h-3.5" />
              Aspek 3: Belajar
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Sebelumnya</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mudah terdistraksi"
                  value={formData.belajar.sebelumnya}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      belajar: { ...formData.belajar, sebelumnya: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-[#1a1c1a] text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Sekarang</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mulai fokus"
                  value={formData.belajar.sekarang}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      belajar: { ...formData.belajar, sekarang: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-[#1a1c1a] text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Status Evaluasi</label>
                <select
                  value={formData.belajar.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      belajar: {
                        ...formData.belajar,
                        status: e.target.value as StatusPerkembangan,
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-[#1a1c1a] text-xs bg-white font-bold"
                >
                  {STATUS_PERKEMBANGAN_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ASPEK 4: SOSIAL */}
          <div className="p-3 border-[1.5px] border-[#1a1c1a] bg-amber-50/30 space-y-2">
            <span className="font-bold text-slate-900 block uppercase text-xs flex items-center gap-1.5 text-amber-800">
              <UsersIcon className="w-3.5 h-3.5" />
              Aspek 4: Sosial
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Sebelumnya</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sering konflik"
                  value={formData.sosial.sebelumnya}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sosial: { ...formData.sosial, sebelumnya: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-[#1a1c1a] text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Sekarang</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lebih mampu bekerja sama"
                  value={formData.sosial.sekarang}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sosial: { ...formData.sosial, sekarang: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-[#1a1c1a] text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Status Evaluasi</label>
                <select
                  value={formData.sosial.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sosial: {
                        ...formData.sosial,
                        status: e.target.value as StatusPerkembangan,
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-[#1a1c1a] text-xs bg-white font-bold"
                >
                  {STATUS_PERKEMBANGAN_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 4: Catatan & Pesan Ortu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                Catatan Evaluasi Pamong / Wali Asuh
              </label>
              <textarea
                rows={2}
                placeholder="Tuliskan catatan perkembangan karakter ananda..."
                value={formData.catatanEvaluasi}
                onChange={(e) => setFormData({ ...formData, catatanEvaluasi: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1a1c1a] mb-1 uppercase">
                Pesan untuk Orang Tua (Ayah & Bunda)
              </label>
              <textarea
                rows={2}
                placeholder="Pesan pengasuhan yang akan dikirim ke orang tua..."
                value={formData.pesanUntukOrangTua}
                onChange={(e) => setFormData({ ...formData, pesanUntukOrangTua: e.target.value })}
                className="w-full px-3 py-2 border-[1.5px] border-[#1a1c1a] text-xs"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#1a1c1a]/15">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="neo-btn-outline py-2 px-4 text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="neo-btn-primary py-2 px-5 text-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingItem ? 'Simpan Perubahan Evaluasi' : 'Simpan Evaluasi Santri'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
