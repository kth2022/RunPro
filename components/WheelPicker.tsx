import React, { useEffect, useRef } from 'react';

interface WheelPickerProps {
  options: (string | number)[];
  value: string | number;
  onChange: (value: any) => void;
  label?: string;
  width?: string;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({ options, value, onChange, label, width = "w-16" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 40; // px

  useEffect(() => {
    if (containerRef.current) {
      const index = options.findIndex(opt => opt === value);
      if (index !== -1) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    }
  }, []); // Only on mount

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      if (options[index] !== undefined && options[index] !== value) {
        onChange(options[index]);
      }
    }
  };

  return (
    <div className={`flex flex-col items-center ${width}`}>
      {label && <div className="text-[10px] text-slate-400 mb-1 text-center">{label}</div>}
      <div className="relative h-32 w-full overflow-hidden bg-slate-950 rounded-lg border border-slate-700">
        <div className="absolute top-1/2 left-0 w-full h-10 -translate-y-1/2 bg-slate-700/50 pointer-events-none z-10 border-y border-slate-600/50"></div>
        <div 
          ref={containerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar py-[44px]"
          onScroll={handleScroll}
        >
          {options.map((opt, i) => (
            <div 
              key={i} 
              className={`h-10 flex items-center justify-center snap-center transition-colors font-bold cursor-pointer select-none
                ${opt === value ? 'text-lime-400 text-lg' : 'text-slate-500 text-sm'}`}
              onClick={() => {
                if (containerRef.current) {
                  containerRef.current.scrollTo({ top: i * itemHeight, behavior: 'smooth' });
                  onChange(opt);
                }
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
