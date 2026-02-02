
import React, { useState, useRef } from 'react';
import { PDFDocument, PageSizes } from 'pdf-lib';

interface ImageItem {
  id: string;
  file: File;
  preview: string;
}

type PageLayout = 'original' | 'a4';
type PageMargin = 'none' | 'small' | 'large';

const JPGToPDF: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [layout, setLayout] = useState<PageLayout>('a4');
  const [margin, setMargin] = useState<PageMargin>('small');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f,
        preview: URL.createObjectURL(f)
      }));
      setImages(prev => [...prev, ...newImages]);
    }
    if (e.target) e.target.value = '';
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // Clean up the URL
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();
      
      for (const item of images) {
        const imgBytes = await item.file.arrayBuffer();
        let embeddedImage;
        
        const isPng = item.file.type === 'image/png';
        if (isPng) {
          embeddedImage = await pdfDoc.embedPng(imgBytes);
        } else {
          embeddedImage = await pdfDoc.embedJpg(imgBytes);
        }

        let pageWidth, pageHeight;
        let imgWidth = embeddedImage.width;
        let imgHeight = embeddedImage.height;
        let x = 0;
        let y = 0;

        const marginMap = { none: 0, small: 20, large: 50 };
        const m = marginMap[margin];

        if (layout === 'a4') {
          pageWidth = PageSizes.A4[0];
          pageHeight = PageSizes.A4[1];

          const availableWidth = pageWidth - m * 2;
          const availableHeight = pageHeight - m * 2;

          const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
          imgWidth *= ratio;
          imgHeight *= ratio;

          x = (pageWidth - imgWidth) / 2;
          y = (pageHeight - imgHeight) / 2;
        } else {
          pageWidth = imgWidth + m * 2;
          pageHeight = imgHeight + m * 2;
          x = m;
          y = m;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        page.drawImage(embeddedImage, {
          x,
          y,
          width: imgWidth,
          height: imgHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Noobu_Images_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to create PDF. Ensure all images are valid JPG/PNG files.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">JPG to PDF</h2>
          <p className="text-slate-600">Convert scans and photos into a professional document. Private & secure.</p>
        </div>

        <div
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all group ${
            isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
          }`}
        >
          <input type="file" multiple accept="image/jpeg,image/png" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={isProcessing} />
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🖼️</div>
          <p className="text-lg font-bold text-slate-900">Add Images to PDF</p>
          <p className="text-sm text-slate-500 mt-1">Select one or more JPG/PNG files</p>
        </div>

        {images.length > 0 && (
          <div className="mt-10 space-y-10 animate-in fade-in slide-in-from-bottom-2">
            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Page Layout</label>
                <div className="flex bg-white rounded-xl p-1 border border-slate-200">
                  <button 
                    onClick={() => setLayout('a4')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${layout === 'a4' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Fit to A4
                  </button>
                  <button 
                    onClick={() => setLayout('original')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${layout === 'original' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Original Size
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Margin Size</label>
                <div className="flex bg-white rounded-xl p-1 border border-slate-200">
                  {(['none', 'small', 'large'] as PageMargin[]).map((m) => (
                    <button 
                      key={m}
                      onClick={() => setMargin(m)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${margin === m ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img, idx) => (
                <div key={img.id} className="relative group aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                  <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-900/50 backdrop-blur-md text-white flex items-center justify-center text-[10px] font-black">
                    {idx + 1}
                  </div>
                  <button 
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleConvert}
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
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <span>Create PDF from {images.length} Image{images.length !== 1 ? 's' : ''}</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
              Private conversion: Images are processed entirely in your browser.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JPGToPDF;
