/**
 * Pricing Calculator Utilities
 * Handles markup calculations, pricing rules, and margin calculations
 */

export interface PricingInput {
  cost: number;
  markupPercent?: number;
  marginPercent?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface PricingResult {
  cost: number;
  sellingPrice: number;
  markup: number;
  margin: number;
  markupPercent: number;
  marginPercent: number;
}

export interface MarkupRule {
  id: string;
  type: 'brand' | 'manufacturer' | 'category' | 'global';
  targetId?: string;
  priority: number;
  b2bMarkupPercent: number;
  retailMarkupPercent: number;
  minB2BPrice?: number;
  maxB2BPrice?: number;
  minRetailPrice?: number;
  maxRetailPrice?: number;
  isActive: boolean;
}

/**
 * Calculate selling price based on markup percentage
 */
export function calculatePriceByMarkup(cost: number, markupPercent: number): number {
  if (cost <= 0) return 0;
  return cost * (1 + markupPercent / 100);
}

/**
 * Calculate selling price based on margin percentage
 */
export function calculatePriceByMargin(cost: number, marginPercent: number): number {
  if (cost <= 0) return 0;
  return cost / (1 - marginPercent / 100);
}

/**
 * Calculate markup percentage from cost and selling price
 */
export function calculateMarkupPercent(cost: number, sellingPrice: number): number {
  if (cost <= 0) return 0;
  return ((sellingPrice - cost) / cost) * 100;
}

/**
 * Calculate margin percentage from cost and selling price
 */
export function calculateMarginPercent(cost: number, sellingPrice: number): number {
  if (sellingPrice <= 0) return 0;
  return ((sellingPrice - cost) / sellingPrice) * 100;
}

/**
 * Calculate comprehensive pricing with all metrics
 */
export function calculatePricing(input: PricingInput): PricingResult {
  const { cost, markupPercent = 25, minPrice, maxPrice } = input;
  
  if (cost <= 0) {
    return {
      cost: 0,
      sellingPrice: 0,
      markup: 0,
      margin: 0,
      markupPercent: 0,
      marginPercent: 0,
    };
  }

  let sellingPrice = calculatePriceByMarkup(cost, markupPercent);
  
  // Apply min/max constraints
  if (minPrice && sellingPrice < minPrice) {
    sellingPrice = minPrice;
  }
  if (maxPrice && sellingPrice > maxPrice) {
    sellingPrice = maxPrice;
  }

  const markup = sellingPrice - cost;
  const margin = markup;
  const finalMarkupPercent = calculateMarkupPercent(cost, sellingPrice);
  const marginPercent = calculateMarginPercent(cost, sellingPrice);

  return {
    cost,
    sellingPrice,
    markup,
    margin,
    markupPercent: finalMarkupPercent,
    marginPercent,
  };
}

/**
 * Find the best applicable markup rule for a product
 */
export function findApplicableRule(
  rules: MarkupRule[],
  productBrandId?: string,
  productManufacturerId?: string,
  productCategoryId?: string
): MarkupRule | null {
  if (!rules.length) return null;

  // Filter active rules
  const activeRules = rules.filter(rule => rule.isActive);
  
  // Sort by priority (highest first)
  const sortedRules = activeRules.sort((a, b) => b.priority - a.priority);

  // Find the most specific rule that applies
  for (const rule of sortedRules) {
    switch (rule.type) {
      case 'brand':
        if (rule.targetId === productBrandId) {
          return rule;
        }
        break;
      case 'manufacturer':
        if (rule.targetId === productManufacturerId) {
          return rule;
        }
        break;
      case 'category':
        if (rule.targetId === productCategoryId) {
          return rule;
        }
        break;
      case 'global':
        return rule; // Global rules apply to all products
    }
  }

  return null;
}

/**
 * Calculate B2B and Retail prices for a product
 */
export function calculateProductPricing(
  cost: number,
  applicableRule: MarkupRule | null,
  manualB2BPrice?: number | null,
  manualRetailPrice?: number | null
): {
  b2bPrice: number;
  retailPrice: number;
  b2bMargin: number;
  retailMargin: number;
  appliedRule: MarkupRule | null;
} {
  let b2bPrice = 0;
  let retailPrice = 0;
  let appliedRule: MarkupRule | null = null;

  if (cost <= 0) {
    return {
      b2bPrice: 0,
      retailPrice: 0,
      b2bMargin: 0,
      retailMargin: 0,
      appliedRule: null,
    };
  }

  // Use manual prices if provided, otherwise calculate from rules
  if (manualB2BPrice) {
    b2bPrice = manualB2BPrice;
  } else if (applicableRule) {
    b2bPrice = calculatePriceByMarkup(cost, applicableRule.b2bMarkupPercent);
    
    // Apply min/max constraints
    if (applicableRule.minB2BPrice && b2bPrice < applicableRule.minB2BPrice) {
      b2bPrice = applicableRule.minB2BPrice;
    }
    if (applicableRule.maxB2BPrice && b2bPrice > applicableRule.maxB2BPrice) {
      b2bPrice = applicableRule.maxB2BPrice;
    }
    
    appliedRule = applicableRule;
  }

  if (manualRetailPrice) {
    retailPrice = manualRetailPrice;
  } else if (applicableRule) {
    retailPrice = calculatePriceByMarkup(cost, applicableRule.retailMarkupPercent);
    
    // Apply min/max constraints
    if (applicableRule.minRetailPrice && retailPrice < applicableRule.minRetailPrice) {
      retailPrice = applicableRule.minRetailPrice;
    }
    if (applicableRule.maxRetailPrice && retailPrice > applicableRule.maxRetailPrice) {
      retailPrice = applicableRule.maxRetailPrice;
    }
  }

  const b2bMargin = calculateMarginPercent(cost, b2bPrice);
  const retailMargin = calculateMarginPercent(cost, retailPrice);

  return {
    b2bPrice,
    retailPrice,
    b2bMargin,
    retailMargin,
    appliedRule,
  };
}

/**
 * Batch calculate pricing for multiple products
 */
export function batchCalculatePricing(
  products: Array<{
    id: string;
    cost: number;
    brandId?: string;
    manufacturerId?: string;
    categoryId?: string;
    manualB2BPrice?: number | null;
    manualRetailPrice?: number | null;
  }>,
  rules: MarkupRule[]
): Array<{
  id: string;
  cost: number;
  b2bPrice: number;
  retailPrice: number;
  b2bMargin: number;
  retailMargin: number;
  appliedRule: MarkupRule | null;
}> {
  return products.map(product => {
    const applicableRule = findApplicableRule(
      rules,
      product.brandId,
      product.manufacturerId,
      product.categoryId
    );

    const pricing = calculateProductPricing(
      product.cost,
      applicableRule,
      product.manualB2BPrice,
      product.manualRetailPrice
    );

    return {
      id: product.id,
      cost: product.cost,
      ...pricing,
    };
  });
}

/**
 * Validate pricing constraints
 */
export function validatePricingConstraints(
  cost: number,
  markupPercent: number,
  minPrice?: number,
  maxPrice?: number
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (cost < 0) {
    errors.push('Cost cannot be negative');
  }

  if (markupPercent < 0) {
    errors.push('Markup percentage cannot be negative');
  }

  if (markupPercent > 1000) {
    warnings.push('Markup percentage is very high (>1000%)');
  }

  if (minPrice && maxPrice && minPrice > maxPrice) {
    errors.push('Minimum price cannot be greater than maximum price');
  }

  if (minPrice && minPrice <= cost) {
    warnings.push('Minimum price is not higher than cost');
  }

  const calculatedPrice = calculatePriceByMarkup(cost, markupPercent);
  
  if (minPrice && calculatedPrice < minPrice) {
    warnings.push(`Calculated price (€${calculatedPrice.toFixed(2)}) is below minimum price (€${minPrice.toFixed(2)})`);
  }

  if (maxPrice && calculatedPrice > maxPrice) {
    warnings.push(`Calculated price (€${calculatedPrice.toFixed(2)}) is above maximum price (€${maxPrice.toFixed(2)})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
