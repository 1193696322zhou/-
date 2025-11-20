
import React, { useState, useEffect, useRef } from 'react';
import { PaperAnalysis } from '../types';
import { MethodologyViewer } from './MethodologyViewer';
import { PdfFigure } from './PdfFigure';
import { FileText, Lightbulb, Highlighter, X, Tag, BarChart2, Image as ImageIcon } from 'lucide-react';

interface Props {
  analysis: PaperAnalysis;
  onSaveHighlight?: (text: string, note: string, section: string) => void;
  pdfBlob?: Blob | null;
}

export const AnalysisResult: React.FC<Props> = ({ analysis, onSaveHighlight, pdfBlob }) => {
  const [selection, setSelection] = useState<{ text: string; top: number; left: number; section: string } | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !containerRef.current?.contains(sel.anchorNode)) {
        if (!isNoteModalOpen) setSelection(null);
        return;
      }

      const text = sel.toString().trim();
      if (text.length < 5) return;

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Determine section based on proximity to headers (simplified logic)
      let section = "General";
      let parent = sel.anchorNode?.parentElement;
      while (parent && parent !== containerRef.current) {
        if (parent.getAttribute('data-section')) {
          section = parent.getAttribute('data-section')!;
          break;
        }
        parent = parent.parentElement;
      }

      setSelection({
        text,
        top: rect.top + window.scrollY - 50, // Position above selection
        left: rect.left + (rect.width / 2) - 20, // Center horizontally
        section
      });
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [isNoteModalOpen]);

  const handleSaveClick = () => {
    setIsNoteModalOpen(true);
  };

  const confirmSave = () => {
    if (selection && onSaveHighlight) {
      onSaveHighlight(selection.text, noteText, selection.section);
    }
    setSelection(null);
    setIsNoteModalOpen(false);
    setNoteText('');
    window.getSelection()?.removeAllRanges();
  };

  const cancelSave = () => {
    setSelection(null);
    setIsNoteModalOpen(false);
    setNoteText('');
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-8 pb-24 relative">
      
      {/* Selection Popup Toolbar */}
      {selection && !isNoteModalOpen && (
        <div 
          className="fixed z-50 flex items-center gap-2 bg-academic-900 text-white px-3 py-2 rounded-lg shadow-xl animate-scale-up origin-bottom"
          style={{ top: selection.top, left: selection.left }}
        >
          <button 
            onClick={handleSaveClick}
            className="flex items-center gap-2 text-sm font-medium hover:text-accent-light transition-colors"
          >
            <Highlighter className="w-4 h-4" />
            <span>Highlight & Note</span>
          </button>
        </div>
      )}

      {/* Note Input Modal */}
      {isNoteModalOpen && selection && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-academic-200 animate-scale-up">
             <div className="flex justify-between items-start mb-4">
               <h3 className="text-lg font-bold text-academic-900 flex items-center gap-2">
                 <Highlighter className="w-5 h-5 text-accent" />
                 Add to Notebook
               </h3>
               <button onClick={cancelSave} className="text-academic-400 hover:text-academic-800">
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             <div className="bg-academic-50 p-3 rounded-lg border-l-4 border-accent mb-4 max-h-32 overflow-y-auto">
               <p className="text-sm text-academic-700 italic font-serif">"{selection.text}"</p>
             </div>

             <textarea 
               autoFocus
               value={noteText}
               onChange={(e) => setNoteText(e.target.value)}
               placeholder="Add your remarks, thoughts, or connections..."
               className="w-full h-32 p-3 rounded-lg border border-academic-300 focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm mb-4 resize-none"
             />

             <div className="flex justify-end gap-3">
               <button 
                 onClick={cancelSave}
                 className="px-4 py-2 text-sm font-medium text-academic-600 hover:bg-academic-100 rounded-lg transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={confirmSave}
                 className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors shadow-sm"
               >
                 Save Note
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Header Section */}
      <header className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-accent" data-section="Header">
        <div className="space-y-4">
          <h1 className="text-3xl font-serif font-bold text-academic-900 leading-tight">
            {analysis.title_cn}
          </h1>
          <h2 className="text-xl text-academic-600 font-medium font-sans border-b border-academic-100 pb-4">
            {analysis.title_en}
          </h2>
          
          {/* Metadata Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
             <div className="flex flex-wrap gap-2">
              {analysis.authors.map((author, i) => (
                <span key={i} className="flex items-center gap-1 bg-academic-100 text-academic-700 px-3 py-1 rounded-full text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-academic-400"></span>
                  {author}
                </span>
              ))}
            </div>
          </div>

          {/* Keywords */}
          {analysis.keywords && analysis.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 animate-fade-in">
               {analysis.keywords.map((kw, i) => (
                 <span key={i} className="flex items-center gap-1.5 text-xs font-medium text-accent bg-accent/10 px-2.5 py-1 rounded border border-accent/20">
                   <Tag className="w-3 h-3" />
                   {kw}
                 </span>
               ))}
            </div>
          )}
        </div>
      </header>

      <div className="space-y-8">
          
        {/* Abstract/Summary */}
        <section className="bg-white rounded-xl p-8 shadow-sm border border-academic-200" data-section="Abstract">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-academic-800 uppercase tracking-wide">Abstract Summary</h3>
            </div>
            <p className="text-academic-700 leading-loose text-lg font-serif">
              {analysis.summary_cn}
            </p>
        </section>

        {/* Methodology Component */}
        <section data-section="Methodology">
          <MethodologyViewer data={analysis.methodology} />
        </section>
        
        {/* Figures & Tables Analysis */}
        {analysis.figures && analysis.figures.length > 0 && (
          <section className="bg-white rounded-xl overflow-hidden shadow-sm border border-academic-200" data-section="Figures">
             <div className="bg-academic-50 px-6 py-4 border-b border-academic-200 flex items-center gap-3">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded">
                   <BarChart2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-academic-900 uppercase tracking-wide">Figures & Data Analysis</h3>
             </div>
             
             <div className="divide-y divide-academic-100">
                {analysis.figures.map((fig, idx) => (
                  <div key={idx} className="p-6 hover:bg-academic-50/50 transition-colors">
                     <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-academic-100 rounded-lg flex items-center justify-center text-academic-500">
                             <ImageIcon className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                             <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="font-bold text-accent text-lg">{fig.label}</span>
                                <span className="text-sm font-medium text-academic-500">Page {fig.page_number}</span>
                             </div>
                             <p className="text-academic-600 font-medium text-sm">{fig.caption}</p>
                          </div>
                        </div>
                        
                        {/* Screenshot / Rendered PDF Page */}
                        {pdfBlob && fig.page_number ? (
                          <div className="w-full rounded-lg border border-academic-300 overflow-hidden">
                            <PdfFigure file={pdfBlob} pageNumber={fig.page_number} />
                          </div>
                        ) : (
                          <div className="w-full h-24 bg-academic-100 rounded-lg flex items-center justify-center text-academic-400 text-sm italic">
                             PDF Preview unavailable (File not in session)
                          </div>
                        )}

                        {/* Explanation */}
                        <div className="bg-white p-4 rounded-lg border border-academic-200 shadow-sm mt-2">
                           <h4 className="text-xs font-bold text-academic-400 uppercase tracking-wider mb-2">Analysis</h4>
                           <p className="text-academic-700 text-sm leading-relaxed">
                              {fig.description}
                           </p>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}

        {/* Conclusions */}
        <section className="bg-gradient-to-br from-white to-academic-50 rounded-xl p-8 shadow-sm border border-academic-200" data-section="Conclusions">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-academic-800 uppercase tracking-wide">Key Conclusions</h3>
            </div>
            <ul className="space-y-4">
              {analysis.conclusions.map((point, idx) => (
                <li key={idx} className="flex gap-4 items-start group">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold mt-1 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {idx + 1}
                  </span>
                  <p className="text-academic-700 leading-relaxed pt-0.5">
                    {point}
                  </p>
                </li>
              ))}
            </ul>
        </section>
      </div>
    </div>
  );
};
