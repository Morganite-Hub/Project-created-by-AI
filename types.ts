export interface FileAsset {
  id: string;
  file: File;
  name: string;
  size: number;
}

export enum InsertionPosition {
  BEGINNING = 'BEGINNING',
  END = 'END',
  AFTER_PAGE = 'AFTER_PAGE'
}

export interface PDFTask {
  id: string;
  targetFileId: string;
  sourceFileIds: string[];
  position: InsertionPosition;
  pageIndex?: number; // 1-based index for user friendliness in UI, converted to 0-based for logic
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  errorMessage?: string;
  outputBlob?: Blob;
  outputFileName?: string;
}

export interface AIPlanResponse {
  tasks: {
    targetFileName: string;
    sourceFileNames: string[];
    position: 'BEGINNING' | 'END' | 'AFTER_PAGE';
    pageNumber?: number;
  }[];
}
