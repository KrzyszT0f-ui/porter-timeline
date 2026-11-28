export const translations = {
  pl: {
    appTitle: 'Porter Timeline Engine',
    appSubtitle: 'Ewolucja przewagi konkurencyjnej i wyników finansowych w czasie',
    compareBtn: 'Porównaj rok',
    exitCompareBtn: 'Zamknij porównanie',
    comparingWith: 'Porównujesz z rokiem:',
    kpiRevenue: 'Przychody',
    kpiGrossMargin: 'Marża brutto',
    kpiOpMargin: 'Marża operacyjna',
    kpiNetIncome: 'Zysk netto',
    kpiRnd: 'R&D',
    kpiCatalyst: 'Katalizator roku',
    radarTitle: 'Profil 5 Sił Portera',
    radarExtendedTitle: 'Profil 9 Obszarów',
    radarScaleNote: 'Skala 1–5 (presja zewnętrzna)',
    radarInstruction: 'Kliknij wierzchołek radaru lub wiersz poniżej, aby odczytać uzasadnienie dla wybranego roku.',
    modeClassic: '5 sił',
    modeExtended: '9 obszarów',
    segmentTitle: 'Struktura przychodów',
    trajectoryTitle: 'Trajektoria przychodów',
    scaleLog: 'Log',
    scaleLinear: 'Liniowa',
    forces: {
      rivalry: 'Rywalizacja',
      suppliers: 'Dostawcy',
      buyers: 'Nabywcy',
      substitutes: 'Substytuty',
      newEntrants: 'Nowe wejścia',
      complementors: 'Komplementorzy',
      regulation: 'Regulacje',
      labor: 'Rynek pracy',
      disruption: 'Technologia'
    },
    forceFullNames: {
      rivalry: 'Rywalizacja wewnątrz sektora',
      suppliers: 'Siła przetargowa dostawców',
      buyers: 'Siła przetargowa nabywców',
      substitutes: 'Groźba substytutów',
      newEntrants: 'Groźba nowych wejść',
      complementors: 'Komplementorzy i ekosystem',
      regulation: 'Regulacje, państwo i geopolityka',
      labor: 'Związki zawodowe i rynek pracy',
      disruption: 'Tempo zmian technologicznych'
    },
    levels: {
      1: 'Bardzo niska presja',
      2: 'Niska presja',
      3: 'Umiarkowana presja',
      4: 'Wysoka presja',
      5: 'Bardzo wysoka presja'
    }
  },
  en: {
    appTitle: 'Porter Timeline Engine',
    appSubtitle: 'Competitive strategy and financial performance evolution over time',
    compareBtn: 'Compare year',
    exitCompareBtn: 'Exit comparison',
    comparingWith: 'Comparing with year:',
    kpiRevenue: 'Revenue',
    kpiGrossMargin: 'Gross margin',
    kpiOpMargin: 'Operating margin',
    kpiNetIncome: 'Net income',
    kpiRnd: 'R&D',
    kpiCatalyst: 'Key catalyst',
    radarTitle: 'Five Forces Profile',
    radarExtendedTitle: '9-Area Profile',
    radarScaleNote: 'Scale 1–5 (external pressure)',
    radarInstruction: 'Click a radar vertex or row below to read the rationale for the selected year.',
    modeClassic: '5 Forces',
    modeExtended: '9 Areas',
    segmentTitle: 'Revenue breakdown',
    trajectoryTitle: 'Revenue trajectory',
    scaleLog: 'Log',
    scaleLinear: 'Linear',
    forces: {
      rivalry: 'Rivalry',
      suppliers: 'Suppliers',
      buyers: 'Buyers',
      substitutes: 'Substitutes',
      newEntrants: 'New entrants',
      complementors: 'Complementors',
      regulation: 'Regulation',
      labor: 'Labor',
      disruption: 'Disruption'
    },
    forceFullNames: {
      rivalry: 'Competitive rivalry within industry',
      suppliers: 'Bargaining power of suppliers',
      buyers: 'Bargaining power of buyers',
      substitutes: 'Threat of substitutes',
      newEntrants: 'Threat of new entrants',
      complementors: 'Complementors and ecosystem',
      regulation: 'Government, regulation and geopolitics',
      labor: 'Labor unions and talent market',
      disruption: 'Disruptive technology velocity'
    },
    levels: {
      1: 'Very low pressure',
      2: 'Low pressure',
      3: 'Moderate pressure',
      4: 'High pressure',
      5: 'Very high pressure'
    }
  }
};

export function pickLang(obj, lang = 'pl') {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.pl || obj.en || '';
}