import { create } from 'zustand';
import { TMockPool } from '~/lib/mockPools';

export type RangeType = 'Full Range' | 'Wide' | 'Common' | 'Narrow';

interface PriceRangeState {
  // Current state
  rangeType: RangeType;
  minPrice: number;
  maxPrice: number;
  currentPrice: number;

  // Manual inputs
  minPriceInput: string;
  maxPriceInput: string;

  // Chart interaction
  isDragging: boolean;
  dragType: 'min' | 'max' | null;

  // Pool context
  pool: TMockPool | null;

  // Actions
  setRangeType: (type: RangeType) => void;
  setPriceRange: (min: number, max: number) => void;
  setManualInputs: (min: string, max: string) => void;
  setCurrentPrice: (price: number) => void;
  setDragState: (isDragging: boolean, dragType: 'min' | 'max' | null) => void;
  setPool: (pool: TMockPool) => void;
  validateAndUpdateRange: (min: number, max: number) => boolean;
  calculateRangeForType: (type: RangeType, currentPrice: number) => { min: number; max: number };
}

// Range multipliers based on Uniswap v3 best practices
const RANGE_MULTIPLIERS = {
  'Full Range': { min: 0.01, max: 2.0 }, // Wide range (1% to 200% of current price)
  Wide: { min: 0.5, max: 1.5 }, // ±50% range
  Common: { min: 0.8, max: 1.25 }, // ±20% range (most common for stablecoins)
  Narrow: { min: 0.95, max: 1.05 }, // ±5% range (very concentrated)
};

export const usePriceRangeStore = create<PriceRangeState>((set, get) => ({
  // Initial state
  rangeType: 'Common',
  minPrice: 0,
  maxPrice: 0,
  currentPrice: 0,
  minPriceInput: '',
  maxPriceInput: '',
  isDragging: false,
  dragType: null,
  pool: null,

  // Actions
  setRangeType: (type: RangeType) => {
    const { currentPrice } = get();
    if (currentPrice > 0) {
      const range = get().calculateRangeForType(type, currentPrice);
      set({
        rangeType: type,
        minPrice: range.min,
        maxPrice: range.max,
        minPriceInput: range.min.toFixed(6),
        maxPriceInput: range.max.toFixed(6),
      });
    } else {
      set({ rangeType: type });
    }
  },

  setPriceRange: (min: number, max: number) => {
    if (get().validateAndUpdateRange(min, max)) {
      set({
        minPrice: min,
        maxPrice: max,
        minPriceInput: min.toFixed(6),
        maxPriceInput: max.toFixed(6),
      });
    }
  },

  setManualInputs: (min: string, max: string) => {
    set({ minPriceInput: min, maxPriceInput: max });

    const minNum = parseFloat(min);
    const maxNum = parseFloat(max);

    if (!isNaN(minNum) && !isNaN(maxNum) && minNum < maxNum && minNum > 0) {
      set({ minPrice: minNum, maxPrice: maxNum });
    }
  },

  setCurrentPrice: (price: number) => {
    const state = get();

    // Don't update if price hasn't changed
    if (state.currentPrice === price) {
      return;
    }

    // If no range is set yet, calculate default range and update everything in one call
    if (state.minPrice === 0 && state.maxPrice === 0) {
      const range = state.calculateRangeForType(state.rangeType, price);
      set({
        currentPrice: price,
        minPrice: range.min,
        maxPrice: range.max,
        minPriceInput: range.min.toFixed(6),
        maxPriceInput: range.max.toFixed(6),
      });
    } else {
      // Just update the current price
      set({ currentPrice: price });
    }
  },

  setDragState: (isDragging: boolean, dragType: 'min' | 'max' | null) => {
    set({ isDragging, dragType });
  },

  setPool: (pool: TMockPool) => {
    const currentState = get();

    // Ensure we have the required properties
    if (!pool?.token0?.id || !pool?.token1?.id) {
      console.error('Invalid pool data: missing required token information');
      return;
    }

    // Only update if pool actually changed (compare by a unique identifier)
    if (currentState.pool?.token0?.id === pool.token0.id && currentState.pool?.token1?.id === pool.token1.id) {
      return; // Pool hasn't changed, don't update
    }

    // Update pool and reset range in a single set call
    set({
      pool,
      minPrice: 0,
      maxPrice: 0,
      minPriceInput: '',
      maxPriceInput: '',
      currentPrice: 0,
    });
  },

  validateAndUpdateRange: (min: number, max: number): boolean => {
    const { currentPrice } = get();

    // Basic validation
    if (min <= 0 || max <= 0 || min >= max) {
      console.warn('Invalid price range: min must be positive and less than max');
      return false;
    }

    // Warn if range is too extreme (but still allow it)
    if (min < currentPrice * 0.001 || max > currentPrice * 1000) {
      console.warn('Price range is very extreme compared to current price');
    }

    // Warn if current price is outside range
    if (currentPrice < min || currentPrice > max) {
      console.warn('Current price is outside the selected range - no fees will be earned until price moves into range');
    }

    return true;
  },

  calculateRangeForType: (type: RangeType, currentPrice: number) => {
    const multiplier = RANGE_MULTIPLIERS[type];
    return {
      min: currentPrice * multiplier.min,
      max: currentPrice * multiplier.max,
    };
  },
}));
