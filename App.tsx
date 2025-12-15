import React, { useState, useCallback } from 'react';
import { FileAsset, PDFTask, InsertionPosition } from './types';
import { FileAssetList } from './components/FileAssetList';
import { TaskList } from './components/TaskList';
import { AIBatchPlanner } from './components/AIBatchPlanner';
import { Button } from './components/Button';
import { processPDFTask } from './services/pdfService';
import { Plus, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [assets, setAssets] = useState<FileAsset[]>([]);
  const [tasks, setTasks] = useState<PDFTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // Manual Form State
  const [manualTarget, setManualTarget] = useState<string>('');
  const [manualSources, setManualSources] = useState<string[]>([]);
  const [manualPosition, setManualPosition] = useState<InsertionPosition>(InsertionPosition.BEGINNING);
  const [manualPage, setManualPage] = useState<number>(1);

  const handleAddFiles = useCallback((files: File[]) => {
    const newAssets = files.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      size: f.size
    }));
    setAssets(prev => [...prev, ...newAssets]);
  }, []);

  const handleRemoveAsset = useCallback((id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    // Also remove tasks referencing this asset to avoid errors
    setTasks(prev => prev.filter(t => t.targetFileId !== id && !t.sourceFileIds.includes(id)));
  }, []);

  const handleAddTasks = useCallback((newTasks: PDFTask[]) => {
    setTasks(prev => [...prev, ...newTasks]);
  }, []);

  const handleRemoveTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const executeTask = async (taskId: string) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    
    // Update status to processing
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'PROCESSING', errorMessage: undefined } : t));

    try {
      const targetAsset = assets.find(a => a.id === task.targetFileId);
      const sourceAssets = task.sourceFileIds.map(id => assets.find(a => a.id === id)).filter(Boolean) as FileAsset[];

      if (!targetAsset) throw new Error("Target file missing");
      if (sourceAssets.length !== task.sourceFileIds.length) throw new Error("Some source files missing");

      const targetBuffer = await targetAsset.file.arrayBuffer();
      const sourceBuffers = await Promise.all(sourceAssets.map(a => a.file.arrayBuffer()));

      const outputPdfBytes = await processPDFTask(targetBuffer, sourceBuffers, task.position, task.pageIndex);
      const blob = new Blob([outputPdfBytes], { type: 'application/pdf' });

      setTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        status: 'COMPLETED',
        outputBlob: blob,
        outputFileName: `merged_${targetAsset.name}`
      } : t));

    } catch (error: any) {
      setTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        status: 'ERROR',
        errorMessage: error.message || "Unknown error"
      } : t));
    }
  };

  const runAllTasks = async () => {
    setIsProcessing(true);
    const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'ERROR');
    
    // Parallel Execution using Promise.all
    // Note: In a browser, heavy PDF ops might freeze UI if done strictly in parallel on main thread.
    // For this demo, we assume the operations are fast enough or the browser handles async well.
    // A production app would use Web Workers.
    await Promise.all(pendingTasks.map(t => executeTask(t.id)));
    
    setIsProcessing(false);
  };

  // Manual Add Logic
  const handleManualAdd = () => {
    if (!manualTarget || manualSources.length === 0) return;
    
    const newTask: PDFTask = {
      id: crypto.randomUUID(),
      targetFileId: manualTarget,
      sourceFileIds: manualSources,
      position: manualPosition,
      pageIndex: manualPage,
      status: 'PENDING'
    };
    
    setTasks(prev => [...prev, newTask]);
    setShowManualForm(false);
    setManualTarget('');
    setManualSources([]);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      
      {/* Sidebar: File Pool */}
      <div className="w-80 h-full shrink-0">
        <FileAssetList 
          assets={assets} 
          onAddFiles={handleAddFiles} 
          onRemoveFile={handleRemoveAsset} 
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Main Workspace */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <TaskList 
            tasks={tasks} 
            assets={assets} 
            onRemoveTask={handleRemoveTask}
            onRunTask={(id) => { setIsProcessing(true); executeTask(id).then(() => setIsProcessing(false)); }}
            onRunAll={runAllTasks}
            isProcessing={isProcessing}
          />

          {/* Floating Action Button for Manual Add */}
          <div className="absolute bottom-6 right-6 flex gap-4">
             {/* We put the manual form in a modal or overlay for simplicity in this structure */}
          </div>
        </div>

        {/* Bottom / Side Panel for Controls */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Manual Task Creator */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-semibold text-white flex items-center gap-2">
                 <Settings className="w-4 h-4 text-blue-400"/>
                 Manual Task Builder
               </h3>
             </div>
             
             <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs text-slate-400 block mb-1">Target PDF</label>
                     <select 
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm"
                        value={manualTarget}
                        onChange={(e) => setManualTarget(e.target.value)}
                      >
                        <option value="">Select Target...</option>
                        {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-xs text-slate-400 block mb-1">Source PDF</label>
                     <select 
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm"
                        value={manualSources[0] || ''}
                        onChange={(e) => setManualSources([e.target.value])}
                      >
                        <option value="">Select Source...</option>
                        {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                     </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Position</label>
                    <select 
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm"
                      value={manualPosition}
                      onChange={(e) => setManualPosition(e.target.value as InsertionPosition)}
                    >
                      <option value={InsertionPosition.BEGINNING}>At Beginning</option>
                      <option value={InsertionPosition.END}>At End</option>
                      <option value={InsertionPosition.AFTER_PAGE}>After Page...</option>
                    </select>
                  </div>
                  {manualPosition === InsertionPosition.AFTER_PAGE && (
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Page Number</label>
                      <input 
                        type="number" 
                        min="1"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm"
                        value={manualPage}
                        onChange={(e) => setManualPage(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  )}
                  {manualPosition !== InsertionPosition.AFTER_PAGE && (
                    <div className="flex items-end">
                       {/* Spacer */}
                    </div>
                  )}
                </div>

                <Button variant="secondary" className="w-full" onClick={handleManualAdd} disabled={!manualTarget || manualSources.length === 0}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Queue
                </Button>
             </div>
          </div>

          {/* AI Planner */}
          <AIBatchPlanner assets={assets} onAddTasks={handleAddTasks} />

        </div>
      </div>
    </div>
  );
};

export default App;