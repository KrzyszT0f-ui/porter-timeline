import nvda from './companies/nvda.json';
import spot from './companies/spot.json';
import rya from './companies/rya.json';

export const COMPANIES = [
  nvda,
  spot,
  rya
];

export function getCompanyById(id) {
  return COMPANIES.find((c) => c.id === id) || COMPANIES[0];
}