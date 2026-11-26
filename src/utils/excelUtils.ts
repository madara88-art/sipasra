import * as XLSX from 'xlsx';
import { Siswa, Kamar, WaliAsuh } from '../types';

export interface ParseResult {
  data: Omit<Siswa, 'id'>[];
  totalRows: number;
  validRows: number;
  errors: string[];
  warnings: string[];
}

const INDONESIAN_MONTH_MAP: Record<string, number> = {
  jan: 1,
  januari: 1,
  january: 1,
  feb: 2,
  peb: 2,
  februari: 2,
  pebruari: 2,
  february: 2,
  mar: 3,
  mrt: 3,
  maret: 3,
  march: 3,
  apr: 4,
  april: 4,
  mei: 5,
  may: 5,
  jun: 6,
  juni: 6,
  june: 6,
  jul: 7,
  juli: 7,
  july: 7,
  agu: 8,
  agt: 8,
  ags: 8,
  agustus: 8,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  okt: 10,
  oktober: 10,
  oct: 10,
  october: 10,
  nov: 11,
  nop: 11,
  november: 11,
  nopember: 11,
  des: 12,
  desember: 12,
  dec: 12,
  december: 12,
};

const formatYMD = (year: number, month: number, day: number): string => {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1900 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return '';
  }
  const check = new Date(year, month - 1, day);
  if (
    check.getFullYear() !== year ||
    check.getMonth() !== month - 1 ||
    check.getDate() !== day
  ) {
    return '';
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const expandTwoDigitYear = (rawYear: number, length: number): number => {
  if (length > 2) return rawYear;
  return rawYear <= 35 ? 2000 + rawYear : 1900 + rawYear;
};

/**
 * Parse various Excel, ISO, Indonesian numeric, and Indonesian/English text dates into YYYY-MM-DD
 */
export function parseFlexibleDate(raw: any): string {
  if (raw === undefined || raw === null) return '';

  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return formatYMD(raw.getFullYear(), raw.getMonth() + 1, raw.getDate());
  }

  // Excel numeric serial date (e.g. 42597 -> 2016-08-15)
  if (typeof raw === 'number' && isFinite(raw)) {
    if (raw >= 1000 && raw <= 90000) {
      const parsedSerial = XLSX.SSF.parse_date_code(raw);
      if (parsedSerial) {
        return formatYMD(parsedSerial.y, parsedSerial.m, parsedSerial.d);
      }
    }
    const numStr = String(Math.trunc(raw));
    if (numStr.length === 8) {
      return parseFlexibleDate(numStr);
    }
    return '';
  }

  let str = String(raw)
    .replace(/\u00a0/g, ' ')
    .replace(/['"`]/g, '')
    .trim();

  if (!str || /^(-|--|n\/a|null|undefined|belum\s+ada)$/i.test(str)) {
    return '';
  }

  // Excel serial passed as numeric string (4-5 digits or decimal)
  if (/^\d{4,5}(?:\.\d+)?$/.test(str)) {
    const serial = Number(str);
    if (serial >= 1000 && serial <= 90000) {
      const parsedSerial = XLSX.SSF.parse_date_code(serial);
      if (parsedSerial) {
        return formatYMD(parsedSerial.y, parsedSerial.m, parsedSerial.d);
      }
    }
  }

  // Compact 8 digits: YYYYMMDD or DDMMYYYY
  const compactMatch = str.match(/^(\d{8})$/);
  if (compactMatch) {
    const digits = compactMatch[1];
    const first4 = Number(digits.slice(0, 4));
    const last4 = Number(digits.slice(4, 8));
    if (first4 >= 1950 && first4 <= 2100) {
      const ymd = formatYMD(first4, Number(digits.slice(4, 6)), Number(digits.slice(6, 8)));
      if (ymd) return ymd;
    }
    if (last4 >= 1950 && last4 <= 2100) {
      const dmy = formatYMD(last4, Number(digits.slice(2, 4)), Number(digits.slice(0, 2)));
      if (dmy) return dmy;
    }
  }

  // Strip trailing time part if ISO / datetime string
  const datePart = str.replace(/[T\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/i, '').trim();

  // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
  const ymdMatch = datePart.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    return formatYMD(Number(ymdMatch[1]), Number(ymdMatch[2]), Number(ymdMatch[3]));
  }

  // DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY (or 2-digit year)
  const dmyMatch = datePart.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyMatch) {
    const p1 = Number(dmyMatch[1]);
    const p2 = Number(dmyMatch[2]);
    const year = expandTwoDigitYear(Number(dmyMatch[3]), dmyMatch[3].length);
    if (p2 <= 12 && p1 <= 31) {
      const asDmy = formatYMD(year, p2, p1);
      if (asDmy) return asDmy;
    }
    if (p1 <= 12 && p2 <= 31) {
      const asMdy = formatYMD(year, p1, p2);
      if (asMdy) return asMdy;
    }
    return '';
  }

  // Text month formats anywhere inside string (supports "15 Agustus 2016", "15-Agu-2016", "Jepara, 15 Agustus 2016")
  const textDmyMatch = str.match(/(\d{1,2})[\s,./-]+([a-zA-Z]{3,12})[\s,./-]+(\d{2,4})/);
  if (textDmyMatch) {
    const day = Number(textDmyMatch[1]);
    const monthKey = textDmyMatch[2].toLowerCase();
    const month = INDONESIAN_MONTH_MAP[monthKey];
    const year = expandTwoDigitYear(Number(textDmyMatch[3]), textDmyMatch[3].length);
    if (month) {
      const parsed = formatYMD(year, month, day);
      if (parsed) return parsed;
    }
  }

  // Month-first text format: "Agustus 15, 2016" / "Aug 15 2016"
  const textMdyMatch = str.match(/([a-zA-Z]{3,12})[\s,./-]+(\d{1,2})[\s,./-]+(\d{2,4})/);
  if (textMdyMatch) {
    const month = INDONESIAN_MONTH_MAP[textMdyMatch[1].toLowerCase()];
    const day = Number(textMdyMatch[2]);
    const year = expandTwoDigitYear(Number(textMdyMatch[3]), textMdyMatch[3].length);
    if (month) {
      const parsed = formatYMD(year, month, day);
      if (parsed) return parsed;
    }
  }

  // Embedded numeric date inside string (e.g. "Jepara, 15-08-2016" or "Jepara / 2016-08-15")
  const embeddedYmd = str.match(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/);
  if (embeddedYmd) {
    const parsed = parseFlexibleDate(embeddedYmd[1]);
    if (parsed) return parsed;
  }
  const embeddedDmy = str.match(/(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/);
  if (embeddedDmy) {
    const parsed = parseFlexibleDate(embeddedDmy[1]);
    if (parsed) return parsed;
  }

  // Final fallback to native Date parsing (e.g. RFC strings)
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) {
    return formatYMD(fallback.getFullYear(), fallback.getMonth() + 1, fallback.getDate());
  }

  return '';
}

/**
 * Split combined Tempat, Tanggal Lahir string (e.g. "Jepara, 15 Agustus 2016" or "Jepara / 15-08-2016")
 */
export function splitTempatDanTanggalLahir(raw: any): { tempat: string; tanggal: string } {
  if (raw === undefined || raw === null) return { tempat: '', tanggal: '' };
  if (raw instanceof Date || typeof raw === 'number') {
    return { tempat: '', tanggal: parseFlexibleDate(raw) };
  }
  const str = String(raw).replace(/\u00a0/g, ' ').trim();
  if (!str) return { tempat: '', tanggal: '' };

  // Check if separated by comma or slash: "Jepara, 15 Agustus 2016"
  const sepMatch = str.match(/^([^,/\d]+?)[,/]\s*(.+)$/);
  if (sepMatch) {
    const parsedRight = parseFlexibleDate(sepMatch[2]);
    if (parsedRight) {
      return {
        tempat: sepMatch[1].trim(),
        tanggal: parsedRight,
      };
    }
  }

  // Check if place name precedes a date pattern with space/dash
  const datePatterns = [
    /(\d{1,2}[\s,./-]+[a-zA-Z]{3,12}[\s,./-]+\d{2,4})/,
    /([a-zA-Z]{3,12}[\s,./-]+\d{1,2}[\s,./-]+\d{2,4})/,
    /(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/,
    /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/,
  ];

  for (const pat of datePatterns) {
    const m = str.match(pat);
    if (m && m.index !== undefined) {
      const parsedDate = parseFlexibleDate(m[1]);
      if (parsedDate) {
        const prefix = str
          .slice(0, m.index)
          .replace(/[,/\-:\s]+$/g, '')
          .trim();
        return {
          tempat: prefix,
          tanggal: parsedDate,
        };
      }
    }
  }

  const directDate = parseFlexibleDate(str);
  if (directDate) {
    return { tempat: '', tanggal: directDate };
  }

  return { tempat: str, tanggal: '' };
}

/**
 * Clean & match kamar ID by room name or keyword
 */
export function resolveKamarId(
  input: string | undefined,
  kamarList: Kamar[]
): { id: string; name: string } {
  if (!input || !input.trim() || !kamarList.length) {
    return { id: '', name: '-' };
  }
  const cleanInput = input.toLowerCase().replace(/kamar|\s/g, '');

  const match = kamarList.find((k) => {
    const cleanKamar = k.nama.toLowerCase().replace(/kamar|\s/g, '');
    return cleanKamar.includes(cleanInput) || cleanInput.includes(cleanKamar);
  });

  if (match) {
    return { id: match.id, name: match.nama };
  }
  return { id: '', name: '-' };
}

/**
 * Clean & match wali asuh ID by name or keyword
 */
export function resolveWaliAsuhId(
  input: string | undefined,
  waliAsuhList: WaliAsuh[],
  fallbackKamar?: Kamar
): { id: string; name: string } {
  if (input && input.trim()) {
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

  return { id: '', name: '-' };
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
 * Format YYYY-MM-DD (or flexible date) into DD-MM-YYYY for export
 */
export function formatDateDMY(raw?: string): string {
  if (!raw) return '-';
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-') return '-';
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : parseFlexibleDate(trimmed);
  if (!iso) return trimmed;
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

/**
 * Lock specified columns as literal text ('@') in Excel so DD-MM-YYYY is never altered/flipped when opened
 */
function enforceTextColumnsByHeader(worksheet: XLSX.WorkSheet, headerNames: string[]) {
  if (!worksheet['!ref']) return;
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const targetCols: number[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const headerCell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c })];
    const headerText = String(headerCell?.v ?? '').trim();
    if (headerNames.includes(headerText)) {
      targetCols.push(c);
    }
  }
  if (targetCols.length === 0) return;

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    for (const c of targetCols) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[addr];
      if (cell) {
        cell.t = 's';
        cell.v = String(cell.v ?? '');
        cell.z = '@';
      }
    }
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
    const hasKk = Boolean(s.dokumen?.kk || s.dokumen?.kkNomor || s.noKk);
    const hasAkte = Boolean(s.dokumen?.akte || s.dokumen?.akteNomor);
    const totalDocs = [hasFoto, hasKtp, hasKk, hasAkte].filter(Boolean).length;

    return {
      'No': idx + 1,
      'NISN': s.nisn,
      'NIK Santri': s.nik || '-',
      'Nomor Kartu Keluarga (KK)': s.noKk || s.dokumen?.kkNomor || '-',
      'Nama Lengkap': s.nama,
      'Nama Panggilan': s.panggilan,
      'Tempat Lahir': s.tempatLahir || '-',
      'Tanggal Lahir': formatDateDMY(s.tanggalLahir),
      'Jenis Kelamin': s.jenisKelamin,
      'Kelas': s.kelas,
      'Kamar Asrama': getKamarName(s.kamarId),
      'Wali Asuh Pamong': getWaliName(s.waliAsuhId),
      'Status': s.status,
      'Pas Foto Santri': hasFoto ? 'Ada (Terunggah)' : 'Belum Ada',
      'NIK KTP Orang Tua': s.dokumen?.ktpNomor || '-',
      'Berkas KTP': s.dokumen?.ktp ? 'Ada (Terunggah)' : 'Belum Ada',
      'Berkas KK': s.dokumen?.kk ? 'Ada (Terunggah)' : 'Belum Ada',
      'No Registrasi Akta': s.dokumen?.akteNomor || '-',
      'Berkas Akta Kelahiran': s.dokumen?.akte ? 'Ada (Terunggah)' : 'Belum Ada',
      'Kelengkapan Berkas': totalDocs === 4 ? 'Lengkap (4/4)' : `${totalDocs}/4 Dokumen`,
      'Nama Ayah': s.orangTua.namaAyah,
      'Nama Ibu': s.orangTua.namaIbu,
      'No HP Orang Tua': s.orangTua.noHp,
      'Alamat Rumah': s.orangTua.alamat,
      'Desa / Kelurahan': s.orangTua.desa || '-',
      'Kecamatan': s.orangTua.kecamatan || '-',
      'Kabupaten': s.orangTua.kabupaten || s.orangTua.kotaAsal || '-',
      'Kota / Kabupaten': s.orangTua.kotaAsal,
      'Tanggal Masuk Asrama': formatDateDMY(s.tanggalMasuk),
      'Alergi / Riwayat Medis': s.alergi || '-',
      'Catatan Pengasuhan': s.catatanKhusus || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  enforceTextColumnsByHeader(worksheet, ['Tanggal Lahir', 'Tanggal Masuk Asrama']);

  // Column widths for optimal readability
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NISN
    { wch: 20 }, // NIK Santri
    { wch: 20 }, // No KK
    { wch: 28 }, // Nama Lengkap
    { wch: 14 }, // Panggilan
    { wch: 16 }, // Tempat Lahir
    { wch: 14 }, // Tanggal Lahir
    { wch: 6 },  // L/P
    { wch: 9 },  // Kelas
    { wch: 18 }, // Kamar
    { wch: 20 }, // Wali Asuh
    { wch: 12 }, // Status
    { wch: 16 }, // Foto
    { wch: 20 }, // NIK KTP
    { wch: 16 }, // Berkas KTP
    { wch: 16 }, // Berkas KK
    { wch: 22 }, // No Akta
    { wch: 18 }, // Berkas Akta
    { wch: 18 }, // Kelengkapan
    { wch: 18 }, // Ayah
    { wch: 18 }, // Ibu
    { wch: 16 }, // HP
    { wch: 32 }, // Alamat
    { wch: 18 }, // Desa
    { wch: 18 }, // Kecamatan
    { wch: 18 }, // Kabupaten
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
    const hasKk = Boolean(s.dokumen?.kk || s.dokumen?.kkNomor || s.noKk);
    const hasAkte = Boolean(s.dokumen?.akte || s.dokumen?.akteNomor);
    const totalDocs = [hasFoto, hasKtp, hasKk, hasAkte].filter(Boolean).length;

    return {
      'No': idx + 1,
      'NISN': s.nisn,
      'NIK Santri': s.nik || '-',
      'Nomor Kartu Keluarga': s.noKk || s.dokumen?.kkNomor || '-',
      'Nama Lengkap': s.nama,
      'Nama Panggilan': s.panggilan,
      'Tempat Lahir': s.tempatLahir || '-',
      'Tanggal Lahir': formatDateDMY(s.tanggalLahir),
      'Jenis Kelamin': s.jenisKelamin,
      'Kelas': s.kelas,
      'Kamar Asrama': getKamarName(s.kamarId),
      'Wali Asuh': getWaliName(s.waliAsuhId),
      'Status': s.status,
      'Pas Foto': hasFoto ? 'Ada' : 'Belum Ada',
      'NIK KTP Orang Tua': s.dokumen?.ktpNomor || '-',
      'Nomor Registrasi Akta': s.dokumen?.akteNomor || '-',
      'Status Dokumen': totalDocs === 4 ? 'Lengkap' : `${totalDocs}/4`,
      'Nama Ayah': s.orangTua.namaAyah,
      'Nama Ibu': s.orangTua.namaIbu,
      'No HP Orang Tua': s.orangTua.noHp,
      'Alamat Rumah': s.orangTua.alamat,
      'Desa / Kelurahan': s.orangTua.desa || '-',
      'Kecamatan': s.orangTua.kecamatan || '-',
      'Kabupaten': s.orangTua.kabupaten || s.orangTua.kotaAsal || '-',
      'Kota Asal': s.orangTua.kotaAsal,
      'Tanggal Masuk': formatDateDMY(s.tanggalMasuk),
      'Alergi Medis': s.alergi || '-',
      'Catatan Pengasuhan': s.catatanKhusus || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  enforceTextColumnsByHeader(worksheet, ['Tanggal Lahir', 'Tanggal Masuk']);
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
      'NIK Santri': '3320121508160001',
      'Nomor Kartu Keluarga': '3320120101150002',
      'Nama Lengkap': 'Muhammad Rayhan Pratama',
      'Nama Panggilan': 'Rayhan',
      'Tempat Lahir': 'Jepara',
      'Tanggal Lahir': '15-08-2016',
      'Jenis Kelamin': 'L',
      'Kelas': '3 SD',
      'Kamar Asrama': 'Kamar Neptunus',
      'Wali Asuh': 'Ust. Jendral',
      'Status': 'Aktif',
      'NIK KTP Orang Tua': '3320121508820001',
      'No Registrasi Akta': '3320-LT-15082016-0012',
      'Nama Ayah': 'Sutrisno',
      'Nama Ibu': 'Karyatun',
      'No HP Orang Tua': '081234567890',
      'Alamat Rumah': 'RT 03/RW 02, Jl. Sunan Mantingan',
      'Desa': 'Tahunan',
      'Kecamatan': 'Tahunan',
      'Kabupaten': 'Jepara',
      'Kota Asal': 'Jepara',
      'Tanggal Masuk': '15-07-2026',
      'Alergi Medis': 'Tidak ada alergi',
      'Catatan Khusus': 'Hafalan Juz 30 lancar',
    },
    {
      'NISN': '0179876543',
      'NIK Santri': '3320146010170003',
      'Nomor Kartu Keluarga': '3320140203170004',
      'Nama Lengkap': 'Aisyah Putri Azzahra',
      'Nama Panggilan': 'Aisyah',
      'Tempat Lahir': 'Jepara',
      'Tanggal Lahir': '20-10-2017',
      'Jenis Kelamin': 'P',
      'Kelas': '2 SD',
      'Kamar Asrama': 'Kamar Merkurius',
      'Wali Asuh': 'Ust. Jamal',
      'Status': 'Aktif',
      'NIK KTP Orang Tua': '3320142010850003',
      'No Registrasi Akta': '3320-LT-20102017-0056',
      'Nama Ayah': 'Ahmad Fauzan',
      'Nama Ibu': 'Nurul Hidayah',
      'No HP Orang Tua': '085740129888',
      'Alamat Rumah': 'RT 01/RW 04, Dukuh Krajan',
      'Desa': 'Mayong Kidul',
      'Kecamatan': 'Mayong',
      'Kabupaten': 'Jepara',
      'Kota Asal': 'Jepara',
      'Tanggal Masuk': '15-07-2026',
      'Alergi Medis': 'Alergi dingin/asma ringan',
      'Catatan Khusus': 'Rajin membaca dan tertib ibadah',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  enforceTextColumnsByHeader(worksheet, ['Tanggal Lahir', 'Tanggal Masuk']);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 28 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 20 },
    { wch: 24 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');

  // Sheet Panduan & Referensi
  const panduan = [
    { 'Aturan Kolom': 'NISN', 'Keterangan': 'Opsional (boleh dikosongkan, dapat dilengkapi nanti).' },
    { 'Aturan Kolom': 'NIK Santri', 'Keterangan': 'Opsional, Nomor Induk Kependudukan siswa (16 digit).' },
    { 'Aturan Kolom': 'Nomor Kartu Keluarga', 'Keterangan': 'Opsional, Nomor Kartu Keluarga (16 digit).' },
    { 'Aturan Kolom': 'Nama Lengkap', 'Keterangan': 'Cukup kolom Nama Siswa saja sudah bisa diimpor dan disimpan (kolom lain opsional).' },
    { 'Aturan Kolom': 'Tempat Lahir', 'Keterangan': 'Kota / kabupaten tempat lahir siswa (bisa juga digabung di kolom TTL).' },
    { 'Aturan Kolom': 'Tanggal Lahir', 'Keterangan': 'Mendukung format YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, 15 Agustus 2016, atau sel Tanggal Excel.' },
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
    let rawRows: Record<string, any>[] = [];

    if (file.name.toLowerCase().endsWith('.txt')) {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*(?:\d+[.)-]|\*|-)\s*/, '').trim())
        .filter((line) => line.length > 0 && !/^(nama(\s+siswa|\s+lengkap|\s+santri)?|daftar\s+nama)$/i.test(line));
      rawRows = lines.map((line) => ({ 'Nama Lengkap': line }));
      result.totalRows = rawRows.length;
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const isCsvFile = file.name.toLowerCase().endsWith('.csv');
      const workbook = XLSX.read(arrayBuffer, { type: 'array', raw: isCsvFile });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        result.errors.push('File Excel tidak memiliki lembar kerja (worksheet).');
        return result;
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const matrix = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

      if (!matrix || matrix.length === 0) {
        result.errors.push('Lembar kerja Excel kosong / tidak ditemukan baris data siswa.');
        return result;
      }

      const normalizeCell = (v: any) =>
        String(v ?? '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

      const knownHeaders = [
        'namalengkap',
        'namasiswa',
        'namasantri',
        'namaanak',
        'nama',
        'nisn',
        'niksantri',
        'niksiswa',
        'nomorkk',
        'nokk',
        'tanggallahir',
        'tgllahir',
        'tempatlahir',
        'tempattanggallahir',
        'tempattgllahir',
        'ttl',
        'dateofbirth',
        'dob',
        'kelas',
        'jeniskelamin',
        'kamarasrama',
        'waliasuh',
      ];

      // Find header row within the first 20 rows
      let headerRowIndex = -1;
      for (let r = 0; r < Math.min(matrix.length, 20); r++) {
        const rowCells = matrix[r] || [];
        const hasKnownHeader = rowCells.some((cell) => {
          const norm = normalizeCell(cell);
          return norm.length > 0 && knownHeaders.some((h) => norm === h || norm.includes(h));
        });
        if (hasKnownHeader) {
          headerRowIndex = r;
          break;
        }
      }

      if (headerRowIndex !== -1) {
        const headerRow = (matrix[headerRowIndex] || []).map((cell, idx) => {
          const text = String(cell ?? '').trim();
          return text || `__col_${idx}`;
        });
        const dataMatrix = matrix.slice(headerRowIndex + 1);
        rawRows = dataMatrix
          .filter((rowArr) =>
            Array.isArray(rowArr) && rowArr.some((cell) => String(cell ?? '').trim() !== '')
          )
          .map((rowArr) => {
            const obj: Record<string, any> = {};
            headerRow.forEach((headerName, colIdx) => {
              obj[headerName] = rowArr[colIdx] ?? '';
            });
            return obj;
          });
      } else {
        // Headerless spreadsheet (e.g. plain list of student names down a column, optionally prefixed by row numbers)
        rawRows = matrix
          .filter((rowArr) =>
            Array.isArray(rowArr) && rowArr.some((cell) => String(cell ?? '').trim() !== '')
          )
          .map((rowArr) => {
            const nonEmpty = rowArr
              .map((c) => String(c ?? '').trim())
              .filter((c) => c.length > 0);
            const nameCandidate =
              nonEmpty.find((c) => !/^\d{1,4}[.)]?$/.test(c)) || nonEmpty[0] || '';
            return { 'Nama Lengkap': nameCandidate };
          });
      }

      result.totalRows = rawRows.length;
    }

    if (rawRows.length === 0) {
      result.errors.push('Berkas kosong / tidak ditemukan baris nama siswa.');
      return result;
    }

    // Helper to find value by loose key matching (preserving raw Date/number values)
    const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
    const getRawValue = (
      row: Record<string, any>,
      candidates: string[],
      excludeTokens: string[] = []
    ): any => {
      const keys = Object.keys(row);
      for (const cand of candidates) {
        const normCand = normalizeKey(cand);
        const exactKey = keys.find((k) => {
          const normK = normalizeKey(k);
          if (excludeTokens.some((ex) => normK.includes(ex))) return false;
          return (
            normK === normCand &&
            row[k] !== undefined &&
            row[k] !== null &&
            String(row[k]).trim() !== ''
          );
        });
        if (exactKey) return row[exactKey];

        const partialKey = keys.find((k) => {
          const normK = normalizeKey(k);
          if (excludeTokens.some((ex) => normK.includes(ex))) return false;
          return (
            normK.includes(normCand) &&
            row[k] !== undefined &&
            row[k] !== null &&
            String(row[k]).trim() !== ''
          );
        });
        if (partialKey) return row[partialKey];
      }
      return '';
    };

    const getValue = (
      row: Record<string, any>,
      candidates: string[],
      excludeTokens: string[] = []
    ): string => {
      const rawVal = getRawValue(row, candidates, excludeTokens);
      if (rawVal === undefined || rawVal === null || rawVal === '') return '';
      return String(rawVal).trim();
    };

    let emptyNisnCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2;

      // Extract fields with multiple possible header spellings
      const rawNisn = getValue(row, ['nisn', 'nis', 'noinduk', 'nomorinduk'], ['nik']);
      let nama = getValue(
        row,
        ['namalengkap', 'namasiswa', 'namasantri', 'namaanak', 'nama', 'santri', 'siswa', 'pesertadidik', 'murid'],
        ['ayah', 'ibu', 'orangtua', 'wali', 'panggilan', 'kamar']
      );
      let panggilan =
        getValue(row, ['namapanggilan', 'panggilan', 'alias']) ||
        (nama ? nama.split(' ')[0] : '') ||
        '';
      const rawJk = getValue(row, ['jeniskelamin', 'jk', 'gender', 'kelamin', 'lp']);
      const rawKelas = getValue(row, ['kelas', 'tingkat', 'grade']);
      const rawKamar = getValue(row, ['kamarasrama', 'kamar', 'ruangkamar', 'dorm']);
      const rawWali = getValue(row, ['waliasuhpamong', 'waliasuh', 'wali', 'pamong', 'ustadz']);
      const rawStatus = getValue(row, ['status', 'statussantri', 'keaktifan']);
      const namaAyah = getValue(row, ['namaayah', 'ayah', 'bapak']);
      const namaIbu = getValue(row, ['namaibu', 'ibu']);
      const noHp = getValue(row, ['nohporangtua', 'nohp', 'nomorhp', 'telepon', 'whatsapp', 'wa', 'hp']);
      const alamat = getValue(row, ['alamatrumah', 'alamat', 'domisili', 'jalan']);
      const desa = getValue(row, ['desakelurahan', 'desa', 'kelurahan', 'kalurahan']);
      const kecamatan = getValue(row, ['kecamatan', 'kec']);
      const kabupaten = getValue(row, ['kabupatenkota', 'kabupaten', 'kab'], ['lahir']);
      const kotaAsal = getValue(row, ['kotaasal', 'kota', 'kabupaten', 'daerah'], ['lahir']) || kabupaten;
      const rawTglMasuk = getRawValue(row, ['tanggalmasukasrama', 'tanggalmasuk', 'tglmasuk', 'masuk']);
      const alergi = getValue(row, ['alergi', 'riwayatmedis', 'penyakit', 'kesehatan']);
      const catatanKhusus = getValue(row, ['catatanpengasuhan', 'catatankhusus', 'catatan', 'keterangan']);

      // Document legal numbers & TTL (if present in spreadsheet)
      const nikSantri = getValue(row, ['niksantri', 'niksiswa', 'nik'], ['ktp', 'orangtua', 'wali', 'ayah', 'ibu']);
      const nikKtp = getValue(row, ['nikktporangtua', 'nikktp', 'ktporangtua', 'noktp']);
      const noKk = getValue(row, ['nomorkartukeluarga', 'nomorkk', 'nokk', 'kartukeluarga', 'kk']);
      const noAkte = getValue(row, ['noregistrasiakta', 'noakta', 'aktakelahiran', 'noakte', 'akta', 'akte']);
      const rawTempatLahir = getValue(
        row,
        ['tempatlahir', 'tmplahir', 'kotalahir', 'kabupatenlahir'],
        ['tanggal', 'tgl']
      );
      const rawTglLahir = getRawValue(
        row,
        [
          'tanggallahir',
          'tgllahir',
          'lahirtgl',
          'tanggalkelahiran',
          'tglkelahiran',
          'dateofbirth',
          'birthdate',
          'dob',
          'tll',
        ],
        ['tempat', 'tmp', 'akta', 'akte', 'masuk']
      );
      const rawTtl = getRawValue(row, [
        'tempattanggallahir',
        'tempattgllahir',
        'tempatdantanggallahir',
        'tempatdantgllahir',
        'tempatlahirdantanggallahir',
        'ttl',
      ]);

      // Skip row only if completely empty across key student fields
      if (!nama && !rawNisn && !nikSantri && !noKk && !namaAyah && !namaIbu && !noHp) {
        return;
      }

      const nisn = rawNisn || '-';
      if (!rawNisn) {
        emptyNisnCount++;
      }

      if (!nama) {
        nama = panggilan || `Santri (${nisn !== '-' ? nisn : `Baris ${rowNum}`})`;
        if (!panggilan) panggilan = nama.split(' ')[0];
        result.warnings.push(`Baris ${rowNum}: Nama siswa kosong, disimpan sementara sebagai "${nama}".`);
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
      const tanggalMasuk = parseFlexibleDate(rawTglMasuk) || todayStr;

      // Tempat & Tanggal Lahir (supports separate columns, combined TTL, Excel serials, DD/MM/YYYY, Indonesian months)
      const splitFromTgl = splitTempatDanTanggalLahir(rawTglLahir);
      const splitFromTtl = splitTempatDanTanggalLahir(rawTtl);
      const tempatLahir = rawTempatLahir || splitFromTgl.tempat || splitFromTtl.tempat;
      const tanggalLahir =
        parseFlexibleDate(rawTglLahir) || splitFromTgl.tanggal || splitFromTtl.tanggal;

      const rawDobProvided =
        (rawTglLahir !== undefined && rawTglLahir !== null && String(rawTglLahir).trim() !== '' && String(rawTglLahir).trim() !== '-') ||
        (rawTtl !== undefined && rawTtl !== null && String(rawTtl).trim() !== '' && String(rawTtl).trim() !== '-');
      if (rawDobProvided && !tanggalLahir) {
        result.warnings.push(
          `Baris ${rowNum} (${nama}): Tanggal lahir "${String(rawTglLahir || rawTtl).trim()}" belum terbaca. Gunakan format YYYY-MM-DD, DD/MM/YYYY, atau 15 Agustus 2016.`
        );
      }

      result.data.push({
        nisn,
        nik: nikSantri || undefined,
        noKk: noKk || undefined,
        tempatLahir: tempatLahir || undefined,
        tanggalLahir: tanggalLahir || undefined,
        nama,
        panggilan,
        jenisKelamin,
        kelas,
        kamarId: matchedKamar.id,
        waliAsuhId: matchedWali.id,
        orangTua: {
          namaAyah: namaAyah || '',
          namaIbu: namaIbu || '',
          noHp: noHp || '',
          alamat: alamat || '',
          desa: desa || undefined,
          kecamatan: kecamatan || undefined,
          kabupaten: kabupaten || undefined,
          kotaAsal: kotaAsal || '',
        },
        tanggalMasuk,
        status,
        alergi: alergi || undefined,
        catatanKhusus: catatanKhusus || undefined,
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

    if (emptyNisnCount > 0) {
      result.warnings.unshift(
        `${emptyNisnCount} siswa belum memiliki NISN di berkas (tetap siap disimpan dan dapat dilengkapi nanti).`
      );
    }

    if (result.validRows === 0 && result.errors.length === 0) {
      result.errors.push('Tidak ada nama siswa yang dapat dibaca dari berkas ini.');
    }
  } catch (err: any) {
    result.errors.push(`Gagal memproses file Excel: ${err?.message || 'Format tidak didukung'}`);
  }

  return result;
}
