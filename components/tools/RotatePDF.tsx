
import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

interface PDFMetadata {
  name: string;
  size: string;
  pageCount: number;
  file: File;
}

const RotatePDF: React.FC = () => {
  const [pdfInfo, setPdfInfo] = useState<PDFMetadata | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rotationProgress, setRotationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setIsProcessing(true);
      setError(null);
      setThumbnails([]);
      setSelectedPages(new Set());

      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        setPdfInfo({
          name: file.name,
          size: formatSize(file.size),
          pageCount: pdf.numPages,
          file: file
        });

        const thumbs: string[] = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Generate thumbs for first 50 pages to avoid crashing browser
        const limit = Math.min(pdf.numPages, 50);
        for (let i = 1; i <= limit; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // Fixed render parameters to include canvas property required by types
          await page.render({ canvasContext: ctx!, viewport, canvas: canvas }).promise;
          thumbs.push(canvas.toDataURL('image/jpeg', 0.8));
        }
        setThumbnails(thumbs);
      } catch (err) {
        setError('Could not load PDF. It might be corrupted or protected.');
      } finally {
        setIsProcessing(false);
      }
    }
    if (e.target) e.target.value = '';
  };

  const togglePage = (index: number) => {
    const newSet = new Set(selectedPages);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedPages(newSet);
  };

  const selectAll = () => {
    if (!pdfInfo) return;
    const all = new Set<number>();
    for (let i = 0; i < pdfInfo.pageCount; i++) all.add(i);
    setSelectedPages(all);
  };

  const handleRotate = async (angle: number) => {
    if (!pdfInfo) return;
    if (selectedPages.size === 0) {
      setError('Please select at least one page to rotate.');
      return;
    }

    setIsProcessing(true);
    setRotationProgress(0);
    setError(null);

    try {
      const existingPdfBytes = await pdfInfo.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();

      selectedPages.forEach((pageIndex) => {
        const page = pages[pageIndex];
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + angle));
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rotated_${pdfInfo.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      setError('An error occurred during rotation.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">Rotate PDF</h2>
            <p className="text-slate-600">Select pages to rotate clockwise or counter-clockwise.</p>
          </div>
          {pdfInfo && (
            <button 
              onClick={() => setPdfInfo(null)}
              className="text-xs font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-3 py-1 rounded-full transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {!pdfInfo ? (
          <div
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center transition-all group ${isProcessing ? 'cursor-wait opacity-50' : 'cursor-pointer hover:border-indigo-400 hover:bg-slate-50'}`}
          >
            <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={isProcessing} />
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🔄</div>
            <p className="text-lg font-bold text-slate-900">Upload PDF to Rotate</p>
            <p className="text-sm text-slate-500 mt-2">Privacy focus: Your PDF is processed locally.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center space-x-4">
                 <button onClick={selectAll} className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border border-indigo-100 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors">Select All</button>
                 <button onClick={() => setSelectedPages(new Set())} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-100 bg-slate-50 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">Deselect All</button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleRotate(-90)}
                  disabled={isProcessing || selectedPages.size === 0}
                  className="bg-white border border-slate-200 p-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  title="90° CCW"
                >
                  <span className="text-lg">↩️</span>
                </button>
                <button 
                  onClick={() => handleRotate(180)}
                  disabled={isProcessing || selectedPages.size === 0}
                  className="bg-white border border-slate-200 p-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  title="180° Flip"
                >
                  <span className="text-lg">↕️</span>
                </button>
                <button 
                  onClick={() => handleRotate(90)}
                  disabled={isProcessing || selectedPages.size === 0}
                  className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2 px-4"
                >
                  <span className="text-lg">↪️</span>
                  <span className="text-sm font-bold">Rotate 90° CW</span>
                </button>
              </div>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 h-[500px] overflow-y-auto p-4 bg-slate-50 rounded-3xl border border-slate-100">
              {thumbnails.map((thumb, idx) => (
                <div 
                  key={idx}
                  onClick={() => togglePage(idx)}
                  className={`relative aspect-[3/4] cursor-pointer rounded-xl border-2 transition-all duration-200 group ${
                    selectedPages.has(idx) ? 'border-indigo-500 shadow-lg scale-[1.02]' : 'border-transparent hover:border-indigo-200 shadow-sm'
                  }`}
                >
                  <img src={thumb} alt={`Page ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                  <div className={`absolute inset-0 bg-indigo-600/10 transition-opacity rounded-lg ${selectedPages.has(idx) ? 'opacity-100' : 'opacity-0'}`} />
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-[10px] font-black text-slate-900 border border-slate-200">
                    {idx + 1}
                  </div>
                  {selectedPages.has(idx) && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {/* Visual Indicator of selection count if multiple pages */}
                  {!selectedPages.has(idx) && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                       <span className="bg-indigo-600/80 text-white px-3 py-1 rounded-full text-xs font-bold">Select Page</span>
                    </div>
                  )}
                </div>
              ))}
              {pdfInfo.pageCount > 50 && (
                <div className="col-span-full p-4 text-center text-slate-400 text-sm italic">
                  Showing first 50 pages for performance. Rotation will still apply to all selected indices.
                </div>
              )}
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
              Pages will be permanently rotated. Save before processing multiple times.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RotatePDF;
