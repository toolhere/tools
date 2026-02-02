
import React, { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onHomeClick: () => void;
  onFeaturesClick: () => void;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
  onCookiesClick: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onHomeClick, 
  onFeaturesClick, 
  onPrivacyClick, 
  onTermsClick, 
  onCookiesClick 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={() => { onHomeClick(); setMobileMenuOpen(false); }}
            className="flex items-center space-x-2.5 transition-all hover:opacity-80 active:scale-95"
          >
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white font-black">N</span>
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">Noobu Tools</span>
          </button>
          
          <nav className="hidden md:flex items-center space-x-8 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
            <button onClick={onHomeClick} className="hover:text-indigo-600 transition-colors">Documents</button>
            <button onClick={onHomeClick} className="hover:text-indigo-600 transition-colors">Images</button>
            <button onClick={onFeaturesClick} className="hover:text-indigo-600 transition-colors">Features</button>
            <button onClick={onPrivacyClick} className="hover:text-indigo-600 transition-colors">Privacy</button>
          </nav>

          <div className="flex items-center space-x-4">
             <button 
              onClick={() => { onHomeClick(); document.getElementById('tool-grid')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200"
            >
              Start Creating
            </button>
            
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 animate-in slide-in-from-top-4 duration-300">
            <div className="px-4 py-8 space-y-6 flex flex-col items-center">
              <button onClick={() => { onHomeClick(); setMobileMenuOpen(false); }} className="text-sm font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600">All Tools</button>
              <button onClick={() => { onFeaturesClick(); setMobileMenuOpen(false); }} className="text-sm font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600">Features</button>
              <button onClick={() => { onPrivacyClick(); setMobileMenuOpen(false); }} className="text-sm font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600">Privacy</button>
              <button onClick={() => { onTermsClick(); setMobileMenuOpen(false); }} className="text-sm font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600">Terms</button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-6 opacity-40 grayscale">
                <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">N</span>
                </div>
                <span className="text-sm font-black text-slate-900">Noobu</span>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                The world's most accessible professional tool suite. Secure, private, and powerful processing right in your browser.
              </p>
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Product</h3>
              <ul className="space-y-4 text-xs font-bold text-slate-600">
                <li><button onClick={onHomeClick} className="hover:text-indigo-600 transition-colors">All Tools</button></li>
                <li><button onClick={onFeaturesClick} className="hover:text-indigo-600 transition-colors">Features</button></li>
                <li><button onClick={onHomeClick} className="hover:text-indigo-600 transition-colors">Resume AI</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Legal</h3>
              <ul className="space-y-4 text-xs font-bold text-slate-600">
                <li><button onClick={onPrivacyClick} className="hover:text-indigo-600 transition-colors">Privacy Policy</button></li>
                <li><button onClick={onTermsClick} className="hover:text-indigo-600 transition-colors">Terms of Service</button></li>
                <li><button onClick={onCookiesClick} className="hover:text-indigo-600 transition-colors">Cookie Policy</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Stay Updated</h3>
              <p className="text-xs text-slate-500 font-medium mb-6">Join our monthly brief on new tools.</p>
              <div className="flex space-x-2">
                <input type="email" placeholder="Email" className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs w-full outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all">Join</button>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] space-y-4 md:space-y-0">
            <div>© {new Date().getFullYear()} Noobu Tools Suite</div>
            <div className="flex items-center space-x-6">
              <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span> System Online</span>
              <span>Built for Students & Creators</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
