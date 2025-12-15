import React, { useState } from 'react';
import { generateBatchPlan } from '../services/geminiService';
import { FileAsset, InsertionPosition } from '../types';
import { Sparkles, MessageSquare } from 'lucide-react';
import { Button } from './Button';

interface AIBatchPlannerProps {
  assets: FileAsset[];
  onAddTasks: (tasks: any[]) => void;
}

export const AIBatchPlanner: React.FC<AIBatchPlannerProps> = ({ assets, onAddTasks }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (assets.length === 0) {
      setError("Please upload files to the pool first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fileNames = assets.map(a => a.name);
      const plan = await generateBatchPlan(fileNames, prompt);

      // Convert plan back to internal IDs
      const newTasks = plan.tasks.map(t => {
        const targetAsset = assets.find(a => a.name === t.targetFileName);
        // If exact match fails, try generic match or skip. 
        // For robustness, we filter out invalid ones later.
        
        const sourceAssets = t.sourceFileNames.map(name => assets.find(a => a.name === name)).filter(Boolean) as FileAsset[];
        
        if (!targetAsset || sourceAssets.length === 0) return null;

        return {
          id: crypto.randomUUID(),
          targetFileId: targetAsset.id,
          sourceFileIds: sourceAssets.map(s => s.id),
          position: t.position as InsertionPosition,
          pageIndex: t.pageNumber || 1,
          status: 'PENDING'
        };
      }).filter(Boolean);

      if (newTasks.length === 0) {
        setError("AI understood the request but could not map files correctly. Ensure filenames match exactly.");
      } else {
        onAddTasks(newTasks);
        setPrompt('');
      }

    } catch (err) {
      setError("Failed to generate plan. Please try again or check your API Key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl">
      <div className="flex items-center gap-2 mb-3 text-purple-400">
        <Sparkles className="w-5 h-5" />
        <h3 className="font-semibold text-white">AI Batch Planner</h3>
      </div>
      
      <p className="text-xs text-slate-400 mb-3">
        Describe your batch operation. Example: <br/>
        <span className="italic text-slate-500">"Insert disclaimer.pdf at the end of all files starting with 'Report'"</span>
      </p>

      <textarea
        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none h-24 mb-3"
        placeholder="Tell Gemini how to organize your PDFs..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={loading}
      />

      {error && (
        <div className="mb-3 text-xs text-red-400 bg-red-900/10 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleGenerate} 
          loading={loading}
          className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Tasks
        </Button>
      </div>
    </div>
  );
};
