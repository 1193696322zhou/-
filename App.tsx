
import React, { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { AnalysisResult } from './components/AnalysisResult';
import { ChatOverlay } from './components/ChatOverlay';
import { LibraryView } from './components/LibraryView';
import { NotebookView } from './components/NotebookView';
import { analyzePaper } from './services/geminiService';
import { PaperAnalysis, AnalysisStatus, StoredPaper, Folder, Highlight } from './types';
import { BookOpen, Grid, Highlighter, Upload, LogOut, ChevronLeft } from 'lucide-react';

// --- Main App Component ---

const App: React.FC = () => {
  // -- State --
  const [view, setView] = useState<'library' | 'upload' | 'reader' | 'notebook'>('library');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(null);
  const [currentPdfBlob, setCurrentPdfBlob] = useState<Blob | null>(null); // Store the active file for rendering
  const [error, setError] = useState<string | null>(null);

  // -- Persistent Data (Loaded from LocalStorage) --
  const [papers, setPapers] = useState<StoredPaper[]>(() => {
    const saved = localStorage.getItem('scholar_papers');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('scholar_folders');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Uncategorized' }];
  });

  const [highlights, setHighlights] = useState<Highlight[]>(() => {
    const saved = localStorage.getItem('scholar_highlights');
    return saved ? JSON.parse(saved) : [];
  });

  // -- Persist Effects --
  useEffect(() => { localStorage.setItem('scholar_papers', JSON.stringify(papers)); }, [papers]);
  useEffect(() => { localStorage.setItem('scholar_folders', JSON.stringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem('scholar_highlights', JSON.stringify(highlights)); }, [highlights]);

  // -- Handlers --

  const handleFileSelect = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setError("File size exceeds 20MB limit.");
      return;
    }
    setStatus(AnalysisStatus.UPLOADING);
    setError(null);
    setCurrentPdfBlob(file); // Store raw file for PDF.js rendering in this session

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(',')[1];
        setStatus(AnalysisStatus.ANALYZING);
        try {
          const result = await analyzePaper(base64Content, file.type);
          
          // Save to library immediately
          const newPaper: StoredPaper = {
            id: crypto.randomUUID(),
            data: result,
            uploadDate: Date.now(),
            folderId: 'default',
            tags: []
          };
          
          setPapers(prev => [newPaper, ...prev]);
          setCurrentPaperId(newPaper.id);
          setStatus(AnalysisStatus.COMPLETE);
          setView('reader');
        } catch (err) {
          setError("Failed to analyze paper.");
          setStatus(AnalysisStatus.ERROR);
        }
      };
    } catch (err) {
      setError("Unexpected error.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleSaveHighlight = (text: string, note: string, section: string) => {
    if (!currentPaperId) return;
    const currentPaper = papers.find(p => p.id === currentPaperId);
    if (!currentPaper) return;

    const newHighlight: Highlight = {
      id: crypto.randomUUID(),
      paperId: currentPaperId,
      paperTitle: currentPaper.data.title_cn || currentPaper.data.title_en,
      text,
      note,
      section,
      createdAt: Date.now()
    };

    setHighlights(prev => [newHighlight, ...prev]);
  };

  const getCurrentPaper = () => papers.find(p => p.id === currentPaperId);

  // -- View Management --
  
  const renderContent = () => {
    switch (view) {
      case 'upload':
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
             {status === AnalysisStatus.ANALYZING ? (
               <div className="text-center space-y-4">
                 <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
                 <p className="text-xl font-medium text-academic-800">Analyzing Document...</p>
                 <p className="text-academic-500">Extracting methods, conclusions, and insights.</p>
               </div>
             ) : (
               <FileUploader 
                 onFileSelect={handleFileSelect} 
                 isAnalyzing={status === AnalysisStatus.UPLOADING} 
                 error={error} 
               />
             )}
          </div>
        );
      
      case 'library':
        return (
          <LibraryView 
            papers={papers}
            folders={folders}
            onSelectPaper={(paper) => {
              setCurrentPaperId(paper.id);
              // Note: If we navigate from Library, we might lose the original Blob if the page was reloaded.
              // The PdfFigure component handles null blobs gracefully.
              setStatus(AnalysisStatus.COMPLETE);
              setView('reader');
            }}
            onDeletePaper={(id) => setPapers(prev => prev.filter(p => p.id !== id))}
            onCreateFolder={(name) => setFolders(prev => [...prev, { id: crypto.randomUUID(), name }])}
            onDeleteFolder={(id) => {
              setFolders(prev => prev.filter(f => f.id !== id));
              // Move papers to default
              setPapers(prev => prev.map(p => p.folderId === id ? { ...p, folderId: 'default' } : p));
            }}
            onMovePaper={(pId, fId) => setPapers(prev => prev.map(p => p.id === pId ? { ...p, folderId: fId } : p))}
            onUploadClick={() => setView('upload')}
          />
        );

      case 'notebook':
        return (
          <NotebookView 
            highlights={highlights} 
            papers={papers}
            onDelete={(id) => setHighlights(prev => prev.filter(h => h.id !== id))}
            onNavigateToPaper={(pId) => {
              setCurrentPaperId(pId);
              setView('reader');
            }}
          />
        );

      case 'reader':
        const paper = getCurrentPaper();
        if (!paper) return <div className="text-center p-10">Paper not found.</div>;
        return (
          <div className="animate-fade-in-up">
             <button 
               onClick={() => setView('library')}
               className="mb-4 flex items-center gap-2 text-academic-500 hover:text-accent transition-colors pl-2"
             >
               <ChevronLeft className="w-4 h-4" />
               Back to Library
             </button>
             <AnalysisResult 
               analysis={paper.data} 
               onSaveHighlight={handleSaveHighlight}
               pdfBlob={currentPdfBlob}
             />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-academic-50 text-academic-800 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-academic-200 flex flex-col justify-between shadow-sm z-20 transition-all duration-300">
        <div>
          <div className="h-20 flex items-center justify-center lg:justify-start lg:px-8 border-b border-academic-100">
            <div className="bg-accent text-white p-1.5 rounded-lg">
               <BookOpen className="w-6 h-6" />
            </div>
            <span className="hidden lg:block ml-3 font-serif font-bold text-xl tracking-tight text-academic-900">ScholarLens</span>
          </div>
          
          <nav className="p-4 space-y-2">
            <button 
              onClick={() => setView('library')}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${view === 'library' ? 'bg-accent text-white shadow-md' : 'hover:bg-academic-100 text-academic-600'}`}
            >
              <Grid className="w-5 h-5" />
              <span className="hidden lg:block font-medium">Library</span>
            </button>

            <button 
              onClick={() => setView('notebook')}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${view === 'notebook' ? 'bg-accent text-white shadow-md' : 'hover:bg-academic-100 text-academic-600'}`}
            >
              <Highlighter className="w-5 h-5" />
              <span className="hidden lg:block font-medium">Notebook</span>
            </button>

            <button 
              onClick={() => { setStatus(AnalysisStatus.IDLE); setView('upload'); }}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${view === 'upload' ? 'bg-accent text-white shadow-md' : 'hover:bg-academic-100 text-academic-600'}`}
            >
              <Upload className="w-5 h-5" />
              <span className="hidden lg:block font-medium">Upload New</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-academic-100">
          <div className="hidden lg:block text-xs text-academic-400 text-center">
            © 2024 ScholarLens AI
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        {/* Top Bar (Mobile/Tablet Context) */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-academic-200 px-8 py-4 flex justify-between items-center">
          <h2 className="text-lg font-medium text-academic-800 capitalize font-serif">
            {view === 'reader' ? 'Reading Mode' : view}
          </h2>
          <div className="text-sm text-academic-500 font-medium bg-academic-100 px-3 py-1 rounded-full">
            Gemini 2.5 Flash
          </div>
        </div>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Global Chat Overlay */}
      <ChatOverlay contextAvailable={view === 'reader' && currentPaperId !== null} />
      
    </div>
  );
};

export default App;