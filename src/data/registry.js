import nvda from './companies/nvda.json';
import spot from './companies/spot.json';

export const COMPANIES = [
  nvda,
  spot
];

export function getCompanyById(id) {
  return COMPANIES.find((c) => c.id === id) || COMPANIES[0];
}