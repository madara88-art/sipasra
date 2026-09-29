import React from 'react';
import { ASPEK_LIST, AspekKey } from '../../../utils/raportUtils';
import { NilaiAspekRaport } from '../../../types';

interface RadarChart8Props {
  aspekData: Record<AspekKey, NilaiAspekRaport>;
  skala?: '1-4' | '1-10';
  size?: number;
}

export const RadarChart8Aspects: React.FC<RadarChart8Props> = ({
  aspekData,
  skala = '1-10',
  size = 360,
}) => {
  const center = size / 2;
  const radius = size * 0.38;
  const maxVal = skala === '1-4' ? 4 : 10;
  const numAxes = ASPEK_LIST.length; // 8

  // Calculate polygon points
  const points = ASPEK_LIST.map((item, index) => {
    const angle = (Math.PI * 2 / numAxes) * index - Math.PI / 2;
    const value = aspekData[item.key]?.nilai || (skala === '1-4' ? 3.0 : 7.0);
    const normalized = Math.min(maxVal, Math.max(0, value)) / maxVal;
    const r = normalized * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, value, angle, key: item.key, label: item.label };
  });

  const polygonPath = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Grid rings (25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="w-full flex flex-col items-center justify-center p-2 bg-[#fdfcf9] border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a]">
      <div className="text-[10px] font-mono-custom uppercase tracking-wider font-bold text-[#1a1c1a]/70 mb-1 self-start flex items-center gap-1.5">
        <span className="w-2 h-2 bg-[#006b54] inline-block"></span>
        <span>RADAR POLIGON 8 ASPEK PENGASUHAN</span>
      </div>

      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[340px] sm:max-w-[380px] h-auto select-none"
      >
        {/* Background Grid Rings */}
        {rings.map((ringVal, rIdx) => {
          const r = radius * ringVal;
          const ringPoints = Array.from({ length: numAxes }).map((_, i) => {
            const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ');

          const labelVal = skala === '1-4' ? (ringVal * 4).toFixed(1) : Math.round(ringVal * 10);

          return (
            <g key={rIdx}>
              <polygon
                points={ringPoints}
                fill={rIdx % 2 === 0 ? '#1a1c1a' : 'transparent'}
                fillOpacity={rIdx % 2 === 0 ? 0.025 : 0}
                stroke="#1a1c1a"
                strokeWidth={rIdx === rings.length - 1 ? '1.5' : '0.75'}
                strokeDasharray={rIdx === rings.length - 1 ? undefined : '2 2'}
                strokeOpacity={0.4}
              />
              {/* Ring scale text */}
              <text
                x={center + 4}
                y={center - r + 10}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#1a1c1a"
                fillOpacity={0.45}
              >
                {labelVal}
              </text>
            </g>
          );
        })}

        {/* Axes lines from center to outer ring */}
        {Array.from({ length: numAxes }).map((_, i) => {
          const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#1a1c1a"
              strokeWidth="0.8"
              strokeOpacity={0.3}
            />
          );
        })}

        {/* Value Area Polygon */}
        <polygon
          points={polygonPath}
          fill="#006b54"
          fillOpacity={0.25}
          stroke="#006b54"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Data points & Labels */}
        {points.map((p, idx) => {
          // Label coordinate (slightly offset outside)
          const labelDist = radius + 22;
          const lx = center + labelDist * Math.cos(p.angle);
          const ly = center + labelDist * Math.sin(p.angle);

          // Text anchor adjustment
          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          if (Math.cos(p.angle) > 0.3) textAnchor = 'start';
          else if (Math.cos(p.angle) < -0.3) textAnchor = 'end';

          return (
            <g key={idx}>
              {/* Vertex Dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#006b54"
                stroke="#1a1c1a"
                strokeWidth="1.5"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="1.5"
                fill="#ffffff"
              />

              {/* Axis Label */}
              <text
                x={lx}
                y={ly}
                textAnchor={textAnchor}
                fontSize="9"
                fontFamily="sans-serif"
                fontWeight="bold"
                fill="#1a1c1a"
                className="select-none"
              >
                {p.label}
              </text>
              <text
                x={lx}
                y={ly + 10}
                textAnchor={textAnchor}
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#006b54"
              >
                ({p.value.toString().replace('.', ',')})
              </text>
            </g>
          );
        })}

        {/* Center dot */}
        <circle cx={center} cy={center} r="2.5" fill="#1a1c1a" />
      </svg>

      <div className="w-full flex items-center justify-center gap-4 text-[10px] font-mono-custom text-[#1a1c1a]/70 mt-1 border-t border-[#1a1c1a]/20 pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2.5 bg-[#006b54]/30 border border-[#006b54] inline-block"></span>
          Capaian Santri (Skala {skala})
        </span>
        <span className="text-[#1a1c1a]/40">·</span>
        <span>Maksimal: {maxVal}.0</span>
      </div>
    </div>
  );
};

interface BarChart8Props {
  aspekData: Record<AspekKey, NilaiAspekRaport>;
  skala?: '1-4' | '1-10';
}

export const BarChart8Aspects: React.FC<BarChart8Props> = ({
  aspekData,
  skala = '1-10',
}) => {
  const maxVal = skala === '1-4' ? 4 : 10;

  return (
    <div className="bg-white border-[1.5px] border-[#1a1c1a] shadow-[2px_2px_0px_#1a1c1a] p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-[#1a1c1a]/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#006b54] inline-block"></span>
          <span className="text-xs font-mono-custom uppercase font-bold text-[#1a1c1a]">
            DIAGRAM BATANG EVALUASI 8 ASPEK
          </span>
        </div>
        <span className="text-[10px] font-mono-custom bg-stone-100 px-2 py-0.5 border border-[#1a1c1a]/30">
          Target Ideal: {maxVal}.0
        </span>
      </div>

      <div className="space-y-2.5">
        {ASPEK_LIST.map((item) => {
          const data = aspekData[item.key] || { nilai: 3.0, predikat: 'Baik' };
          const percentage = Math.min(100, Math.round((data.nilai / maxVal) * 100));

          // Color based on predikat
          let barBg = 'bg-teal-600';
          if (data.predikat === 'Sangat Baik') barBg = 'bg-emerald-600';
          else if (data.predikat === 'Cukup') barBg = 'bg-amber-500';
          else if (data.predikat === 'Pembinaan Khusus') barBg = 'bg-rose-500';

          return (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono-custom">
                <span className="font-bold text-[#1a1c1a] flex items-center gap-1.5">
                  <span className="text-[10px] text-[#1a1c1a]/50">#</span>
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1a1c1a]">
                    {data.nilai.toString().replace('.', ',')}
                  </span>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.2 border border-[#1a1c1a]/30 ${
                      data.predikat === 'Sangat Baik'
                        ? 'bg-emerald-100 text-emerald-950 font-bold'
                        : data.predikat === 'Baik'
                        ? 'bg-teal-100 text-teal-950 font-semibold'
                        : data.predikat === 'Cukup'
                        ? 'bg-amber-100 text-amber-950'
                        : 'bg-rose-100 text-rose-950 font-bold'
                    }`}
                  >
                    {data.predikat}
                  </span>
                </div>
              </div>

              {/* Progress bar container */}
              <div className="h-4 w-full bg-stone-100 border border-[#1a1c1a] relative overflow-hidden flex">
                <div
                  className={`h-full ${barBg} transition-all duration-300 relative border-r border-[#1a1c1a]`}
                  style={{ width: `${percentage}%` }}
                >
                  {/* Stripes pattern */}
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[length:8px_8px]" />
                </div>
                {/* 50% & 75% indicator marks */}
                <div className="absolute top-0 bottom-0 left-1/2 border-r border-dashed border-[#1a1c1a]/30" />
                <div className="absolute top-0 bottom-0 left-3/4 border-r border-dashed border-[#1a1c1a]/30" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
