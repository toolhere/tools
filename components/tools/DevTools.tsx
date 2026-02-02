
import React, { useState } from 'react';
import { devTask } from '../../services/geminiService';
import { DevOutput } from '../../types';

const DevTools: React.FC = () => {
  const [lang, setLang] = useState('TypeScript');
  const [task, setTask] = useState('');
  const [codeContext, setCodeContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DevOutput | null>(null);

  const handleRun = async () => {
    if (!task) return;
    setLoading(true);
    try {
      const res = await devTask(lang, task, codeContext);
      setResult(res);
    } catch (e) {
      alert('Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Professional Code Writer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Language</label>
            <select 
              value={lang} 
              onChange={e => setLang(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
            >
              <option>TypeScript</option>
              <option>Python</option>
              <option>JavaScript</option>
              <option>Go</option>
              <option>Rust</option>
              <option>C#</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Task Description</label>
            <input 
              type="text"
              value={task}
              onChange={e => setTask(e.target.value)}
              placeholder="e.g. Write a custom React hook for debouncing"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <label className="block text-sm font-semibold text-slate-700 mb-2">Code Context (Optional)</label>
        <textarea
          value={codeContext}
          onChange={e => setCodeContext(e.target.value)}
          placeholder="Paste existing code here if fixing/optimizing..."
          className="w-full h-40 p-4 bg-slate-900 text-slate-100 font-mono text-sm rounded-xl outline-none mb-6 resize-none"
        />

        <button
          onClick={handleRun}
          disabled={loading || !task}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
            loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black shadow-lg'
          }`}
        >
          {loading ? 'Generating Code...' : 'Write Code'}
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
              <span className="text-sm font-mono text-slate-400">{lang}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(result.code)}
                className="text-xs font-bold text-slate-400 hover:text-white"
              >
                Copy Code
              </button>
            </div>
            <pre className="p-6 overflow-x-auto text-sm font-mono text-emerald-400">
              <code>{result.code}</code>
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <h3 className="font-bold text-lg mb-4">Explanation</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{result.explanation}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <h3 className="font-bold text-lg mb-4">Best Practices</h3>
              <ul className="space-y-2">
                {result.bestPractices.map((bp, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start space-x-2">
                    <span className="text-indigo-500">•</span>
                    <span>{bp}</span>
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

export default DevTools;
