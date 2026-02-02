
import React, { useState, useEffect, useMemo } from 'react';
import { TOOLS } from '../constants';
import { ToolCategory, Tool } from '../types';
import Modal from './Modal';

interface ToolGridProps {
  onActivateTool: (id: string) => void;
}

const SkeletonCard = () => (
  <div className="p-8 bg-white border border-slate-200 rounded-3xl space-y-4">
    <div className="w-14 h-14 rounded-2xl shimmer"></div>
    <div className="w-3/4 h-8 rounded-xl shimmer"></div>
    <div className="space-y-3">
      <div className="w-full h-4 rounded-lg shimmer"></div>
      <div className="w-5/6 h-4 rounded-lg shimmer"></div>
    </div>
    <div className="w-24 h-5 rounded-lg shimmer mt-6"></div>
  </div>
);

const ToolCard = React.memo(({ tool, onPreview }: { tool: Tool; onPreview: (id: string) => void }) => (
  <button
    onClick={() => onPreview(tool.id)}
    className="group p-8 bg-white border border-slate-200 rounded-3xl text-left transition-all duration-500 ease-out hover:shadow-[0_20px_60px_-15px_rgba(79,70,229,0.1)] hover:-translate-y-2 hover:border-indigo-500/30 animate-in fade-in zoom-in-95"
  >
    <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-500 ease-out">
      {tool.icon}
    </div>
    <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors tracking-tight">
      {tool.name}
    </h3>
    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">
      {tool.description}
    </p>
    <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 transition-all transform translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100">
      Launch Tool
      <svg className="w-3.5 h-3.5 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
));

const ToolGrid: React.FC<ToolGridProps> = ({ onActivateTool }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [previewToolId, setPreviewToolId] = useState<string | null>(null);
  
  const categories = useMemo(() => Object.values(ToolCategory), []);
  const previewTool = useMemo(() => TOOLS.find(t => t.id === previewToolId), [previewToolId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleActivate = () => {
    if (previewToolId) {
      onActivateTool(previewToolId);
      setPreviewToolId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-20">
        {categories.map((category) => (
          <section key={category}>
            <div className="flex items-center space-x-6 mb-10">
              <div className="w-56 h-10 rounded-2xl shimmer"></div>
              <div className="h-px flex-grow bg-slate-200/60"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-20">
      {categories.map((category) => {
        const filteredTools = TOOLS.filter(t => t.category === category);
        if (filteredTools.length === 0) return null;

        return (
          <section key={category} className="animate-in fade-in duration-1000 slide-in-from-bottom-4">
            <div className="flex items-center space-x-6 mb-10">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{category}</h2>
              <div className="h-px flex-grow bg-slate-200/60"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredTools.map((tool) => (
                <ToolCard 
                  key={tool.id} 
                  tool={tool} 
                  onPreview={setPreviewToolId} 
                />
              ))}
            </div>
          </section>
        );
      })}

      <Modal isOpen={!!previewToolId} onClose={() => setPreviewToolId(null)}>
        {previewTool && (
          <div className="text-center p-2">
            <div className="text-7xl mb-8 transform hover:scale-110 transition-transform duration-500 inline-block drop-shadow-xl">
              {previewTool.icon}
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter leading-none">{previewTool.name}</h2>
            <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-indigo-100/50">
              {previewTool.category}
            </div>
            <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10 px-4">
              {previewTool.description}
            </p>
            <div className="flex flex-col space-y-4">
              <button
                onClick={handleActivate}
                className="w-full bg-slate-900 text-white py-5 rounded-3xl text-xl font-black hover:bg-black shadow-2xl shadow-slate-200 transition-all active:scale-[0.98]"
              >
                Launch Utility
              </button>
              <button
                onClick={() => setPreviewToolId(null)}
                className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-all"
              >
                Dismiss
              </button>
            </div>
            <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center space-x-6 text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">
              <span className="flex items-center">
                <svg className="w-3.5 h-3.5 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Secure Environment
              </span>
              <span className="flex items-center">
                <svg className="w-3.5 h-3.5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Zero Data Storage
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ToolGrid;
