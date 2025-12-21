import Tesseract from 'tesseract.js';

export async function recognizeText(imageSource: string | Blob): Promise<string> {
    try {
        const result = await Tesseract.recognize(
            imageSource,
            'eng',
            {
                logger: m => console.log(`[OCR] ${m.status}: ${Math.round(m.progress * 100)}%`)
            }
        );
        return result.data.text;
    } catch (error) {
        console.error("OCR Failed:", error);
        return "";
    }
}
