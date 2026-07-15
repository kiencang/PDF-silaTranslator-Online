import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface PdfCropResult {
  fileBase64: string;
  croppedFile: File;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  async hashFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async extractImagesFromPDF(file: File, pdfHash: string): Promise<{ id: string, dataUrl: string }[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: { id: string, dataUrl: string }[] = [];
    let imgCount = 0;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) continue;

      const originalDrawImage = ctx.drawImage;
      const originalPutImageData = ctx.putImageData;
      
      const extractAndSave = (source: HTMLImageElement | HTMLCanvasElement | ImageBitmap) => {
        let w = source.width;
        let h = source.height;
        if (w < 100 || h < 100) return;

        let scale = 1;
        if (w > 1024) {
          scale = 1024 / w;
          w = 1024;
          h = Math.round(h * scale);
        }
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(source as any, 0, 0, w, h);
          const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
          images.push({ id: `${pdfHash}_img_${imgCount++}`, dataUrl });
        }
      };

      ctx.drawImage = function(...args: any[]) {
        const imgSource = args[0];
        try {
          if (imgSource instanceof HTMLImageElement || imgSource instanceof HTMLCanvasElement || imgSource instanceof ImageBitmap) {
            extractAndSave(imgSource);
          }
        } catch(e) {}
        // @ts-ignore
        return originalDrawImage.apply(this, args);
      };

      ctx.putImageData = function(...args: any[]) {
        const imgData = args[0];
        try {
          if (imgData instanceof ImageData) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imgData.width;
            tempCanvas.height = imgData.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx?.putImageData(imgData, 0, 0);
            extractAndSave(tempCanvas);
          }
        } catch(e) {}
        // @ts-ignore
        return originalPutImageData.apply(this, args);
      };

      try {
        await page.render({ canvasContext: ctx, viewport: viewport } as any).promise;
      } catch (err) {
        console.warn(`Error rendering page ${pageNum} for image extraction:`, err);
      }
    }
    
    return images;
  }

  async getPageCount(file: File): Promise<number> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
  }

  async cropPdf(file: File, start: number, end: number, totalPages: number): Promise<PdfCropResult> {
    if (start > end) {
      throw new Error('Trang bắt đầu không được lớn hơn trang kết thúc.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const originalPdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const pageIndices = [];
    for (let i = start - 1; i < Math.min(end, totalPages); i++) {
      pageIndices.push(i);
    }

    const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
    copiedPages.forEach(page => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    const croppedBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const croppedFileObj = new File([croppedBlob], file.name, { type: 'application/pdf' });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve({
          fileBase64: base64String,
          croppedFile: croppedFileObj
        });
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc file cắt.'));
      reader.readAsDataURL(croppedFileObj);
    });
  }
}
