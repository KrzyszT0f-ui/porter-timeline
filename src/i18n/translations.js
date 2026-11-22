export const translations = {
  pl: {
    appTitle: "Silnik 5 Sił Portera",
    appSubtitle: "Dynamiczna analiza ewolucji pozycji konkurencyjnej",
    compareBtn: "Porównaj rok",
    exitCompareBtn: "Zakończ porównanie",
    comparingWith: "Porównanie z rokiem:",
    baselineYear: "Rok bazowy",
    kpiRevenue: "PRZYCHODY",
    kpiGrossMargin: "MARŻA BRUTTO",
    kpiOpMargin: "MARŻA OPERACYJNA",
    kpiNetIncome: "ZYSK NETTO",
    kpiRnd: "WYDATKI R&D",
    kpiCatalyst: "KLUCZOWY KATALIZATOR",
    radarTitle: "Profil 5 Sił Portera",
    radarScaleNote: "Skala 1–5 (presja zewnętrzna)",
    radarInstruction: "Kliknij wierzchołek radaru lub wiersz poniżej, aby odczytać uzasadnienie dla wybranego roku.",
    segmentTitle: "STRUKTURA PRZYCHODÓW",
    trajectoryTitle: "Trajektoria przychodów",
    scaleLog: "Skala Log",
    scaleLinear: "Liniowa",
    timelineHint: "Przesuń suwak lub użyj strzałek, aby zmienić rok",
    forces: {
      rivalry: "Rywalizacja",
      suppliers: "Dostawcy",
      buyers: "Nabywcy",
      substitutes: "Substytuty",
      newEntrants: "Nowe wejścia"
    },
    forceFullNames: {
      rivalry: "Rywalizacja w sektorze",
      suppliers: "Siła przetargowa dostawców",
      buyers: "Siła przetargowa nabywców",
      substitutes: "Zagrożenie ze strony substytutów",
      newEntrants: "Groźba nowych wejść"
    },
    levels: {
      1: "Bardzo niska",
      2: "Niska",
      3: "Umiarkowana",
      4: "Wysoka",
      5: "Bardzo wysoka"
    }
  },
  en: {
    appTitle: "Porter's Five Forces Engine",
    appSubtitle: "Dynamic analysis of competitive moat evolution",
    compareBtn: "Compare year",
    exitCompareBtn: "Exit comparison",
    comparingWith: "Comparing against:",
    baselineYear: "Baseline year",
    kpiRevenue: "REVENUE",
    kpiGrossMargin: "GROSS MARGIN",
    kpiOpMargin: "OPERATING MARGIN",
    kpiNetIncome: "NET INCOME",
    kpiRnd: "R&D SPEND",
    kpiCatalyst: "KEY CATALYST",
    radarTitle: "Five Forces Profile",
    radarScaleNote: "1–5 Scale (external pressure)",
    radarInstruction: "Click any radar vertex or row below to inspect the strategic rationale for the selected year.",
    segmentTitle: "REVENUE BREAKDOWN",
    trajectoryTitle: "Revenue Trajectory",
    scaleLog: "Log Scale",
    scaleLinear: "Linear",
    timelineHint: "Drag slider or use arrow keys to scrub timeline",
    forces: {
      rivalry: "Rivalry",
      suppliers: "Suppliers",
      buyers: "Buyers",
      substitutes: "Substitutes",
      newEntrants: "New Entrants"
    },
    forceFullNames: {
      rivalry: "Competitive Rivalry",
      suppliers: "Bargaining Power of Suppliers",
      buyers: "Bargaining Power of Buyers",
      substitutes: "Threat of Substitution",
      newEntrants: "Threat of New Entry"
    },
    levels: {
      1: "Very Low",
      2: "Low",
      3: "Moderate",
      4: "High",
      5: "Very High"
    }
  }
};

export function pickLang(value, lang) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && !Array.isArray(value)) {
    return value[lang] || value.en || value.pl || "";
  }
  return value;
}