import React from 'react';

interface DailyPrayerStats {
  subuh: number; // percentage 0-100
  dhuha: number;
  duhur: number;
  ashar: number;
  maghrib: number;
  isya: number;
  diniyah: number;
}

export const DailyPrayerAttendanceChart: React.FC<{ stats: DailyPrayerStats }> = ({ stats }) => {
  const items = [
    { label: 'Subuh', val: stats.subuh, color: '#0284c7' },
    { label: 'Dhuha', val: stats.dhuha, color: '#0d9488' },
    { label: 'Dzuhur', val: stats.duhur, color: '#006b54' },
    { label: 'Ashar', val: stats.ashar, color: '#16a34a' },
    { label: 'Maghrib', val: stats.maghrib, color: '#ca8a04' },
    { label: 'Isya', val: stats.isya, color: '#4f46e5' },
    { label: 'Diniyah', val: stats.diniyah, color: '#9333ea' },
  ];

  return (
    <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-[#1a1c1a]/20 pb-2">
        <span className="text-xs font-mono-custom font-bold uppercase text-[#1a1c1a]">
          // DIAGRAM KEPATUHAN IBADAH HARIAN SANTRI (%)
        </span>
        <span className="text-[10px] font-mono-custom bg-emerald-100 text-emerald-900 px-2 py-0.5 border border-emerald-300">
          Target Asrama: 100%
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2 items-end pt-4 pb-1 h-36">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center h-full justify-end group">
            <span className="text-[10px] font-mono-custom font-bold text-[#1a1c1a] mb-1">
              {item.val}%
            </span>
            <div className="w-full max-w-[36px] bg-stone-100 border border-[#1a1c1a] h-24 relative flex items-end overflow-hidden">
              <div
                className="w-full transition-all duration-500 border-t border-[#1a1c1a]"
                style={{
                  height: `${item.val}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <span className="text-[10px] font-mono-custom font-bold text-[#1a1c1a] mt-1.5 truncate max-w-full">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WeeklyCleanlinessComparisonChart: React.FC<{
  kamarScores: { nama: string; score: number; gedung: string }[];
}> = ({ kamarScores }) => {
  return (
    <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-[#1a1c1a]/20 pb-2">
        <span className="text-xs font-mono-custom font-bold uppercase text-[#1a1c1a]">
          // DIAGRAM RATING KEBERSIHAN KAMAR MINGGU INI (SKALA 1 - 5)
        </span>
        <span className="text-[10px] font-mono-custom bg-amber-100 text-amber-900 px-2 py-0.5 border border-amber-300">
          Standar Minimal: 3.5
        </span>
      </div>

      <div className="space-y-2">
        {kamarScores.map((k, idx) => {
          const percentage = Math.min(100, Math.round((k.score / 5) * 100));
          const isTop = idx === 0;

          return (
            <div key={k.nama} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono-custom">
                <span className="font-bold text-[#1a1c1a] flex items-center gap-1.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    idx === 0 ? 'bg-amber-400 text-stone-900' : 'bg-stone-200 text-stone-700'
                  }`}>
                    {idx + 1}
                  </span>
                  {k.nama}
                  <span className="text-[9.5px] text-[#1a1c1a]/50">({k.gedung.includes('Putra') ? 'PA' : 'PI'})</span>
                </span>
                <span className="font-bold text-[#1a1c1a]">
                  {k.score.toFixed(1)} / 5.0
                </span>
              </div>

              <div className="h-3.5 w-full bg-stone-100 border border-[#1a1c1a] relative overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 border-r border-[#1a1c1a] ${
                    isTop ? 'bg-amber-500' : k.score >= 4 ? 'bg-[#006b54]' : 'bg-teal-600'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
                <div className="absolute top-0 bottom-0 left-[70%] border-r border-dashed border-red-500/60" title="Batas 3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MonthlyCharacterGrowthChart: React.FC<{
  statusCounts: {
    sangatBaik: number;
    berkembang: number;
    stabil: number;
    perluPendampingan: number;
    menurun: number;
  };
  totalSiswa: number;
}> = ({ statusCounts, totalSiswa }) => {
  const items = [
    { label: '⭐ Sangat Baik', count: statusCounts.sangatBaik, color: 'bg-emerald-600', textCol: 'text-emerald-900', bgBox: 'bg-emerald-50' },
    { label: '📈 Berkembang', count: statusCounts.berkembang, color: 'bg-[#006b54]', textCol: 'text-[#006b54]', bgBox: 'bg-teal-50' },
    { label: '➡️ Stabil', count: statusCounts.stabil, color: 'bg-sky-600', textCol: 'text-sky-900', bgBox: 'bg-sky-50' },
    { label: '⚠️ Perlu Pendampingan', count: statusCounts.perluPendampingan, color: 'bg-amber-500', textCol: 'text-amber-900', bgBox: 'bg-amber-50' },
    { label: '📉 Menurun', count: statusCounts.menurun, color: 'bg-rose-600', textCol: 'text-rose-900', bgBox: 'bg-rose-50' },
  ];

  return (
    <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-[#1a1c1a]/20 pb-2">
        <span className="text-xs font-mono-custom font-bold uppercase text-[#1a1c1a]">
          // DIAGRAM DISTRIBUSI PERKEMBANGAN KARAKTER SANTRI
        </span>
        <span className="text-[10px] font-mono-custom bg-stone-100 text-stone-800 px-2 py-0.5 border border-[#1a1c1a]/30">
          Total: {totalSiswa} Santri
        </span>
      </div>

      {/* Multi-segment horizontal stacked bar */}
      <div className="h-6 w-full bg-stone-100 border-[1.5px] border-[#1a1c1a] flex overflow-hidden">
        {items.map((item) => {
          const pct = totalSiswa > 0 ? (item.count / totalSiswa) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={item.label}
              className={`h-full ${item.color} relative border-r border-[#1a1c1a] transition-all`}
              style={{ width: `${pct}%` }}
              title={`${item.label}: ${item.count} santri (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>

      {/* Legend & Breakdown grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
        {items.map((item) => {
          const pct = totalSiswa > 0 ? ((item.count / totalSiswa) * 100).toFixed(0) : '0';
          return (
            <div
              key={item.label}
              className={`p-2 border border-[#1a1c1a]/30 ${item.bgBox} text-xs font-mono-custom`}
            >
              <span className="block font-bold text-[10.5px] truncate">{item.label}</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-base font-syne font-bold text-[#1a1c1a]">
                  {item.count}
                </span>
                <span className="text-[10px] text-[#1a1c1a]/60">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
