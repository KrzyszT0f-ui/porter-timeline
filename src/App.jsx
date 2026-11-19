import React, { useState, useMemo } from 'react';
import { COMPANIES, COMPANY_LIST } from './data/registry';
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  GitCompare,
  Cpu,
  TrendingUp,
  AlertTriangle,
  Info,
} from 'lucide-react';

const FORCE_LABELS = [
  { key: 'rivalry', label: 'Rywalizacja w sektorze', short: 'Rywalizacja' },
  { key: 'supplierPower', label: 'Siła dostawców', short: 'Dostawcy' },
  { key: 'buyerPower', label: 'Siła nabywców', short: 'Nabywcy' },
  { key: 'substitutes', label: 'Groźba substytutów', short: 'Substytuty' },
  { key: 'newEntrants', label: 'Groźba nowych wejść', short: 'Nowe wejścia' },
];

const SCORE_BADGES = {
  1: { text: '1/5 Bardzo niska', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  2: { text: '2/5 Niska', cls: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  3: { text: '3/5 Umiarkowana', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  4: { text: '4/5 Wysoka', cls: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  5: { text: '5/5 Ekstremalna', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
};

function formatMoney(valM, currency = 'USD') {
  if (valM === null || valM === undefined) return 'Brak danych';
  const abs = Math.abs(valM);
  const sign = valM < 0 ? '-' : '';
  if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(2)} mld ${currency}`;
  }
  return `${sign}${abs.toFixed(2)} mln ${currency}`;
}

function PorterRadar({ forces, compareForces, activeForce, onSelectForce }) {
  const size = 300;
  const center = size / 2;
  const maxRadius = 105;
  const levels = [1, 2, 3, 4, 5];

  const getPoint = (index, value) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    const r = (value / 5) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const mainPoints = FORCE_LABELS.map((f, i) => getPoint(i, forces[f.key] || 1));
  const mainPath = mainPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const comparePoints = compareForces
    ? FORCE_LABELS.map((f, i) => getPoint(i, compareForces[f.key] || 1))
    : null;
  const comparePath = comparePoints ? comparePoints.map((p) => `${p.x},${p.y}`).join(' ') : '';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] overflow-visible select-none">
        {levels.map((lvl) => {
          const pts = FORCE_LABELS.map((_, i) => getPoint(i, lvl))
            .map((p) => `${p.x},${p.y}`)
            .join(' ');
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="#334155"
              strokeWidth={lvl === 5 ? '1.5' : '0.8'}
              strokeDasharray={lvl === 5 ? 'none' : '3 3'}
            />
          );
        })}

        {FORCE_LABELS.map((f, i) => {
          const outer = getPoint(i, 5);
          const labelPos = getPoint(i, 6.15);
          const isSelected = activeForce === f.key;
          return (
            <g key={f.key} onClick={() => onSelectForce(f.key)} className="cursor-pointer group">
              <line x1={center} y1={center} x2={outer.x} y2={outer.y} stroke="#334155" strokeWidth="1" />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`text-[11px] font-medium transition-colors ${
                  isSelected ? 'fill-sky-400 font-bold' : 'fill-slate-300 group-hover:fill-white'
                }`}
              >
                {f.short}
              </text>
            </g>
          );
        })}

        {comparePath && (
          <polygon
            points={comparePath}
            fill="rgba(245, 158, 11, 0.18)"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        )}

        <polygon
          points={mainPath}
          fill="rgba(56, 189, 248, 0.25)"
          stroke="#38bdf8"
          strokeWidth="2.5"
          className="transition-all duration-300"
        />

        {mainPoints.map((p, i) => {
          const fKey = FORCE_LABELS[i].key;
          const isSelected = activeForce === fKey;
          return (
            <circle
              key={fKey}
              cx={p.x}
              cy={p.y}
              r={isSelected ? 6.5 : 4.5}
              onClick={() => onSelectForce(fKey)}
              className={`cursor-pointer transition-all ${
                isSelected ? 'fill-white stroke-sky-400 stroke-2' : 'fill-sky-400 hover:fill-white'
              }`}
            />
          );
        })}
      </svg>
    </div>
  );
}

function RevenueHistoryChart({ snapshots, selectedYear, onSelectYear, logScale, currency }) {
  const width = 640;
  const height = 190;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const validRevs = snapshots.map((s) => Math.max(s.financials.revenueM, 0.5));
  const maxRev = Math.max(...validRevs);
  const minLog = Math.log10(0.5);
  const maxLog = Math.log10(maxRev);

  const getX = (idx) => padL + (idx / Math.max(snapshots.length - 1, 1)) * plotW;
  const getY = (revM) => {
    const safeVal = Math.max(revM || 0, 0.5);
    if (logScale) {
      const ratio = (Math.log10(safeVal) - minLog) / (maxLog - minLog);
      return padT + plotH - ratio * plotH;
    }
    const ratio = (revM || 0) / maxRev;
    return padT + plotH - ratio * plotH;
  };

  const points = snapshots.map((s, i) => `${getX(i)},${getY(s.financials.revenueM)}`).join(' ');
  const activeIdx = snapshots.findIndex((s) => s.year === selectedYear);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible select-none">
      {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
        const y = padT + plotH * (1 - t);
        let labelVal;
        if (logScale) {
          labelVal = Math.pow(10, minLog + t * (maxLog - minLog));
        } else {
          labelVal = maxRev * t;
        }
        const labelStr = labelVal >= 1000 ? `${(labelVal / 1000).toFixed(0)}B` : `${labelVal.toFixed(0)}M`;
        return (
          <g key={idx}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#1e293b" strokeWidth="1" />
            <text x={padL - 8} y={y + 3} textAnchor="end" className="fill-slate-500 text-[10px]">
              {labelStr}
            </text>
          </g>
        );
      })}

      <polyline fill="none" stroke="#38bdf8" strokeWidth="2.5" points={points} />

      {snapshots.map((s, i) => {
        const cx = getX(i);
        const cy = getY(s.financials.revenueM);
        const isSelected = s.year === selectedYear;
        return (
          <g key={s.year} onClick={() => onSelectYear(s.year)} className="cursor-pointer">
            <rect x={cx - 8} y={padT} width="16" height={plotH} fill="transparent" />
            {(isSelected || s.year % 5 === 0 || i === snapshots.length - 1) && (
              <text
                x={cx}
                y={height - 6}
                textAnchor="middle"
                className={`text-[10px] ${isSelected ? 'fill-sky-400 font-bold' : 'fill-slate-500'}`}
              >
                {s.year}
              </text>
            )}
            <circle
              cx={cx}
              cy={cy}
              r={isSelected ? 5.5 : 2.5}
              className={isSelected ? 'fill-white stroke-sky-400 stroke-2' : 'fill-sky-400/70'}
            />
          </g>
        );
      })}

      {activeIdx >= 0 && (
        <line
          x1={getX(activeIdx)}
          y1={padT}
          x2={getX(activeIdx)}
          y2={padT + plotH}
          stroke="#38bdf8"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}
    </svg>
  );
}

export default function App() {
  const [ticker, setTicker] = useState(COMPANY_LIST[0].ticker);
  const company = COMPANIES[ticker];
  const snapshots = company.snapshots;

  const [selectedYear, setSelectedYear] = useState(2015);
  const [compareMode, setCompareMode] = useState(false);
  const [compareYear, setCompareYear] = useState(2026);
  const [activeForce, setActiveForce] = useState('rivalry');
  const [logScale, setLogScale] = useState(true);

  const currentSnap = useMemo(
    () => snapshots.find((s) => s.year === selectedYear) || snapshots[0],
    [snapshots, selectedYear]
  );

  const compareSnap = useMemo(
    () => snapshots.find((s) => s.year === compareYear) || snapshots[snapshots.length - 1],
    [snapshots, compareYear]
  );

  const currentEra = useMemo(
    () => company.eras.find((e) => e.id === currentSnap.eraId) || company.eras[0],
    [company.eras, currentSnap]
  );

  const minYear = snapshots[0].year;
  const maxYear = snapshots[snapshots.length - 1].year;

  const stepYear = (delta) => {
    const next = Math.min(maxYear, Math.max(minYear, selectedYear + delta));
    setSelectedYear(next);
  };

  const segmentEntries = Object.entries(currentSnap.segments || {});
  const totalSegmentRev = segmentEntries.reduce((acc, [, v]) => acc + (v || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 md:pb-12 font-sans">
      {/* Górny pasek nawigacji */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold tracking-tight text-white">
                Silnik 5 Sił Portera
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Dynamiczna analiza ewolucji pozycji konkurencyjnej
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Przełącznik spółki */}
            <select
              value={ticker}
              onChange={(e) => {
                const nextTicker = e.target.value;
                setTicker(nextTicker);
                const nextSnaps = COMPANIES[nextTicker].snapshots;
                setSelectedYear(nextSnaps[nextSnaps.length - 1].year);
              }}
              className="bg-slate-800 border border-slate-700 text-sm rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-sky-500"
            >
              {COMPANY_LIST.map((c) => (
                <option key={c.ticker} value={c.ticker}>
                  {c.ticker} — {c.name}
                </option>
              ))}
            </select>

            {/* Tryb porównania */}
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                compareMode
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>Porównaj rok</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-5 space-y-6">
        {/* Pasek kontekstu roku i ery */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-2xl md:text-3xl font-extrabold text-white">{currentSnap.year}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {currentSnap.fiscalLabel}
                </span>
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: `${currentEra.color}20`,
                    borderColor: `${currentEra.color}60`,
                    color: currentEra.color,
                  }}
                >
                  Era: {currentEra.name}
                </span>
              </div>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed">{currentSnap.catalyst}</p>
            </div>

            {compareMode && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 shrink-0">
                <span className="text-xs text-amber-300 font-medium">Zestaw z rokiem:</span>
                <select
                  value={compareYear}
                  onChange={(e) => setCompareYear(Number(e.target.value))}
                  className="bg-slate-900 border border-amber-500/40 text-amber-200 text-sm rounded px-2 py-1"
                >
                  {snapshots.map((s) => (
                    <option key={s.year} value={s.year}>
                      {s.year} ({s.fiscalLabel})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Architektury i kluczowe wskaźniki finansowe */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-800/80">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400 uppercase">Przychody</div>
              <div className="text-sm md:text-base font-bold text-white mt-0.5">
                {formatMoney(currentSnap.financials.revenueM, company.meta.currency)}
              </div>
              {currentSnap.financials.yoyGrowthPct !== null && (
                <div
                  className={`text-xs mt-0.5 ${
                    currentSnap.financials.yoyGrowthPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {currentSnap.financials.yoyGrowthPct >= 0 ? '+' : ''}
                  {currentSnap.financials.yoyGrowthPct}% r/r
                </div>
              )}
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400 uppercase">Marża brutto</div>
              <div className="text-sm md:text-base font-bold text-white mt-0.5">
                {currentSnap.financials.grossMarginPct !== null
                  ? `${currentSnap.financials.grossMarginPct.toFixed(1)}%`
                  : 'Brak danych'}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400 uppercase">Marża operacyjna</div>
              <div className="text-sm md:text-base font-bold text-white mt-0.5">
                {currentSnap.financials.operatingMarginPct !== null
                  ? `${currentSnap.financials.operatingMarginPct.toFixed(1)}%`
                  : 'Brak danych'}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400 uppercase">Zysk netto</div>
              <div className="text-sm md:text-base font-bold text-white mt-0.5">
                {formatMoney(currentSnap.financials.netIncomeM, company.meta.currency)}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400 uppercase">Wydatki R&D</div>
              <div className="text-sm md:text-base font-bold text-white mt-0.5">
                {formatMoney(currentSnap.financials.rdExpenseM, company.meta.currency)}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <div className="text-[11px] text-slate-400 uppercase flex items-center gap-1">
                <Cpu className="w-3 h-3 text-sky-400" /> Architektura
              </div>
              <div className="text-xs font-semibold text-sky-300 mt-1 line-clamp-2">
                {currentSnap.architectures.join(', ')}
              </div>
            </div>
          </div>
        </section>

        {/* Główna siatka: Radar 5 sił + Szczegóły sił i wykres finansowy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lewa kolumna: Wykres Radarowy */}
          <section className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-white">Profil 5 Sił Portera ({currentSnap.year})</h2>
                <span className="text-[11px] text-slate-400">Skala 1–5 (presja zewnętrzna)</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Kliknij dowolny wierzchołek lub wiersz poniżej, aby przeczytać uzasadnienie dla wybranego roku.
              </p>

              <PorterRadar
                forces={currentSnap.forces}
                compareForces={compareMode ? compareSnap.forces : null}
                activeForce={activeForce}
                onSelectForce={setActiveForce}
              />

              {compareMode && (
                <div className="flex justify-center gap-4 text-xs mt-2">
                  <span className="flex items-center gap-1.5 text-sky-300">
                    <span className="w-3 h-3 rounded-full bg-sky-400 inline-block" /> {currentSnap.year}
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> {compareSnap.year}
                  </span>
                </div>
              )}
            </div>

            {/* Lista ocen 1-5 */}
            <div className="space-y-2 mt-4">
              {FORCE_LABELS.map((f) => {
                const score = currentSnap.forces[f.key];
                const badge = SCORE_BADGES[score];
                const isSelected = activeForce === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveForce(f.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-sky-500/60'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-medium text-slate-200">{f.label}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${badge.cls}`}>
                      {badge.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Prawa kolumna: Szczegóły wybranej siły + Segmenty + Wykres przychodów */}
          <div className="lg:col-span-7 space-y-6">
            {/* Karta uzasadnienia wybranej siły */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold text-white">
                    {FORCE_LABELS.find((f) => f.key === activeForce)?.label} — rok {currentSnap.year}
                  </h3>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                    SCORE_BADGES[currentSnap.forces[activeForce]].cls
                  }`}
                >
                  {SCORE_BADGES[currentSnap.forces[activeForce]].text}
                </span>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/70 p-4 rounded-lg border border-slate-800">
                {currentSnap.forceDetails[activeForce]}
              </p>

              {compareMode && (
                <div className="mt-3 bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-lg">
                  <div className="text-xs font-semibold text-amber-300 mb-1">
                    Kontrast dla roku {compareSnap.year} (ocena {compareSnap.forces[activeForce]}/5):
                  </div>
                  <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                    {compareSnap.forceDetails[activeForce]}
                  </p>
                </div>
              )}

              {/* Struktura segmentowa przychodów */}
              {segmentEntries.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-2.5">
                    Struktura przychodów w {currentSnap.fiscalLabel}
                  </div>
                  <div className="space-y-2">
                    {segmentEntries.map(([segName, valM]) => {
                      const pct = totalSegmentRev > 0 ? ((valM / totalSegmentRev) * 100).toFixed(1) : 0;
                      return (
                        <div key={segName}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">{segName}</span>
                            <span className="text-slate-400 font-mono">
                              {formatMoney(valM, company.meta.currency)} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-sky-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Wykres trajektorii finansowej */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold text-white">
                    Trajektoria przychodów ({minYear}–{maxYear})
                  </h3>
                </div>

                <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setLogScale(true)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      logScale ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Skala Log
                  </button>
                  <button
                    onClick={() => setLogScale(false)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      !logScale ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Liniowa
                  </button>
                </div>
              </div>

              <RevenueHistoryChart
                snapshots={snapshots}
                selectedYear={selectedYear}
                onSelectYear={setSelectedYear}
                logScale={logScale}
                currency={company.meta.currency}
              />

              <div className="flex items-start gap-2 mt-3 text-[11px] text-slate-400">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>{company.meta.fiscalNote}</span>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Dolny suwak czasu (przyklejony na mobile pod kciuk, statyczny na desktopie) */}
      <footer className="fixed bottom-0 inset-x-0 md:static z-30 bg-slate-900/95 backdrop-blur border-t md:border border-slate-800 md:max-w-7xl md:mx-auto md:mt-6 md:rounded-xl px-4 py-3 shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => stepYear(-1)}
            disabled={selectedYear <= minYear}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
            aria-label="Poprzedni rok"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>{minYear}</span>
              <span className="text-sky-400 font-bold">Wybrany rok: {selectedYear}</span>
              <span>{maxYear}</span>
            </div>
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            {/* Pasek er strategicznych pod suwakiem */}
            <div className="hidden sm:flex w-full h-1.5 rounded-full overflow-hidden mt-2 gap-0.5">
              {company.eras.map((era) => {
                const span = era.end - era.start + 1;
                const total = maxYear - minYear + 1;
                const widthPct = (span / total) * 100;
                return (
                  <div
                    key={era.id}
                    title={`${era.name} (${era.start}–${era.end})`}
                    style={{ width: `${widthPct}%`, backgroundColor: era.color }}
                    className="h-full opacity-80"
                  />
                );
              })}
            </div>
          </div>

          <button
            onClick={() => stepYear(1)}
            disabled={selectedYear >= maxYear}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
            aria-label="Następny rok"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}