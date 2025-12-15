import React from 'react';
import { PDFTask, FileAsset, InsertionPosition } from '../types';
import { Play, Download, Trash2, CheckCircle, AlertCircle, Clock, FilePlus } from 'lucide-react';
import { Button } from './Button';

interface TaskListProps {
  tasks: PDFTask[];
  assets: FileAsset[];
  onRemoveTask: (id: string) => void;
  onRunTask: (id: string) => void;
  onRunAll: () => void;
  isProcessing: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  assets, 
  onRemoveTask, 
  onRunTask, 
  onRunAll,
  isProcessing 
}) => {
  const getAssetName = (id: string) => assets.find(a => a.id === id)?.name || "Unknown File";

  const getStatusIcon = (status: PDFTask['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'ERROR': return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'PROCESSING': return <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      default: return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleDownload = (task: PDFTask) => {
    if (!task.outputBlob) return;
    const url = URL.createObjectURL(task.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = task.outputFileName || `merged_${task.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Processing Queue</h1>
          <p className="text-slate-400 text-sm">Manage insertion tasks and execute in parallel.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="primary" 
            size="lg"
            onClick={onRunAll}
            disabled={tasks.filter(t => t.status === 'PENDING' || t.status === 'ERROR').length === 0 || isProcessing}
            className="shadow-lg shadow-blue-900/20"
          >
            <Play className="w-4 h-4 mr-2" />
            Run All Pending
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
            <FilePlus className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No tasks queued</p>
            <p className="text-sm">Use the form or AI assistant to add tasks.</p>
          </div>
        )}

        {tasks.map((task) => (
          <div key={task.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-sm hover:border-slate-600 transition-all">
            <div className="flex items-start justify-between gap-4">
              {/* Status Icon */}
              <div className="mt-1">{getStatusIcon(task.status)}</div>

              {/* Task Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">Target</span>
                  <span className="text-slate-200 font-medium truncate">{getAssetName(task.targetFileId)}</span>
                </div>
                
                <div className="text-sm text-slate-400 flex flex-col gap-1">
                   <div className="flex items-center gap-2">
                      <span className="bg-slate-700 px-1.5 py-0.5 rounded text-xs text-slate-300">Action</span>
                      <span>Insert <b>{task.sourceFileIds.length} file(s)</b> at <b>{task.position}</b> {task.position === InsertionPosition.AFTER_PAGE && `(Page ${task.pageIndex})`}</span>
                   </div>
                   <div className="flex flex-wrap gap-1 mt-1">
                      {task.sourceFileIds.map(sid => (
                        <span key={sid} className="bg-slate-700/50 border border-slate-700 px-2 py-0.5 rounded text-xs truncate max-w-[200px]">
                          + {getAssetName(sid)}
                        </span>
                      ))}
                   </div>
                </div>

                {task.errorMessage && (
                  <p className="text-red-400 text-xs mt-2 bg-red-900/20 p-2 rounded border border-red-900/30">
                    Error: {task.errorMessage}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                {task.status === 'COMPLETED' ? (
                  <Button size="sm" variant="ghost" onClick={() => handleDownload(task)} className="text-green-400 hover:text-green-300 hover:bg-green-900/20">
                    <Download className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onRunTask(task.id)} 
                    disabled={isProcessing || task.status === 'PROCESSING'}
                    title="Run Single Task"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onRemoveTask(task.id)}
                  disabled={task.status === 'PROCESSING'}
                  className="text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
