
import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

const CompressPDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ original: string; compressed: string; savings: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setResult(null);
      setError(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const originalBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(originalBuffer);
      
      // Basic compression strategy: Load and resave with full optimization
      // This removes unused objects and flattens structure.
      const compressedBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
      
      const compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });
      const savings = 1 - (compressedBlob.size / file.size);

      setResult({
        original: formatSize(file.size),
        compressed: formatSize(compressedBlob.size),
        savings: (savings * 100).toFixed(1) + '%'
      });

      const url = URL.createObjectURL(compressedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Compressed_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('An error occurred. Some PDFs are already highly optimized.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-2">Compress PDF</h2>
        <p className="text-slate-600 mb-8">Reduce file size while preserving document quality. Optimized for sharing.</p>

        {error && <div className="mb-6 p-4 bg-rose-50 rounded-xl text-rose-600 text-sm font-medium">{error}</div>}

        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all"
          >
            <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div className="text-5xl mb-4">📉</div>
            <p className="text-lg font-bold">Select PDF to Compress</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">📄</div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                </div>
              </div>
              <button onClick={() => setFile(null)} className="text-xs font-bold text-rose-500">Change</button>
            </div>

            {result && (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-indigo-50 rounded-2xl text-center">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">Original</p>
                  <p className="text-lg font-black text-indigo-600">{result.original}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl text-center">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase">Compressed</p>
                  <p className="text-lg font-black text-emerald-600">{result.compressed}</p>
                </div>
                <div className="p-4 bg-violet-50 rounded-2xl text-center">
                  <p className="text-[10px] text-violet-400 font-bold uppercase">Savings</p>
                  <p className="text-lg font-black text-violet-600">{result.savings}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleCompress}
              disabled={isProcessing}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all ${
                isProcessing ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isProcessing ? 'Optimizing PDF...' : 'Compress PDF'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompressPDF;
