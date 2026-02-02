
import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createWorker } from 'tesseract.js';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

interface PDFMeta {
  name: string;
  size: string;
  pageCount: number;
  file: File;
}

const OCRPDF: React.FC = () => {
  const [pdfMeta, setPdfMeta] = useState<PDFMeta | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('eng');
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
      setError(null);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        setPdfMeta({
          name: file.name,
          size: formatSize(file.size),
          pageCount: pdf.numPages,
          file: file
        });
      } catch (err) {
        console.error(err);
        setError('Could not load PDF. It may be corrupted.');
      }
    }
    if (e.target) e.target.value = '';
  };

  const runOCR = async () => {
    if (!pdfMeta) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      setStatus('Initializing AI Worker...');
      const worker = await createWorker(language, 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            const pageProgress = Math.round(m.progress * 100);
            // We'll update the global progress separately based on page count
          }
        }
      });

      const arrayBuffer = await pdfMeta.file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const outputPdf = await PDFDocument.create();
      const font = await outputPdf.embedFont(StandardFonts.Helvetica);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');

      for (let i = 1; i <= pdf.numPages; i++) {
        setStatus(`Processing Page ${i} of ${pdf.numPages}...`);
        
        // 1. Render PDF page to canvas
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); // High res for better OCR
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Fixed render parameters to include canvas property required by types
        await page.render({ canvasContext: ctx, viewport, canvas: canvas }).promise;
        const imageData = canvas.toDataURL('image/png');

        // 2. Run OCR on the image
        const { data: { blocks } } = await worker.recognize(imageData);

        // 3. Create searchable PDF page
        const newPage = outputPdf.addPage([viewport.width, viewport.height]);
        
        // Embed the original page image
        const imageBytes = await fetch(imageData).then(r => r.arrayBuffer());
        const embeddedImage = await outputPdf.embedPng(imageBytes);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });

        // 4. Overlay recognized text (invisible)
        if (blocks) {
          for (const block of blocks) {
            for (const paragraph of block.paragraphs) {
              for (const line of paragraph.lines) {
                for (const word of line.words) {
                  const { x0, y0, x1, y1 } = word.bbox;
                  const textWidth = x1 - x0;
                  const textHeight = y1 - y0;

                  // Draw text invisibly (opacity 0) to keep it searchable
                  newPage.drawText(word.text, {
                    x: x0,
                    y: viewport.height - y1, // PDF coordinate system is bottom-up
                    size: Math.max(textHeight * 0.8, 1),
                    font: font,
                    color: rgb(0, 0, 0),
                    opacity: 0, 
                  });
                }
              }
            }
          }
        }
        
        setProgress(Math.round((i / pdf.numPages) * 100));
      }

      setStatus('Finalizing Document...');
      await worker.terminate();

      const pdfBytes = await outputPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Searchable_${pdfMeta.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setStatus('Complete!');
    } catch (err) {
      console.error(err);
      setError('OCR process failed. This is usually due to heavy memory usage on large documents.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setStatus('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">OCR PDF</h2>
          <p className="text-slate-600">Make your scanned PDF documents searchable by recognizing text using AI.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {!pdfMeta ? (
          <div
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center transition-all group ${isProcessing ? 'cursor-wait opacity-50' : 'cursor-pointer hover:border-indigo-400 hover:bg-slate-50'}`}
          >
            <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={isProcessing} />
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🔍</div>
            <p className="text-lg font-bold text-slate-900">Upload Scanned PDF</p>
            <p className="text-sm text-slate-500 mt-2">Maximum recommended: 10 pages for best browser performance.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">📄</div>
                <div>
                  <p className="text-sm font-bold text-slate-900 truncate max-w-xs">{pdfMeta.name}</p>
                  <p className="text-xs text-slate-500 font-medium uppercase">{pdfMeta.size} • {pdfMeta.pageCount} Pages</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Language</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isProcessing}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="eng">English</option>
                    <option value="spa">Spanish</option>
                    <option value="fra">French</option>
                    <option value="deu">German</option>
                    <option value="chi_sim">Chinese (Sim)</option>
                  </select>
                </div>
                <button 
                  onClick={() => setPdfMeta(null)} 
                  disabled={isProcessing}
                  className="text-xs font-bold text-rose-500 uppercase tracking-widest hover:underline disabled:opacity-50"
                >
                  Change
                </button>
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{status}</p>
                    <p className="text-[10px] text-slate-400 font-medium">This may take a minute as it uses your computer's AI power.</p>
                  </div>
                  <span className="text-sm font-black text-indigo-600">{progress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-300 shadow-[0_0_10px_rgba(79,70,229,0.4)]" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button
              onClick={runOCR}
              disabled={isProcessing}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center space-x-3 ${
                isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-[0.98]'
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Recognizing Text...</span>
                </>
              ) : (
                <>
                  <span>Start OCR Recognition</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
              Local Processing: Your document never leaves your browser.
            </p>
          </div>
        )}
      </div>

      <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
        <h4 className="text-sm font-bold text-indigo-900 mb-2">How it works</h4>
        <p className="text-sm text-indigo-700 leading-relaxed">
          The OCR tool uses an on-device AI model (Tesseract) to analyze each page of your PDF. 
          It identifies characters, words, and their exact positions, then reconstructs a 
          "sandwich" PDF where the invisible text layer is placed perfectly over the image. 
          This makes the final document searchable and allows you to highlight and copy text.
        </p>
      </div>
    </div>
  );
};

export default OCRPDF;
