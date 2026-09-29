import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';

// 12 Menu Views
import { DashboardView } from './components/views/DashboardView';
import { DataSiswaView } from './components/views/DataSiswaView';
import { DataKamarView } from './components/views/DataKamarView';
import { DataWaliAsuhView } from './components/views/DataWaliAsuhView';
import { KegiatanHarianView } from './components/views/KegiatanHarianView';
import { KebersihanView } from './components/views/KebersihanView';
import { IbadahView } from './components/views/IbadahView';
import { KesehatanView } from './components/views/KesehatanView';
import { KonselingView } from './components/views/KonselingView';
import { PerkembanganAnakView } from './components/views/PerkembanganAnakView';
import { PelanggaranView } from './components/views/PelanggaranView';
import { LaporanView } from './components/views/LaporanView';

const MainLayout: React.FC = () => {
  const { activeMenu } = useApp();

  const renderActiveView = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardView />;
      case 'siswa':
        return <DataSiswaView />;
      case 'kamar':
        return <DataKamarView />;
      case 'wali-asuh':
        return <DataWaliAsuhView />;
      case 'kegiatan-harian':
        return <KegiatanHarianView />;
      case 'kebersihan':
        return <KebersihanView />;
      case 'ibadah':
        return <IbadahView />;
      case 'kesehatan':
        return <KesehatanView />;
      case 'konseling':
        return <KonselingView />;
      case 'perkembangan-anak':
        return <PerkembanganAnakView />;
      case 'pelanggaran':
        return <PelanggaranView />;
      case 'laporan':
        return <LaporanView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfcf9] text-[#1a1c1a] flex flex-col font-sans selection:bg-[#006b54] selection:text-white">
      {/* Top Header */}
      <Header />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-5 md:px-6 py-5 gap-6">
        {/* Desktop Sidebar Navigation */}
        <Sidebar />

        {/* Dynamic Content View Area */}
        <main className="flex-1 min-w-0">
          {renderActiveView()}
        </main>
      </div>

      {/* Variation 2 Footer Bar */}
      <footer className="border-t-[1.5px] border-[#1a1c1a] py-3.5 px-4 sm:px-6 bg-[#fdfcf9] font-mono-custom text-[0.65rem] text-[#1a1c1a]/60 flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
        <span>© 2026 SI-PASRA SYSTEM · SEKOLAH RAKYAT 1 JEPARA</span>
        <span>JEPARA, INDONESIA — VER 2.4.0</span>
      </footer>

      {/* Android Mobile Touch Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
