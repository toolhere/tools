
import React, { useState } from 'react';
import { generateHashtags, HashtagGroup } from '../../services/geminiService';

const HashtagGen: React.FC = () => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<HashtagGroup[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const res = await generateHashtags(description);
      setGroups(res);
    } catch (error) {
      console.error(error);
      alert('Failed to generate hashtags.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number | 'all') => {
    navigator.clipboard.writeText(text);
    if (index === 'all') {
       // set an arbitrary state or toast
    } else {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const copyAll = () => {
    const allTags = groups.flatMap(g => g.tags).join(' ');
    copyToClipboard(allTags, 'all');
    alert('All hashtags copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-2">Smart Hashtag Generator</h2>
        <p className="text-slate-600 mb-8">Get categorized hashtags based on reach and competition levels.</p>

        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Describe your post or niche</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. A photo of a healthy avocado toast with a coffee in a minimalist kitchen..."
          className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors mb-6 resize-none"
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !description}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center space-x-2 ${
            loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100'
          }`}
        >
          {loading ? 'Analyzing Content...' : 'Generate Hashtags'}
        </button>
      </div>

      {groups.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Optimized Results</h3>
             <button 
                onClick={copyAll}
                className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors border border-indigo-100"
              >
                Copy All Tags
              </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {groups.map((group, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{group.category}</h4>
                  <button 
                    onClick={() => copyToClipboard(group.tags.join(' '), i)}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                  >
                    {copiedIndex === i ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4 flex-grow">
                  {group.tags.map((tag, j) => (
                    <span key={j} className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg">
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HashtagGen;
