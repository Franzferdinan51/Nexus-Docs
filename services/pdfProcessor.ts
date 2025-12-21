import { recognizeText } from './ocrService';

declare const pdfjsLib: any;

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export async function processPdf(file: File | Blob): Promise<{ text: string; images: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  const images: string[] = [];

  for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) { // Limit 10 for performance with OCR
    const page = await pdf.getPage(i);

    // Render Page for Visuals & OCR
    const viewport = page.getViewport({ scale: 1.5 }); // Higher scale for better OCR
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport: viewport }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    images.push(dataUrl.split(',')[1]);

    // Attempt Text Extraction
    const textContent = await page.getTextContent();
    let pageText = textContent.items.map((item: any) => item.str).join(' ');

    // Fallback to OCR if text is empty (Scanned PDF)
    if (pageText.trim().length < 20) {
      console.log(`[Page ${i}] No text layer found. Attempting OCR...`);
      pageText = await recognizeText(dataUrl);
    }

    fullText += `[Page ${i}]\n${pageText}\n\n`;
  }

  return { text: fullText, images };
}
