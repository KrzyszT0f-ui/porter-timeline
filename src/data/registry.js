import nvda from './companies/nvda.json';
import nvdaExtended from './companies/nvda-extended.json';
import spot from './companies/spot.json';
import rya from './companies/rya.json';

export const COMPANIES = [
  nvda,
  spot,
  rya
];

const EXTENDED_FORCES_BY_COMPANY = {
  [nvda.id]: nvdaExtended.extendedForces || {}
};

export function getCompanyById(id) {
  return COMPANIES.find((c) => c.id === id) || COMPANIES[0];
}

export function getExtendedForcesForYear(companyId, year) {
  const byYear = EXTENDED_FORCES_BY_COMPANY[companyId];
  if (!byYear) return null;
  return byYear[String(year)] || null;
}