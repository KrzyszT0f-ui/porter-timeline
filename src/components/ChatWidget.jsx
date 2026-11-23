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
  Sparkles
} from 'lucide-react';
import { pickLang } from '../i18n/translations';

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
      'Twoja przeglądarka lub karta graficzna nie obsługuje lokalnego uruchamiania modeli 3B (wymagany Chrome/Edge na komputerze z WebGPU). Możesz skopiować gotowy pakiet danych spółki do własnego czatu AI:',
    copyPromptBtn: 'Kopiuj dane spółki + prompt do schowka',
    copiedBtn: 'Skopiowano do schowka',
    placeholder: 'Zapytaj o przychody, marże lub 5 Sił Portera...',
    thinking: 'Analizuję dane...',
    contextBadge: 'Kontekst:',
    welcome:
      'Model gotowy. Znam pełną historię przychodów i KPI aktywnej spółki oraz szczegóły wybranego roku na osi czasu.'
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
      'Your browser or GPU does not support running a local 3B model (requires desktop Chrome/Edge with WebGPU). You can copy the structured company context to use in any external AI:',
    copyPromptBtn: 'Copy Company Data + Prompt',
    copiedBtn: 'Copied to Clipboard',
    placeholder: 'Ask about revenue, margins, or Five Forces...',
    thinking: 'Analyzing data...',
    contextBadge: 'Context:',
    welcome:
      'Model ready. I have access to the full historical revenue/KPI table for this company and detailed Five Forces scores for the selected year.'
  }
};

function buildContextPayload(company, currentEntry, compareEntry, lang) {
  const formatDetailedEntry = (entry) => ({
    year: entry.year,
    fiscalPeriod: pickLang(entry.fiscalLabel, lang),
    era: pickLang(entry.era, lang),
    summary: pickLang(entry.summary, lang),
    kpis: {
      revenue: pickLang(entry.kpis.revenue, lang),
      yoy: entry.kpis.yoy,
      grossMargin: entry.kpis.grossMargin,
      opMargin: entry.kpis.opMargin,
      netIncome: pickLang(entry.kpis.netIncome, lang),
      rndOrOps: pickLang(entry.kpis.rnd, lang),
      catalyst: pickLang(entry.kpis.catalyst, lang)
    },
    forces: Object.fromEntries(
      Object.entries(entry.forces).map(([k, v]) => [
        k,
        { score: `${v.score}/5`, rationale: pickLang(v.rationale, lang) }
      ])
    ),
    segments: entry.segments.map((s) => ({
      name: pickLang(s.name, lang),
      value: pickLang(s.value, lang),
      sharePct: s.pct
    }))
  });

  const allYearsOverview = company.timeline.map((item) => ({
    year: item.year,
    revenue: pickLang(item.kpis.revenue, lang),
    yoy: item.kpis.yoy,
    grossMargin: item.kpis.grossMargin,
    opMargin: item.kpis.opMargin,
    catalyst: pickLang(item.kpis.catalyst, lang)
  }));

  const payload = {
    company: `${company.name} (${company.ticker})`,
    sector: pickLang(company.sector, lang),
    activeSliderYearDetail: formatDetailedEntry(currentEntry),
    allYearsFinancialTable: allYearsOverview
  };

  if (compareEntry) {
    payload.comparisonYearDetail = formatDetailedEntry(compareEntry);
  }

  return JSON.stringify(payload);
}

export default function ChatWidget({ company, currentEntry, compareEntry, lang }) {
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
        setHwReason(err?.message || 'WebGPU initialization failed');
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
      setHwReason(err?.message || 'Model initialization error');
      setHwStatus('unsupported');
      setEngineStatus('error');
    }
  };

  const handleCopyFallbackPrompt = () => {
    const contextJson = buildContextPayload(company, currentEntry, compareEntry, lang);
    const prompt =
      lang === 'pl'
        ? `Przeanalizuj poniższe dane finansowe i oceny Pięciu Sił Portera dla spółki ${company.name} (${company.ticker}):\n\n${contextJson}`
        : `Analyze the following financial metrics and Porter's Five Forces scores for ${company.name} (${company.ticker}):\n\n${contextJson}`;

    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !engineRef.current || isGenerating) return;

    const userMsg = { role: 'user', content: trimmed };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setIsGenerating(true);

    const contextJson = buildContextPayload(company, currentEntry, compareEntry, lang);
    const systemPrompt =
      lang === 'pl'
        ? `Jesteś precyzyjnym analitykiem finansowym.
ZASADY KRYTYCZNE:
1. Odpowiadaj WYŁĄCZNIE w poprawnym języku polskim. Nigdy nie używaj chińskich znaków ani obcych wtrąceń.
2. Opieraj się WYŁĄCZNIE na poniższym obiekcie JSON.
3. Jeśli użytkownik pyta o konkretny rok (np. 2021), znajdź obiekt "year": 2021 w tablicy "allYearsFinancialTable" i podaj DOKŁADNE wartości z tego roku (revenue, yoy, grossMargin, catalyst). Nie mieszaj liczb z innych lat!
4. Jeśli użytkownik nie poda roku, odnieś się do "activeSliderYearDetail" (rok ${currentEntry.year}).
5. Zachowuj dokładne nazwy produktów (np. Vera Rubin NVL72, Hopper H100, Blackwell). Bądź zwięzły i konkretny.

DANE SPÓŁKI (JSON):
${contextJson}`
        : `You are a precise financial analyst.
CRITICAL RULES:
1. Answer ONLY in clean English. Never output Chinese characters or mixed languages.
2. Rely STRICTLY on the JSON object below.
3. If the user asks about a specific year (e.g., 2021), look up "year": 2021 in "allYearsFinancialTable" and report the EXACT figures for that year. Never mix metrics across different years!
4. If no year is specified, refer to "activeSliderYearDetail" (year ${currentEntry.year}).
5. Keep exact product names (e.g., Vera Rubin NVL72, Hopper H100, Blackwell). Be concise and factual.

COMPANY DATA (JSON):
${contextJson}`;

    try {
      const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...updatedHistory.slice(-2).map((m) => ({ role: m.role, content: m.content }))
      ];

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const chunks = await engineRef.current.chat.completions.create({
        messages: chatMessages,
        temperature: 0.05,
        repetition_penalty: 1.1,
        max_tokens: 400,
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
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            lang === 'pl'
              ? `Błąd generowania odpowiedzi: ${err.message}`
              : `Generation error: ${err.message}`
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
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
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
              {compareEntry ? ` vs ${compareEntry.year}` : ''}
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