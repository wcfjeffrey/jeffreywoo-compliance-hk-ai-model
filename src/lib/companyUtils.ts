import { IRDCode } from '../types';

/**
 * Derives the IRD year-end code from a date string.
 * D – Companies with a financial year-end of 31 December.
 * M – Companies with a financial year-end of 31 March.
 * N – Companies with a non-standard year-end (any other date).
 */
export function deriveIRDCode(dateStr: string): IRDCode {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N';

  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  const day = date.getDate();

  if (month === 12 && day === 31) return 'D';
  if (month === 3 && day === 31) return 'M';
  
  return 'N';
}

export const IRD_CODE_LABELS: Record<IRDCode, string> = {
  D: '31 Dec (D)',
  M: '31 Mar (M)',
  N: 'Non-Standard (N)'
};
