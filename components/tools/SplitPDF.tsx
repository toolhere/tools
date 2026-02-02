
import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

interface PDFMetadata {
  name: string;
  size: string;
  pageCount: number;
  file: File;
}

const SplitPDF: React.FC = () => {
  const [pdfInfo, setPdfInfo] = useState<PDFMetadata | null>(null);
  const [splitMode, setSplitMode] = useState<'range' | 'all'>('range');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeText, setRangeText] = useState('');
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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
      if (file.size > 100 * 1024 * 1024) {
        setError('File is too large for browser processing. Please use files under 100MB.');
        return;
      }
      setIsProcessing(true);
      setError(null);
      setThumbnails([]);
      setSelectedPages(new Set());
      setRangeText('');

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

        // Generate Thumbnails
        const thumbs: string[] = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) { // Limit thumbs for perf
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // Fixed render parameters to include canvas property required by types
          await page.render({ canvasContext: ctx!, viewport, canvas: canvas }).promise;
          thumbs.push(canvas.toDataURL('image/jpeg', 0.7));
          setProgress(Math.round((i / Math.min(pdf.numPages, 50)) * 100));
        }
        setThumbnails(thumbs);
      } catch (err) {
        setError('Could not load PDF. It might be corrupted or protected.');
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    }
    if (e.target) e.target.value = '';
  };

  // Sync selectedPages set to Range Text
  const updateRangeFromSet = (set: Set<number>) => {
    const sorted = Array.from(set).sort((a, b) => a - b);
    if (sorted.length === 0) {
      setRangeText('');
      return;
    }
    
    let ranges = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
        start = end = sorted[i];
      }
    }
    ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
    setRangeText(ranges.join(', '));
  };

  const togglePage = (index: number) => {
    const newSet = new Set(selectedPages);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedPages(newSet);
    updateRangeFromSet(newSet);
  };

  const selectAll = () => {
    if (!pdfInfo) return;
    const all = new Set<number>();
    for (let i = 0; i < pdfInfo.pageCount; i++) all.add(i);
    setSelectedPages(all);
    updateRangeFromSet(all);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
    setRangeText('');
  };

  const parseRangeText = (text: string, max: number): number[] => {
    const pages = new Set<number>();
    const parts = text.split(',').map(p => p.trim());
    
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i > 0 && i <= max) pages.add(i - 1);
          }
        }
      } else {
        const page = parseInt(part);
        if (!isNaN(page) && page > 0 && page <= max) {
          pages.add(page - 1);
        }
      }
    });
    
    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!pdfInfo) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const existingPdfBytes = await pdfInfo.file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(existingPdfBytes);

      if (splitMode === 'range') {
        const indices = rangeText ? parseRangeText(rangeText, pdfInfo.pageCount) : Array.from(selectedPages);
        if (indices.length === 0) {
          setError('Please select at least one page to extract.');
          setIsProcessing(false);
          return;
        }

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(sourcePdf, indices);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), `Extracted_${pdfInfo.name}`);
        setProgress(100);
      } else {
        const zip = new JSZip();
        for (let i = 0; i < pdfInfo.pageCount; i++) {
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(sourcePdf, [i]);
          newPdf.addPage(page);
          const pdfBytes = await newPdf.save();
          zip.file(`Page_${i + 1}.pdf`, pdfBytes);
          setProgress(Math.round(((i + 1) / pdfInfo.pageCount) * 100));
        }
        const content = await zip.generateAsync({ type: 'blob' });
        downloadBlob(content, `${pdfInfo.name.replace('.pdf', '')}_individual_pages.zip`);
      }
    } catch (err) {
      setError('An error occurred during splitting.');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 500);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">Split PDF</h2>
            <p className="text-slate-600">Extract specific pages visually or burst into individual files.</p>
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
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all group"
          >
            <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">✂️</div>
            <p className="text-lg font-bold text-slate-900">Upload PDF to Split</p>
            <p className="text-sm text-slate-500 mt-2">Privacy focus: Your PDF is processed locally.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Control Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setSplitMode('range')}
                className={`p-6 rounded-2xl border text-left transition-all relative ${splitMode === 'range' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className="font-bold text-slate-900 mb-1">Custom Extraction</div>
                <div className="text-xs text-slate-500">Pick specific pages to create a new PDF.</div>
                {splitMode === 'range' && <div className="absolute top-4 right-4 text-indigo-600 text-xl font-black">✓</div>}
              </button>
              <button 
                onClick={() => setSplitMode('all')}
                className={`p-6 rounded-2xl border text-left transition-all relative ${splitMode === 'all' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className="font-bold text-slate-900 mb-1">Split All (Individual)</div>
                <div className="text-xs text-slate-500">Save every single page as its own PDF in a ZIP.</div>
                {splitMode === 'all' && <div className="absolute top-4 right-4 text-indigo-600 text-xl font-black">✓</div>}
              </button>
            </div>

            {splitMode === 'range' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-grow">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Page Selection</label>
                    <input 
                      type="text" 
                      value={rangeText}
                      onChange={(e) => setRangeText(e.target.value)}
                      placeholder="e.g. 1-5, 8, 12"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={selectAll} className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest border border-indigo-100 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors">Select All</button>
                    <button onClick={clearSelection} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-100 bg-slate-50 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">Clear</button>
                  </div>
                </div>

                {/* Thumbnail Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 h-[400px] overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100">
                  {thumbnails.length > 0 ? thumbnails.map((thumb, idx) => (
                    <div 
                      key={idx}
                      onClick={() => togglePage(idx)}
                      className={`relative aspect-[3/4] cursor-pointer rounded-xl border-2 transition-all ${
                        selectedPages.has(idx) ? 'border-indigo-500 shadow-md' : 'border-transparent hover:border-indigo-200 shadow-sm'
                      }`}
                    >
                      <img src={thumb} alt={`Page ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                      <div className={`absolute inset-0 bg-indigo-600/10 transition-opacity ${selectedPages.has(idx) ? 'opacity-100' : 'opacity-0'}`} />
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-[10px] font-black text-slate-900 border border-slate-200">
                        {idx + 1}
                      </div>
                      {selectedPages.has(idx) && (
                        <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="col-span-full flex items-center justify-center h-full text-slate-400 font-medium">
                      Loading Previews...
                    </div>
                  )}
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  <span>{splitMode === 'all' ? 'Bursting PDF...' : 'Creating New PDF...'}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-300 shadow-[0_0_10px_rgba(79,70,229,0.3)]" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button
              onClick={handleSplit}
              disabled={isProcessing}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center space-x-3 ${
                isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-[0.98]'
              }`}
            >
              {isProcessing ? 'Processing...' : (splitMode === 'all' ? 'Split All Pages' : 'Extract Selected Pages')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitPDF;
