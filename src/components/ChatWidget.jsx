import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Download,
  Cpu,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { pickLang } from '../i18n/translations';
import { getExtendedForcesForYear } from '../data/registry';

const MODEL_ID = 'Qwen2.5-3B-Instruct-q4f16_1-MLC';

const UI_TEXT = {
  pl: {
    btnLabel: 'Asystent AI',
    title: 'Analityk Strategiczny (Edge AI)',
    subtitle: 'Lokalny model Qwen 2.5 3B • 100% w przeglądarce',
    checkingHw: 'Sprawdzanie wsparcia sprzętowego WebGPU...',
    consentTitle: 'Uruchom lokalny model językowy',
    consentBody:
      'Asystent działa bezpośrednio na Twojej karcie graficznej (WebGPU) bez wysyłania danych na zewnętrzne serwery. Wymaga jednorazowego pobrania ok. 1,9 GB wag modelu do pamięci przeglądarki.',
    downloadBtn: 'Pobierz model (~1,9 GB) i uruchom',
    declineBtn: 'Nie teraz',
    loadingModel: 'Pobieranie i kompilacja modelu w pamięci GPU...',
    fallbackTitle: 'Brak wsparcia WebGPU na tym urządzeniu',
    fallbackBody:
      'Twoja przeglądarka lub karta graficzna nie obsługuje lokalnego uruchamiania modeli 3B (wymagany Chrome/Edge na komputerze z WebGPU). Możesz skopiować gotowy pakiet danych do własnego czatu AI:',
    copyPromptBtn: 'Kopiuj dane okresu + prompt do schowka',
    copiedBtn: 'Skopiowano do schowka',
    placeholder: 'Zapytaj o dowolny rok (np. 2021 vs 2024), 5 Sił lub 9 obszarów...',
    thinking: 'Analizuję dane...',
    contextBadge: 'Kontekst:',
    clearBtn: 'Wyczyść rozmowę',
    welcome:
      'Model gotowy. Zapytaj o dowolny rok z historii spółki, wyniki finansowe, 5 Sił Portera lub 9 obszarów.'
  },
  en: {
    btnLabel: 'AI Analyst',
    title: 'Strategic Analyst (Edge AI)',
    subtitle: 'Local Qwen 2.5 3B • 100% In-Browser',
    checkingHw: 'Checking WebGPU hardware support...',
    consentTitle: 'Run Local Language Model',
    consentBody:
      'The assistant runs directly on your GPU via WebGPU with zero external API calls. Requires a one-time ~1.9 GB model download cached in your browser.',
    downloadBtn: 'Download Model (~1.9 GB) & Start',
    declineBtn: 'Not now',
    loadingModel: 'Downloading & compiling model on GPU...',
    fallbackTitle: 'WebGPU Unavailable on This Device',
    fallbackBody:
      'Your browser or GPU does not support running a local 3B model (requires desktop Chrome/Edge with WebGPU). You can copy the structured context to use in any external AI:',
    copyPromptBtn: 'Copy Period Data + Prompt',
    copiedBtn: 'Copied to Clipboard',
    placeholder: 'Ask about any year (e.g. 2021 vs 2024), Five Forces, or 9 areas...',
    thinking: 'Analyzing data...',
    contextBadge: 'Context:',
    clearBtn: 'Clear chat',
    welcome:
      'Model ready. Ask about any year in the company timeline, financials, Porter’s Five Forces, or 9 areas.'
  }
};

function resolveForcesForEntry(companyId, entry, includeExtended) {
  if (!entry) return { forces: {}, isExtended: false };
  const baseForces = entry.forces || {};
  if (!includeExtended || !companyId) {
    return { forces: baseForces, isExtended: false };
  }
  const ext = getExtendedForcesForYear(companyId, entry.year);
  if (!ext) {
    return { forces: baseForces, isExtended: false };
  }
  return {
    forces: { ...baseForces, ...ext },
    isExtended: true
  };
}

function formatEntryBlock(companyId, entry, tag, lang, includeExtended) {
  if (!entry) return '';
  const kpis = entry.kpis || {};
  const { forces, isExtended } = resolveForcesForEntry(companyId, entry, includeExtended);

  const forcesLines = Object.entries(forces)
    .map(([k, v]) => `  - ${k}: ${v?.score ?? '?'}/5 (${pickLang(v?.rationale, lang)})`)
    .join('\n');

  const segmentsLines = (entry.segments || [])
    .map((s) => `  - ${pickLang(s?.name, lang)}: ${pickLang(s?.value, lang)} (${s?.pct ?? 0}%)`)
    .join('\n');

  const forcesHeader = isExtended
    ? '9 Obszarów (5 Sił Portera + 4 Obszary Rozszerzone) / 9 Areas:'
    : '5 Sił Portera / Five Forces:';

  return [
    `=== ${tag}: ROK / YEAR ${entry.year} (${pickLang(entry.fiscalLabel, lang)}) ===`,
    `Era: ${pickLang(entry.era, lang)}`,
    `Podsumowanie / Summary: ${pickLang(entry.summary, lang)}`,
    `Przychody / Revenue: ${pickLang(kpis.revenue, lang)}`,
    `Dynamika YoY: ${kpis.yoy || 'N/A'}`,
    `Marża brutto / Gross Margin: ${kpis.grossMargin || 'N/A'}`,
    `Marża operacyjna / Operating Margin: ${kpis.opMargin || 'N/A'}`,
    `Zysk netto / Net Income: ${pickLang(kpis.netIncome, lang)}`,
    `R&D / Operacje: ${pickLang(kpis.rnd, lang)}`,
    `Katalizator / Catalyst: ${pickLang(kpis.catalyst, lang)}`,
    segmentsLines ? `Segmenty / Segments:\n${segmentsLines}` : '',
    forcesLines ? `${forcesHeader}\n${forcesLines}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

function buildTargetedContext(company, currentEntry, compareEntry, userQuery, lang, includeExtended) {
  const timeline = company?.timeline || [];
  const mentionedYears = [...new Set((userQuery.match(/\b(19\d{2}|20\d{2})\b/g) || []).map(Number))];
  const blocks = [];
  const includedYears = new Set();

  mentionedYears.forEach((yr) => {
    const found = timeline.find((item) => item.year === yr);
    if (found && !includedYears.has(found.year)) {
      blocks.push(formatEntryBlock(company.id, found, 'ZAPYTANY ROK / REQUESTED YEAR', lang, includeExtended));
      includedYears.add(found.year);
    }
  });

  if (currentEntry && !includedYears.has(currentEntry.year)) {
    blocks.push(formatEntryBlock(company.id, currentEntry, 'AKTYWNY ROK NA SUWAKU / ACTIVE SLIDER YEAR', lang, includeExtended));
    includedYears.add(currentEntry.year);
  }

  if (compareEntry && !includedYears.has(compareEntry.year)) {
    blocks.push(formatEntryBlock(company.id, compareEntry, 'ROK PORÓWNYWANY / COMPARISON YEAR', lang, includeExtended));
    includedYears.add(compareEntry.year);
  }

  const firstYear = timeline[0]?.year ?? '';
  const lastYear = timeline[timeline.length - 1]?.year ?? '';

  return [
    `SPÓŁKA / COMPANY: ${company.name} (${company.ticker})`,
    `SEKTOR / SECTOR: ${pickLang(company.sector, lang)}`,
    `DOSTĘPNY ZAKRES LAT / AVAILABLE YEARS: ${firstYear}–${lastYear}`,
    '',
    ...blocks
  ].join('\n\n');
}

export default function ChatWidget({ company, currentEntry, compareEntry, lang, isExtendedActive = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hwStatus, setHwStatus] = useState('checking');
  const [hwReason, setHwReason] = useState('');
  const [engineStatus, setEngineStatus] = useState('idle');
  const [progressText, setProgressText] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const engineRef = useRef(null);
  const messagesEndRef = useRef(null);
  const t = UI_TEXT[lang] || UI_TEXT.pl;

  useEffect(() => {
    if (engineStatus === 'ready') {
      setMessages([{ role: 'assistant', content: t.welcome }]);
    }
  }, [company.id, lang, engineStatus, t.welcome]);

  useEffect(() => {
    if (!isOpen || hwStatus !== 'checking') return;

    async function checkWebGPU() {
      try {
        if (!navigator.gpu) {
          setHwReason('navigator.gpu not available');
          setHwStatus('unsupported');
          return;
        }
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          setHwReason('No compatible GPU adapter found');
          setHwStatus('unsupported');
          return;
        }
        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
          setHwReason('Insufficient device RAM (< 4 GB)');
          setHwStatus('unsupported');
          return;
        }
        setHwStatus('supported');
      } catch (err) {
        setHwReason(err?.message || String(err));
        setHwStatus('unsupported');
      }
    }

    checkWebGPU();
  }, [isOpen, hwStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const initLocalModel = async () => {
    if (engineStatus === 'loading' || engineStatus === 'ready') return;
    setEngineStatus('loading');
    setProgressPct(2);

    try {
      const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm');
      const worker = new Worker(
        new URL('../workers/llm.worker.js', import.meta.url),
        { type: 'module' }
      );

      const engine = await CreateWebWorkerMLCEngine(worker, MODEL_ID, {
        initProgressCallback: (report) => {
          setProgressText(report.text || '');
          if (typeof report.progress === 'number') {
            setProgressPct(Math.round(report.progress * 100));
          }
        }
      });

      engineRef.current = engine;
      setEngineStatus('ready');
      setMessages([{ role: 'assistant', content: t.welcome }]);
    } catch (err) {
      setHwReason(err?.message || String(err));
      setHwStatus('unsupported');
      setEngineStatus('error');
    }
  };

  const handleCopyFallbackPrompt = () => {
    const contextText = buildTargetedContext(company, currentEntry, compareEntry, '', lang, isExtendedActive);
    const scopeLabelPl = isExtendedActive ? '9 obszarów analizy' : 'Pięciu Sił Portera';
    const scopeLabelEn = isExtendedActive ? '9-area analysis' : 'Five Forces';
    const prompt =
      lang === 'pl'
        ? `Przeanalizuj poniższe dane finansowe i oceny (${scopeLabelPl}) dla spółki ${company.name} (${company.ticker}):\n\n${contextText}`
        : `Analyze the following financial metrics and ${scopeLabelEn} scores for ${company.name} (${company.ticker}):\n\n${contextText}`;

    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !engineRef.current || isGenerating) return;

    const userMsg = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    try {
      const contextText = buildTargetedContext(company, currentEntry, compareEntry, trimmed, lang, isExtendedActive);

      const systemPrompt =
        lang === 'pl'
          ? `Jesteś precyzyjnym analitykiem finansowym.
ZASADY:
1. Odpowiadaj WYŁĄCZNIE poprawną polszczyzną, krótko i rzeczowo (maksymalnie 3-4 zdania lub krótkie punkty).
2. Korzystaj WYŁĄCZNIE z danych podanych poniżej dla spółki ${company.name} (${company.ticker}).
3. Przypisuj liczby oraz oceny sił i obszarów dokładnie do właściwego roku z nagłówka sekcji (np. ROK 2021 vs ROK 2024). Nie zgaduj i nie dopowiadaj nic spoza tekstu.

DANE ŹRÓDŁOWE:
${contextText}`
          : `You are a precise financial analyst.
RULES:
1. Answer ONLY in clean English, concisely and factually (max 3-4 sentences or brief bullet points).
2. Rely STRICTLY on the data provided below for ${company.name} (${company.ticker}).
3. Match every metric and force or area score strictly to its exact year section header. Never guess or invent anything outside the provided text.

SOURCE DATA:
${contextText}`;

      const chatMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: trimmed }
      ];

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const chunks = await engineRef.current.chat.completions.create({
        messages: chatMessages,
        temperature: 0.01,
        top_p: 0.9,
        repetition_penalty: 1.05,
        max_tokens: 350,
        stream: true
      });

      let fullReply = '';
      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || '';
        fullReply += delta;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: fullReply };
          return copy;
        });
      }
    } catch (err) {
      const errMsg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            lang === 'pl'
              ? `Błąd generowania odpowiedzi: ${errMsg}`
              : `Generation error: ${errMsg}`
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full font-bold text-xs shadow-lg border transition-transform hover:scale-105 cursor-pointer"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-contrast)',
          borderColor: 'var(--bg-main)'
        }}
      >
        {isOpen ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        <span>{t.btnLabel}</span>
      </button>

      {isOpen && (
        <div
          className="fixed bottom-32 right-4 z-40 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
            maxHeight: '68vh'
          }}
        >
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{
              backgroundColor: 'var(--bg-card-elevated)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <div>
                <div className="text-xs font-bold leading-tight">{t.title}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {t.subtitle}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {engineStatus === 'ready' && (
                <button
                  onClick={() => setMessages([{ role: 'assistant', content: t.welcome }])}
                  title={t.clearBtn}
                  className="p-1 rounded-lg opacity-70 hover:opacity-100 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className="px-3 py-1.5 text-[10px] font-semibold border-b flex items-center justify-between"
            style={{
              backgroundColor: 'var(--accent-soft)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent)'
            }}
          >
            <span>
              {t.contextBadge} {company.ticker} • {currentEntry.year}
              {compareEntry ? ` vs ${compareEntry.year}` : ''} • {isExtendedActive ? '9' : '5'}
            </span>
            <span>WebGPU</span>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
            {hwStatus === 'checking' && (
              <div className="py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                {t.checkingHw}
              </div>
            )}

            {hwStatus === 'unsupported' && (
              <div className="space-y-3 py-2">
                <div className="flex items-start gap-2.5 p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--border-subtle)' }}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div className="space-y-1">
                    <div className="font-bold">{t.fallbackTitle}</div>
                    <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {t.fallbackBody}
                    </p>
                    {hwReason && (
                      <div className="text-[10px] opacity-60 font-mono pt-1">
                        ({hwReason})
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCopyFallbackPrompt}
                  className="w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-contrast)'
                  }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? t.copiedBtn : t.copyPromptBtn}</span>
                </button>
              </div>
            )}

            {hwStatus === 'supported' && engineStatus === 'idle' && (
              <div className="space-y-3 py-2">
                <div className="flex items-start gap-2.5 p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-card-elevated)', borderColor: 'var(--border-subtle)' }}>
                  <Cpu className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                  <div className="space-y-1.5">
                    <div className="font-bold">{t.consentTitle}</div>
                    <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {t.consentBody}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={initLocalModel}
                    className="flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)'
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.downloadBtn}</span>
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-2.5 rounded-xl font-semibold border cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-card-elevated)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {t.declineBtn}
                  </button>
                </div>
              </div>
            )}

            {engineStatus === 'loading' && (
              <div className="py-6 space-y-3">
                <div className="font-bold text-center">{t.loadingModel}</div>
                <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-main)' }}>
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${progressPct}%`, backgroundColor: 'var(--accent)' }}
                  />
                </div>
                <div className="text-[10px] text-center font-mono leading-snug" style={{ color: 'var(--text-secondary)' }}>
                  {progressPct}% — {progressText}
                </div>
              </div>
            )}

            {engineStatus === 'ready' &&
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' ? 'ml-6 font-medium' : 'mr-4 border'
                  }`}
                  style={
                    msg.role === 'user'
                      ? {
                          backgroundColor: 'var(--accent)',
                          color: 'var(--accent-contrast)'
                        }
                      : {
                          backgroundColor: 'var(--bg-card-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)'
                        }
                  }
                >
                  {msg.content || (isGenerating ? t.thinking : '')}
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>

          {engineStatus === 'ready' && (
            <form
              onSubmit={handleSend}
              className="p-2.5 border-t flex gap-2"
              style={{
                backgroundColor: 'var(--bg-card-elevated)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                disabled={isGenerating}
                className="flex-1 px-3 py-2 rounded-xl text-xs border outline-none"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                type="submit"
                disabled={isGenerating || !input.trim()}
                className="p-2 rounded-xl disabled:opacity-40 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)'
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}