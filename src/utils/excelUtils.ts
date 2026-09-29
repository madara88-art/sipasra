import * as XLSX from 'xlsx';
import { Siswa, Kamar, WaliAsuh } from '../types';

export interface ParseResult {
  data: Omit<Siswa, 'id'>[];
  totalRows: number;
  validRows: number;
  errors: string[];
  warnings: string[];
}

/**
 * Clean & match kamar ID by room name or keyword
 */
export function resolveKamarId(
  input: string | undefined,
  kamarList: Kamar[]
): { id: string; name: string } {
  if (!input || !kamarList.length) {
    return { id: kamarList[0]?.id || '', name: kamarList[0]?.nama || 'Kamar Neptunus' };
  }
  const cleanInput = input.toLowerCase().replace(/kamar|\s/g, '');

  const match = kamarList.find((k) => {
    const cleanKamar = k.nama.toLowerCase().replace(/kamar|\s/g, '');
    return cleanKamar.includes(cleanInput) || cleanInput.includes(cleanKamar);
  });

  if (match) {
    return { id: match.id, name: match.nama };
  }
  return { id: kamarList[0].id, name: kamarList[0].nama };
}

/**
 * Clean & match wali asuh ID by name or keyword
 */
export function resolveWaliAsuhId(
  input: string | undefined,
  waliAsuhList: WaliAsuh[],
  fallbackKamar?: Kamar
): { id: string; name: string } {
  if (input) {
    const cleanInput = input.toLowerCase().replace(/ustad[z]?|ust\.|\s/g, '');
    const match = waliAsuhList.find((w) => {
      const cleanWali = w.nama.toLowerCase().replace(/ustad[z]?|ust\.|\s/g, '');
      return cleanWali.includes(cleanInput) || cleanInput.includes(cleanWali);
    });

    if (match) {
      return { id: match.id, name: match.nama };
    }
  }

  // Fallback to kamar's wali asuh
  if (fallbackKamar?.waliAsuhId) {
    const waliFromKamar = waliAsuhList.find((w) => w.id === fallbackKamar.waliAsuhId);
    if (waliFromKamar) {
      return { id: waliFromKamar.id, name: waliFromKamar.nama };
    }
  }

  return { id: waliAsuhList[0]?.id || '', name: waliAsuhList[0]?.nama || 'Ust. Jendral' };
}

/**
 * Helper to download workbook reliably in any browser environment via Blob URL
 */
function downloadWorkbook(workbook: XLSX.WorkBook, filename: string) {
  try {
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    // Fallback to SheetJS writeFile
    XLSX.writeFile(workbook, filename);
  }
}

/**
 * Export Siswa to Excel (.xlsx)
 */
export function exportSiswaToExcel(
  siswaList: Siswa[],
  kamarList: Kamar[],
  waliAsuhList: WaliAsuh[],
  customFilename?: string
) {
  const getKamarName = (id: string) => kamarList.find((k) => k.id === id)?.nama || '-';
  const getWaliName = (id: string) => waliAsuhList.find((w) => w.id === id)?.nama || '-';

  const rows = siswaList.map((s, idx) => {
    const hasFoto = Boolean(s.dokumen?.foto);
    const hasKtp = Boolean(s.dokumen?.ktp || s.dokumen?.ktpNomor);
    const hasKk = Boolean(s.dokumen?.kk || s.dokumen?.kkNomor);
    const hasAkte = Boolean(s.dokumen?.akte || s.dokumen?.akteNomor);
    const totalDocs = [hasFoto, hasKtp, hasKk, hasAkte].filter(Boolean).length;

    return {
      'No': idx + 1,
      'NISN': s.nisn,
      'Nama Lengkap': s.nama,
      'Nama Panggilan': s.panggilan,
      'Jenis Kelamin': s.jenisKelamin,
      'Kelas': s.kelas,
      'Kamar Asrama': getKamarName(s.kamarId),
      'Wali Asuh Pamong': getWaliName(s.waliAsuhId),
      'Status': s.status,
      'Pas Foto Santri': hasFoto ? 'Ada (Terunggah)' : 'Belum Ada',
      'NIK KTP Orang Tua': s.dokumen?.ktpNomor || '-',
      'Berkas KTP': s.dokumen?.ktp ? 'Ada (Terunggah)' : 'Belum Ada',
      'Nomor Kartu Keluarga (KK)': s.dokumen?.kkNomor || '-',
      'Berkas KK': s.dokumen?.kk ? 'Ada (Terunggah)' : 'Belum Ada',
      'No Registrasi Akta': s.dokumen?.akteNomor || '-',
      'Berkas Akta Kelahiran': s.dokumen?.akte ? 'Ada (Terunggah)' : 'Belum Ada',
      'Kelengkapan Berkas': totalDocs === 4 ? 'Lengkap (4/4)' : `${totalDocs}/4 Dokumen`,
      'Nama Ayah': s.orangTua.namaAyah,
      'Nama Ibu': s.orangTua.namaIbu,
      'No HP Orang Tua': s.orangTua.noHp,
      'Alamat Rumah': s.orangTua.alamat,
      'Kota / Kabupaten': s.orangTua.kotaAsal,
      'Tanggal Masuk Asrama': s.tanggalMasuk,
      'Alergi / Riwayat Medis': s.alergi || '-',
      'Catatan Pengasuhan': s.catatanKhusus || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Column widths for optimal readability
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NISN
    { wch: 28 }, // Nama Lengkap
    { wch: 14 }, // Panggilan
    { wch: 6 },  // L/P
    { wch: 9 },  // Kelas
    { wch: 18 }, // Kamar
    { wch: 20 }, // Wali Asuh
    { wch: 12 }, // Status
    { wch: 16 }, // Foto
    { wch: 20 }, // NIK KTP
    { wch: 16 }, // Berkas KTP
    { wch: 20 }, // No KK
    { wch: 16 }, // Berkas KK
    { wch: 22 }, // No Akta
    { wch: 18 }, // Berkas Akta
    { wch: 18 }, // Kelengkapan
    { wch: 18 }, // Ayah
    { wch: 18 }, // Ibu
    { wch: 16 }, // HP
    { wch: 32 }, // Alamat
    { wch: 14 }, // Kota
    { wch: 14 }, // Tgl Masuk
    { wch: 24 }, // Alergi
    { wch: 36 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Santri SD');

  // Sheet 2: Daftar Referensi Kamar & Wali Asuh untuk memudahkan
  const refRows = kamarList.map((k, i) => {
    const wali = waliAsuhList.find((w) => w.id === k.waliAsuhId);
    return {
      'No': i + 1,
      'Nama Kamar': k.nama,
      'Gedung Asrama': k.gedung,
      'Kapasitas': `${k.kapasitas} Anak`,
      'Wali Asuh Pengampu': wali ? `${wali.nama}, ${wali.gelar}` : '-',
    };
  });
  const refWorksheet = XLSX.utils.json_to_sheet(refRows);
  refWorksheet['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 32 }, { wch: 12 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(workbook, refWorksheet, 'Referensi Kamar & Wali');

  const filename =
    customFilename ||
    `Data_Siswa_Sekolah_Rakyat_1_Jepara_${new Date().toISOString().split('T')[0]}.xlsx`;

  downloadWorkbook(workbook, filename);
}

/**
 * Export Siswa to CSV (.csv)
 */
export function exportSiswaToCsv(
  siswaList: Siswa[],
  kamarList: Kamar[],
  waliAsuhList: WaliAsuh[],
  customFilename?: string
) {
  const getKamarName = (id: string) => kamarList.find((k) => k.id === id)?.nama || '-';
  const getWaliName = (id: string) => waliAsuhList.find((w) => w.id === id)?.nama || '-';

  const rows = siswaList.map((s, idx) => {
    const hasFoto = Boolean(s.dokumen?.foto);
    const hasKtp = Boolean(s.dokumen?.ktp || s.dokumen?.ktpNomor);
    const hasKk = Boolean(s.dokumen?.kk || s.dokumen?.kkNomor);
    const hasAkte = Boolean(s.dokumen?.akte || s.dokumen?.akteNomor);
    const totalDocs = [hasFoto, hasKtp, hasKk, hasAkte].filter(Boolean).length;

    return {
      'No': idx + 1,
      'NISN': s.nisn,
      'Nama Lengkap': s.nama,
      'Nama Panggilan': s.panggilan,
      'Jenis Kelamin': s.jenisKelamin,
      'Kelas': s.kelas,
      'Kamar Asrama': getKamarName(s.kamarId),
      'Wali Asuh': getWaliName(s.waliAsuhId),
      'Status': s.status,
      'Pas Foto': hasFoto ? 'Ada' : 'Belum Ada',
      'NIK KTP Orang Tua': s.dokumen?.ktpNomor || '-',
      'Nomor Kartu Keluarga': s.dokumen?.kkNomor || '-',
      'Nomor Registrasi Akta': s.dokumen?.akteNomor || '-',
      'Status Dokumen': totalDocs === 4 ? 'Lengkap' : `${totalDocs}/4`,
      'Nama Ayah': s.orangTua.namaAyah,
      'Nama Ibu': s.orangTua.namaIbu,
      'No HP Orang Tua': s.orangTua.noHp,
      'Alamat Rumah': s.orangTua.alamat,
      'Kota Asal': s.orangTua.kotaAsal,
      'Tanggal Masuk': s.tanggalMasuk,
      'Alergi Medis': s.alergi || '-',
      'Catatan Pengasuhan': s.catatanKhusus || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  // Prepend UTF-8 BOM so Excel opens accented characters and UTF-8 cleanly
  const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download =
    customFilename ||
    `Data_Siswa_Sekolah_Rakyat_1_Jepara_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate Blank Excel Template with Instructions for Import
 */
export function generateSiswaTemplateExcel(kamarList: Kamar[], waliAsuhList: WaliAsuh[]) {
  const sampleData = [
    {
      'NISN': '0161234567',
      'Nama Lengkap': 'Muhammad Rayhan Pratama',
      'Nama Panggilan': 'Rayhan',
      'Jenis Kelamin': 'L',
      'Kelas': '3 SD',
      'Kamar Asrama': 'Kamar Neptunus',
      'Wali Asuh': 'Ust. Jendral',
      'Status': 'Aktif',
      'NIK KTP Orang Tua': '3320121508820001',
      'Nomor Kartu Keluarga': '3320120101150002',
      'No Registrasi Akta': '3320-LT-15082016-0012',
      'Nama Ayah': 'Sutrisno',
      'Nama Ibu': 'Karyatun',
      'No HP Orang Tua': '081234567890',
      'Alamat Rumah': 'RT 03/RW 02, Desa Tahunan',
      'Kota Asal': 'Jepara',
      'Tanggal Masuk': '2026-07-15',
      'Alergi Medis': 'Tidak ada alergi',
      'Catatan Khusus': 'Hafalan Juz 30 lancar',
    },
    {
      'NISN': '0179876543',
      'Nama Lengkap': 'Aisyah Putri Azzahra',
      'Nama Panggilan': 'Aisyah',
      'Jenis Kelamin': 'P',
      'Kelas': '2 SD',
      'Kamar Asrama': 'Kamar Merkurius',
      'Wali Asuh': 'Ust. Jamal',
      'Status': 'Aktif',
      'NIK KTP Orang Tua': '3320142010850003',
      'Nomor Kartu Keluarga': '3320140203170004',
      'No Registrasi Akta': '3320-LT-20102017-0056',
      'Nama Ayah': 'Ahmad Fauzan',
      'Nama Ibu': 'Nurul Hidayah',
      'No HP Orang Tua': '085740129888',
      'Alamat Rumah': 'RT 01/RW 04, Desa Mayong',
      'Kota Asal': 'Jepara',
      'Tanggal Masuk': '2026-07-15',
      'Alergi Medis': 'Alergi dingin/asma ringan',
      'Catatan Khusus': 'Rajin membaca dan tertib ibadah',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 32 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');

  // Sheet Panduan & Referensi
  const panduan = [
    { 'Aturan Kolom': 'NISN', 'Keterangan': 'Wajib diisi, angka 10 digit unik siswa.' },
    { 'Aturan Kolom': 'Nama Lengkap', 'Keterangan': 'Wajib diisi, nama lengkap siswa.' },
    { 'Aturan Kolom': 'Jenis Kelamin', 'Keterangan': 'Isi dengan "L" (Laki-laki) atau "P" (Perempuan).' },
    { 'Aturan Kolom': 'Kelas', 'Keterangan': 'Contoh: "1 SD", "2 SD", "3 SD", "4 SD", "5 SD", "6 SD".' },
    {
      'Aturan Kolom': 'Kamar Asrama',
      'Keterangan': kamarList.map((k) => k.nama).join(', ') || 'Kamar Neptunus, Kamar Uranus, dll.',
    },
    {
      'Aturan Kolom': 'Wali Asuh',
      'Keterangan': waliAsuhList.map((w) => w.nama).join(', ') || 'Ust. Jendral, Ust. Luki, dll.',
    },
    { 'Aturan Kolom': 'Status', 'Keterangan': 'Pilihan: "Aktif", "Sakit", atau "Izin Pulang".' },
    { 'Aturan Kolom': 'NIK KTP Orang Tua', 'Keterangan': 'Nomor NIK KTP Orang Tua (16 digit).' },
    { 'Aturan Kolom': 'Nomor Kartu Keluarga', 'Keterangan': 'Nomor Kartu Keluarga (16 digit).' },
    { 'Aturan Kolom': 'No Registrasi Akta', 'Keterangan': 'Nomor Registrasi Akta Kelahiran Anak.' },
    { 'Aturan Kolom': 'Tanggal Masuk', 'Keterangan': 'Format YYYY-MM-DD (Contoh: 2026-07-15).' },
  ];

  const wsPanduan = XLSX.utils.json_to_sheet(panduan);
  wsPanduan['!cols'] = [{ wch: 20 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, wsPanduan, 'Panduan Pengisian');

  downloadWorkbook(workbook, 'Template_Import_Siswa_Sekolah_Rakyat_1_Jepara.xlsx');
}

/**
 * Parse Excel File buffer into Siswa list
 */
export async function parseSiswaExcel(
  file: File,
  kamarList: Kamar[],
  waliAsuhList: WaliAsuh[]
): Promise<ParseResult> {
  const result: ParseResult = {
    data: [],
    totalRows: 0,
    validRows: 0,
    errors: [],
    warnings: [],
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      result.errors.push('File Excel tidak memiliki lembar kerja (worksheet).');
      return result;
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    result.totalRows = rawRows.length;

    if (rawRows.length === 0) {
      result.errors.push('Lembar kerja Excel kosong / tidak ditemukan baris data siswa.');
      return result;
    }

    // Helper to find value by loose key matching
    const getValue = (row: Record<string, any>, candidates: string[]): string => {
      for (const cand of candidates) {
        const key = Object.keys(row).find((k) =>
          k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cand.toLowerCase().replace(/[^a-z0-9]/g, ''))
        );
        if (key && row[key] !== undefined && row[key] !== null) {
          return String(row[key]).trim();
        }
      }
      return '';
    };

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header row in Excel

      // Extract fields with multiple possible header spellings
      const rawNisn = getValue(row, ['nisn', 'nis', 'noinduk', 'nomorinduk']);
      const nama = getValue(row, ['namalengkap', 'nama', 'santri', 'siswa']);
      const panggilan = getValue(row, ['namapanggilan', 'panggilan', 'alias']) || nama.split(' ')[0] || '';
      const rawJk = getValue(row, ['jeniskelamin', 'jk', 'gender', 'kelamin', 'lp']);
      const rawKelas = getValue(row, ['kelas', 'tingkat', 'grade']);
      const rawKamar = getValue(row, ['kamarasrama', 'kamar', 'ruangkamar', 'dorm']);
      const rawWali = getValue(row, ['waliasuhpamong', 'waliasuh', 'wali', 'pamong', 'ustadz']);
      const rawStatus = getValue(row, ['status', 'statussantri', 'keaktifan']);
      const namaAyah = getValue(row, ['namaayah', 'ayah', 'bapak']);
      const namaIbu = getValue(row, ['namaibu', 'ibu']);
      const noHp = getValue(row, ['nohporangtua', 'nohp', 'nomorhp', 'telepon', 'whatsapp', 'wa', 'hp']);
      const alamat = getValue(row, ['alamatrumah', 'alamat', 'domisili', 'jalan']);
      const kotaAsal = getValue(row, ['kota', 'kabupaten', 'kotaasal', 'daerah']) || 'Jepara';
      const rawTglMasuk = getValue(row, ['tanggalmasukasrama', 'tanggalmasuk', 'tglmasuk', 'masuk']);
      const alergi = getValue(row, ['alergi', 'riwayatmedis', 'penyakit', 'kesehatan']);
      const catatanKhusus = getValue(row, ['catatanpengasuhan', 'catatankhusus', 'catatan', 'keterangan']);

      // Document legal numbers (if present in spreadsheet)
      const nikKtp = getValue(row, ['nikktporangtua', 'nikktp', 'nik', 'ktporangtua', 'noktp']);
      const noKk = getValue(row, ['nomorkartukeluarga', 'nomorkk', 'nokk', 'kartukeluarga', 'kk']);
      const noAkte = getValue(row, ['noregistrasiakta', 'noakta', 'aktakelahiran', 'noakte', 'akta', 'akte']);

      // Skip row if it appears to be an empty row
      if (!nama && !rawNisn) {
        return;
      }

      // NISN is required or fallback
      let nisn = rawNisn;
      if (!nisn) {
        nisn = `NISN${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        result.warnings.push(`Baris ${rowNum} (${nama || 'Tanpa Nama'}): NISN kosong, diisikan NISN otomatis (${nisn}).`);
      }

      if (!nama) {
        result.errors.push(`Baris ${rowNum}: Nama siswa kosong, baris dilewati.`);
        return;
      }

      // Gender normalization
      let jenisKelamin: 'L' | 'P' = 'L';
      const cleanJk = rawJk.toUpperCase();
      if (cleanJk.includes('P') || cleanJk.includes('WANITA') || cleanJk.includes('PEREMPUAN')) {
        jenisKelamin = 'P';
      }

      // Kelas normalization
      let kelas: Siswa['kelas'] = '1 SD';
      const cleanKelas = rawKelas.toLowerCase();
      if (cleanKelas.includes('6') || cleanKelas.includes('vi')) kelas = '6 SD';
      else if (cleanKelas.includes('5') || cleanKelas.includes('v')) kelas = '5 SD';
      else if (cleanKelas.includes('4') || cleanKelas.includes('iv')) kelas = '4 SD';
      else if (cleanKelas.includes('3') || cleanKelas.includes('iii')) kelas = '3 SD';
      else if (cleanKelas.includes('2') || cleanKelas.includes('ii')) kelas = '2 SD';
      else if (cleanKelas.includes('1') || cleanKelas.includes('i')) kelas = '1 SD';

      // Kamar resolution
      const matchedKamar = resolveKamarId(rawKamar, kamarList);
      const kamarObj = kamarList.find((k) => k.id === matchedKamar.id);

      // Wali Asuh resolution
      const matchedWali = resolveWaliAsuhId(rawWali, waliAsuhList, kamarObj);

      // Status normalization
      let status: Siswa['status'] = 'Aktif';
      const cleanStatus = rawStatus.toLowerCase();
      if (cleanStatus.includes('sakit') || cleanStatus.includes('rawat') || cleanStatus.includes('uks')) {
        status = 'Sakit';
      } else if (cleanStatus.includes('pulang') || cleanStatus.includes('izin')) {
        status = 'Izin Pulang';
      }

      // Tanggal Masuk
      let tanggalMasuk = rawTglMasuk;
      if (!tanggalMasuk || !/^\d{4}-\d{2}-\d{2}$/.test(tanggalMasuk)) {
        // If Excel date serial number or formatted differently
        const parsedDate = new Date(rawTglMasuk);
        if (!isNaN(parsedDate.getTime())) {
          tanggalMasuk = parsedDate.toISOString().split('T')[0];
        } else {
          tanggalMasuk = new Date().toISOString().split('T')[0];
        }
      }

      result.data.push({
        nisn,
        nama,
        panggilan,
        jenisKelamin,
        kelas,
        kamarId: matchedKamar.id,
        waliAsuhId: matchedWali.id,
        orangTua: {
          namaAyah: namaAyah || '-',
          namaIbu: namaIbu || '-',
          noHp: noHp || '-',
          alamat: alamat || 'Jepara',
          kotaAsal: kotaAsal || 'Jepara',
        },
        tanggalMasuk,
        status,
        alergi: alergi || 'Tidak ada riwayat alergi',
        catatanKhusus: catatanKhusus || 'Santri aktif Sekolah Rakyat 1 Jepara',
        dokumen:
          nikKtp || noKk || noAkte
            ? {
                ktpNomor: nikKtp || undefined,
                kkNomor: noKk || undefined,
                akteNomor: noAkte || undefined,
              }
            : undefined,
      });

      result.validRows++;
    });

    if (result.validRows === 0 && result.errors.length === 0) {
      result.errors.push('Tidak ada baris data valid yang berhasil dibaca dari file Excel.');
    }
  } catch (err: any) {
    result.errors.push(`Gagal memproses file Excel: ${err?.message || 'Format tidak didukung'}`);
  }

  return result;
}
