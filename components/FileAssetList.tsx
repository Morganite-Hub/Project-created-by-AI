import React, { useRef } from 'react';
import { FileAsset } from '../types';
import { Trash2, FileText, Upload } from 'lucide-react';
import { Button } from './Button';

interface FileAssetListProps {
  assets: FileAsset[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
}

export const FileAssetList: React.FC<FileAssetListProps> = ({ assets, onAddFiles, onRemoveFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-800/50 border-r border-slate-700">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-slate-100 font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          File Pool
        </h2>
        <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-1 rounded">
          {assets.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {assets.length === 0 && (
          <div className="text-center text-slate-500 py-10 text-sm">
            <p className="mb-2">No files loaded.</p>
            <p>Upload PDFs to start creating tasks.</p>
          </div>
        )}
        {assets.map((asset) => (
          <div key={asset.id} className="group flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                <span className="text-xs font-bold">PDF</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm text-slate-200 truncate font-medium">{asset.name}</span>
                <span className="text-xs text-slate-500">{(asset.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
            <button 
              onClick={() => onRemoveFile(asset.id)}
              className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-700">
        <input 
          type="file" 
          multiple 
          accept="application/pdf" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <Button 
          variant="primary" 
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Add PDFs
        </Button>
      </div>
    </div>
  );
};
