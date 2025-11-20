import React, { useCallback, useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
  error?: string | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, isAnalyzing, error }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 text-center">
      <div className="mb-8">
        <h1 className="text-4xl font-serif text-academic-900 mb-4 tracking-tight">ScholarLens AI</h1>
        <p className="text-academic-600 text-lg">
          Deep bilingual analysis for complex academic literature.
        </p>
      </div>

      <div 
        className={`
          relative group rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out
          p-12 flex flex-col items-center justify-center min-h-[300px]
          ${dragActive 
            ? 'border-accent bg-accent-light/10 scale-[1.01]' 
            : 'border-academic-300 hover:border-academic-400 bg-white'
          }
          ${isAnalyzing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          accept=".pdf,application/pdf"
          disabled={isAnalyzing}
        />

        {isAnalyzing ? (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-16 h-16 text-accent animate-spin mb-6" />
            <p className="text-xl font-medium text-academic-800">Reading & Analyzing...</p>
            <p className="text-sm text-academic-500 mt-2">Extracting methodology and insights</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-academic-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-8 h-8 text-academic-500 group-hover:text-accent" />
            </div>
            <p className="text-xl font-medium text-academic-800 mb-2">
              Drop your PDF here, or click to browse
            </p>
            <p className="text-sm text-academic-500">
              Supported format: PDF (Max 20MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100 flex items-center justify-center gap-2 text-red-700 animate-fade-in">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};