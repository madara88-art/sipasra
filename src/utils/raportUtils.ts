import {
  Siswa,
  Kamar,
  WaliAsuh,
  IbadahRecord,
  KebersihanSantriRecord,
  KebersihanKamar,
  CatatanKesehatan,
  CatatanKonseling,
  PelanggaranPembinaan,
  PerkembanganAnak,
  PredikatRaport,
  RaportPengasuhan,
  NilaiAspekRaport,
} from '../types';

export const ASPEK_LIST = [
  { key: 'kemandirian', label: 'Kemandirian', deskripsi: 'Kerapian ranjang pribadi, mandiri berpakaian, makan, dan merawat barang bawaan' },
  { key: 'kebersihan', label: 'Kebersihan & Kerapian', deskripsi: 'Piket kamar, kebersihan badan/mandi, locket lemari, dan kepatuhan cuci tangan/alat makan' },
  { key: 'ibadah', label: 'Ibadah & Adab', deskripsi: 'Ketertiban sholat 5 waktu berjamaah, dhuha, adab masjid, dan keaktifan halaqah Al-Qur\'an' },
  { key: 'kedisiplinan', label: 'Kedisiplinan', deskripsi: 'Ketaatan jadwal asrama, bangun pagi, jam belajar, dan kepatuhan jam istirahat malam' },
  { key: 'belajar', label: 'Belajar', deskripsi: 'Fokus saat bimbingan belajar malam, pengerjaan PR sekolah, dan literasi membaca' },
  { key: 'sosial', label: 'Sosial', deskripsi: 'Kerjasama dengan teman sekamar, empati, berbagi, dan menghindari perselisihan' },
  { key: 'emosi', label: 'Pengendalian Emosi', deskripsi: 'Kematangan mengelola rindu rumah (homesick), kesabaran saat antre, dan respon tenang' },
  { key: 'tanggungJawab', label: 'Tanggung Jawab', deskripsi: 'Menjaga fasilitas bersama asrama, kejujuran berkata, dan komitmen menuntaskan tugas' },
] as const;

export type AspekKey = typeof ASPEK_LIST[number]['key'];

/**
 * Predikat berdasarkan aturan user:
 * Skala 1 - 10:
 * 8 - 10 : Sangat Baik
 * 5 - 7.9 : Baik
 * 3 - 4.9 : Cukup
 * 1 - 2.9 : Pembinaan Khusus
 */
export const getPredikat10 = (score: number): PredikatRaport => {
  if (score >= 8.0) return 'Sangat Baik';
  if (score >= 5.0) return 'Baik';
  if (score >= 3.0) return 'Cukup';
  return 'Pembinaan Khusus';
};

/**
 * Predikat berdasarkan skala 1 - 4 (Sesuai contoh tabel user):
 * 3.6 - 4.0 : Sangat Baik (e.g. 3.7 & 3.6 -> Sangat Baik)
 * 3.0 - 3.59 : Baik (e.g. 3.5, 3.4, 3.2, 3.1, 3.0 -> Baik)
 * 2.0 - 2.99 : Cukup
 * 1.0 - 1.99 : Pembinaan Khusus
 */
export const getPredikat4 = (score: number): PredikatRaport => {
  if (score >= 3.6) return 'Sangat Baik';
  if (score >= 3.0) return 'Baik';
  if (score >= 2.0) return 'Cukup';
  return 'Pembinaan Khusus';
};

export const getPredikat = (score: number, skala: '1-4' | '1-10'): PredikatRaport => {
  return skala === '1-4' ? getPredikat4(score) : getPredikat10(score);
};

export const getPredikatBadgeClass = (predikat: PredikatRaport): string => {
  switch (predikat) {
    case 'Sangat Baik':
      return 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold';
    case 'Baik':
      return 'bg-teal-50 text-teal-900 border-teal-300 font-semibold';
    case 'Cukup':
      return 'bg-amber-100 text-amber-950 border-amber-300 font-semibold';
    case 'Pembinaan Khusus':
      return 'bg-rose-100 text-rose-950 border-rose-300 font-bold';
    default:
      return 'bg-stone-100 text-stone-800 border-stone-300';
  }
};

/**
 * Hitung otomatis nilai 8 aspek dari data menu-menu sebelumnya
 */
export const calculateAutoRaport = (
  siswa: Siswa,
  kamar: Kamar | undefined,
  waliAsuh: WaliAsuh | undefined,
  ibadahList: IbadahRecord[],
  kebersihanList: KebersihanKamar[],
  kesehatanList: CatatanKesehatan[],
  konselingList: CatatanKonseling[],
  pelanggaranList: PelanggaranPembinaan[],
  perkembanganList: PerkembanganAnak[],
  skala: '1-4' | '1-10' = '1-10'
): RaportPengasuhan => {
  // 1. Data Perkembangan Karakter Anak
  const perk = perkembanganList.find((p) => p.siswaId === siswa.id);

  // 2. Data Ibadah
  const siswaIbadah = ibadahList.filter((i) => i.siswaId === siswa.id);
  let sholatCount = 0;
  let sholatHadir = 0;
  siswaIbadah.forEach((rec) => {
    ['subuh', 'dhuha', 'duhur', 'ashar', 'maghrib', 'isya', 'diniyah'].forEach((w) => {
      const val = (rec as any)[w];
      if (val) {
        sholatCount++;
        if (val === 'Melaksanakan') sholatHadir++;
      }
    });
  });
  const rasioIbadah = sholatCount > 0 ? sholatHadir / sholatCount : 0.95;

  // 3. Data Kebersihan Kamar & Santri
  const nilaiKamar = kamar?.nilaiKebersihan || 4.2;
  const kamarKeb = kebersihanList.filter((k) => k.kamarId === siswa.kamarId);
  let cleanChecks = 0;
  let cleanPassed = 0;
  kamarKeb.forEach((k) => {
    cleanChecks += 4;
    if (k.kebersihanDiri) cleanPassed++;
    if (k.tempatTidur) cleanPassed++;
    if (k.locketLemari) cleanPassed++;
    if (k.piket) cleanPassed++;
  });
  const rasioKebersihan = cleanChecks > 0 ? cleanPassed / cleanChecks : 0.92;

  // 4. Data Pelanggaran & Kedisiplinan
  const siswaPelanggaran = pelanggaranList.filter((p) => p.siswaId === siswa.id);
  const activePelanggaran = siswaPelanggaran.filter(
    (p) => p.status === 'Dalam Pembinaan' || p.status === 'Sedang Berjalan'
  ).length;
  const monitoredPelanggaran = siswaPelanggaran.filter((p) => p.status === 'Dipantau').length;

  // 5. Data Konseling & Emosi
  const siswaKonseling = konselingList.filter((k) => k.siswaId === siswa.id);
  const activeKonseling = siswaKonseling.filter(
    (k) => k.status === 'Perlu Pemantauan' || k.status === 'Bimbingan Lanjutan'
  ).length;

  // 6. Evaluasi Skor 1-10
  // Kemandirian: default 8.6
  let valKemandirian = 8.6;
  if (perk?.kemandirian?.status === '⭐ Sangat Baik') valKemandirian = 9.2;
  else if (perk?.kemandirian?.status === '📈 Berkembang') valKemandirian = 8.5;
  else if (perk?.kemandirian?.status === '⚠️ Perlu Pendampingan') valKemandirian = 6.2;

  // Kebersihan: default 8.8
  let valKebersihan = Math.min(9.8, Math.max(5.5, 7.2 + (nilaiKamar / 5) * 1.5 + (rasioKebersihan - 0.8) * 1.5));
  valKebersihan = Math.round(valKebersihan * 10) / 10;

  // Ibadah & Adab: default 8.5
  let valIbadah = Math.min(9.8, Math.max(5.5, 6.2 + rasioIbadah * 3.4));
  valIbadah = Math.round(valIbadah * 10) / 10;

  // Kedisiplinan: default 8.8 (berkurang jika ada pelanggaran aktif)
  let valKedisiplinan = 8.8;
  if (activePelanggaran > 0) valKedisiplinan -= activePelanggaran * 1.2;
  if (monitoredPelanggaran > 0) valKedisiplinan -= monitoredPelanggaran * 0.6;
  valKedisiplinan = Math.min(9.5, Math.max(5.0, Math.round(valKedisiplinan * 10) / 10));

  // Belajar: default 8.2
  let valBelajar = 8.2;
  if (perk?.belajar?.status === '⭐ Sangat Baik') valBelajar = 9.0;
  else if (perk?.belajar?.status === '📈 Berkembang') valBelajar = 8.4;
  else if (perk?.belajar?.status === '⚠️ Perlu Pendampingan') valBelajar = 6.0;

  // Sosial: default 8.8
  let valSosial = 8.8;
  if (perk?.sosial?.status === '⭐ Sangat Baik') valSosial = 9.3;
  else if (perk?.sosial?.status === '📈 Berkembang') valSosial = 8.5;
  else if (perk?.sosial?.status === '⚠️ Perlu Pendampingan') valSosial = 6.4;

  // Pengendalian Emosi: default 8.4
  let valEmosi = 8.4;
  if (activeKonseling > 0) valEmosi -= activeKonseling * 0.8;
  valEmosi = Math.min(9.4, Math.max(5.2, Math.round(valEmosi * 10) / 10));

  // Tanggung Jawab: default
  let valTanggungJawab = Math.round(((valKedisiplinan + valKebersihan) / 2) * 10) / 10;

  // Scale 1-10 mapping (or if legacy 1-4 is requested, convert down)
  const transform = (v: number): number => {
    if (skala === '1-4') {
      // Map 1-10 to 1-4
      const down = 1 + ((v - 1) / 9) * 3;
      return Math.round(down * 10) / 10;
    }
    return Math.round(v * 10) / 10;
  };

  const kScore = transform(valKemandirian);
  const cScore = transform(valKebersihan);
  const iScore = transform(valIbadah);
  const dScore = transform(valKedisiplinan);
  const bScore = transform(valBelajar);
  const sScore = transform(valSosial);
  const eScore = transform(valEmosi);
  const tScore = transform(valTanggungJawab);

  const makeAspek = (nilai: number, catatan: string): NilaiAspekRaport => ({
    nilai,
    predikat: getPredikat(nilai, skala),
    catatan,
  });

  return {
    id: `rapor-${siswa.id}`,
    siswaId: siswa.id,
    periode: 'Semester Ganjil 2026/2027',
    tanggal: new Date().toISOString().split('T')[0],
    skala,
    aspek: {
      kemandirian: makeAspek(kScore, 'Mampu merapikan tempat tidur dan berpakaian mandiri tanpa perlu didorong berulang kali.'),
      kebersihan: makeAspek(cScore, 'Sangat tertib dalam piket kamar dan menjaga kebersihan loker pakaian pribadinya.'),
      ibadah: makeAspek(iScore, 'Konsisten sholat 5 waktu berjamaah di musholla asrama dan menyimak halaqah Al-Qur\'an.'),
      kedisiplinan: makeAspek(dScore, 'Mematuhi tata tertib jam asrama, antre makan dengan sopan, dan tidur tepat waktu.'),
      belajar: makeAspek(bScore, 'Menunjukkan ketekunan saat jam belajar malam dan antusias membaca buku cerita di perpustakaan.'),
      sosial: makeAspek(sScore, 'Memiliki empati tinggi, ramah, dan menjadi teman yang menyenangkan bagi kawan sekamarnya.'),
      emosi: makeAspek(eScore, 'Mampu menenangkan diri dengan baik saat rindu keluarga dan menyelesaikan masalah secara damai.'),
      tanggungJawab: makeAspek(tScore, 'Menjaga inventaris kamar dengan baik dan menuntaskan tugas pembiasaan harian tepat waktu.'),
    },
    catatanWaliAsuh:
      `Ananda ${siswa.nama} menunjukkan kematangan karakter yang sangat menggembirakan selama masa pengasuhan. Sikap ramah, mandiri, dan hormat kepada pamong menjadi teladan yang baik bagi teman-teman sekamar. Terus tingkatkan fokus belajar saat jam muroja'ah.`,
    pesanOrangTua:
      `Mohon Ayah/Bunda terus memberikan apresiasi dan motivasi hangat saat ananda libur berkunjung ke rumah, terutama pembiasaan bangun sholat subuh mandiri dan merapikan ranjang.`,
  };
};
