import { Injectable } from '@angular/core';

export interface ExtractedImage {
  id: string;
  dataUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageProcessorService {
  extractImagesFromHtml(html: string): { cleanHtml: string; extractedImages: ExtractedImage[] } {
    const extractedImages: ExtractedImage[] = [];
    
    const regex = /(?:src|href|data)=(['"])(data:image\/.*?)\1|url\((['"]?)(data:image\/.*?)\3\)/gi;
    
    const cleanHtml = html.replace(regex, (match, q1, g1, q2, g2) => {
      const dataUrl = g1 || g2;
      const id = `img_placeholder_${crypto.randomUUID()}`;
      extractedImages.push({ id, dataUrl });
      return match.replace(dataUrl, id);
    });

    return { cleanHtml, extractedImages };
  }

  extractHtml(text: string): string {
    const match = text.match(/```[a-zA-Z]*\s*([\s\S]*?)\s*```/);
    return match ? match[1] : text;
  }

  postProcessHtml(html: string, extractedImages: ExtractedImage[]): string {
    if (!extractedImages || extractedImages.length === 0) return html;
    
    let processedHtml = html;
    for (const img of extractedImages) {
      const escapedId = img.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const srcRegex = new RegExp(`src=["']\\[?${escapedId}\\]?["']`, 'g');
      processedHtml = processedHtml.replace(srcRegex, `src="${img.dataUrl}"`);
      
      const fallbackRegex = new RegExp(`\\[IMAGE:\\s*${escapedId}\\]`, 'g');
      processedHtml = processedHtml.replace(fallbackRegex, `<img src="${img.dataUrl}" style="max-width: 100%; height: auto;">`);
    }
    return processedHtml;
  }
}
