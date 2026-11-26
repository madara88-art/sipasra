import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthUser,
  MenuItemId,
  Siswa,
  Kamar,
  WaliAsuh,
  KegiatanHarianItem,
  PresensiKegiatan,
  KebersihanKamar,
  CatatanAksiKamar,
  IbadahRecord,
  StatusIbadah,
  SesiIbadah,
  CatatanKesehatan,
  PemeriksaanCKG,
  SesiKonseling,
  PerkembanganAnak,
  PelanggaranPembinaan,
  MutasiRecord,
  CatatanPergantianShift,
} from '../types';
import { authenticateUser } from '../data/authAccounts';
import {
  INITIAL_SISWA,
  INITIAL_KAMAR,
  INITIAL_WALI_ASUH,
  INITIAL_KEGIATAN_HARIAN,
  INITIAL_PRESENSI,
  INITIAL_KEBERSIHAN,
  INITIAL_IBADAH,
  INITIAL_KESEHATAN,
  INITIAL_CKG,
  INITIAL_KONSELING,
  INITIAL_PERKEMBANGAN,
  INITIAL_PELANGGARAN,
} from '../data/initialData';

interface AppContextType {
  currentUser: AuthUser | null;
  login: (
    username: string,
    password: string,
    remember?: boolean
  ) => { success: boolean; error?: string };
  logout: () => void;

  activeMenu: MenuItemId;
  setActiveMenu: (menu: MenuItemId) => void;
  selectedSiswaId: string | null;
  setSelectedSiswaId: (id: string | null) => void;
  selectedKamarId: string | null;
  setSelectedKamarId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;

  // Data collections
  siswaList: Siswa[];
  kamarList: Kamar[];
  waliAsuhList: WaliAsuh[];
  kegiatanHarianList: KegiatanHarianItem[];
  presensiList: PresensiKegiatan[];
  kebersihanList: KebersihanKamar[];
  catatanAksiKebersihanList: CatatanAksiKamar[];
  ibadahList: IbadahRecord[];
  kesehatanList: CatatanKesehatan[];
  ckgList: PemeriksaanCKG[];
  konselingList: SesiKonseling[];
  perkembanganList: PerkembanganAnak[];
  pelanggaranList: PelanggaranPembinaan[];
  mutasiList: MutasiRecord[];
  shiftLogList: CatatanPergantianShift[];

  // Mutators
  addSiswa: (siswa: Omit<Siswa, 'id'>) => void;
  updateSiswa: (id: string, siswa: Partial<Siswa>) => void;
  deleteSiswa: (id: string) => void;
  deleteMultipleSiswa: (ids: string[]) => void;
  clearAllSiswa: () => void;
  mutateSiswa: (params: {
    siswaIds: string[];
    jenisMutasi: MutasiRecord['jenisMutasi'];
    keKamarId?: string;
    keWaliAsuhId?: string;
    keKelas?: Siswa['kelas'];
    tanggal: string;
    keterangan?: string;
  }) => number;
  importSiswaList: (
    items: Omit<Siswa, 'id'>[],
    mode: 'upsert' | 'append' | 'replace'
  ) => { added: number; updated: number };

  addKamar: (kamar: Omit<Kamar, 'id'>) => void;
  updateKamar: (id: string, kamar: Partial<Kamar>) => void;
  deleteKamar: (id: string) => void;
  clearAllKamar: () => void;

  addWaliAsuh: (wali: Omit<WaliAsuh, 'id'>) => void;
  updateWaliAsuh: (id: string, wali: Partial<WaliAsuh>) => void;
  deleteWaliAsuh: (id: string) => void;
  clearAllWaliAsuh: () => void;

  addKegiatanHarian: (kegiatan: Omit<KegiatanHarianItem, 'id'>) => void;
  updateKegiatanHarian: (id: string, kegiatan: Partial<KegiatanHarianItem>) => void;
  deleteKegiatanHarian: (id: string) => void;
  clearAllKegiatanHarian: () => void;
  updatePresensi: (presensi: PresensiKegiatan) => void;

  addKebersihan: (kebersihan: Omit<KebersihanKamar, 'id'>) => void;
  addCatatanAksiKebersihan: (aksi: Omit<CatatanAksiKamar, 'id'>) => void;
  updateCatatanAksiKebersihan: (id: string, data: Partial<CatatanAksiKamar>) => void;
  deleteCatatanAksiKebersihan: (id: string) => void;
  addIbadah: (ibadah: Omit<IbadahRecord, 'id'>) => void;
  updateIbadahRecord: (record: IbadahRecord) => void;
  bulkUpdateIbadah: (
    siswaIds: string[],
    sesiList: SesiIbadah[],
    status: StatusIbadah,
    tanggal: string
  ) => void;
  addKesehatan: (kesehatan: Omit<CatatanKesehatan, 'id'>) => void;
  updateKesehatan: (id: string, data: Partial<CatatanKesehatan>) => void;
  deleteKesehatan: (id: string) => void;
  updateKesehatanStatus: (id: string, status: CatatanKesehatan['status'], catatan?: string) => void;

  addCKG: (ckg: Omit<PemeriksaanCKG, 'id'>) => void;
  updateCKG: (id: string, data: Partial<PemeriksaanCKG>) => void;
  deleteCKG: (id: string) => void;

  addKonseling: (konseling: Omit<SesiKonseling, 'id'>) => void;
  updateKonseling: (id: string, konseling: Partial<SesiKonseling>) => void;
  deleteKonseling: (id: string) => void;

  addShiftLog: (item: Omit<CatatanPergantianShift, 'id'>) => void;
  updateShiftLog: (id: string, data: Partial<CatatanPergantianShift>) => void;
  deleteShiftLog: (id: string) => void;

  addPerkembangan: (perkembangan: Omit<PerkembanganAnak, 'id'>) => void;
  updatePerkembangan: (id: string, perkembangan: Partial<PerkembanganAnak>) => void;
  deletePerkembangan: (id: string) => void;
  addPelanggaran: (pelanggaran: Omit<PelanggaranPembinaan, 'id'>) => void;
  updatePelanggaran: (id: string, data: Partial<PelanggaranPembinaan>) => void;
  updatePelanggaranStatus: (id: string, status: PelanggaranPembinaan['status'], catatan?: string) => void;
  deletePelanggaran: (id: string) => void;

  resetToDefaultData: () => void;

  // Helper resolvers
  getSiswa: (id?: string) => Siswa | undefined;
  getKamar: (id?: string) => Kamar | undefined;
  getWaliAsuh: (id?: string) => WaliAsuh | undefined;
}

const STORAGE_KEY = 'sipasra_jepara_data_v2';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const savedLocal = localStorage.getItem(`${STORAGE_KEY}_auth_user`);
      if (savedLocal) return JSON.parse(savedLocal) as AuthUser;
      const savedSession = sessionStorage.getItem(`${STORAGE_KEY}_auth_user`);
      if (savedSession) return JSON.parse(savedSession) as AuthUser;
    } catch {
      // ignore corrupted storage
    }
    return null;
  });

  const [activeMenu, setActiveMenu] = useState<MenuItemId>('dashboard');
  const [selectedSiswaId, setSelectedSiswaId] = useState<string | null>(null);
  const [selectedKamarId, setSelectedKamarId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  const login = (
    username: string,
    password: string,
    remember = true
  ): { success: boolean; error?: string } => {
    const result = authenticateUser(username, password);
    if (!result.user) {
      return { success: false, error: result.error || 'Login gagal.' };
    }
    setCurrentUser(result.user);
    setActiveMenu('dashboard');
    try {
      if (remember) {
        localStorage.setItem(`${STORAGE_KEY}_auth_user`, JSON.stringify(result.user));
        sessionStorage.removeItem(`${STORAGE_KEY}_auth_user`);
      } else {
        sessionStorage.setItem(`${STORAGE_KEY}_auth_user`, JSON.stringify(result.user));
        localStorage.removeItem(`${STORAGE_KEY}_auth_user`);
      }
    } catch {
      // ignore storage quota errors
    }
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setMobileDrawerOpen(false);
    try {
      localStorage.removeItem(`${STORAGE_KEY}_auth_user`);
      sessionStorage.removeItem(`${STORAGE_KEY}_auth_user`);
    } catch {
      // ignore storage errors
    }
  };

  // One-time cleanup of legacy pre-seeded dummy student records
  const [hasCleanedSeed] = useState<boolean>(() => {
    try {
      const flagKey = `${STORAGE_KEY}_cleared_seed_siswa_v1`;
      if (!localStorage.getItem(flagKey)) {
        [
          `${STORAGE_KEY}_siswa`,
          `${STORAGE_KEY}_presensi`,
          `${STORAGE_KEY}_ibadah_v4`,
          `${STORAGE_KEY}_kesehatan_v2`,
          `${STORAGE_KEY}_ckg_v1`,
          `${STORAGE_KEY}_konseling`,
          `${STORAGE_KEY}_perkembangan_v2`,
          `${STORAGE_KEY}_pelanggaran`,
        ].forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(flagKey, 'true');
        return true;
      }
    } catch {
      // ignore storage errors
    }
    return false;
  });

  // One-time cleanup of legacy pre-seeded dummy kamar records
  const [hasCleanedSeedKamar] = useState<boolean>(() => {
    try {
      const flagKey = `${STORAGE_KEY}_cleared_seed_kamar_v1`;
      if (!localStorage.getItem(flagKey)) {
        [
          `${STORAGE_KEY}_kamar`,
          `${STORAGE_KEY}_kebersihan`,
          `${STORAGE_KEY}_kebersihan_v2`,
        ].forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(flagKey, 'true');
        return true;
      }
    } catch {
      // ignore storage errors
    }
    return false;
  });

  // One-time cleanup of legacy pre-seeded dummy wali asuh records
  const [hasCleanedSeedWali] = useState<boolean>(() => {
    try {
      const flagKey = `${STORAGE_KEY}_cleared_seed_wali_v1`;
      if (!localStorage.getItem(flagKey)) {
        localStorage.removeItem(`${STORAGE_KEY}_wali`);
        localStorage.setItem(flagKey, 'true');
        return true;
      }
    } catch {
      // ignore storage errors
    }
    return false;
  });

  // Load from local storage or initial
  const [siswaList, setSiswaList] = useState<Siswa[]>(() => {
    if (hasCleanedSeed) return INITIAL_SISWA;
    const saved = localStorage.getItem(`${STORAGE_KEY}_siswa`);
    return saved ? JSON.parse(saved) : INITIAL_SISWA;
  });

  const [kamarList, setKamarList] = useState<Kamar[]>(() => {
    if (hasCleanedSeedKamar) return INITIAL_KAMAR;
    const saved = localStorage.getItem(`${STORAGE_KEY}_kamar`);
    return saved ? JSON.parse(saved) : INITIAL_KAMAR;
  });

  const normalizeShiftLabel = (shift: any): any => {
    if (shift === 'Pagi (05:00 - 13:00)') return 'Pagi (07:00 - 15:00)';
    if (shift === 'Sore (13:00 - 21:00)') return 'Sore (15:00 - 23:00)';
    if (shift === 'Malam (21:00 - 05:00)') return 'Malam (23:00 - 07:00)';
    return shift;
  };

  const [waliAsuhList, setWaliAsuhList] = useState<WaliAsuh[]>(() => {
    if (hasCleanedSeedWali) return INITIAL_WALI_ASUH;
    const saved = localStorage.getItem(`${STORAGE_KEY}_wali`);
    if (!saved) return INITIAL_WALI_ASUH;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.map((w: any) => ({ ...w, shiftPiket: normalizeShiftLabel(w.shiftPiket) }))
        : INITIAL_WALI_ASUH;
    } catch {
      return INITIAL_WALI_ASUH;
    }
  });

  const [kegiatanHarianList, setKegiatanHarianList] = useState<KegiatanHarianItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_kegiatan_v4`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && (parsed.length === 0 || parsed[0]?.namaKegiatan)) {
          return parsed;
        }
      } catch (e) {
        // ignore fallback
      }
    }
    localStorage.removeItem(`${STORAGE_KEY}_kegiatan`);
    return INITIAL_KEGIATAN_HARIAN;
  });

  const [presensiList, setPresensiList] = useState<PresensiKegiatan[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_presensi`);
    return saved ? JSON.parse(saved) : INITIAL_PRESENSI;
  });

  const [kebersihanList, setKebersihanList] = useState<KebersihanKamar[]>(() => {
    if (hasCleanedSeedKamar) return INITIAL_KEBERSIHAN;
    const saved = localStorage.getItem(`${STORAGE_KEY}_kebersihan_v2`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].kebersihanDiri === 'boolean') {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem(`${STORAGE_KEY}_kebersihan`);
    return INITIAL_KEBERSIHAN;
  });

  const [ibadahList, setIbadahList] = useState<IbadahRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_ibadah_v4`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          (parsed.length === 0 ||
            ['Melaksanakan', 'Sakit', 'Izin', 'Tidak Melaksanakan'].includes(parsed[0]?.subuh))
        ) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem(`${STORAGE_KEY}_ibadah`);
    return INITIAL_IBADAH;
  });

  const [kesehatanList, setKesehatanList] = useState<CatatanKesehatan[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_kesehatan_v2`);
    return saved ? JSON.parse(saved) : INITIAL_KESEHATAN;
  });

  const [ckgList, setCkgList] = useState<PemeriksaanCKG[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_ckg_v1`);
    return saved ? JSON.parse(saved) : INITIAL_CKG;
  });

  const [konselingList, setKonselingList] = useState<SesiKonseling[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_konseling`);
    return saved ? JSON.parse(saved) : INITIAL_KONSELING;
  });

  const [perkembanganList, setPerkembanganList] = useState<PerkembanganAnak[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_perkembangan_v2`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          (parsed.length === 0 || parsed[0]?.kemandirian?.status)
        ) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem(`${STORAGE_KEY}_perkembangan`);
    return INITIAL_PERKEMBANGAN;
  });

  const [pelanggaranList, setPelanggaranList] = useState<PelanggaranPembinaan[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pelanggaran`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => {
            let status = item.status;
            if (status === 'Sedang Berjalan') status = 'Dalam Pembinaan';
            else if (status === 'Tuntas') status = 'Selesai';
            return {
              ...item,
              jam: item.jam || '14:00',
              lokasi: item.lokasi || 'Area Asrama',
              jenisPelanggaran: item.jenisPelanggaran || 'Kedisiplinan & Kerapian',
              petugas: item.petugas || item.pembina || 'Wali Asuh',
              status: status || 'Dalam Pembinaan',
            };
          });
        }
      } catch (e) {
        // ignore
      }
    }
    return INITIAL_PELANGGARAN;
  });

  const [mutasiList, setMutasiList] = useState<MutasiRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_mutasi`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [shiftLogList, setShiftLogList] = useState<CatatanPergantianShift[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_shift_log`);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.map((item: any) => ({
            ...item,
            dariShift: normalizeShiftLabel(item.dariShift),
            keShift: normalizeShiftLabel(item.keShift),
          }))
        : [];
    } catch {
      return [];
    }
  });

  const [catatanAksiKebersihanList, setCatatanAksiKebersihanList] = useState<CatatanAksiKamar[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_catatan_aksi_kebersihan`);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_siswa`, JSON.stringify(siswaList));
  }, [siswaList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_kamar`, JSON.stringify(kamarList));
  }, [kamarList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_wali`, JSON.stringify(waliAsuhList));
  }, [waliAsuhList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_kegiatan_v4`, JSON.stringify(kegiatanHarianList));
  }, [kegiatanHarianList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_presensi`, JSON.stringify(presensiList));
  }, [presensiList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_kebersihan_v2`, JSON.stringify(kebersihanList));
  }, [kebersihanList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ibadah_v4`, JSON.stringify(ibadahList));
  }, [ibadahList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_kesehatan_v2`, JSON.stringify(kesehatanList));
  }, [kesehatanList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ckg_v1`, JSON.stringify(ckgList));
  }, [ckgList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_konseling`, JSON.stringify(konselingList));
  }, [konselingList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_perkembangan_v2`, JSON.stringify(perkembanganList));
  }, [perkembanganList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_pelanggaran`, JSON.stringify(pelanggaranList));
  }, [pelanggaranList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_mutasi`, JSON.stringify(mutasiList));
  }, [mutasiList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_shift_log`, JSON.stringify(shiftLogList));
  }, [shiftLogList]);

  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_KEY}_catatan_aksi_kebersihan`,
      JSON.stringify(catatanAksiKebersihanList)
    );
  }, [catatanAksiKebersihanList]);

  // Resolvers
  const getSiswa = (id?: string) => (id ? siswaList.find((s) => s.id === id) : undefined);
  const getKamar = (id?: string) => (id ? kamarList.find((k) => k.id === id) : undefined);
  const getWaliAsuh = (id?: string) => (id ? waliAsuhList.find((w) => w.id === id) : undefined);

  // Actions
  const addSiswa = (data: Omit<Siswa, 'id'>) => {
    const newSiswa: Siswa = {
      ...data,
      id: `sis-${Date.now()}`,
    };
    setSiswaList((prev) => [newSiswa, ...prev]);
  };

  const updateSiswa = (id: string, data: Partial<Siswa>) => {
    setSiswaList((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteSiswa = (id: string) => {
    setSiswaList((prev) => prev.filter((s) => s.id !== id));
  };

  const deleteMultipleSiswa = (ids: string[]) => {
    const idSet = new Set(ids);
    setSiswaList((prev) => prev.filter((s) => !idSet.has(s.id)));
  };

  const clearAllSiswa = () => {
    setSiswaList([]);
    setPresensiList([]);
    setIbadahList([]);
    setKesehatanList([]);
    setCkgList([]);
    setKonselingList([]);
    setPerkembanganList([]);
    setPelanggaranList([]);
    setMutasiList([]);
    setSelectedSiswaId(null);
  };

  const mutateSiswa = (params: {
    siswaIds: string[];
    jenisMutasi: MutasiRecord['jenisMutasi'];
    keKamarId?: string;
    keWaliAsuhId?: string;
    keKelas?: Siswa['kelas'];
    tanggal: string;
    keterangan?: string;
  }): number => {
    const idSet = new Set(params.siswaIds);
    const targetKamar = params.keKamarId ? getKamar(params.keKamarId) : undefined;
    const targetWali = params.keWaliAsuhId
      ? getWaliAsuh(params.keWaliAsuhId)
      : targetKamar?.waliAsuhId
      ? getWaliAsuh(targetKamar.waliAsuhId)
      : undefined;

    const newMutasiLogs: MutasiRecord[] = [];
    let movedCount = 0;

    setSiswaList((prev) =>
      prev.map((s) => {
        if (!idSet.has(s.id)) return s;
        movedCount++;

        const dariKamar = getKamar(s.kamarId)?.nama || '-';
        const dariWali = getWaliAsuh(s.waliAsuhId)?.nama || '-';
        const dariKelas = s.kelas;

        let nextKamarId = s.kamarId;
        let nextWaliId = s.waliAsuhId;
        let nextKelas = s.kelas;
        let nextStatus = s.status;

        if (
          params.jenisMutasi === 'Pindah Kamar' ||
          params.jenisMutasi === 'Pindah Kamar & Kelas'
        ) {
          if (params.keKamarId) nextKamarId = params.keKamarId;
          if (params.keWaliAsuhId) nextWaliId = params.keWaliAsuhId;
          else if (targetKamar?.waliAsuhId) nextWaliId = targetKamar.waliAsuhId;
        }

        if (
          params.jenisMutasi === 'Pindah Kelas' ||
          params.jenisMutasi === 'Pindah Kamar & Kelas'
        ) {
          if (params.keKelas) nextKelas = params.keKelas;
        }

        if (params.jenisMutasi === 'Mutasi Keluar') {
          nextStatus = 'Mutasi Keluar';
        } else if (s.status === 'Mutasi Keluar') {
          nextStatus = 'Aktif';
        }

        newMutasiLogs.push({
          id: `mut-${Date.now()}-${movedCount}`,
          tanggal: params.tanggal,
          siswaId: s.id,
          namaSiswa: s.nama,
          jenisMutasi: params.jenisMutasi,
          dariKamar,
          keKamar:
            params.jenisMutasi === 'Mutasi Keluar'
              ? 'Keluar Asrama'
              : getKamar(nextKamarId)?.nama || dariKamar,
          dariKelas,
          keKelas: params.jenisMutasi === 'Mutasi Keluar' ? '-' : nextKelas,
          dariWali,
          keWali:
            params.jenisMutasi === 'Mutasi Keluar'
              ? '-'
              : targetWali?.nama || getWaliAsuh(nextWaliId)?.nama || dariWali,
          keterangan: params.keterangan?.trim() || undefined,
          petugas: currentUser?.displayName || 'Admin',
        });

        return {
          ...s,
          kamarId: nextKamarId,
          waliAsuhId: nextWaliId,
          kelas: nextKelas,
          status: nextStatus,
        };
      })
    );

    if (newMutasiLogs.length > 0) {
      setMutasiList((prev) => [...newMutasiLogs, ...prev]);
    }
    return movedCount;
  };

  const importSiswaList = (
    items: Omit<Siswa, 'id'>[],
    mode: 'upsert' | 'append' | 'replace'
  ): { added: number; updated: number } => {
    let added = 0;
    let updated = 0;

    if (mode === 'replace') {
      const newSiswaList: Siswa[] = items.map((item, idx) => ({
        ...item,
        id: `sis-${Date.now()}-${idx}`,
      }));
      setSiswaList(newSiswaList);
      return { added: newSiswaList.length, updated: 0 };
    }

    if (mode === 'append') {
      const newItems: Siswa[] = items.map((item, idx) => ({
        ...item,
        id: `sis-${Date.now()}-${idx}`,
      }));
      setSiswaList((prev) => [...newItems, ...prev]);
      return { added: newItems.length, updated: 0 };
    }

    // mode === 'upsert'
    setSiswaList((prev) => {
      const mapByNisn = new Map<string, Siswa>();
      const mapByName = new Map<string, Siswa>();
      prev.forEach((s) => {
        const keyNisn = s.nisn.trim();
        if (keyNisn && keyNisn !== '-') {
          mapByNisn.set(keyNisn, s);
        }
        const keyName = s.nama.trim().toLowerCase();
        if (keyName) {
          mapByName.set(keyName, s);
        }
      });

      const updatedList = [...prev];
      const newlyCreated: Siswa[] = [];

      items.forEach((item, idx) => {
        const cleanNisn = item.nisn.trim();
        const cleanName = item.nama.trim().toLowerCase();
        const existing =
          (cleanNisn && cleanNisn !== '-' ? mapByNisn.get(cleanNisn) : undefined) ||
          (cleanName ? mapByName.get(cleanName) : undefined);
        if (existing) {
          const index = updatedList.findIndex((s) => s.id === existing.id);
          if (index !== -1) {
            updatedList[index] = {
              ...existing,
              ...item,
              nisn: cleanNisn && cleanNisn !== '-' ? item.nisn : existing.nisn,
              nik: item.nik || existing.nik,
              noKk: item.noKk || existing.noKk,
              tempatLahir: item.tempatLahir || existing.tempatLahir,
              tanggalLahir: item.tanggalLahir || existing.tanggalLahir,
              kamarId: item.kamarId || existing.kamarId,
              waliAsuhId: item.waliAsuhId || existing.waliAsuhId,
              alergi: item.alergi || existing.alergi,
              catatanKhusus: item.catatanKhusus || existing.catatanKhusus,
              orangTua: {
                namaAyah: item.orangTua?.namaAyah || existing.orangTua?.namaAyah || '',
                namaIbu: item.orangTua?.namaIbu || existing.orangTua?.namaIbu || '',
                noHp: item.orangTua?.noHp || existing.orangTua?.noHp || '',
                alamat: item.orangTua?.alamat || existing.orangTua?.alamat || '',
                desa: item.orangTua?.desa || existing.orangTua?.desa || '',
                kecamatan: item.orangTua?.kecamatan || existing.orangTua?.kecamatan || '',
                kabupaten: item.orangTua?.kabupaten || existing.orangTua?.kabupaten || '',
                kotaAsal: item.orangTua?.kotaAsal || existing.orangTua?.kotaAsal || '',
              },
              dokumen:
                existing.dokumen || item.dokumen
                  ? {
                      ...existing.dokumen,
                      ...item.dokumen,
                      ktpNomor: item.dokumen?.ktpNomor || existing.dokumen?.ktpNomor,
                      kkNomor: item.dokumen?.kkNomor || existing.dokumen?.kkNomor,
                      akteNomor: item.dokumen?.akteNomor || existing.dokumen?.akteNomor,
                    }
                  : undefined,
            };
            updated++;
          }
        } else {
          const newStudent: Siswa = {
            ...item,
            id: `sis-${Date.now()}-${idx}`,
          };
          newlyCreated.push(newStudent);
          if (cleanNisn && cleanNisn !== '-') {
            mapByNisn.set(cleanNisn, newStudent);
          }
          if (cleanName) {
            mapByName.set(cleanName, newStudent);
          }
          added++;
        }
      });

      return [...newlyCreated, ...updatedList];
    });

    return { added, updated };
  };

  const addKamar = (data: Omit<Kamar, 'id'>) => {
    const newKamar: Kamar = {
      ...data,
      id: `kmr-${Date.now()}`,
    };
    setKamarList((prev) => [...prev, newKamar]);
  };

  const updateKamar = (id: string, data: Partial<Kamar>) => {
    setKamarList((prev) => prev.map((k) => (k.id === id ? { ...k, ...data } : k)));
  };

  const deleteKamar = (id: string) => {
    setKamarList((prev) => prev.filter((k) => k.id !== id));
    setKebersihanList((prev) => prev.filter((keb) => keb.kamarId !== id));
    setCatatanAksiKebersihanList((prev) => prev.filter((aksi) => aksi.kamarId !== id));
    setSiswaList((prev) => prev.map((s) => (s.kamarId === id ? { ...s, kamarId: '' } : s)));
  };

  const clearAllKamar = () => {
    setKamarList([]);
    setKebersihanList([]);
    setCatatanAksiKebersihanList([]);
    setSelectedKamarId(null);
    setSiswaList((prev) => prev.map((s) => ({ ...s, kamarId: '' })));
  };

  const addWaliAsuh = (data: Omit<WaliAsuh, 'id'>) => {
    const newWali: WaliAsuh = {
      ...data,
      id: `wali-${Date.now()}`,
    };
    setWaliAsuhList((prev) => [...prev, newWali]);
  };

  const updateWaliAsuh = (id: string, data: Partial<WaliAsuh>) => {
    setWaliAsuhList((prev) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)));
  };

  const deleteWaliAsuh = (id: string) => {
    setWaliAsuhList((prev) => prev.filter((w) => w.id !== id));
    setKamarList((prev) => prev.map((k) => (k.waliAsuhId === id ? { ...k, waliAsuhId: '' } : k)));
    setSiswaList((prev) => prev.map((s) => (s.waliAsuhId === id ? { ...s, waliAsuhId: '' } : s)));
  };

  const clearAllWaliAsuh = () => {
    setWaliAsuhList([]);
    setKamarList((prev) => prev.map((k) => ({ ...k, waliAsuhId: '' })));
    setSiswaList((prev) => prev.map((s) => ({ ...s, waliAsuhId: '' })));
  };

  const addKegiatanHarian = (data: Omit<KegiatanHarianItem, 'id'>) => {
    const item: KegiatanHarianItem = {
      ...data,
      id: `keg-${Date.now()}`,
    };
    setKegiatanHarianList((prev) => [...prev, item]);
  };

  const updateKegiatanHarian = (id: string, data: Partial<KegiatanHarianItem>) => {
    setKegiatanHarianList((prev) => prev.map((k) => (k.id === id ? { ...k, ...data } : k)));
  };

  const deleteKegiatanHarian = (id: string) => {
    setKegiatanHarianList((prev) => prev.filter((k) => k.id !== id));
    setPresensiList((prev) => prev.filter((p) => p.kegiatanId !== id));
  };

  const clearAllKegiatanHarian = () => {
    setKegiatanHarianList([]);
    setPresensiList([]);
  };

  const updatePresensi = (record: PresensiKegiatan) => {
    setPresensiList((prev) => {
      const idx = prev.findIndex(
        (p) => p.tanggal === record.tanggal && p.kegiatanId === record.kegiatanId && p.siswaId === record.siswaId
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [...prev, { ...record, id: `pres-${Date.now()}` }];
    });
  };

  const addKebersihan = (data: Omit<KebersihanKamar, 'id'>) => {
    setKebersihanList((prev) => {
      const idx = prev.findIndex(
        (item) => item.kamarId === data.kamarId && item.tanggal === data.tanggal
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...data, id: copy[idx].id };
        return copy;
      }
      const newItem: KebersihanKamar = {
        ...data,
        id: `keb-${Date.now()}`,
      };
      return [newItem, ...prev];
    });
  };

  const addCatatanAksiKebersihan = (data: Omit<CatatanAksiKamar, 'id'>) => {
    const newItem: CatatanAksiKamar = {
      ...data,
      id: `aksi-keb-${Date.now()}`,
    };
    setCatatanAksiKebersihanList((prev) => [newItem, ...prev]);
  };

  const updateCatatanAksiKebersihan = (id: string, data: Partial<CatatanAksiKamar>) => {
    setCatatanAksiKebersihanList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  const deleteCatatanAksiKebersihan = (id: string) => {
    setCatatanAksiKebersihanList((prev) => prev.filter((item) => item.id !== id));
  };

  const addIbadah = (data: Omit<IbadahRecord, 'id'>) => {
    const newItem: IbadahRecord = {
      ...data,
      id: `ibd-${Date.now()}`,
    };
    setIbadahList((prev) => [newItem, ...prev]);
  };

  const updateIbadahRecord = (record: IbadahRecord) => {
    setIbadahList((prev) => {
      const idx = prev.findIndex(
        (i) =>
          i.id === record.id ||
          (i.siswaId === record.siswaId && i.tanggal === record.tanggal)
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...record };
        return copy;
      }
      return [
        {
          ...record,
          id: record.id || `ibd-${record.siswaId}-${record.tanggal}`,
        },
        ...prev,
      ];
    });
  };

  const bulkUpdateIbadah = (
    siswaIds: string[],
    sesiList: SesiIbadah[],
    status: StatusIbadah,
    tanggal: string
  ) => {
    setIbadahList((prev) => {
      const map = new Map<string, IbadahRecord>();
      prev.forEach((r) => {
        map.set(`${r.siswaId}_${r.tanggal}`, { ...r });
      });

      siswaIds.forEach((siswaId) => {
        const key = `${siswaId}_${tanggal}`;
        const existing = map.get(key) || {
          id: `ibd-${siswaId}-${tanggal}`,
          tanggal,
          siswaId,
          subuh: 'Melaksanakan',
          dhuha: 'Melaksanakan',
          duhur: 'Melaksanakan',
          ashar: 'Melaksanakan',
          maghrib: 'Melaksanakan',
          isya: 'Melaksanakan',
          diniyah: 'Melaksanakan',
        };

        const updated = { ...existing };
        sesiList.forEach((sesi) => {
          updated[sesi] = status;
          if (sesi === 'duhur') {
            updated.dzuhur = status;
          }
        });

        map.set(key, updated);
      });

      return Array.from(map.values());
    });
  };

  const addKesehatan = (data: Omit<CatatanKesehatan, 'id'>) => {
    const newItem: CatatanKesehatan = {
      ...data,
      id: `kes-${Date.now()}`,
    };
    setKesehatanList((prev) => [newItem, ...prev]);
    // update status siswa jika dirawat atau perlu observasi
    if (data.kondisi === 'Dalam Perawatan' || data.kondisi === 'Observasi' || data.status === 'Dalam Perawatan' || data.status === 'Observasi') {
      updateSiswa(data.siswaId, { status: 'Sakit' });
    }
  };

  const updateKesehatan = (id: string, data: Partial<CatatanKesehatan>) => {
    setKesehatanList((prev) =>
      prev.map((k) => {
        if (k.id === id) {
          const updated = { ...k, ...data };
          if (data.kondisi === 'Sembuh' || data.status === 'Sembuh') {
            updateSiswa(updated.siswaId, { status: 'Aktif' });
          } else if (data.kondisi === 'Dalam Perawatan' || data.status === 'Dalam Perawatan') {
            updateSiswa(updated.siswaId, { status: 'Sakit' });
          }
          return updated;
        }
        return k;
      })
    );
  };

  const deleteKesehatan = (id: string) => {
    setKesehatanList((prev) => prev.filter((k) => k.id !== id));
  };

  const updateKesehatanStatus = (id: string, status: CatatanKesehatan['status'], catatan?: string) => {
    setKesehatanList((prev) =>
      prev.map((k) => {
        if (k.id === id) {
          const updated = {
            ...k,
            status,
            kondisi: status || k.kondisi,
            catatanPerkembangan: catatan || k.catatanPerkembangan,
            catatan: catatan || k.catatan,
          };
          if (status === 'Sembuh') {
            updateSiswa(k.siswaId, { status: 'Aktif' });
          }
          return updated;
        }
        return k;
      })
    );
  };

  const addCKG = (data: Omit<PemeriksaanCKG, 'id'>) => {
    const newItem: PemeriksaanCKG = {
      ...data,
      id: `ckg-${Date.now()}`,
    };
    setCkgList((prev) => [newItem, ...prev]);
  };

  const updateCKG = (id: string, data: Partial<PemeriksaanCKG>) => {
    setCkgList((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const deleteCKG = (id: string) => {
    setCkgList((prev) => prev.filter((item) => item.id !== id));
  };

  const addKonseling = (data: Omit<SesiKonseling, 'id'>) => {
    const newItem: SesiKonseling = {
      ...data,
      id: `kon-${Date.now()}`,
    };
    setKonselingList((prev) => [newItem, ...prev]);
  };

  const updateKonseling = (id: string, data: Partial<SesiKonseling>) => {
    setKonselingList((prev) => prev.map((k) => (k.id === id ? { ...k, ...data } : k)));
  };

  const deleteKonseling = (id: string) => {
    setKonselingList((prev) => prev.filter((k) => k.id !== id));
  };

  const addShiftLog = (data: Omit<CatatanPergantianShift, 'id'>) => {
    const newItem: CatatanPergantianShift = {
      ...data,
      id: `shf-${Date.now()}`,
    };
    setShiftLogList((prev) => [newItem, ...prev]);
  };

  const updateShiftLog = (id: string, data: Partial<CatatanPergantianShift>) => {
    setShiftLogList((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const deleteShiftLog = (id: string) => {
    setShiftLogList((prev) => prev.filter((item) => item.id !== id));
  };

  const addPerkembangan = (data: Omit<PerkembanganAnak, 'id'>) => {
    const newItem: PerkembanganAnak = {
      ...data,
      id: `prk-${Date.now()}`,
    };
    setPerkembanganList((prev) => [newItem, ...prev]);
  };

  const updatePerkembangan = (id: string, data: Partial<PerkembanganAnak>) => {
    setPerkembanganList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  const deletePerkembangan = (id: string) => {
    setPerkembanganList((prev) => prev.filter((item) => item.id !== id));
  };

  const addPelanggaran = (data: Omit<PelanggaranPembinaan, 'id'>) => {
    const newItem: PelanggaranPembinaan = {
      ...data,
      id: `pel-${Date.now()}`,
    };
    setPelanggaranList((prev) => [newItem, ...prev]);
  };

  const updatePelanggaran = (id: string, data: Partial<PelanggaranPembinaan>) => {
    setPelanggaranList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  };

  const deletePelanggaran = (id: string) => {
    setPelanggaranList((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePelanggaranStatus = (
    id: string,
    status: PelanggaranPembinaan['status'],
    catatan?: string
  ) => {
    setPelanggaranList((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status, catatanPerubahan: catatan !== undefined ? catatan : p.catatanPerubahan }
          : p
      )
    );
  };

  const resetToDefaultData = () => {
    setSiswaList(INITIAL_SISWA);
    setKamarList(INITIAL_KAMAR);
    setWaliAsuhList(INITIAL_WALI_ASUH);
    setKegiatanHarianList(INITIAL_KEGIATAN_HARIAN);
    setPresensiList(INITIAL_PRESENSI);
    setKebersihanList(INITIAL_KEBERSIHAN);
    setCatatanAksiKebersihanList([]);
    setIbadahList(INITIAL_IBADAH);
    setKesehatanList(INITIAL_KESEHATAN);
    setCkgList(INITIAL_CKG);
    setKonselingList(INITIAL_KONSELING);
    setPerkembanganList(INITIAL_PERKEMBANGAN);
    setPelanggaranList(INITIAL_PELANGGARAN);
    setShiftLogList([]);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        activeMenu,
        setActiveMenu,
        selectedSiswaId,
        setSelectedSiswaId,
        selectedKamarId,
        setSelectedKamarId,
        searchQuery,
        setSearchQuery,
        mobileDrawerOpen,
        setMobileDrawerOpen,
        siswaList,
        kamarList,
        waliAsuhList,
        kegiatanHarianList,
        presensiList,
        kebersihanList,
        catatanAksiKebersihanList,
        ibadahList,
        kesehatanList,
        ckgList,
        konselingList,
        perkembanganList,
        pelanggaranList,
        mutasiList,
        shiftLogList,
        addSiswa,
        updateSiswa,
        deleteSiswa,
        deleteMultipleSiswa,
        clearAllSiswa,
        mutateSiswa,
        importSiswaList,
        addKamar,
        updateKamar,
        deleteKamar,
        clearAllKamar,
        addWaliAsuh,
        updateWaliAsuh,
        deleteWaliAsuh,
        clearAllWaliAsuh,
        addKegiatanHarian,
        updateKegiatanHarian,
        deleteKegiatanHarian,
        clearAllKegiatanHarian,
        updatePresensi,
        addKebersihan,
        addCatatanAksiKebersihan,
        updateCatatanAksiKebersihan,
        deleteCatatanAksiKebersihan,
        addIbadah,
        updateIbadahRecord,
        bulkUpdateIbadah,
        addKesehatan,
        updateKesehatan,
        deleteKesehatan,
        updateKesehatanStatus,
        addCKG,
        updateCKG,
        deleteCKG,
        addKonseling,
        updateKonseling,
        deleteKonseling,
        addShiftLog,
        updateShiftLog,
        deleteShiftLog,
        addPerkembangan,
        updatePerkembangan,
        deletePerkembangan,
        addPelanggaran,
        updatePelanggaran,
        updatePelanggaranStatus,
        deletePelanggaran,
        resetToDefaultData,
        getSiswa,
        getKamar,
        getWaliAsuh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
