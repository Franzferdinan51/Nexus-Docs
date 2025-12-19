
declare const pdfjsLib: any;

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export async function processPdf(file: File | Blob): Promise<{ text: string; images: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  const images: string[] = [];

  for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) { // Limit to first 20 pages for performance
    const page = await pdf.getPage(i);
    
    // Extract Text
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';

    // Extract first image of each page if it exists (sample approach)
    // In a production app, we'd iterate over operators to find actual images
    // For now, let's render the page to a small canvas as a visual reference for the AI
    const viewport = page.getViewport({ scale: 1.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    images.push(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]); // Base64 part only
  }

  return { text: fullText, images };
}
