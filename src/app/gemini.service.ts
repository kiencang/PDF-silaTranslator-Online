import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  async countTokens(fileData: string, mimeType: string): Promise<number> {
    const response = await fetch('/api/count-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileData, mimeType })
    });
    
    if (!response.ok) {
      return 0; // fallback
    }
    const data = await response.json();
    return data.tokens || 0;
  }

  async translate(
    fileData: string,
    mimeType: string,
    prompt: string,
    systemInstruction: string,
    temperature: number,
    useGoogleSearch = false
  ): Promise<string> {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileData,
        mimeType,
        prompt,
        systemInstruction,
        temperature,
        useGoogleSearch
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Server error during translation calls');
    }
    return data.text;
  }

  async translateHtml(
    htmlContent: string,
    prompt: string,
    systemInstruction: string,
    temperature: number,
    useGoogleSearch = false
  ): Promise<string> {
    const response = await fetch('/api/translate-html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        htmlContent,
        prompt,
        systemInstruction,
        temperature,
        useGoogleSearch
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Server error during HTML translation');
    }
    return data.text;
  }

  async translateSearchQuery(query: string): Promise<string> {
    const response = await fetch('/api/translate-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Server error during search translation');
    }
    return data.text;
  }
}
