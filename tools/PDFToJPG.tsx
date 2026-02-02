
import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

interface PDFInfo {
  name: string;
  size: string;
  pageCount: number;
  file: File;
}

const PDFToJPG: React.FC = () => {
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
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
      setIsProcessing(true);
      setError(null);
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
      } catch (err) {
        console.error(err);
        setError('Failed to load PDF. It might be corrupted or password protected.');
      } finally {
        setIsProcessing(false);
      }
    }
    if (e.target) e.target.value = '';
  };

  const convertToImages = async () => {
    if (!pdfInfo) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const arrayBuffer = await pdfInfo.file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const zip = new JSZip();
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); // High quality scale
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Fixed render parameters to include canvas property required by types
        await page.render({
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas
        }).promise;

        // Convert canvas to JPG blob
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9);
        });

        if (blob) {
          const fileName = `${pdfInfo.name.replace('.pdf', '')}_page_${i}.jpg`;
          zip.file(fileName, blob);
        }

        setProgress(Math.round((i / pdf.numPages) * 100));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pdfInfo.name.replace('.pdf', '')}_images.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      setError('An error occurred during conversion.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">PDF to JPG</h2>
          <p className="text-slate-600">Export every page of your PDF as a separate high-quality image.</p>
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
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🖼️</div>
            <p className="text-lg font-bold text-slate-900">
              {isProcessing ? 'Loading PDF...' : 'Upload PDF to Convert'}
            </p>
            <p className="text-sm text-slate-500 mt-2">Maximum file size recommended: 50MB</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">📄</div>
                <div>
                  <p className="text-sm font-bold text-slate-900 truncate max-w-xs">{pdfInfo.name}</p>
                  <p className="text-xs text-slate-500 font-medium uppercase">{pdfInfo.size} • {pdfInfo.pageCount} Pages</p>
                </div>
              </div>
              <button 
                onClick={() => setPdfInfo(null)} 
                disabled={isProcessing}
                className="text-xs font-bold text-rose-500 uppercase tracking-widest hover:underline disabled:opacity-50"
              >
                Change File
              </button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  <span>Converting Pages...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button
              onClick={convertToImages}
              disabled={isProcessing}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center space-x-3 ${
                isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Convert to JPG Images</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
              Conversion happens locally in your browser for maximum privacy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFToJPG;
