
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface Props {
  file: Blob;
  pageNumber: number;
  scale?: number;
}

export const PdfFigure: React.FC<Props> = ({ file, pageNumber, scale = 1.5 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const renderPage = async () => {
      if (!(window as any).pdfjsLib) {
        setError("PDF Library not loaded.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = (window as any).pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;

        if (pageNumber > pdf.numPages || pageNumber < 1) {
           if (isMounted) setError(`Page ${pageNumber} out of bounds (1-${pdf.numPages})`);
           setLoading(false);
           return;
        }

        const page = await pdf.getPage(pageNumber);
        
        // Calculate viewport
        // We can adjust scale to make high quality screenshots
        const viewport = page.getViewport({ scale: scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
        
        if (isMounted) setLoading(false);

      } catch (err) {
        console.error("PDF Render Error:", err);
        if (isMounted) {
          setError("Failed to render figure from PDF.");
          setLoading(false);
        }
      }
    };

    renderPage();

    return () => { isMounted = false; };
  }, [file, pageNumber, scale]);

  return (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden min-h-[200px] flex items-center justify-center border border-academic-200">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-academic-50/80 z-10">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-2" />
          <span className="text-xs text-academic-500 font-medium">Loading PDF Page {pageNumber}...</span>
        </div>
      )}
      
      {error && (
        <div className="flex flex-col items-center text-red-500 p-4 text-center">
           <AlertCircle className="w-6 h-6 mb-2" />
           <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Canvas for the PDF Page */}
      <canvas 
        ref={canvasRef} 
        className={`w-full h-auto shadow-sm ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{ display: error ? 'none' : 'block' }}
      />
    </div>
  );
};
