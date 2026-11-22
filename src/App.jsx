import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Layers,
  GitCompare,
  X,
  Globe,
  ChevronLeft,
  ChevronRight,
  Cpu
} from 'lucide-react';
import { COMPANIES, getCompanyById } from './data/registry';
import { translations, pickLang } from './i18n/translations';

const FORCE_KEYS = ['rivalry', 'suppliers', 'buyers', 'substitutes', 'newEntrants'];

function FiveForcesRadar({ currentForces, compareForces, labels, accentColor, compareColor, selectedForce, onSelectForce }) {
  const size = 300;
  const center = size / 2;
  const maxRadius = 102;
  const levels = [1, 2, 3, 4, 5];

  const getPoint = (index, score) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    const r = (score / 5) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const currentPoints = FORCE_KEYS.map((key, idx) => getPoint(idx, currentForces[key]?.score || 1));
  const currentPolygon = currentPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const comparePoints = compareForces
    ? FORCE_KEYS.map((key, idx) => getPoint(idx, compareForces[key]?.score || 1))
    : null;
  const comparePolygon = comparePoints ? comparePoints.map((p) => `${p.x},${p.y}`).join(' ') : '';

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[310px] overflow-visible select-none">
        {/* Siatka pięciokątów 1-5 */}
        {levels.map((lvl) => {
          const pts = FORCE_KEYS.map((_, idx) => getPoint(idx, lvl))
            .map((p) => `${p.x},${p.y}`)
            .join(' ');
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth={lvl === 5 ? '1.5' : '1'}
              strokeDasharray={lvl === 5 ? '0' : '2,2'}
            />
          );
        })}

        {/* Osie promieniowe */}
        {FORCE_KEYS.map((key, idx) => {
          const outer = getPoint(idx, 5);
          return (
            <line
              key={key}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
          );
        })}

        {/* Wielokąt roku porównawczego */}
        {comparePolygon && (
          <polygon
            points={comparePolygon}
            fill={compareColor}
            fillOpacity="0.16"
            stroke={compareColor}
            strokeWidth="2"
            strokeDasharray="4,3"
          />
        )}

        {/* Wielokąt aktywnego roku */}
        <polygon
          points={currentPolygon}
          fill={accentColor}
          fillOpacity="0.22"
          stroke={accentColor}
          strokeWidth="2.5"
        />

        {/* Interaktywne wierzchołki i etykiety */}
        {FORCE_KEYS.map((key, idx) => {
          const pt = currentPoints[idx];
          const labelPt = getPoint(idx, 6.25);
          const isSelected = selectedForce === key;

          return (
            <g
              key={key}
              onClick={() => onSelectForce(key)}
              className="cursor-pointer group"
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isSelected ? 7 : 5}
                fill={isSelected ? 'var(--text-primary)' : accentColor}
                stroke="var(--bg-main)"
                strokeWidth="2"
              />
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isSelected ? accentColor : 'var(--text-secondary)'}
                fontSize="11"
                fontWeight={isSelected ? '700' : '500'}
                className="transition-colors"
              >
                {labels[key]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function RevenueChart({ timeline, activeIndex, onSelectIndex, isLog, accentColor }) {
  const width = 460;
  const height = 160;
  const padX = 28;
  const padY = 20;

  const values = timeline.map((d) => Math.max(d.kpis.revenueNum || 0.001, 0.01));
  const transformed = isLog ? values.map((v) => Math.log10(v + 0.1)) : values;

  const minVal = Math.min(...transformed);
  const maxVal = Math.max(...transformed);
  const range = maxVal - minVal || 1;

  const coords = transformed.map((val, idx) => {
    const x = padX + (idx / Math.max(timeline.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - ((val - minVal) / range) * (height - padY * 2);
    return { x, y, year: timeline[idx].year, label: timeline[idx].kpis.revenue };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const activeCoord = coords[activeIndex] || coords[0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible select-none">
      {/* Linia pionowa wybranego roku */}
      {activeCoord && (
        <line
          x1={activeCoord.x}
          y1={padY / 2}
          x2={activeCoord.x}
          y2={height - padY}
          stroke="var(--text-secondary)"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      )}

      {/* Linia trendu przychodów */}
      <polyline
        fill="none"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polyline}
      />

      {/* Punkty danych */}
      {coords.map((c, idx) => {
        const isActive = idx === activeIndex;
        return (
          <g
            key={c.year}
            onClick={() => onSelectIndex(idx)}
            className="cursor-pointer"
          >
            <circle
              cx={c.x}
              cy={c.y}
              r={isActive ? 6 : 3.5}
              fill={isActive ? 'var(--text-primary)' : accentColor}
              stroke="var(--bg-main)"
              strokeWidth="1.5"
            />
            <text
              x={c.x}
              y={height - 4}
              textAnchor="middle"
              fill={isActive ? accentColor : 'var(--text-secondary)'}
              fontSize="10"
              fontWeight={isActive ? '700' : '400'}
            >
              {c.year}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('porter_lang') || 'pl');
  const [companyId, setCompanyId] = useState(COMPANIES[0].id);
  const [yearIndex, setYearIndex] = useState(0);
  const [compareIndex, setCompareIndex] = useState(null);
  const [selectedForce, setSelectedForce] = useState('rivalry');
  const [isLogScale, setIsLogScale] = useState(true);

  const company = useMemo(() => getCompanyById(companyId), [companyId]);
  const t = translations[lang] || translations.pl;

  // Zapis języka w localStorage
  useEffect(() => {
    localStorage.setItem('porter_lang', lang);
  }, [lang]);

  // Dynamiczne wstrzykiwanie motywu kolorystycznego aktywnej spółki
  useEffect(() => {
    const theme = company.theme;
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--bg-main', theme.bgMain);
    root.style.setProperty('--bg-card', theme.bgCard);
    root.style.setProperty('--bg-card-elevated', theme.bgCardElevated);
    root.style.setProperty('--border-subtle', theme.borderSubtle);
    root.style.setProperty('--text-primary', theme.textPrimary);
    root.style.setProperty('--text-secondary', theme.textSecondary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-soft', theme.accentSoft);
    root.style.setProperty('--accent-contrast', theme.accentContrast);
    root.style.setProperty('--compare-accent', theme.compareAccent || '#38bdf8');

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme.bgMain);
    }
  }, [company]);

  // Reset indeksu roku po przełączeniu spółki (ustawienie na przedostatni lub najnowszy rok)
  useEffect(() => {
    const defaultIdx = Math.max(0, company.timeline.length - 1);
    setYearIndex(defaultIdx);
    setCompareIndex(null);
  }, [company]);

  // Obsługa klawiatury (strzałki lewo/prawo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setYearIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setYearIndex((prev) => Math.min(company.timeline.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [company.timeline.length]);

  const currentEntry = company.timeline[yearIndex] || company.timeline[0];
  const compareEntry = compareIndex !== null ? company.timeline[compareIndex] : null;
  const activeForceData = currentEntry.forces[selectedForce];

  const toggleCompare = () => {
    if (compareIndex !== null) {
      setCompareIndex(null);
    } else {
      const fallbackIdx = yearIndex > 0 ? 0 : Math.min(1, company.timeline.length - 1);
      setCompareIndex(fallbackIdx);
    }
  };

  return (
    <div
      className="min-h-screen pb-32 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}
    >
      {/* Górny pasek nawigacji */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{ backgroundColor: 'color-mix(in srgb, var(--bg-main) 88%, transparent)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold"
              style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
            >
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight">
                {t.appTitle}
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t.appSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Przełącznik języka PL / EN */}
            <button
              onClick={() => setLang((prev) => (prev === 'pl' ? 'en' : 'pl'))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
              title="Switch language / Zmień język"
            >
              <Globe className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span className={lang === 'pl' ? 'font-extrabold' : 'opacity-50'}>PL</span>
              <span className="opacity-30">|</span>
              <span className={lang === 'en' ? 'font-extrabold' : 'opacity-50'}>EN</span>
            </button>

            {/* Selektor spółki */}
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              {COMPANIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ticker} — {c.name}
                </option>
              ))}
            </select>

            {/* Przycisk porównania lat */}
            <button
              onClick={toggleCompare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
              style={{
                backgroundColor: compareIndex !== null ? 'var(--accent)' : 'var(--bg-card)',
                borderColor: compareIndex !== null ? 'var(--accent)' : 'var(--border-subtle)',
                color: compareIndex !== null ? 'var(--accent-contrast)' : 'var(--text-primary)'
              }}
            >
              {compareIndex !== null ? <X className="w-3.5 h-3.5" /> : <GitCompare className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {compareIndex !== null ? t.exitCompareBtn : t.compareBtn}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Główna zawartość */}
      <main className="max-w-6xl mx-auto px-4 pt-5 space-y-5">
        {/* Karta nagłówkowa wybranego roku i KPI */}
        <section
          className="rounded-xl p-5 border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {currentEntry.year}
              </span>
              <span
                className="px-2.5 py-0.5 rounded-md text-xs font-medium border"
                style={{
                  backgroundColor: 'var(--bg-card-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)'
                }}
              >
                {pickLang(currentEntry.fiscalLabel, lang)}
              </span>
              <span
                className="px-2.5 py-0.5 rounded-md text-xs font-semibold border"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)'
                }}
              >
                {pickLang(currentEntry.era, lang)}
              </span>
            </div>

            {/* Pasek wyboru roku do porównania */}
            {compareIndex !== null && (
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-lg border text-xs"
                style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--compare-accent)' }}
              >
                <span style={{ color: 'var(--compare-accent)' }} className="font-semibold">
                  {t.comparingWith}
                </span>
                <select
                  value={compareIndex}
                  onChange={(e) => setCompareIndex(Number(e.target.value))}
                  className="bg-transparent font-bold outline-none cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {company.timeline.map((item, idx) => (
                    <option key={item.year} value={idx} style={{ backgroundColor: '#111111' }}>
                      {item.year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
            {pickLang(currentEntry.summary, lang)}
          </p>

          {/* Siatka 6 kart KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--border-subtle)' }}>
              <div className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t.kpiRevenue}
              </div>
              <div className="text-sm sm:text-base font-extrabold">{pickLang(currentEntry.kpis.revenue, lang)}</div>
              {currentEntry.kpis.yoy && (
                <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>
                  {currentEntry.kpis.yoy} r/r
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--border-subtle)' }}>
              <div className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t.kpiGrossMargin}
              </div>
              <div className="text-sm sm:text-base font-extrabold">{currentEntry.kpis.grossMargin}</div>
            </div>

            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--border-subtle)' }}>
              <div className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t.kpiOpMargin}
              </div>
              <div className="text-sm sm:text-base font-extrabold">{currentEntry.kpis.opMargin}</div>
            </div>

            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--border-subtle)' }}>
              <div className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t.kpiNetIncome}
              </div>
              <div className="text-sm sm:text-base font-extrabold">{pickLang(currentEntry.kpis.netIncome, lang)}</div>
            </div>

            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--border-subtle)' }}>
              <div className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t.kpiRnd}
              </div>
              <div className="text-sm sm:text-base font-extrabold">{pickLang(currentEntry.kpis.rnd, lang)}</div>
            </div>

            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--border-subtle)' }}>
              <div className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t.kpiCatalyst}
              </div>
              <div className="text-xs sm:text-sm font-bold leading-snug" style={{ color: 'var(--accent)' }}>
                {pickLang(currentEntry.kpis.catalyst, lang)}
              </div>
            </div>
          </div>
        </section>

        {/* Główna sekcja analityczna: Radar (lewa) + Uzasadnienie i Wykresy (prawa) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Lewa kolumna: Radar + Lista 5 sił */}
          <section
            className="lg:col-span-5 rounded-xl p-5 border flex flex-col justify-between"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold">
                  {t.radarTitle} ({currentEntry.year})
                </h2>
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  {t.radarScaleNote}
                </span>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                {t.radarInstruction}
              </p>

              <FiveForcesRadar
                currentForces={currentEntry.forces}
                compareForces={compareEntry?.forces}
                labels={t.forces}
                accentColor="var(--accent)"
                compareColor="var(--compare-accent)"
                selectedForce={selectedForce}
                onSelectForce={setSelectedForce}
              />
            </div>

            {/* Lista klikalna wszystkich 5 sił */}
            <div className="mt-4 space-y-2">
              {FORCE_KEYS.map((key) => {
                const score = currentEntry.forces[key]?.score || 1;
                const compScore = compareEntry?.forces[key]?.score;
                const isSelected = selectedForce === key;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedForce(key)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left text-xs transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--bg-card-elevated)',
                      borderColor: isSelected ? 'var(--accent)' : 'var(--border-subtle)'
                    }}
                  >
                    <span className="font-semibold" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {t.forceFullNames[key]}
                    </span>
                    <div className="flex items-center gap-2">
                      {compScore !== undefined && (
                        <span className="font-bold" style={{ color: 'var(--compare-accent)' }}>
                          {compScore}/5 vs
                        </span>
                      )}
                      <span className="font-extrabold px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--accent)' }}>
                        {score}/5
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Prawa kolumna: Uzasadnienie siły + Struktura przychodów + Trajektoria */}
          <div className="lg:col-span-7 space-y-5">
            {/* Szczegóły wybranej siły */}
            <section
              className="rounded-xl p-5 border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <h3 className="text-sm font-bold">
                    {t.forceFullNames[selectedForce]} — {currentEntry.year}
                  </h3>
                </div>
                <span
                  className="px-2.5 py-0.5 rounded text-xs font-bold border"
                  style={{
                    backgroundColor: 'var(--accent-soft)',
                    borderColor: 'var(--accent)',
                    color: 'var(--accent)'
                  }}
                >
                  {activeForceData.score}/5 • {t.levels[activeForceData.score]}
                </span>
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
                {pickLang(activeForceData.rationale, lang)}
              </p>

              {compareEntry && (
                <div
                  className="p-3 rounded-lg border mb-4 text-xs"
                  style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--compare-accent)' }}
                >
                  <div className="font-bold mb-1" style={{ color: 'var(--compare-accent)' }}>
                    {compareEntry.year} ({compareEntry.forces[selectedForce].score}/5 • {t.levels[compareEntry.forces[selectedForce].score]}):
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {pickLang(compareEntry.forces[selectedForce].rationale, lang)}
                  </p>
                </div>
              )}

              {/* Paski struktury przychodów */}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {t.segmentTitle} ({pickLang(currentEntry.fiscalLabel, lang)})
                </div>
                <div className="space-y-3">
                  {currentEntry.segments.map((seg, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{pickLang(seg.name, lang)}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {pickLang(seg.value, lang)} ({seg.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-main)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${seg.pct}%`, backgroundColor: 'var(--accent)' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Wykres trajektorii przychodów */}
            <section
              className="rounded-xl p-5 border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <h3 className="text-sm font-bold">
                    {t.trajectoryTitle} ({company.timeline[0]?.year}–{company.timeline[company.timeline.length - 1]?.year})
                  </h3>
                </div>

                <div
                  className="flex rounded-lg p-0.5 border text-xs"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-subtle)' }}
                >
                  <button
                    onClick={() => setIsLogScale(true)}
                    className="px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer"
                    style={{
                      backgroundColor: isLogScale ? 'var(--accent)' : 'transparent',
                      color: isLogScale ? 'var(--accent-contrast)' : 'var(--text-secondary)'
                    }}
                  >
                    {t.scaleLog}
                  </button>
                  <button
                    onClick={() => setIsLogScale(false)}
                    className="px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer"
                    style={{
                      backgroundColor: !isLogScale ? 'var(--accent)' : 'transparent',
                      color: !isLogScale ? 'var(--accent-contrast)' : 'var(--text-secondary)'
                    }}
                  >
                    {t.scaleLinear}
                  </button>
                </div>
              </div>

              <RevenueChart
                timeline={company.timeline}
                activeIndex={yearIndex}
                onSelectIndex={setYearIndex}
                isLog={isLogScale}
                accentColor="var(--accent)"
              />
            </section>
          </div>
        </div>
      </main>

      {/* Dolny suwak osi czasu (Mobile-first Dock) */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-md"
        style={{ backgroundColor: 'color-mix(in srgb, var(--bg-main) 92%, transparent)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setYearIndex((prev) => Math.max(0, prev - 1))}
              disabled={yearIndex === 0}
              className="p-2 rounded-lg border disabled:opacity-30 cursor-pointer"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-bold mb-1.5 px-1">
                {company.timeline.map((item, idx) => (
                  <button
                    key={item.year}
                    onClick={() => setYearIndex(idx)}
                    className="cursor-pointer transition-colors"
                    style={{ color: idx === yearIndex ? 'var(--accent)' : 'var(--text-secondary)' }}
                  >
                    {item.year}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={company.timeline.length - 1}
                value={yearIndex}
                onChange={(e) => setYearIndex(Number(e.target.value))}
                className="w-full porter-slider"
              />
            </div>

            <button
              onClick={() => setYearIndex((prev) => Math.min(company.timeline.length - 1, prev + 1))}
              disabled={yearIndex === company.timeline.length - 1}
              className="p-2 rounded-lg border disabled:opacity-30 cursor-pointer"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}