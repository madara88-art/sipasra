import {
  Siswa,
  Kamar,
  WaliAsuh,
  KegiatanHarianItem,
  PresensiKegiatan,
  KebersihanKamar,
  IbadahRecord,
  StatusIbadah,
  CatatanKesehatan,
  PemeriksaanCKG,
  SesiKonseling,
  PerkembanganAnak,
  PelanggaranPembinaan,
} from '../types';

// ==========================================
// DATA WALI ASUH KOSONG (SIAP INPUT MANUAL)
// ==========================================
export const INITIAL_WALI_ASUH: WaliAsuh[] = [];

// ==========================================
// DATA KAMAR KOSONG (SIAP INPUT MANUAL)
// ==========================================
export const INITIAL_KAMAR: Kamar[] = [];

// ==========================================
// DATA SISWA KOSONG (SIAP INPUT MANUAL ATAU IMPORT EXCEL/CSV)
// ==========================================
export const INITIAL_SISWA: Siswa[] = [];

// ==========================================
// KEGIATAN HARIAN RUTIN ASRAMA (20 KEGIATAN RESMI)
// ==========================================
export const INITIAL_KEGIATAN_HARIAN: KegiatanHarianItem[] = [
  {
    id: 'keg-1',
    waktuMulai: '03:45',
    waktuSelesai: '04:15',
    namaKegiatan: 'Bangun tidur & persiapan',
    fokusPengasuhan: 'Kemandirian, kebersihan diri',
    kategori: 'Kebersihan',
    penanggungJawab: 'Wali Asuh Piket Subuh',
    tempat: 'Kamar Asrama & Kamar Mandi',
    deskripsi: 'Bangun pagi tepat waktu, melipat selimut, mencuci muka, wudhu, dan persiapan ke masjid.',
  },
  {
    id: 'keg-2',
    waktuMulai: '04:15',
    waktuSelesai: '04:45',
    namaKegiatan: 'Salat Subuh berjamaah',
    fokusPengasuhan: 'Ibadah & kedisiplinan',
    kategori: 'Ibadah',
    penanggungJawab: 'Ust. Jendral, S.Pd.I',
    tempat: 'Masjid Asrama Al-Ikhlas',
    deskripsi: 'Salat sunnah qobliyah subuh, shalat subuh berjamaah tepat waktu, dzikir pagi dan doa bersama.',
  },
  {
    id: 'keg-3',
    waktuMulai: '04:45',
    waktuSelesai: '05:15',
    namaKegiatan: 'Kebersihan kamar & piket',
    fokusPengasuhan: 'Tanggung jawab',
    kategori: 'Kebersihan',
    penanggungJawab: 'Wali Asuh Kamar Masing-Masing',
    tempat: 'Kamar Asrama',
    deskripsi: 'Piket kebersihan kamar: menyapu, mengepel lantai, merapikan sprei dan bantal, serta menata loker pakaian.',
  },
  {
    id: 'keg-4',
    waktuMulai: '05:15',
    waktuSelesai: '05:45',
    namaKegiatan: 'Mandi, Piket & merapikan diri',
    fokusPengasuhan: 'Kebersihan diri',
    kategori: 'Kebersihan',
    penanggungJawab: 'Wali Asuh Piket Pagi',
    tempat: 'Kamar Mandi & Area Cuci',
    deskripsi: 'Mandi pagi tertib antrean, sikat gigi, cuci tangan dengan sabun, dan merapikan diri berpakaian seragam.',
  },
  {
    id: 'keg-5',
    waktuMulai: '06:15',
    waktuSelesai: '06:40',
    namaKegiatan: 'Apel & Sarapan',
    fokusPengasuhan: 'Disiplin & etika makan',
    kategori: 'Sosial',
    penanggungJawab: 'Ust. Luki, S.Pd',
    tempat: 'Ruang Makan Asrama',
    deskripsi: 'Apel pagi santri, sarapan bergizi bersama, doa sebelum & sesudah makan, dan mencuci wadah makan mandiri.',
  },
  {
    id: 'keg-6',
    waktuMulai: '06:30',
    waktuSelesai: '07:00',
    namaKegiatan: 'Persiapan menuju sekolah',
    fokusPengasuhan: 'Kerapian',
    kategori: 'Pendidikan',
    penanggungJawab: 'Ust. Saiful, S.Pd.I',
    tempat: 'Halaman Utama Sekolah Rakyat',
    deskripsi: 'Pemeriksaan kerapian seragam lengkap, sepatu, tas sekolah, dan doa bersama keberangkatan sekolah.',
  },
  {
    id: 'keg-7',
    waktuMulai: '12:00',
    waktuSelesai: '12:45',
    namaKegiatan: 'Istirahat, makan & Salat Zuhur',
    fokusPengasuhan: 'Pemulihan & ibadah',
    kategori: 'Ibadah',
    penanggungJawab: 'Ust. Saiful, S.Pd.I',
    tempat: 'Masjid Asrama & Ruang Makan',
    deskripsi: 'Kepulangan sekolah, wudhu, shalat Zuhur berjamaah, kuliah singkat adab, dan makan siang bergizi.',
  },
  {
    id: 'keg-8',
    waktuMulai: '12:45',
    waktuSelesai: '13:30',
    namaKegiatan: 'Istirahat/relaksasi',
    fokusPengasuhan: 'Keseimbangan aktivitas',
    kategori: 'Istirahat',
    tempat: 'Kamar Asrama Masing-Masing',
    penanggungJawab: 'Ust. Edition, S.Sos',
    deskripsi: 'Qoilulah atau istirahat relaksasi santri cilik untuk menjaga kebugaran tubuh dan daya konsentrasi.',
  },
  {
    id: 'keg-9',
    waktuMulai: '13:30',
    waktuSelesai: '14:30',
    namaKegiatan: 'Belajar/tugas sekolah',
    fokusPengasuhan: 'Akademik',
    kategori: 'Pendidikan',
    penanggungJawab: 'Ust. Jamal, S.Pd.SD',
    tempat: 'Ruang Belajar & Perpustakaan',
    deskripsi: 'Mengerjakan tugas/PR sekolah, membaca buku cerita edukatif, dan pendampingan materi akademik SD.',
  },
  {
    id: 'keg-10',
    waktuMulai: '14:30',
    waktuSelesai: '15:00',
    namaKegiatan: 'Salat Asar & persiapan',
    fokusPengasuhan: 'Ibadah',
    kategori: 'Ibadah',
    penanggungJawab: 'Ust. Farid, S.Pd',
    tempat: 'Masjid Asrama Al-Ikhlas',
    deskripsi: 'Wudhu tepat waktu, shalat Asar berjamaah di masjid, dan persiapan menuju kegiatan sore santri.',
  },
  {
    id: 'keg-11',
    waktuMulai: '15:00',
    waktuSelesai: '16:00',
    namaKegiatan: 'Olahraga/permainan edukatif',
    fokusPengasuhan: 'Fisik & sosial',
    kategori: 'Sosial',
    penanggungJawab: 'Ust. Farid & Ust. Arip',
    tempat: 'Lapangan Olahraga & Halaman',
    deskripsi: 'Olahraga gembira santri, permainan edukatif, melatih ketangkasan motorik, sportivitas dan kerjasama.',
  },
  {
    id: 'keg-12',
    waktuMulai: '16:00',
    waktuSelesai: '17:15',
    namaKegiatan: 'Mandi sore & kebersihan diri',
    fokusPengasuhan: 'PHBS',
    kategori: 'Kebersihan',
    penanggungJawab: 'Wali Asuh Piket Sore',
    tempat: 'Kamar Mandi Asrama',
    deskripsi: 'Penerapan Pola Hidup Bersih & Sehat (PHBS): mandi sore, berganti pakaian bersih, dan menyisir rambut.',
  },
  {
    id: 'keg-13',
    waktuMulai: '17:15',
    waktuSelesai: '18:00',
    namaKegiatan: 'Persiapan Magrib',
    fokusPengasuhan: 'Kerapian & ketenangan',
    kategori: 'Ibadah',
    tempat: 'Masjid & Serambi Asrama',
    penanggungJawab: 'Ust. Hasan, S.Ag',
    deskripsi: 'Mengenakan busana muslim rapi dan wangi, membawa mushaf Al-Qur\'an, duduk tenang membaca dzikir dan shalawat.',
  },
  {
    id: 'keg-14',
    waktuMulai: '18:00',
    waktuSelesai: '18:30',
    namaKegiatan: 'Salat Magrib berjamaah',
    fokusPengasuhan: 'Ibadah',
    kategori: 'Ibadah',
    penanggungJawab: 'Ust. Jendral, S.Pd.I',
    tempat: 'Masjid Asrama Al-Ikhlas',
    deskripsi: 'Shalat Magrib berjamaah tepat waktu, dzikir ma\'tsurat petang, dan muraja\'ah hafalan ayat Al-Qur\'an.',
  },
  {
    id: 'keg-15',
    waktuMulai: '18:30',
    waktuSelesai: '19:00',
    namaKegiatan: 'Makan malam',
    fokusPengasuhan: 'Etika & kebersamaan',
    kategori: 'Sosial',
    penanggungJawab: 'Ust. Luki, S.Pd',
    tempat: 'Ruang Makan Asrama',
    deskripsi: 'Makan malam bersama santri dengan tertib, menumbuhkan adab bersyukur, saling peduli, dan merapikan meja makan.',
  },
  {
    id: 'keg-16',
    waktuMulai: '19:00',
    waktuSelesai: '19:30',
    namaKegiatan: 'Salat Isya berjamaah',
    fokusPengasuhan: 'Ibadah',
    kategori: 'Ibadah',
    penanggungJawab: 'Ust. Saiful, S.Pd.I',
    tempat: 'Masjid Asrama Al-Ikhlas',
    deskripsi: 'Shalat Isya berjamaah di masjid dilanjutkan wejangan singkat pengasuhan karakter anak.',
  },
  {
    id: 'keg-17',
    waktuMulai: '19:30',
    waktuSelesai: '20:00',
    namaKegiatan: 'Jam belajar malam',
    fokusPengasuhan: 'Akademik',
    kategori: 'Pendidikan',
    penanggungJawab: 'Ust. Jamal, S.Pd.SD',
    tempat: 'Ruang Belajar Asrama',
    deskripsi: 'Membaca ulang materi pelajaran sekolah, persiapan jadwal esok hari, dan setoran hafalan mandiri.',
  },
  {
    id: 'keg-18',
    waktuMulai: '20:00',
    waktuSelesai: '21:15',
    namaKegiatan: 'Refleksi/evaluasi harian',
    fokusPengasuhan: 'Karakter & emosi',
    kategori: 'Sosial',
    penanggungJawab: 'Seluruh Wali Asuh Kamar',
    tempat: 'Kamar Masing-Masing',
    deskripsi: 'Lingkaran santri bersama wali asuh kamar: evaluasi emosi harian, apresiasi sikap baik, nasihat motivasi, dan doa penutup.',
  },
  {
    id: 'keg-19',
    waktuMulai: '21:15',
    waktuSelesai: '21:30',
    namaKegiatan: 'Persiapan tidur & cek kamar',
    fokusPengasuhan: 'Kerapian',
    kategori: 'Kebersihan',
    penanggungJawab: 'Wali Asuh Piket Malam',
    tempat: 'Kamar Asrama & Wastafel',
    deskripsi: 'Menggosok gigi, wudhu sebelum tidur, memeriksa ventilasi & pintu, merapikan sandal dan perlengkapan santri.',
  },
  {
    id: 'keg-20',
    waktuMulai: '21:30',
    waktuSelesai: '03:45',
    namaKegiatan: 'Jam malam/tidur',
    fokusPengasuhan: 'Istirahat',
    kategori: 'Istirahat',
    penanggungJawab: 'Seluruh Pamong Piket Malam',
    tempat: 'Ranjang Masing-Masing',
    deskripsi: 'Lampu kamar dipadamkan/mode tidur, pembacaan doa tidur bersama, istirahat malam santri tertib dan aman.',
  },
];

export const INITIAL_PRESENSI: PresensiKegiatan[] = [];

// 8 PENILAIAN KEBERSIHAN & KERAPIAN KAMAR
// Format 4 Aspek Resmi:
// 1. Kebersihan diri (ya/tidak)
// 2. Tempat tidur (ya/tidak)
// 3. Locket lemari (ya/tidak)
// 4. Piket (ya/tidak)
// ==========================================
export const INITIAL_KEBERSIHAN: KebersihanKamar[] = [];

export const INITIAL_IBADAH: IbadahRecord[] = INITIAL_SISWA.map((siswa) => {
  const isSakit = siswa.status === "Sakit";
  const isIzin = siswa.status === "Izin Pulang";
  const statusDefault: StatusIbadah = isSakit
    ? "Sakit"
    : isIzin
    ? "Izin"
    : "Melaksanakan";

  return {
    id: `ibd-${siswa.id}-2026-09-22`,
    tanggal: "2026-09-22",
    siswaId: siswa.id,
    subuh: statusDefault,
    dhuha: statusDefault,
    duhur: statusDefault,
    ashar: statusDefault,
    maghrib: statusDefault,
    isya: statusDefault,
    diniyah: statusDefault,
    dzuhur: statusDefault,
    adabMasjid: isSakit || isIzin ? "Cukup Tertib" : "Sangat Tertib",
  };
});

export const INITIAL_KESEHATAN: CatatanKesehatan[] = [];

export const INITIAL_CKG: PemeriksaanCKG[] = [];

export const INITIAL_KONSELING: SesiKonseling[] = [];

export const INITIAL_PERKEMBANGAN: PerkembanganAnak[] = [];

export const INITIAL_PELANGGARAN: PelanggaranPembinaan[] = [];
