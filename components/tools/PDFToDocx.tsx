
import React, { useState, useRef } from 'react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { convertPdfToStructuredDoc } from '../../services/geminiService';

interface FileInfo {
  name: string;
  size: string;
  file: File;
}

const PDFToDocx: React.FC = () => {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      if (file.size > 15 * 1024 * 1024) {
        setError('File too large. Maximum size for AI conversion is 15MB.');
        return;
      }
      setFileInfo({
        name: file.name,
        size: formatSize(file.size),
        file: file
      });
      setError(null);
    }
    if (e.target) e.target.value = '';
  };

  const generateDocx = async (structuredData: any) => {
    const doc = new Document({
      sections: [{
        children: structuredData.elements.map((el: any) => {
          let heading;
          if (el.type === 'heading1') heading = HeadingLevel.HEADING_1;
          if (el.type === 'heading2') heading = HeadingLevel.HEADING_2;

          return new Paragraph({
            text: el.text,
            heading: heading,
            spacing: {
              after: 200,
            }
          });
        })
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileInfo!.name.replace('.pdf', '.docx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConvert = async () => {
    if (!fileInfo) return;
    setIsProcessing(true);
    setError(null);
    setStatus('Reading document...');

    try {
      const base64 = await fileToBase64(fileInfo.file);
      setStatus('AI analyzing content structure...');
      const structuredDoc = await convertPdfToStructuredDoc(base64);
      
      setStatus('Generating Word document...');
      await generateDocx(structuredDoc);
      
      setStatus('Conversion complete!');
    } catch (err) {
      console.error(err);
      setError('AI Conversion failed. The document might be too complex or there was an API error.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">PDF to Word (AI)</h2>
          <p className="text-slate-600">Uses Gemini to intelligently extract and format text from PDFs into editable DOCX files.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {!fileInfo ? (
          <div
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center transition-all group ${isProcessing ? 'cursor-wait opacity-50' : 'cursor-pointer hover:border-indigo-400 hover:bg-slate-50'}`}
          >
            <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={isProcessing} />
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📝</div>
            <p className="text-lg font-bold text-slate-900">Upload PDF for AI Conversion</p>
            <p className="text-sm text-slate-500 mt-2">Maximum file size: 15MB</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">📄</div>
                <div>
                  <p className="text-sm font-bold text-slate-900 truncate max-w-xs">{fileInfo.name}</p>
                  <p className="text-xs text-slate-500 font-medium uppercase">{fileInfo.size}</p>
                </div>
              </div>
              <button 
                onClick={() => setFileInfo(null)} 
                disabled={isProcessing}
                className="text-xs font-bold text-rose-500 uppercase tracking-widest hover:underline disabled:opacity-50"
              >
                Change File
              </button>
            </div>

            {isProcessing && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-bold text-indigo-600 animate-pulse">{status}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 animate-shimmer" style={{ width: '100%' }} />
                </div>
              </div>
            )}

            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center space-x-3 ${
                isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-[0.98]'
              }`}
            >
              {isProcessing ? 'Converting...' : 'Convert to DOCX'}
            </button>
            
            <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
              AI Hybrid: Content analysis via Gemini, document generation in browser.
            </p>
          </div>
        )}
      </div>

      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
        <h4 className="text-sm font-bold text-amber-900 mb-2">Why AI Conversion?</h4>
        <p className="text-sm text-amber-700 leading-relaxed">
          Traditional PDF to Word converters often struggle with layouts, merging random sentences into weird boxes. 
          Our AI tool reads the document like a human, understands the hierarchy (headings vs paragraphs), 
          and reconstructs a clean, logical Word document that is much easier to edit.
        </p>
      </div>
    </div>
  );
};

export default PDFToDocx;
