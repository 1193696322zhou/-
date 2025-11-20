
import React, { useState } from 'react';
import { Highlight, StoredPaper } from '../types';
import { Quote, Calendar, FileText, Trash2, Search, Download } from 'lucide-react';

interface Props {
  highlights: Highlight[];
  papers: StoredPaper[];
  onDelete: (id: string) => void;
  onNavigateToPaper: (paperId: string) => void;
}

export const NotebookView: React.FC<Props> = ({ highlights, papers, onDelete, onNavigateToPaper }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHighlights = highlights.filter(h => 
    h.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.paperTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    if (filteredHighlights.length === 0) return;

    // Build a simple HTML document that Word can interpret
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>ScholarLens Export</title></head>
      <body>
        <h1>ScholarLens Notebook Export</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <hr/>
        ${filteredHighlights.map(h => `
          <div style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
            <h3>Paper: ${h.paperTitle}</h3>
            <p><strong>Section:</strong> ${h.section || 'General'}</p>
            <p><strong>Highlight:</strong> <em>"${h.text}"</em></p>
            <p><strong>Note:</strong> ${h.note}</p>
            <p style="color: #666; font-size: 0.8em;">Date: ${new Date(h.createdAt).toLocaleDateString()}</p>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ScholarLens_Notebook_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 border-b border-academic-200 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-academic-900">My Notebook</h1>
          <p className="text-academic-500 mt-1">Aggregated insights and remarks from your readings</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-academic-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none bg-white"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-academic-400" />
          </div>

          <button 
            onClick={handleExport}
            disabled={filteredHighlights.length === 0}
            className="bg-academic-800 hover:bg-academic-900 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export to Word"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {highlights.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-academic-300">
          <div className="bg-academic-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Quote className="w-8 h-8 text-academic-400" />
          </div>
          <h3 className="text-lg font-medium text-academic-800">Notebook is Empty</h3>
          <p className="text-academic-500 max-w-md mx-auto mt-2">
            Select text while reading a paper to highlight it and add your personal remarks here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredHighlights.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm border border-academic-200 hover:border-accent/30 transition-all duration-300 group relative">
              
              {/* Actions */}
              <button 
                onClick={() => onDelete(item.id)}
                className="absolute top-4 right-4 p-2 text-academic-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Highlight"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Context Header */}
              <div className="flex items-center gap-3 mb-4 text-sm">
                <button 
                  onClick={() => onNavigateToPaper(item.paperId)}
                  className="flex items-center gap-1.5 bg-academic-50 text-academic-600 px-3 py-1 rounded-full hover:bg-accent hover:text-white transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px] font-medium">{item.paperTitle}</span>
                </button>
                <span className="text-academic-400">•</span>
                <span className="text-academic-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                {item.section && (
                  <>
                    <span className="text-academic-400">•</span>
                    <span className="text-xs uppercase tracking-wider font-bold text-academic-400">{item.section}</span>
                  </>
                )}
              </div>

              {/* The Quote */}
              <div className="pl-4 border-l-4 border-accent/30 mb-4">
                 <p className="text-lg font-serif text-academic-800 italic leading-relaxed">
                   "{item.text}"
                 </p>
              </div>

              {/* The Note */}
              {item.note && (
                <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100/50 mt-2">
                  <span className="text-xs font-bold text-yellow-700/70 uppercase tracking-wider block mb-1">My Remark</span>
                  <p className="text-academic-700 whitespace-pre-wrap">
                    {item.note}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
