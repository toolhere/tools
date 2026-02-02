
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ToolGrid from './components/ToolGrid';
import ResumeAI from './components/tools/ResumeAI';
import DevTools from './components/tools/DevTools';
import MergePDF from './components/tools/MergePDF';
import SplitPDF from './components/tools/SplitPDF';
import PDFToJPG from './components/tools/PDFToJPG';
import OCRPDF from './components/tools/OCRPDF';
import CompressPDF from './components/tools/CompressPDF';
import JPGToPDF from './components/tools/JPGToPDF';
import PDFToDocx from './components/tools/PDFToDocx';
import RotatePDF from './components/tools/RotatePDF';
import CropImage from './components/tools/CropImage';
import PassportPhotoTool from './components/tools/PassportPhotoTool';
import VideoIdeas from './components/tools/VideoIdeas';
import HashtagGen from './components/tools/HashtagGen';
import { TOOLS } from './constants';

type ViewState = 'home' | 'tool' | 'features' | 'privacy' | 'terms' | 'cookies';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  const activeTool = TOOLS.find(t => t.id === activeToolId);

  const navigateTo = (v: ViewState, toolId: string | null = null) => {
    setView(v);
    setActiveToolId(toolId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderTool = () => {
    switch (activeToolId) {
      case 'resume-analyzer': return <ResumeAI />;
      case 'code-writer': return <DevTools />;
      case 'merge-pdf': return <MergePDF />;
      case 'split-pdf': return <SplitPDF />;
      case 'pdf-to-jpg': return <PDFToJPG />;
      case 'ocr-pdf': return <OCRPDF />;
      case 'compress-pdf': return <CompressPDF />;
      case 'jpg-to-pdf': return <JPGToPDF />;
      case 'pdf-to-docx': return <PDFToDocx />;
      case 'rotate-pdf': return <RotatePDF />;
      case 'crop-image': return <CropImage />;
      case 'id-photo': return <PassportPhotoTool />;
      case 'video-ideas': return <VideoIdeas />;
      case 'hashtag-gen': return <HashtagGen />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
            <div className="text-6xl mb-6">🚧</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{activeTool?.name}</h2>
            <p className="text-slate-600 max-w-md">Coming soon in the next update!</p>
            <button onClick={() => navigateTo('home')} className="mt-8 text-indigo-600 font-semibold hover:underline">Back to all tools</button>
          </div>
        );
    }
  };

  const renderView = () => {
    switch (view) {
      case 'tool':
        return (
          <div className="min-h-[80vh] animate-in fade-in duration-500">
            <div className="bg-slate-900 py-3 sticky top-16 z-40 backdrop-blur-sm bg-slate-900/90">
              <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                <button onClick={() => navigateTo('home')} className="text-slate-400 hover:text-white flex items-center text-xs font-bold transition-colors uppercase tracking-widest">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Dashboard
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{activeTool?.icon}</span>
                  <span className="text-white font-black text-sm uppercase tracking-tight">{activeTool?.name}</span>
                </div>
                <div className="hidden sm:block text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                  Client-Side Secure
                </div>
              </div>
            </div>
            {renderTool()}
          </div>
        );
      case 'features':
        return (
          <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black mb-8">Professional Features</h1>
            <div className="grid gap-12">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Privacy-First Engine</h3>
                <p className="text-slate-600 leading-relaxed">Unlike other online PDF tools, Noobu processes your sensitive files (PDFs, Images, Resumes) entirely within your browser memory. We don't have servers that store your documents. Once you close the tab, your data is gone.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Gemini AI Integration</h3>
                <p className="text-slate-600 leading-relaxed">Our content tools and resume analysis are powered by Google's most advanced Gemini models, ensuring high-accuracy text recognition (OCR) and intelligent document reconstruction.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold mb-4">No Watermarks, No Fees</h3>
                <p className="text-slate-600 leading-relaxed">We believe professional tools should be accessible. There are no hidden fees, no credit systems, and we will never add watermarks to your merged or compressed documents.</p>
              </div>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in slide-in-from-bottom-4 duration-700 prose prose-slate">
            <h1 className="text-4xl font-black mb-8">Privacy Policy</h1>
            <p className="text-lg text-slate-600 mb-6">Your data privacy is our highest priority. Here is how we protect you:</p>
            <div className="space-y-8 text-slate-700">
              <section>
                <h3 className="text-xl font-bold text-slate-900">1. Local Processing</h3>
                <p>For PDF merging, splitting, rotating, and image processing, all calculations happen on your device. We do not upload these files to any server.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-slate-900">2. AI Data Usage</h3>
                <p>When using AI-based features (Resume Analyzer, Code Writer), only the text or file content is sent to Google's Gemini API for processing. This data is not stored by Noobu Tools.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-slate-900">3. Analytics</h3>
                <p>We use minimal, privacy-friendly analytics to understand tool usage. We never track individual users or sell any data to third parties.</p>
              </section>
            </div>
          </div>
        );
      case 'terms':
        return (
          <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black mb-8">Terms of Service</h1>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-slate-600 space-y-6">
              <p>By using Noobu Tools, you agree to the following terms:</p>
              <ul className="list-disc pl-5 space-y-4">
                <li>You are solely responsible for the content you process through our tools.</li>
                <li>Our services are provided "as-is" without any warranties of any kind.</li>
                <li>Noobu Tools is not liable for any data loss or errors resulting from tool usage.</li>
                <li>You may not use our tools for any illegal activities or to process copyrighted material you do not own.</li>
              </ul>
            </div>
          </div>
        );
      case 'cookies':
        return (
          <div className="max-w-4xl mx-auto px-4 py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl font-black mb-8">Cookie Policy</h1>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-slate-600 space-y-6">
              <p>We keep it simple. Noobu Tools uses essential cookies to:</p>
              <ul className="list-disc pl-5 space-y-4">
                <li>Remember your UI preferences (like theme or view mode).</li>
                <li>Prevent spam and ensure the security of our AI endpoints.</li>
                <li>Collect anonymous performance data to improve tool speed.</li>
              </ul>
              <p>We do not use tracking or advertising cookies.</p>
            </div>
          </div>
        );
      default:
        return (
          <>
            <div className="relative pt-24 pb-20 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-[0.2em] mb-10 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span>100% Free • Privacy First</span>
                  </div>
                  <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight mb-8 leading-[0.9]">
                    Professional <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-[shimmer_5s_linear_infinite]">
                      Creative Utilities
                    </span>
                  </h1>
                  <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mb-12">
                    Accurate, high-speed tools designed for modern workflows. No watermarks. No signups. Powered by Gemini AI.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <button onClick={() => document.getElementById('tool-grid')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl text-lg font-black hover:bg-black shadow-2xl hover:-translate-y-1 transition-all active:scale-95">
                      Explore 17+ Tools
                    </button>
                    <button onClick={() => navigateTo('features')} className="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 px-10 py-5 rounded-2xl text-lg font-black hover:bg-slate-50 transition-all">
                      Why Noobu?
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 pointer-events-none opacity-30">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-200 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-200 rounded-full blur-[120px]"></div>
              </div>
            </div>
            <div id="tool-grid" className="pb-24">
              <ToolGrid onActivateTool={(id) => navigateTo('tool', id)} />
            </div>
          </>
        );
    }
  };

  return (
    <Layout 
      onHomeClick={() => navigateTo('home')} 
      onFeaturesClick={() => navigateTo('features')}
      onPrivacyClick={() => navigateTo('privacy')}
      onTermsClick={() => navigateTo('terms')}
      onCookiesClick={() => navigateTo('cookies')}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
