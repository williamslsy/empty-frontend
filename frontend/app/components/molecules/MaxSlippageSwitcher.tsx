import type React from 'react';
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { twMerge } from '~/utils/twMerge';

interface Props {
  maxSlippage: string;
  setMaxSlippage: (value: string) => void;
}

const MaxSlippageSwitcher: React.FC<Props> = ({ maxSlippage, setMaxSlippage }) => {
  const [isCustom, setIsCustom] = useState(false);
  const presetValues = ['0.01', '0.04', '0.1'];

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {presetValues.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={maxSlippage === value ? 'solid' : 'flat'}
            onPress={() => {
              setMaxSlippage(value);
              setIsCustom(false);
            }}
            className="text-xs px-2 py-1"
          >
            {(Number(value) * 100).toFixed(value === '0.01' ? 1 : 0)}%
          </Button>
        ))}
        <Button size="sm" variant={isCustom ? 'solid' : 'flat'} onPress={() => setIsCustom(true)} className="text-xs px-2 py-1">
          Custom
        </Button>
      </div>
      {isCustom && (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={Number(maxSlippage) * 100}
            onChange={(e) => setMaxSlippage((Number(e.target.value) / 100).toString())}
            className="w-16 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded outline-none"
            step="0.1"
            min="0"
            max="50"
          />
          <span className="text-xs text-white/50">%</span>
        </div>
      )}
    </div>
  );
};

export default MaxSlippageSwitcher;
