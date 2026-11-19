import nvdaData from './companies/nvda.json';

export const COMPANIES = {
  NVDA: nvdaData,
};

export const COMPANY_LIST = Object.values(COMPANIES).map((c) => ({
  ticker: c.meta.ticker,
  name: c.meta.name,
  sector: c.meta.sector,
}));