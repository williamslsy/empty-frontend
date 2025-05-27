import { create } from 'zustand';
import { TMockPool } from '~/lib/mockPools';

export type RangeType = 'Full Range' | 'Wide' | 'Common' | 'Narrow';

interface PriceRangeState {
  rangeType: RangeType;
  minPrice: number;
  maxPrice: number;
  currentPrice: number;

  minPriceInput: string;
  maxPriceInput: string;

  isDragging: boolean;
  dragType: 'min' | 'max' | null;

  pool: TMockPool | null;

  setRangeType: (type: RangeType) => void;
  setPriceRange: (min: number, max: number) => void;
  setManualInputs: (min: string, max: string) => void;
  setCurrentPrice: (price: number) => void;
  setDragState: (isDragging: boolean, dragType: 'min' | 'max' | null) => void;
  setPool: (pool: TMockPool) => void;
  validateAndUpdateRange: (min: number, max: number) => boolean;
  calculateRangeForType: (type: RangeType, currentPrice: number) => { min: number; max: number };
}

const RANGE_MULTIPLIERS = {
  'Full Range': { min: 0.01, max: 2.0 },
  Wide: { min: 0.5, max: 1.5 },
  Common: { min: 0.8, max: 1.25 },
  Narrow: { min: 0.95, max: 1.05 },
};

export const usePriceRangeStore = create<PriceRangeState>((set, get) => ({
  rangeType: 'Common',
  minPrice: 0,
  maxPrice: 0,
  currentPrice: 0,
  minPriceInput: '',
  maxPriceInput: '',
  isDragging: false,
  dragType: null,
  pool: null,

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

    if (state.currentPrice === price) {
      return;
    }

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
      set({ currentPrice: price });
    }
  },

  setDragState: (isDragging: boolean, dragType: 'min' | 'max' | null) => {
    set({ isDragging, dragType });
  },

  setPool: (pool: TMockPool) => {
    const currentState = get();

    if (!pool?.token0?.id || !pool?.token1?.id) {
      console.error('Invalid pool data: missing required token information');
      return;
    }

    if (currentState.pool?.token0?.id === pool.token0.id && currentState.pool?.token1?.id === pool.token1.id) {
      return;
    }

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

    if (min <= 0 || max <= 0 || min >= max) {
      console.warn('Invalid price range: min must be positive and less than max');
      return false;
    }

    if (min < currentPrice * 0.001 || max > currentPrice * 1000) {
      console.warn('Price range is very extreme compared to current price');
    }

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
