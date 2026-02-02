
import React, { useState, useCallback, useRef } from 'react';
import Cropper, { Area } from 'react-easy-crop';

const ASPECT_RATIOS = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 / 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '2:3', value: 2 / 3 },
];

const CropImage: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleDownload = async () => {
    if (!image || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      if (croppedBlob) {
        const url = URL.createObjectURL(croppedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Cropped_Image_${new Date().getTime()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to crop image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Crop Image</h2>
          <p className="text-slate-600">Perfectly frame your images for social media, print, or web.</p>
        </div>

        {!image ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all group"
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">✂️</div>
            <p className="text-xl font-bold text-slate-900">Upload Image to Crop</p>
            <p className="text-sm text-slate-500 mt-2">Supports JPG, PNG, WEBP</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Aspect Ratio Presets */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Select Aspect Ratio</label>
              <div className="flex flex-wrap gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.label}
                    onClick={() => setAspect(ratio.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      aspect === ratio.value
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cropper Container */}
            <div className="relative h-[400px] sm:h-[500px] w-full bg-slate-900 rounded-3xl overflow-hidden shadow-inner">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Zoom Slider */}
            <div className="space-y-3 max-w-sm mx-auto">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zoom Level</label>
                <span className="text-xs font-mono font-bold text-indigo-600">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleDownload}
                disabled={isProcessing}
                className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center space-x-3 ${
                  isProcessing
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-[0.98]'
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
                    <span>Crop & Download</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </>
                )}
              </button>
              <button
                onClick={() => setImage(null)}
                className="px-8 py-5 rounded-2xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100">
        <h4 className="text-sm font-black text-indigo-900 mb-4 uppercase tracking-widest">Professional Pro-Tips</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-xs font-bold text-indigo-600">Aspect Ratio 1:1</p>
            <p className="text-sm text-indigo-700/80 leading-relaxed">Best for Instagram profile pictures and feed posts.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-indigo-600">Aspect Ratio 16:9</p>
            <p className="text-sm text-indigo-700/80 leading-relaxed">Perfect for YouTube thumbnails and cinematic presentations.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-indigo-600">Aspect Ratio 9:16</p>
            <p className="text-sm text-indigo-700/80 leading-relaxed">Optimized for TikTok, Instagram Reels, and Mobile Wallpapers.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-indigo-600">Privacy & Speed</p>
            <p className="text-sm text-indigo-700/80 leading-relaxed">Your images are never uploaded. Cropping happens entirely in your browser.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropImage;
