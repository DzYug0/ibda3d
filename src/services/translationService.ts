
/**
 * Translation service using MyMemory API.
 * 
 * Note: MyMemory API has a free tier usage limit (approx 5000 chars/day).
 * For production usage, consider using a paid API like Google Translate or DeepL.
 * 
 * API: https://mymemory.translated.net/doc/spec.php
 */
export async function translateToArabic(text: string): Promise<string> {
    if (!text) return '';

    try {
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`
        );

        if (!response.ok) {
            throw new Error('Translation API request failed');
        }

        const data = await response.json();

        // MyMemory API returns structure: { responseData: { translatedText: "..." }, ... }
        if (data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        }

        throw new Error('Invalid response format');
    } catch (error) {
        console.error('Translation failed:', error);
        // Fallback to original text if translation fails
        return text;
    }
}
