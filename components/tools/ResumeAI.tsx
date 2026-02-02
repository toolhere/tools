
import React, { useState } from 'react';
import { analyzeResume } from '../../services/geminiService';
import { ResumeAnalysisResult } from '../../types';

const ResumeAI: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await analyzeResume(text);
      setResult(res);
    } catch (error) {
      console.error(error);
      alert('Analysis failed. Please check your text and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Resume Analyzer</h2>
        <p className="text-slate-600 mb-6">Paste your resume text below for a comprehensive ATS and professional analysis.</p>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your resume content here..."
          className="w-full h-64 p-4 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors mb-6 resize-none font-mono text-sm"
        />

        <button
          onClick={handleAnalyze}
          disabled={loading || !text}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
            loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
          }`}
        >
          {loading ? 'Analyzing with Gemini...' : 'Analyze Resume'}
        </button>
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Score</span>
              <div className="text-5xl font-black text-indigo-600 mt-2">{result.score}/100</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 md:col-span-2">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">ATS Compatibility</span>
              <p className="text-lg font-medium text-slate-900 mt-2">{result.atsCompatibility}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <h3 className="font-bold text-lg mb-4 text-slate-900">Key Feedback</h3>
              <ul className="space-y-3">
                {result.feedback.map((item, i) => (
                  <li key={i} className="flex items-start space-x-3 text-slate-600 text-sm">
                    <span className="text-indigo-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <h3 className="font-bold text-lg mb-4 text-slate-900">Missing Sections</h3>
              <ul className="space-y-3">
                {result.missingSections.map((item, i) => (
                  <li key={i} className="flex items-start space-x-3 text-rose-500 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAI;
