export type MenuItemId =
  | 'dashboard'
  | 'siswa'
  | 'kamar'
  | 'wali-asuh'
  | 'kegiatan-harian'
  | 'kebersihan'
  | 'ibadah'
  | 'kesehatan'
  | 'konseling'
  | 'perkembangan-anak'
  | 'pelanggaran'
  | 'laporan';

export interface DokumenSiswa {
  foto?: string; // Data URL or Image URL
  fotoNama?: string;
  fotoUpdatedAt?: string;
  ktp?: string; // Data URL or Image URL
  ktpNama?: string;
  ktpNomor?: string; // NIK KTP Orang Tua / Wali (16 digit)
  ktpUpdatedAt?: string;
  kk?: string; // Data URL or Image URL
  kkNama?: string;
  kkNomor?: string; // Nomor KK (16 digit)
  kkUpdatedAt?: string;
  akte?: string; // Data URL or Image URL
  akteNama?: string;
  akteNomor?: string; // Nomor Registrasi Akta Kelahiran
  akteUpdatedAt?: string;
}

export interface Siswa {
  id: string;
  nisn: string;
  nama: string;
  panggilan: string;
  jenisKelamin: 'L' | 'P';
  kelas: '1 SD' | '2 SD' | '3 SD' | '4 SD' | '5 SD' | '6 SD';
  kamarId: string;
  waliAsuhId: string;
  orangTua: {
    namaAyah: string;
    namaIbu: string;
    noHp: string;
    alamat: string;
    kotaAsal: string;
  };
  tanggalMasuk: string;
  status: 'Aktif' | 'Izin Pulang' | 'Sakit';
  alergi?: string;
  catatanKhusus?: string;
  dokumen?: DokumenSiswa;
}

export interface Kamar {
  id: string;
  nama: string;
  gedung: 'Gedung Putra (Sultan Hadlirin)' | 'Gedung Putri (Ratu Shima)';
  lantai: 'Lantai 1' | 'Lantai 2';
  kapasitas: number;
  waliAsuhId: string;
  ketuaKamarId: string;
  nilaiKebersihan: number; // 1-5
  kondisiFasilitas: 'Sangat Baik' | 'Baik' | 'Perlu Perbaikan';
}

export interface WaliAsuh {
  id: string;
  nip: string;
  nama: string;
  gelar: string;
  jenisKelamin: 'L' | 'P';
  noHp: string;
  email: string;
  kamarBinaanIds: string[];
  fokusBimbingan: string;
  shiftPiket: 'Pagi (05:00 - 13:00)' | 'Sore (13:00 - 21:00)' | 'Malam (21:00 - 05:00)' | 'Pendamping Penuh';
  status: 'Bertugas' | 'Libur / Lepas Piket';
}

export interface KegiatanHarianItem {
  id: string;
  waktuMulai: string;
  waktuSelesai: string;
  namaKegiatan: string;
  fokusPengasuhan?: string;
  kategori: 'Ibadah' | 'Pendidikan' | 'Kebersihan' | 'Sosial' | 'Istirahat';
  penanggungJawab: string;
  tempat: string;
  deskripsi: string;
}

export interface PresensiKegiatan {
  id: string;
  tanggal: string;
  kegiatanId: string;
  siswaId: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Terlambat';
  keterangan?: string;
}

export interface KebersihanKamar {
  id: string;
  tanggal: string;
  kamarId: string;
  pemeriksaId: string;
  // 4 Aspek Resmi Kebersihan & Kerapian (Ya / Tidak atau Rapi / Tidak)
  kebersihanDiri: boolean; // 1. Kebersihan diri (ya / tidak)
  tempatTidur: boolean;    // 2. Tempat tidur (ya / tidak)
  locketLemari: boolean;   // 3. Locket lemari (ya / tidak)
  piket: boolean;          // 4. Piket (ya / tidak)
  // Legacy numeric scores for backward compatibility
  skorRanjang?: number; // 1-5
  skorLemari?: number;  // 1-5
  skorLantai?: number;  // 1-5
  skorKerapianDiri?: number; // 1-5
  catatan: string;
  tindakanEdukasi?: string;
}

export interface KebersihanSantriRecord {
  id: string;
  tanggal: string;
  siswaId: string;
  kamarId: string;
  kebersihanDiri: boolean; // 1. Kebersihan diri (ya / tidak)
  tempatTidur: boolean;    // 2. Tempat tidur (ya / tidak)
  locketLemari: boolean;   // 3. Locket lemari (ya / tidak)
  piket: boolean;          // 4. Piket (ya / tidak)
  catatan?: string;
}

export type StatusIbadah = 'Melaksanakan' | 'Sakit' | 'Izin' | 'Tidak Melaksanakan';

export type SesiIbadah =
  | 'subuh'
  | 'dhuha'
  | 'duhur'
  | 'ashar'
  | 'maghrib'
  | 'isya'
  | 'diniyah';

export interface IbadahRecord {
  id: string;
  tanggal: string;
  siswaId: string;
  subuh: StatusIbadah;
  dhuha: StatusIbadah;
  duhur: StatusIbadah;
  ashar: StatusIbadah;
  maghrib: StatusIbadah;
  isya: StatusIbadah;
  diniyah: StatusIbadah;
  catatan?: string;
  // Backward compatibility
  dzuhur?: StatusIbadah;
  tahajud?: boolean;
  setoranTahfidz?: string;
  adabMasjid?: 'Sangat Tertib' | 'Cukup Tertib' | 'Perlu Diingatkan';
}

export interface CatatanKesehatan {
  id: string;
  tanggal: string;
  siswaId: string;
  kondisi: 'Dalam Perawatan' | 'Observasi' | 'Sembuh' | 'Perlu Istirahat' | 'Rujuk Medis' | string;
  keluhan: string;
  penanganan: string;
  rujukan: string;
  catatan?: string;
  kamar?: string;
  waliAsuh?: string;

  // Backward compatibility fields
  suhuTubuh?: string;
  lokasiPerawatan?: 'Kamar Asrama' | 'Ruang UKS' | 'Puskesmas Tahunan' | 'RSUD RA Kartini Jepara';
  penangananObat?: string;
  jadwalObat?: string;
  status?: 'Dalam Perawatan' | 'Observasi' | 'Sembuh' | 'Rujuk Medis';
  dicatatOleh?: string;
  catatanPerkembangan?: string;
}

export interface PemeriksaanCKG {
  id: string;
  tanggal: string;
  siswaId: string;
  beratBadan: number; // in kg (contoh: 27.5)
  tinggiBadan: number; // in cm (contoh: 125)
  penglihatan: 'Normal (6/6)' | 'Rabun Jauh / Perlu Kacamata' | 'Iritasi Mata Ringan' | 'Normal' | string;
  kondisiGigi: 'Bersih & Sehat (Bebas Karies)' | 'Gigi Berlubang (Karies)' | 'Plak / Karang Gigi' | 'Gigi Goyang' | string;
  kondisiKuku: 'Pendek & Bersih' | 'Panjang / Perlu Dipotong' | 'Kotor / Kurang Bersih' | string;
  kebersihanDiri: 'Sangat Bersih & Mandiri' | 'Bersih' | 'Cukup / Perlu Bimbingan' | 'Kurang' | string;
  catatan?: string;
  pemeriksa?: string;
}

export type CatatanKonseling = SesiKonseling;

export interface SesiKonseling {
  id: string;
  tanggal: string;
  siswaId: string;
  kategori:
    | 'Homesick / Rindu Rumah'
    | 'Adaptasi Teman Sekamar'
    | 'Motivasi Belajar'
    | 'Nafsu Makan & Kebiasaan Mandiri'
    | 'Kecemasan / Emosi'
    | 'Kedisiplinan';
  uraianMasalah: string;
  pendekatanSolusi: string;
  rencanaTindakLanjut: string;
  status: 'Selesai' | 'Perlu Pemantauan' | 'Bimbingan Lanjutan';
  konselor: string;
}

export type StatusPerkembangan =
  | '📈 Berkembang'
  | '➡️ Stabil'
  | '📉 Menurun'
  | '⭐ Sangat Baik'
  | '⚠️ Perlu Pendampingan';

export interface EvaluasiAspekPerkembangan {
  sebelumnya: string;
  sekarang: string;
  status: StatusPerkembangan;
}

export interface PerkembanganAnak {
  id: string;
  periodeEvaluasi: string; // e.g. "September 2026", "Agustus 2026"
  tanggalEvaluasi: string; // e.g. "2026-09-22"
  siswaId: string;
  kamar?: string;
  waliAsuh?: string;

  // 4 Aspek Evaluasi Utama
  kemandirian: EvaluasiAspekPerkembangan;
  kebersihan: EvaluasiAspekPerkembangan;
  belajar: EvaluasiAspekPerkembangan;
  sosial: EvaluasiAspekPerkembangan;

  catatanEvaluasi?: string;
  pesanUntukOrangTua?: string;
  dievaluasiOleh?: string;

  // Backward compatibility fields
  periodeBulan?: string;
  skorKemandirian?: number;
  skorSosialisasi?: number;
  skorIbadahAkhlak?: number;
  skorDisiplin?: number;
  skorBelajar?: number;
  catatanKemandirian?: string;
  catatanSosialisasi?: string;
  catatanIbadah?: string;
  catatanDisiplin?: string;
  catatanBelajar?: string;
}

export type StatusPelanggaran =
  | 'Dalam Pembinaan'
  | 'Dipantau'
  | 'Selesai'
  | 'Sedang Berjalan'
  | 'Tuntas'
  | 'Evaluasi Wali Asuh';

export interface PelanggaranPembinaan {
  id: string;
  tanggal: string; // Tanggal kejadian
  jam?: string; // Jam kejadian (contoh: "14:30")
  siswaId: string; // Nama siswa (relasi ID)
  kamar?: string; // Kamar santri
  lokasi?: string; // Lokasi kejadian
  jenisPelanggaran?: string; // Jenis pelanggaran (Kedisiplinan, Adab, Kebersihan, dll)
  tingkat?: 'Ringan' | 'Sedang' | 'Perlu Pendampingan' | string;
  pelanggaran: string; // Deskripsi / Bentuk pelanggaran
  kronologi: string; // Kronologi kejadian
  bentukPembinaan: string; // Bentuk pembinaan edukatif ramah anak
  saksi?: string; // Saksi kejadian
  petugas?: string; // Petugas / wali asuh
  pembina: string; // Petugas / wali asuh (backward compatibility)
  status: StatusPelanggaran; // Status: Dalam Pembinaan → Dipantau → Selesai
  catatanPerubahan?: string; // Catatan perubahan perilaku / hasil pembinaan
}

export type PredikatRaport =
  | 'Sangat Baik'
  | 'Baik'
  | 'Cukup'
  | 'Pembinaan Khusus';

export interface NilaiAspekRaport {
  nilai: number; // Nilai numerik
  predikat: PredikatRaport; // Predikat berdasarkan skala
  catatan?: string; // Catatan khusus per aspek
}

export interface RaportPengasuhan {
  id: string;
  siswaId: string;
  periode: string; // e.g. "September 2026", "Semester Ganjil 2026/2027"
  tanggal: string;
  skala: '1-4' | '1-10';
  aspek: {
    kemandirian: NilaiAspekRaport;
    kebersihan: NilaiAspekRaport;
    ibadah: NilaiAspekRaport;
    kedisiplinan: NilaiAspekRaport;
    belajar: NilaiAspekRaport;
    sosial: NilaiAspekRaport;
    emosi: NilaiAspekRaport;
    tanggungJawab: NilaiAspekRaport;
  };
  catatanWaliAsuh?: string;
  pesanOrangTua?: string;
}

