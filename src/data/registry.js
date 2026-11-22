import nvda from './companies/nvda.json';

export const COMPANIES = [
  nvda
];

export function getCompanyById(id) {
  return COMPANIES.find((c) => c.id === id) || COMPANIES[0];
}