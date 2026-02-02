
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper, { Area } from 'react-easy-crop';

interface PassportPreset {
  name: string;
  country: string;
  widthMm: number;
  heightMm: number;
  aspect: number;
  description: string;
}

const PRESETS: PassportPreset[] = [
  { name: 'US Passport', country: 'USA', widthMm: 51, heightMm: 51, aspect: 1, description: '2 x 2 inches' },
  { name: 'EU / UK', country: 'Europe/UK', widthMm: 35, heightMm: 45, aspect: 35 / 45, description: '35 x 45 mm' },
  { name: 'Indian Passport', country: 'India', widthMm: 51, heightMm: 51, aspect: 1, description: '2 x 2 inches' },
  { name: 'Chinese Visa', country: 'China', widthMm: 33, heightMm: 48, aspect: 33 / 48, description: '33 x 48 mm' },
  { name: 'Japan ID', country: 'Japan', widthMm: 35, heightMm: 45, aspect: 35 / 45, description: '35 x 45 mm' },
];

const PassportPhotoTool: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedPreset, setSelectedPreset] = useState<PassportPreset>(PRESETS[0]);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setShowCamera(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Could not access camera. Please check permissions.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        setImage(canvasRef.current.toDataURL('image/jpeg'));
        stopCamera();
      }
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (error) => reject(error));
      img.src = url;
    });

  const generatePhoto = async (mode: 'single' | 'sheet') => {
    if (!image || !croppedAreaPixels) return;
    setIsProcessing(true);

    try {
      const img = await createImage(image);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Single Photo Calculation (Higher res for printing)
      const targetDpi = 300;
      const mmToIn = 1 / 25.4;
      const pxWidth = Math.round(selectedPreset.widthMm * mmToIn * targetDpi);
      const pxHeight = Math.round(selectedPreset.heightMm * mmToIn * targetDpi);

      if (mode === 'single') {
        canvas.width = pxWidth;
        canvas.height = pxHeight;
        
        // Apply Corrections
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        
        ctx.drawImage(
          img,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          pxWidth,
          pxHeight
        );

        const link = document.createElement('a');
        link.download = `Passport_${selectedPreset.name.replace(/\s+/g, '_')}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
      } else {
        // Printable Sheet (4x6 inches @ 300 DPI)
        const sheetWidth = 4 * targetDpi; // 1200
        const sheetHeight = 6 * targetDpi; // 1800
        canvas.width = sheetWidth;
        canvas.height = sheetHeight;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, sheetWidth, sheetHeight);

        // Temp canvas for the single cropped image with filters
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = pxWidth;
        tempCanvas.height = pxHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
          tempCtx.drawImage(
            img,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            pxWidth,
            pxHeight
          );
        }

        // Layout multiple photos on the sheet
        const padding = 20;
        const startX = padding;
        const startY = padding;
        const cols = Math.floor((sheetWidth - padding) / (pxWidth + padding));
        const rows = Math.floor((sheetHeight - padding) / (pxHeight + padding));

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.drawImage(
              tempCanvas,
              startX + c * (pxWidth + padding),
              startY + r * (pxHeight + padding)
            );
            // Draw cutting guides
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 1;
            ctx.strokeRect(
              startX + c * (pxWidth + padding),
              startY + r * (pxHeight + padding),
              pxWidth,
              pxHeight
            );
          }
        }

        const link = document.createElement('a');
        link.download = `Printable_Sheet_4x6.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Passport & ID Photo Tool</h2>
          <p className="text-slate-600">Create official-standard ID photos ready for printing or digital submission.</p>
        </div>

        {!image && !showCamera ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all group"
            >
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📁</div>
              <p className="text-lg font-bold text-slate-900">Upload Photo</p>
              <p className="text-sm text-slate-500 mt-2">Best for existing high-quality shots</p>
            </div>
            <div
              onClick={startCamera}
              className="border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📸</div>
              <p className="text-lg font-bold text-slate-900">Take Live Photo</p>
              <p className="text-sm text-slate-500 mt-2">Use your webcam for an instant photo</p>
            </div>
          </div>
        ) : showCamera ? (
          <div className="relative bg-slate-900 rounded-3xl overflow-hidden aspect-video max-w-2xl mx-auto border-4 border-slate-800 shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera Overlay Guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-[100px] flex items-center justify-center">
                 <div className="w-full h-full relative">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-500 rounded-full" title="Eye level"></div>
                 </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-4">
              <button 
                onClick={capturePhoto}
                className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-slate-100 transition-all active:scale-95"
              >
                Capture Photo
              </button>
              <button 
                onClick={stopCamera}
                className="bg-slate-800/80 text-white px-6 py-3 rounded-full font-bold backdrop-blur-md hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
            {/* Left: Cropper */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative h-[500px] bg-slate-900 rounded-3xl overflow-hidden shadow-inner border border-slate-100">
                <Cropper
                  image={image!}
                  crop={crop}
                  zoom={zoom}
                  aspect={selectedPreset.aspect}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  style={{
                    containerStyle: { backgroundColor: '#0f172a' }
                  }}
                />
                
                {/* Face Centering Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pointer-events-none">
                  <div className="w-48 h-64 border-2 border-dashed border-indigo-400/40 rounded-[100px] shadow-[0_0_0_1000px_rgba(15,23,42,0.3)]">
                    <div className="w-full h-full flex flex-col items-center justify-center text-indigo-400/50 text-[10px] font-bold uppercase tracking-widest">
                      <div className="mt-8">Align Eyes Here</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Zoom</label>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                <button 
                  onClick={() => setImage(null)}
                  className="bg-slate-50 text-slate-500 px-6 py-3 rounded-2xl font-bold border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">1. Choose Standard</h3>
                <div className="grid grid-cols-1 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setSelectedPreset(p)}
                      className={`p-4 rounded-2xl text-left border transition-all ${
                        selectedPreset.name === p.name 
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">{p.country}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">2. Correct Image</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-slate-600">Brightness</label>
                      <span className="text-xs font-mono text-indigo-600 font-bold">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-slate-600">Contrast</label>
                      <span className="text-xs font-mono text-indigo-600 font-bold">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">3. Export</h3>
                <button
                  onClick={() => generatePhoto('single')}
                  disabled={isProcessing}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  Download Single Photo
                </button>
                <button
                  onClick={() => generatePhoto('sheet')}
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
                >
                  Download Printable Sheet (4x6)
                </button>
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                  Ready for Walgreens, CVS, or home printing
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100 flex items-start space-x-4">
        <div className="text-2xl mt-1">💡</div>
        <div>
          <h4 className="font-bold text-amber-900 mb-2 uppercase text-xs tracking-widest">Official Photo Requirements</h4>
          <ul className="text-sm text-amber-800 space-y-2 leading-relaxed">
            <li>• Use a plain white or off-white background.</li>
            <li>• Keep a neutral facial expression or a natural smile, with both eyes open.</li>
            <li>• Ensure your head is centered within the oval guide provided.</li>
            <li>• Do not wear glasses, hats, or head coverings (unless for religious reasons).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PassportPhotoTool;
