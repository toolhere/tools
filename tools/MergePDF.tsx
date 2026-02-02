
import React, { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface FileItem {
  id: string;
  file: File;
  name: string;
  size: string;
  sizeRaw: number;
}

interface NumberingOptions {
  enabled: boolean;
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'top-center';
  fontSize: number;
  color: string;
}

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const MergePDF: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<NumberingOptions>({
    enabled: false,
    position: 'bottom-center',
    fontSize: 10,
    color: '#6366f1', // Indigo 500
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
    if (e.target) e.target.value = ''; // Reset input
  };

  const addFiles = (newFiles: File[]) => {
    setErrorMessage(null);
    const pdfFiles = newFiles.filter(f => f.type === 'application/pdf');
    
    const tooLarge = pdfFiles.filter(f => f.size > MAX_FILE_SIZE_BYTES);
    if (tooLarge.length > 0) {
      setErrorMessage(`${tooLarge.length} file(s) skipped. Maximum size per file is ${MAX_FILE_SIZE_MB}MB.`);
    }

    const validFiles = pdfFiles.filter(f => f.size <= MAX_FILE_SIZE_BYTES);
    const newItems: FileItem[] = validFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      name: f.name,
      size: formatSize(f.size),
      sizeRaw: f.size
    }));
    
    setFiles(prev => [...prev, ...newItems]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (id: string, direction: 'up' | 'down') => {
    const index = files.findIndex(f => f.id === id);
    if (index < 0) return;
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newFiles.length) {
      [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
      setFiles(newFiles);
    }
  };

  const onDragStartItem = (index: number) => {
    setDraggedIndex(index);
  };

  const onDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newFiles = [...files];
    const draggedItem = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setFiles(newFiles);
  };

  const onDragEndItem = () => {
    setDraggedIndex(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please add at least two PDF files to merge.');
      return;
    }

    setIsMerging(true);
    setMergeProgress(0);
    try {
      const mergedPdf = await PDFDocument.create();
      const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
      
      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        const fileArrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileArrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        
        setMergeProgress(Math.round(((i + 1) / files.length) * 50)); // First 50% for loading/merging
      }

      if (options.enabled) {
        const pages = mergedPdf.getPages();
        const totalPages = pages.length;
        const colorRgb = hexToRgb(options.color);
        
        for (let i = 0; i < totalPages; i++) {
          const page = pages[i];
          const { width, height } = page.getSize();
          const text = `Page ${i + 1} of ${totalPages}`;
          const textWidth = font.widthOfTextAtSize(text, options.fontSize);
          
          let x = 0;
          let y = 0;
          const margin = 20;

          switch (options.position) {
            case 'bottom-center':
              x = (width / 2) - (textWidth / 2);
              y = margin;
              break;
            case 'bottom-right':
              x = width - textWidth - margin;
              y = margin;
              break;
            case 'bottom-left':
              x = margin;
              y = margin;
              break;
            case 'top-center':
              x = (width / 2) - (textWidth / 2);
              y = height - margin - options.fontSize;
              break;
            case 'top-right':
              x = width - textWidth - margin;
              y = height - margin - options.fontSize;
              break;
            case 'top-left':
              x = margin;
              y = height - margin - options.fontSize;
              break;
          }

          page.drawText(text, {
            x,
            y,
            size: options.fontSize,
            font,
            color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
          });

          setMergeProgress(50 + Math.round(((i + 1) / totalPages) * 50));
        }
      } else {
        setMergeProgress(100);
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Noobu_Merged_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => setIsMerging(false), 500);
    } catch (error) {
      console.error('Merge error:', error);
      alert('Failed to merge PDFs. Please ensure files are not password protected.');
      setIsMerging(false);
    }
  };

  const onMainDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const onMainDragLeave = () => {
    setIsDraggingOver(false);
  };

  const onMainDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Merge PDF</h2>
            <p className="text-slate-600">Combine multiple PDF documents into a single professional file.</p>
          </div>
          <button 
            onClick={() => { setFiles([]); setErrorMessage(null); }}
            className="text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
          >
            Clear All
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-3 text-amber-800 animate-in fade-in slide-in-from-top-2 duration-300">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragOver={onMainDragOver}
          onDragLeave={onMainDragLeave}
          onDrop={onMainDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            isDraggingOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            multiple
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">📂</div>
          <p className="text-lg font-semibold text-slate-900">Click or drag PDF files here</p>
          <p className="text-sm text-slate-500 mt-2">Maximum file size: {MAX_FILE_SIZE_MB}MB per file</p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Merge Queue</h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase italic">Drag to reorder</span>
            </div>
            {files.map((item, index) => (
              <div 
                key={item.id}
                draggable={!isMerging}
                onDragStart={() => onDragStartItem(index)}
                onDragOver={(e) => onDragOverItem(e, index)}
                onDragEnd={onDragEndItem}
                className={`flex items-center justify-between p-4 bg-white border rounded-xl group transition-all duration-200 ${
                  draggedIndex === index ? 'opacity-40 border-indigo-400 scale-[0.98]' : 'border-slate-200 hover:border-indigo-200'
                } ${isMerging ? 'cursor-not-allowed opacity-60' : 'cursor-grab active:cursor-grabbing'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center p-1 text-slate-300 group-hover:text-indigo-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 7h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4-8h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
                    </svg>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    {index + 1}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[150px] sm:max-w-xs md:max-w-md">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase">{item.size}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                    disabled={isMerging}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-20"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Options Section */}
        {files.length > 0 && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center space-x-2 text-sm font-bold text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              <svg className={`w-4 h-4 transform transition-transform ${showOptions ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Page Numbering Options {options.enabled ? '(Enabled)' : ''}</span>
            </button>
            
            {showOptions && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="enable-numbering"
                    checked={options.enabled}
                    onChange={(e) => setOptions({ ...options, enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="enable-numbering" className="text-sm font-bold text-slate-700">Add Page Numbers</label>
                </div>

                <div className={!options.enabled ? 'opacity-40 pointer-events-none' : ''}>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Position</label>
                  <select 
                    value={options.position}
                    onChange={(e) => setOptions({ ...options, position: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>

                <div className={!options.enabled ? 'opacity-40 pointer-events-none' : ''}>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Font Size ({options.fontSize}px)</label>
                  <input 
                    type="range" 
                    min="6" max="24"
                    value={options.fontSize}
                    onChange={(e) => setOptions({ ...options, fontSize: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className={!options.enabled ? 'opacity-40 pointer-events-none' : ''}>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Color</label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="color" 
                      value={options.color}
                      onChange={(e) => setOptions({ ...options, color: e.target.value })}
                      className="w-10 h-10 rounded border-0 cursor-pointer p-0 bg-transparent"
                    />
                    <span className="text-sm font-mono text-slate-600 uppercase">{options.color}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-10">
          {isMerging && (
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-xs font-bold text-indigo-600 uppercase tracking-wider">
                <span>{options.enabled && mergeProgress > 50 ? 'Applying Numbering...' : 'Working Magic...'}</span>
                <span>{mergeProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                  style={{ width: `${mergeProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleMerge}
            disabled={isMerging || files.length < 2}
            className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center space-x-3 group ${
              isMerging || files.length < 2 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 active:scale-[0.98]'
            }`}
          >
            {isMerging ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Working Magic...</span>
              </>
            ) : (
              <>
                <span>Merge {files.length} Files</span>
                <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
            Privacy First: No files are uploaded. Merging happens in your memory.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MergePDF;
