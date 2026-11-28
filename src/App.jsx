import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Layers,
  GitCompare,
  X,
  Globe,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Radio,
  Plane
} from 'lucide-react';
import { COMPANIES, getCompanyById, getExtendedForcesForYear } from './data/registry';
import { translations, pickLang } from './i18n/translations';
import ChatWidget from './components/ChatWidget';

const CLASSIC_FORCE_KEYS = ['rivalry', 'suppliers', 'buyers', 'substitutes', 'newEntrants'];
const EXTENDED_FORCE_KEYS = ['complementors', 'regulation', 'labor', 'disruption'];

function FiveForcesRadar({
  forceKeys,
  currentForces,
  compareForces,
  labels,
  accentColor,
  compareColor,
  selectedForce,
  onSelectForce
}) {
  const size = 300;
  const center = size / 2;
  const axisCount = forceKeys.length;
  const isExtended = axisCount > 5;
  const maxRadius = isExtended ? 88 : 102;
  const labelRadius = isExtended ? 6.45 : 6.25;
  const levels = [1, 2, 3, 4, 5];

  const getPoint = (index, score) => {
    const angle = (Math.PI * 2 * index) / axisCount - Math.PI / 2;
    const r = (score / 5) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const currentPoints = forceKeys.map((key, idx) => getPoint(idx, currentForces[key]?.score || 1));
  const currentPolygon = currentPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const comparePoints = compareForces
    ? forceKeys.map((key, idx) => getPoint(idx, compareForces[key]?.score || 1))
    : null;
  const comparePolygon = comparePoints ? comparePoints.map((p) => `${p.x},${p.y}`).join(' ') : '';

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] overflow-visible select-none">
        {levels.map((lvl) => {
          const pts = forceKeys
            .map((_, idx) => getPoint(idx, lvl))
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

        {forceKeys.map((key, idx) => {
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

        <polygon
          points={currentPolygon}
          fill={accentColor}
          fillOpacity="0.22"
          stroke={accentColor}
          strokeWidth="2.5"
        />

        {forceKeys.map((key, idx) => {
          const pt = currentPoints[idx];
          const labelPt = getPoint(idx, labelRadius);
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
                r={isSelected ? 6.5 : 4.5}
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
                fontSize={isExtended ? '9.5' : '11'}
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

      <polyline
        fill="none"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polyline}
      />

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
            {(timeline.length <= 14 || idx % 2 === 0 || idx === timeline.length - 1 || isActive) && (
              <text
                x={c.x}
                y={height - 4}
                textAnchor="middle"
                fill={isActive ? accentColor : 'var(--text-secondary)'}
                fontSize={timeline.length > 14 ? '9' : '10'}
                fontWeight={isActive ? '700' : '400'}
              >
                {timeline.length > 14 ? `'${String(c.year).slice(-2)}` : c.year}
              </text>
            )}
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
  const [forceMode, setForceMode] = useState('classic');

  const company = useMemo(() => getCompanyById(companyId), [companyId]);
  const t = translations[lang] || translations.pl;

  useEffect(() => {
    localStorage.setItem('porter_lang', lang);
  }, [lang]);

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

  useEffect(() => {
    const defaultIdx = Math.max(0, company.timeline.length - 1);
    setYearIndex(defaultIdx);
    setCompareIndex(null);
  }, [company]);

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

  const extendedForCurrent = useMemo(
    () => getExtendedForcesForYear(company.id, currentEntry.year),
    [company.id, currentEntry.year]
  );

  const extendedForCompare = useMemo(
    () => (compareEntry ? getExtendedForcesForYear(company.id, compareEntry.year) : null),
    [company.id, compareEntry]
  );

  const hasExtendedForYear = Boolean(extendedForCurrent);
  const isExtendedActive = forceMode === 'extended' && hasExtendedForYear;

  const activeForceKeys = useMemo(
    () => (isExtendedActive ? [...CLASSIC_FORCE_KEYS, ...EXTENDED_FORCE_KEYS] : CLASSIC_FORCE_KEYS),
    [isExtendedActive]
  );

  const mergedCurrentForces = useMemo(
    () => (isExtendedActive ? { ...currentEntry.forces, ...extendedForCurrent } : currentEntry.forces),
    [isExtendedActive, currentEntry.forces, extendedForCurrent]
  );

  const mergedCompareForces = useMemo(() => {
    if (!compareEntry) return null;
    if (isExtendedActive && extendedForCompare) {
      return { ...compareEntry.forces, ...extendedForCompare };
    }
    return compareEntry.forces;
  }, [isExtendedActive, compareEntry, extendedForCompare]);

  useEffect(() => {
    if (!activeForceKeys.includes(selectedForce)) {
      setSelectedForce('rivalry');
    }
  }, [activeForceKeys, selectedForce]);

  const effectiveSelectedForce = activeForceKeys.includes(selectedForce) ? selectedForce : 'rivalry';
  const activeForceData = mergedCurrentForces[effectiveSelectedForce] || mergedCurrentForces.rivalry;
  const compareForceData = mergedCompareForces
    ? (mergedCompareForces[effectiveSelectedForce] || mergedCompareForces.rivalry)
    : null;

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
              {company.id === 'spot' ? <Radio className="w-5 h-5" /> : company.id === 'rya' ? <Plane className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
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

      <main className="max-w-6xl mx-auto px-4 pt-5 space-y-5">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <section
            className="lg:col-span-5 rounded-xl p-5 border flex flex-col justify-between"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h2 className="text-sm font-bold">
                  {isExtendedActive ? (t.radarExtendedTitle || 'Profil 9 Obszarów') : t.radarTitle} ({currentEntry.year})
                </h2>
                <div className="flex items-center gap-2">
                  {hasExtendedForYear && (
                    <div
                      className="flex rounded-md p-0.5 border text-[11px]"
                      style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-subtle)' }}
                    >
                      <button
                        type="button"
                        onClick={() => setForceMode('classic')}
                        className="px-2 py-0.5 rounded font-semibold cursor-pointer"
                        style={{
                          backgroundColor: !isExtendedActive ? 'var(--accent)' : 'transparent',
                          color: !isExtendedActive ? 'var(--accent-contrast)' : 'var(--text-secondary)'
                        }}
                      >
                        {t.modeClassic || '5 sił'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setForceMode('extended')}
                        className="px-2 py-0.5 rounded font-semibold cursor-pointer"
                        style={{
                          backgroundColor: isExtendedActive ? 'var(--accent)' : 'transparent',
                          color: isExtendedActive ? 'var(--accent-contrast)' : 'var(--text-secondary)'
                        }}
                      >
                        {t.modeExtended || '9 obszarów'}
                      </button>
                    </div>
                  )}
                  <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {t.radarScaleNote}
                  </span>
                </div>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                {t.radarInstruction}
              </p>

              <FiveForcesRadar
                forceKeys={activeForceKeys}
                currentForces={mergedCurrentForces}
                compareForces={mergedCompareForces}
                labels={t.forces}
                accentColor="var(--accent)"
                compareColor="var(--compare-accent)"
                selectedForce={effectiveSelectedForce}
                onSelectForce={setSelectedForce}
              />
            </div>

            <div className="mt-4 space-y-2">
              {activeForceKeys.map((key) => {
                const score = mergedCurrentForces[key]?.score || 1;
                const compScore = mergedCompareForces?.[key]?.score;
                const isSelected = effectiveSelectedForce === key;

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

          <div className="lg:col-span-7 space-y-5">
            <section
              className="rounded-xl p-5 border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <h3 className="text-sm font-bold">
                    {t.forceFullNames[effectiveSelectedForce]} — {currentEntry.year}
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

              {compareEntry && compareForceData && (
                <div
                  className="p-3 rounded-lg border mb-4 text-xs"
                  style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--compare-accent)' }}
                >
                  <div className="font-bold mb-1" style={{ color: 'var(--compare-accent)' }}>
                    {compareEntry.year} ({compareForceData.score}/5 • {t.levels[compareForceData.score]}):
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {pickLang(compareForceData.rationale, lang)}
                  </p>
                </div>
              )}

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
              <div className="flex justify-between text-[9px] sm:text-[11px] font-bold mb-1.5 px-1">
                {company.timeline.map((item, idx) => (
                  <button
                    key={company.timeline.length > 14 ? `'${String(item.year).slice(-2)}` : item.year}
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

      <ChatWidget
        company={company}
        currentEntry={currentEntry}
        compareEntry={compareEntry}
        lang={lang}
      />
    </div>
  );
}