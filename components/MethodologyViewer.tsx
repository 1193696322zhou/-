import React, { useState, useRef, useEffect } from 'react';
import { MethodologyAnalysis, MethodDetail } from '../types';
import { Layers, BookOpen, Code, X, Info } from 'lucide-react';

interface Props {
  data: MethodologyAnalysis;
}

type Level = 1 | 2 | 3;

export const MethodologyViewer: React.FC<Props> = ({ data }) => {
  const [activeLevel, setActiveLevel] = useState<Level>(3);
  const [selectedMethod, setSelectedMethod] = useState<MethodDetail | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const levels = [
    { id: 1, label: 'Concept', icon: BookOpen, desc: 'Simplified logic' },
    { id: 2, label: 'Process', icon: Layers, desc: 'Technical workflow' },
    { id: 3, label: 'Deep Dive', icon: Code, desc: 'Math & nuance' },
  ] as const;

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setSelectedMethod(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMethodClick = (method: MethodDetail, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedMethod(method);
    
    // Calculate position to center the popup relative to the viewport or container
    // For simplicity and robustness on mobile, we will use a fixed centered modal approach
    // effectively 'overlaying' the text.
  };

  const renderInteractiveText = (text: string) => {
    if (!data.key_methods || data.key_methods.length === 0) return text;

    const sortedMethods = [...data.key_methods].sort((a, b) => b.name.length - a.name.length);
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(${sortedMethods.map(m => `\\b${escapeRegExp(m.name)}\\b`).join('|')})`, 'gi');

    const parts = text.split(pattern);

    return parts.map((part, i) => {
      const method = sortedMethods.find(m => m.name.toLowerCase() === part.toLowerCase());

      if (method) {
        const isSelected = selectedMethod?.name === method.name;
        return (
          <span 
            key={i}
            onClick={(e) => handleMethodClick(method, e)}
            className={`
              cursor-pointer font-semibold transition-colors duration-200
              border-b-2 border-dotted
              ${isSelected 
                ? 'text-accent border-accent bg-accent/10' 
                : 'text-academic-800 border-accent hover:text-accent hover:bg-accent/5'
              }
            `}
            title="Click for details"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-academic-200 overflow-hidden transition-all duration-500 relative">
      {/* Header */}
      <div className="bg-academic-50 px-6 py-4 border-b border-academic-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-serif font-semibold text-academic-900 flex items-center gap-2">
          <span className="bg-accent text-white p-1 rounded text-xs font-sans tracking-wider">METHOD</span>
          研究方法解析
        </h3>
        
        <div className="flex p-1 bg-white rounded-lg border border-academic-200 shadow-sm">
          {levels.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setActiveLevel(lvl.id as Level)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${activeLevel === lvl.id 
                  ? 'bg-accent text-white shadow-md transform scale-105' 
                  : 'text-academic-600 hover:bg-academic-50 hover:text-academic-900'
                }
              `}
            >
              <lvl.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{lvl.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Text Content */}
      <div className="p-8 relative min-h-[200px]" ref={contentRef}>
         <div className="animate-fade-in">
           <div className="flex items-center justify-between mb-4">
             <div className="text-xs font-bold tracking-wider text-accent uppercase">
                {levels.find(l => l.id === activeLevel)?.desc}
             </div>
           </div>
           
           <p className="text-academic-800 leading-loose text-lg whitespace-pre-wrap font-serif text-justify">
             {activeLevel === 1 && renderInteractiveText(data.level_1_concept)}
             {activeLevel === 2 && renderInteractiveText(data.level_2_process)}
             {activeLevel === 3 && renderInteractiveText(data.level_3_technical)}
           </p>
         </div>

         {/* Popover Card for Method Details */}
         {selectedMethod && (
            <div className="absolute inset-0 flex items-center justify-center z-10 p-4 bg-white/60 backdrop-blur-sm transition-all duration-300 animate-fade-in">
              <div 
                className="bg-white rounded-xl shadow-xl border border-academic-200 p-6 max-w-md w-full animate-scale-up relative"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the card
              >
                <button 
                  onClick={() => setSelectedMethod(null)}
                  className="absolute top-4 right-4 text-academic-400 hover:text-academic-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-accent" />
                  <span className="text-xs font-bold text-accent tracking-wider uppercase">Method Index</span>
                </div>
                
                <h4 className="text-2xl font-bold text-academic-900 mb-1">
                  {selectedMethod.name}
                </h4>
                <p className="text-sm font-medium text-academic-500 italic mb-4 border-b border-academic-100 pb-3">
                  {selectedMethod.full_name}
                </p>
                
                <div className="text-academic-800 text-base leading-relaxed">
                  {selectedMethod.description}
                </div>
              </div>
            </div>
         )}
      </div>

      {/* Footer/Progress */}
      <div className="bg-academic-50/50 px-6 py-3 border-t border-academic-100">
        <div className="flex items-center text-xs text-academic-500 gap-2">
           <div className={`h-1.5 w-1.5 rounded-full ${activeLevel >= 1 ? 'bg-accent' : 'bg-academic-300'}`} />
           <div className={`h-0.5 w-8 rounded-full ${activeLevel >= 2 ? 'bg-accent' : 'bg-academic-300'}`} />
           <div className={`h-1.5 w-1.5 rounded-full ${activeLevel >= 2 ? 'bg-accent' : 'bg-academic-300'}`} />
           <div className={`h-0.5 w-8 rounded-full ${activeLevel >= 3 ? 'bg-accent' : 'bg-academic-300'}`} />
           <div className={`h-1.5 w-1.5 rounded-full ${activeLevel >= 3 ? 'bg-accent' : 'bg-academic-300'}`} />
           <span className="ml-auto font-medium">
             Level {activeLevel}/3 Depth
           </span>
        </div>
      </div>
    </div>
  );
};