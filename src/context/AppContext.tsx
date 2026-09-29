import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  MenuItemId,
  Siswa,
  Kamar,
  WaliAsuh,
  KegiatanHarianItem,
  PresensiKegiatan,
  KebersihanKamar,
  IbadahRecord,
  StatusIbadah,
  SesiIbadah,
  CatatanKesehatan,
  PemeriksaanCKG,
  SesiKonseling,
  PerkembanganAnak,
  PelanggaranPembinaan,
} from '../types';
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
  ibadahList: IbadahRecord[];
  kesehatanList: CatatanKesehatan[];
  ckgList: PemeriksaanCKG[];
  konselingList: SesiKonseling[];
  perkembanganList: PerkembanganAnak[];
  pelanggaranList: PelanggaranPembinaan[];

  // Mutators
  addSiswa: (siswa: Omit<Siswa, 'id'>) => void;
  updateSiswa: (id: string, siswa: Partial<Siswa>) => void;
  deleteSiswa: (id: string) => void;
  importSiswaList: (
    items: Omit<Siswa, 'id'>[],
    mode: 'upsert' | 'append' | 'replace'
  ) => { added: number; updated: number };

  addKamar: (kamar: Omit<Kamar, 'id'>) => void;
  updateKamar: (id: string, kamar: Partial<Kamar>) => void;
  deleteKamar: (id: string) => void;

  addWaliAsuh: (wali: Omit<WaliAsuh, 'id'>) => void;
  updateWaliAsuh: (id: string, wali: Partial<WaliAsuh>) => void;

  addKegiatanHarian: (kegiatan: Omit<KegiatanHarianItem, 'id'>) => void;
  updatePresensi: (presensi: PresensiKegiatan) => void;

  addKebersihan: (kebersihan: Omit<KebersihanKamar, 'id'>) => void;
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
  const [activeMenu, setActiveMenu] = useState<MenuItemId>('dashboard');
  const [selectedSiswaId, setSelectedSiswaId] = useState<string | null>(null);
  const [selectedKamarId, setSelectedKamarId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Load from local storage or initial
  const [siswaList, setSiswaList] = useState<Siswa[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_siswa`);
    return saved ? JSON.parse(saved) : INITIAL_SISWA;
  });

  const [kamarList, setKamarList] = useState<Kamar[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_kamar`);
    return saved ? JSON.parse(saved) : INITIAL_KAMAR;
  });

  const [waliAsuhList, setWaliAsuhList] = useState<WaliAsuh[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_wali`);
    return saved ? JSON.parse(saved) : INITIAL_WALI_ASUH;
  });

  const [kegiatanHarianList, setKegiatanHarianList] = useState<KegiatanHarianItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_kegiatan_v4`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 20 && parsed[0]?.fokusPengasuhan) {
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
          parsed.length > 0 &&
          typeof parsed[0].subuh === 'string' &&
          (parsed[0].subuh === 'Melaksanakan' || parsed[0].subuh === 'Sakit')
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
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.kemandirian?.status) {
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
        if (Array.isArray(parsed) && parsed.length > 0) {
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
      prev.forEach((s) => mapByNisn.set(s.nisn.trim(), s));

      const updatedList = [...prev];
      const newlyCreated: Siswa[] = [];

      items.forEach((item, idx) => {
        const cleanNisn = item.nisn.trim();
        const existing = mapByNisn.get(cleanNisn);
        if (existing) {
          const index = updatedList.findIndex((s) => s.id === existing.id);
          if (index !== -1) {
            updatedList[index] = { ...existing, ...item };
            updated++;
          }
        } else {
          const newStudent: Siswa = {
            ...item,
            id: `sis-${Date.now()}-${idx}`,
          };
          newlyCreated.push(newStudent);
          mapByNisn.set(cleanNisn, newStudent);
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

  const addKegiatanHarian = (data: Omit<KegiatanHarianItem, 'id'>) => {
    const item: KegiatanHarianItem = {
      ...data,
      id: `keg-${Date.now()}`,
    };
    setKegiatanHarianList((prev) => [...prev, item]);
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
    const newItem: KebersihanKamar = {
      ...data,
      id: `keb-${Date.now()}`,
    };
    setKebersihanList((prev) => [newItem, ...prev]);
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
    setIbadahList(INITIAL_IBADAH);
    setKesehatanList(INITIAL_KESEHATAN);
    setCkgList(INITIAL_CKG);
    setKonselingList(INITIAL_KONSELING);
    setPerkembanganList(INITIAL_PERKEMBANGAN);
    setPelanggaranList(INITIAL_PELANGGARAN);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
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
        ibadahList,
        kesehatanList,
        ckgList,
        konselingList,
        perkembanganList,
        pelanggaranList,
        addSiswa,
        updateSiswa,
        deleteSiswa,
        importSiswaList,
        addKamar,
        updateKamar,
        deleteKamar,
        addWaliAsuh,
        updateWaliAsuh,
        addKegiatanHarian,
        updatePresensi,
        addKebersihan,
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
