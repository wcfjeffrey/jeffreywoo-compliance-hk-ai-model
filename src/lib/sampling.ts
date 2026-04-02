import { SamplingAnalysis, MaterialitySettings } from '../types';

/**
 * HKSA 530 Audit Sampling
 * Formulas for sample size calculation
 */

export function calculateRequiredSampleSize(
  populationValue: number,
  tolerableMisstatement: number,
  expectedMisstatement: number = 0,
  confidenceLevel: number = 95,
  method: 'Statistical' | 'Non-Statistical' = 'Statistical'
): number {
  if (method === 'Statistical') {
    // Statistical sampling (Monetary Unit Sampling / Attribute Sampling)
    // Formula: Sample size = (Population value × Reliability factor) / (Tolerable misstatement – Expected misstatement)
    
    // Reliability factors for 95% confidence (standard values)
    // 0 errors: 3.0
    // 1 error: 4.75
    // 2 errors: 6.3
    // We'll use 3.0 as default for 95% confidence with 0 expected errors
    let reliabilityFactor = 3.0;
    if (confidenceLevel === 90) reliabilityFactor = 2.31;
    if (confidenceLevel === 99) reliabilityFactor = 4.61;
    
    const denominator = tolerableMisstatement - expectedMisstatement;
    if (denominator <= 0) return 0;
    
    return Math.ceil((populationValue * reliabilityFactor) / denominator);
  } else {
    // Non-statistical sampling based on HKICPA Practice Manual guidance (simplified)
    // This usually depends on risk level and population size
    // For simplicity, we'll return a standard range based on population size
    // High risk: 60-100
    // Medium risk: 25-60
    // Low risk: 10-25
    return 60; // Defaulting to a conservative medium-high risk value
  }
}

export function evaluateSamplingSufficiency(
  analysis: SamplingAnalysis,
  materiality?: MaterialitySettings
): { status: 'Sufficient' | 'Insufficient' | 'Not Provided'; calculatedSize: number } {
  if (!materiality) return { status: 'Not Provided', calculatedSize: 0 };

  // Tolerable misstatement is usually Performance Materiality
  const tolerableMisstatement = materiality.performanceMateriality;
  
  const calculatedSize = calculateRequiredSampleSize(
    analysis.populationValue || 0,
    tolerableMisstatement,
    analysis.expectedMisstatement,
    analysis.confidenceLevel,
    analysis.method
  );

  const actualSize = analysis.actualSampleSize;
  if (actualSize === undefined || actualSize === null) {
    return { status: 'Not Provided', calculatedSize };
  }

  return {
    status: actualSize >= calculatedSize ? 'Sufficient' : 'Insufficient',
    calculatedSize
  };
}
