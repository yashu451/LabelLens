import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface NutrientItem {
  name: string;
  amount: string;
  dailyValue?: string;
}

export interface ExtractedLabelData {
  rawText: string;
  calories?: string;
  servingSize?: string;
  nutrients: NutrientItem[];
  ingredients: string[];
  rawIngredientsText?: string;
  allergens: string[];
  productTitleGuess?: string;
}

export interface DietaryCheckItem {
  preference: string;
  isCompliant: boolean;
  reason: string;
}

export interface LabelAnalysisResult {
  score: number;
  ratingLabel: 'Excellent' | 'Good' | 'Moderate' | 'Avoid';
  summary: string;
  highlights: string[];
  concerns: string[];
  dietaryMatches: DietaryCheckItem[];
}

export interface OcrExtractionResult {
  success: boolean;
  data?: ExtractedLabelData;
  analysis?: LabelAnalysisResult;
  errorMessage?: string;
  isBlurryOrUnreadable?: boolean;
}

// Public API key for OCR.space
// Allows setting a custom key in EXPO_PUBLIC_OCR_SPACE_API_KEY if desired
const OCR_SPACE_API_KEY =
  process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY || 'helloworld';

/**
 * Intelligent parser that extracts ingredients, nutrition facts, and allergens
 * from the raw OCR text of a food package label.
 */
export function parseFoodLabel(rawText: string): ExtractedLabelData {
  const cleanText = (rawText || '').trim();

  // 1. Calories extraction
  const calRegex = /(?:calories|energy)\s*[:\s]?\s*([0-9]{1,4})(?!\s*%)/i;
  const calMatch = cleanText.match(calRegex);
  const calories = calMatch ? calMatch[1] : undefined;

  // 2. Serving size extraction
  const servRegex = /serving\s+size\s*[:\s]?\s*([^\n\r]+)/i;
  const servMatch = cleanText.match(servRegex);
  const servingSize = servMatch ? servMatch[1].trim() : undefined;

  // 3. Nutrition Facts extraction
  const nutrientRules: Array<{ name: string; regex: RegExp }> = [
    { name: 'Total Fat', regex: /total\s+fat\s*[:\s]?\s*([0-9.]+\s*g)(?:[^\n0-9]*([0-9]{1,3})%)?/i },
    { name: 'Saturated Fat', regex: /saturated\s+fat\s*[:\s]?\s*([0-9.]+\s*g)(?:[^\n0-9]*([0-9]{1,3})%)?/i },
    { name: 'Trans Fat', regex: /trans\s+fat\s*[:\s]?\s*([0-9.]+\s*g)/i },
    { name: 'Cholesterol', regex: /cholesterol\s*[:\s]?\s*([0-9.]+\s*mg)(?:[^\n0-9]*([0-9]{1,3})%)?/i },
    { name: 'Sodium', regex: /sodium\s*[:\s]?\s*([0-9.]+\s*mg)(?:[^\n0-9]*([0-9]{1,3})%)?/i },
    { name: 'Total Carbohydrate', regex: /total\s+carb(?:ohydrate)?\s*[:\s]?\s*([0-9.]+\s*g)(?:[^\n0-9]*([0-9]{1,3})%)?/i },
    { name: 'Dietary Fiber', regex: /dietary\s+fiber\s*[:\s]?\s*([0-9.]+\s*g)(?:[^\n0-9]*([0-9]{1,3})%)?/i },
    { name: 'Total Sugars', regex: /(?:total\s+)?sugars\s*[:\s]?\s*([0-9.]+\s*g)/i },
    { name: 'Added Sugars', regex: /(?:includes\s+)?([0-9.]+\s*g)\s+added\s+sugars/i },
    { name: 'Protein', regex: /protein\s*[:\s]?\s*([0-9.]+\s*g)(?:[^\n0-9]*([0-9]{1,3})%)?/i },
    { name: 'Vitamin D', regex: /vitamin\s+d\s*[:\s]?\s*([0-9.]+\s*(?:mcg|iu|mg))(?:[^\n0-9]*([0-9]{1,3})%)?/i },
    { name: 'Calcium', regex: /calcium\s*[:\s]?\s*([0-9.]+\s*mg)(?:[^\n0-9]*([0-9]{1,3})%)?/i },
    { name: 'Iron', regex: /iron\s*[:\s]?\s*([0-9.]+\s*mg)(?:[^\n0-9]*([0-9]{1,3})%)?/i },
    { name: 'Potassium', regex: /potassium\s*[:\s]?\s*([0-9.]+\s*mg)(?:[^\n0-9]*([0-9]{1,3})%)?/i },
  ];

  const nutrients: NutrientItem[] = [];
  for (const rule of nutrientRules) {
    const match = cleanText.match(rule.regex);
    if (match) {
      nutrients.push({
        name: rule.name,
        amount: match[1].trim(),
        dailyValue: match[2] ? `${match[2]}%` : undefined,
      });
    }
  }

  // 4. Ingredients extraction
  let rawIngredientsText: string | undefined = undefined;
  const ingredients: string[] = [];

  const ingBlockRegex =
    /ingredients?\s*[:\s]\s*([\s\S]*?)(?=(?:(?:\r?\n|^)\s*(?:contains|allergens?|may contain)\s*:|distributed by|manufactured (?:by|for)|packed for|nutrition facts|\n\n|$))/i;
  const ingMatch = cleanText.match(ingBlockRegex);

  if (ingMatch && ingMatch[1]) {
    rawIngredientsText = ingMatch[1].replace(/[\r\n]+/g, ' ').trim();

    // Split ingredients on commas while preserving parentheses
    let current = '';
    let depth = 0;
    for (let i = 0; i < rawIngredientsText.length; i++) {
      const char = rawIngredientsText[i];
      if (char === '(' || char === '[') depth++;
      else if (char === ')' || char === ']') depth = Math.max(0, depth - 1);

      if (char === ',' && depth === 0) {
        const item = current.trim().replace(/\.$/, '');
        if (item.length > 1) ingredients.push(item);
        current = '';
      } else {
        current += char;
      }
    }
    const finalItem = current.trim().replace(/\.$/, '');
    if (finalItem.length > 1) ingredients.push(finalItem);
  }

  // 5. Allergens detection
  const allergens: string[] = [];
  const allergenBlockRegex =
    /(?:(?:\r?\n|^)\s*(?:contains|allergens?|may contain)\s*:\s*)([^\n\r]+)/gi;

  let aMatch: RegExpExecArray | null;
  while ((aMatch = allergenBlockRegex.exec(cleanText)) !== null) {
    const parts = aMatch[1].split(/,|\band\b|;/i);
    for (const part of parts) {
      const cleaned = part.trim().replace(/\.$/, '');
      if (cleaned.length > 1 && !allergens.some((a) => a.toLowerCase() === cleaned.toLowerCase())) {
        allergens.push(cleaned);
      }
    }
  }

  // Common allergen keywords fallback scan if not explicitly captured
  const knownAllergens = [
    'Milk',
    'Eggs',
    'Fish',
    'Shellfish',
    'Crustacean',
    'Tree Nuts',
    'Peanuts',
    'Wheat',
    'Soybeans',
    'Soy',
    'Sesame',
    'Gluten',
    'Oats',
    'Mustard',
    'Sulphites',
  ];

  for (const k of knownAllergens) {
    const reg = new RegExp(`\\b${k}\\b`, 'i');
    if (reg.test(cleanText) && !allergens.some((a) => a.toLowerCase().includes(k.toLowerCase()))) {
      allergens.push(k);
    }
  }

  // Product Title Guess (First prominent line before nutrition facts)
  const lines = cleanText.split(/[\r\n]+/).map((l) => l.trim()).filter((l) => l.length > 2);
  let productTitleGuess: string | undefined = undefined;
  if (lines.length > 0) {
    const candidate = lines[0];
    if (!/nutrition|facts|serving|calories|ingredient/i.test(candidate) && candidate.length < 50) {
      productTitleGuess = candidate;
    }
  }

  return {
    rawText: cleanText,
    calories,
    servingSize,
    nutrients,
    ingredients,
    rawIngredientsText,
    allergens,
    productTitleGuess,
  };
}

/**
 * Evaluates extracted food label against user dietary preferences
 * and calculates health score.
 */
export function evaluateHealthAndDiet(
  data: ExtractedLabelData,
  userPreferences: string[]
): LabelAnalysisResult {
  let score = 75; // Baseline healthy score
  const highlights: string[] = [];
  const concerns: string[] = [];
  const dietaryMatches: DietaryCheckItem[] = [];

  const textLower = (data.rawText || '').toLowerCase();
  const ingLower = (data.rawIngredientsText || '').toLowerCase();

  // 1. Nutritional scoring checks
  const fiber = data.nutrients.find((n) => n.name.toLowerCase().includes('fiber'));
  if (fiber) {
    const val = parseFloat(fiber.amount);
    if (!isNaN(val) && val >= 3) {
      score += 8;
      highlights.push(`High in Dietary Fiber (${fiber.amount})`);
    }
  }

  const protein = data.nutrients.find((n) => n.name.toLowerCase().includes('protein'));
  if (protein) {
    const val = parseFloat(protein.amount);
    if (!isNaN(val) && val >= 5) {
      score += 6;
      highlights.push(`Good Source of Protein (${protein.amount})`);
    }
  }

  const transFat = data.nutrients.find((n) => n.name.toLowerCase().includes('trans fat'));
  if (transFat && /0\s*g/i.test(transFat.amount)) {
    highlights.push('Zero Trans Fat');
  } else if (transFat && parseFloat(transFat.amount) > 0) {
    score -= 15;
    concerns.push(`Contains Trans Fat (${transFat.amount})`);
  }

  const sodium = data.nutrients.find((n) => n.name.toLowerCase().includes('sodium'));
  if (sodium) {
    const val = parseFloat(sodium.amount);
    if (!isNaN(val)) {
      if (val > 400) {
        score -= 10;
        concerns.push(`High Sodium (${sodium.amount})`);
      } else if (val < 140) {
        highlights.push(`Low Sodium (${sodium.amount})`);
      }
    }
  }

  const sugars = data.nutrients.find((n) => n.name.toLowerCase().includes('sugars'));
  if (sugars) {
    const val = parseFloat(sugars.amount);
    if (!isNaN(val) && val > 12) {
      score -= 10;
      concerns.push(`High in Sugars (${sugars.amount})`);
    }
  }

  // Additives / Artificial Ingredient checks
  if (/high\s+fructose\s+corn\s+syrup/i.test(ingLower)) {
    score -= 15;
    concerns.push('Contains High Fructose Corn Syrup');
  }
  if (/hydrogenated/i.test(ingLower)) {
    score -= 12;
    concerns.push('Contains Hydrogenated Oils');
  }
  if (/artificial\s+(?:flavor|colour|color)/i.test(ingLower)) {
    score -= 8;
    concerns.push('Contains Artificial Flavors or Colors');
  }

  // 2. User Dietary Preferences Match
  for (const pref of userPreferences) {
    const p = pref.toLowerCase();
    let isCompliant = true;
    let reason = `Complies with ${pref}`;

    if (p.includes('vegan') || p.includes('vegetarian')) {
      if (/meat|chicken|beef|pork|gelatin|lard|anchov/i.test(ingLower)) {
        isCompliant = false;
        reason = 'Contains animal derived ingredients';
      } else if (p.includes('vegan') && /milk|cheese|butter|whey|casein|egg|honey/i.test(ingLower)) {
        isCompliant = false;
        reason = 'Contains dairy, egg, or animal derivatives';
      }
    } else if (p.includes('gluten-free')) {
      if (/wheat|barley|rye|malt|gluten/i.test(ingLower) || data.allergens.some((a) => /wheat|gluten/i.test(a))) {
        isCompliant = false;
        reason = 'Contains gluten or wheat ingredients';
      }
    } else if (p.includes('dairy-free')) {
      if (/milk|cream|cheese|whey|casein|butter|lactose/i.test(ingLower) || data.allergens.some((a) => /milk|dairy/i.test(a))) {
        isCompliant = false;
        reason = 'Contains dairy ingredients or milk allergens';
      }
    } else if (p.includes('nut-free')) {
      if (/peanut|almond|cashew|walnut|pecan|pistachio|macadamia|hazelnut/i.test(ingLower) || data.allergens.some((a) => /nut/i.test(a))) {
        isCompliant = false;
        reason = 'Contains nuts or potential nut traces';
      }
    } else if (p.includes('low sugar')) {
      if (sugars && parseFloat(sugars.amount) > 5) {
        isCompliant = false;
        reason = `Sugar is ${sugars.amount} (exceeds low sugar guideline)`;
      }
    }

    if (!isCompliant) {
      score -= 8;
    }
    dietaryMatches.push({ preference: pref, isCompliant, reason });
  }

  // Final score clamping
  score = Math.max(15, Math.min(98, score));

  let ratingLabel: LabelAnalysisResult['ratingLabel'] = 'Good';
  if (score >= 85) ratingLabel = 'Excellent';
  else if (score >= 70) ratingLabel = 'Good';
  else if (score >= 50) ratingLabel = 'Moderate';
  else ratingLabel = 'Avoid';

  const summary =
    highlights.length > 0
      ? `Recognized food label with ${data.nutrients.length} verified nutrient values and ${data.ingredients.length} detected ingredients.`
      : 'Nutritional facts and ingredients successfully extracted from the label.';

  return {
    score,
    ratingLabel,
    summary,
    highlights,
    concerns,
    dietaryMatches,
  };
}

/**
 * Performs real OCR text extraction on the specified image using OCR.space API.
 * Automatically handles base64 encoding from file URIs on Android/iOS/Web.
 */
export async function performOcrExtraction(
  imageUri: string,
  providedBase64?: string | null
): Promise<OcrExtractionResult> {
  try {
    let base64String = providedBase64 || null;

    // If base64 was not provided directly by camera/picker, read it from file system
    if (!base64String) {
      try {
        if (Platform.OS === 'web') {
          const res = await fetch(imageUri);
          const blob = await res.blob();
          base64String = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              const cleanB64 = result.includes(',') ? result.split(',')[1] : result;
              resolve(cleanB64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          base64String = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
          });
        }
      } catch (readErr: any) {
        console.warn('[OCR] File read error:', readErr);
        return {
          success: false,
          errorMessage: 'Could not access the photo file. Please capture or select the image again.',
          isBlurryOrUnreadable: true,
        };
      }
    }

    if (!base64String || base64String.trim().length === 0) {
      return {
        success: false,
        errorMessage: 'The image file appears empty or unreadable.',
        isBlurryOrUnreadable: true,
      };
    }

    // Build multipart/form-data for OCR.space
    const formData = new FormData();
    const dataUri = base64String.startsWith('data:')
      ? base64String
      : `data:image/jpeg;base64,${base64String}`;

    formData.append('base64Image', dataUri);
    formData.append('apikey', OCR_SPACE_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('OCREngine', '2'); // OCREngine 2 is optimized for small text / labels / numbers

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        errorMessage: `OCR service responded with HTTP status ${response.status}. Please check your connection and try again.`,
        isBlurryOrUnreadable: false,
      };
    }

    const json = await response.json();

    // Check for OCR processing errors
    if (json.IsErroredOnProcessing || json.OCRExitCode === 99 || json.OCRExitCode === 0) {
      const errDetail = Array.isArray(json.ErrorMessage)
        ? json.ErrorMessage.join('; ')
        : json.ErrorMessage || 'Text extraction failed.';

      return {
        success: false,
        errorMessage: `OCR could not parse this photo: ${errDetail}`,
        isBlurryOrUnreadable: true,
      };
    }

    const parsedResult = json.ParsedResults && json.ParsedResults[0];
    const rawText = parsedResult ? parsedResult.ParsedText || '' : '';
    const trimmed = rawText.trim();

    // Validation: Image is blurry, blank, or has no legible text
    // A food label typically contains words like calories, ingredients, nutrition, or at least 15+ characters
    const alphanumericCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;

    if (alphanumericCount < 8) {
      return {
        success: false,
        errorMessage:
          'No readable text detected on the label. The photo may be blurry, poorly lit, or out of focus.',
        isBlurryOrUnreadable: true,
      };
    }

    // Parse extracted text into structured food label data
    const parsedData = parseFoodLabel(trimmed);

    return {
      success: true,
      data: parsedData,
    };
  } catch (error: any) {
    console.warn('[OCR] Extraction error:', error);
    const isTimeout = error.name === 'AbortError';
    return {
      success: false,
      errorMessage: isTimeout
        ? 'OCR extraction timed out. Please check your internet connection and try again.'
        : error?.message || 'Failed to complete OCR extraction.',
      isBlurryOrUnreadable: false,
    };
  }
}
