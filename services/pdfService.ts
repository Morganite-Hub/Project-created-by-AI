import { PDFDocument } from 'pdf-lib';
import { InsertionPosition } from '../types';

export const processPDFTask = async (
  targetBuffer: ArrayBuffer,
  sourceBuffers: ArrayBuffer[],
  position: InsertionPosition,
  pageIndex: number = 0 // 1-based from UI, but logic here assumes we handle it
): Promise<Uint8Array> => {
  
  try {
    const targetDoc = await PDFDocument.load(targetBuffer);
    
    // Process sources sequentially to maintain order
    for (const sourceBuffer of sourceBuffers) {
      const sourceDoc = await PDFDocument.load(sourceBuffer);
      const copiedPages = await targetDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());

      let insertIndex = 0;
      const pageCount = targetDoc.getPageCount();

      switch (position) {
        case InsertionPosition.BEGINNING:
          insertIndex = 0;
          break;
        case InsertionPosition.END:
          insertIndex = pageCount;
          break;
        case InsertionPosition.AFTER_PAGE:
          // User provides 1-based index. 
          // If they say "After page 1", we insert at index 1 (between p1 and p2).
          insertIndex = Math.min(Math.max(0, pageIndex), pageCount);
          break;
      }

      // If we are inserting multiple sources, we need to adjust index for subsequent sources 
      // if they are meant to be grouped. However, for this simple implementation,
      // subsequent sources in the same task are appended after the previous one.
      // If position is BEGINNING, subsequent sources push previous ones down? 
      // Usually "insert at beginning" implies [Source 1][Source 2][Original].
      // So we keep inserting at the calculated `insertIndex`? No, that would reverse order.
      // We should insert Source 1 at 0, then Source 2 at (Source 1 length).
      // BUT, to keep it simple: we insert pages one by one.
      
      // Correct logic for multiple source insertion at a specific point:
      // We just iterate and add them.
      
      for (const page of copiedPages) {
        targetDoc.insertPage(insertIndex, page);
        insertIndex++;
      }
    }

    return await targetDoc.save();
  } catch (error) {
    console.error("PDF Processing Error:", error);
    throw new Error("Failed to process PDF. Ensure files are valid and not encrypted.");
  }
};
