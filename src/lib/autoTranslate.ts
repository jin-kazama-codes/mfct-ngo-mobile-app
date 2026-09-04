import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../types';

const TRANSLATION_CACHE_KEY = 'mfct_translation_cache_v2';

let memoryCache: Record<string, string> = {};
let isCacheLoaded = false;
const inFlightRequests: Record<string, Promise<string>> = {};

// Universal High-Accuracy Dictionary for Indian States, Common Locations, Honorifics & Names
export const AUTO_TRANSLATE_DICTIONARY: Record<string, { hi: string; ur: string; en?: string }> = {
  // Names
  'mohd nayeem': { hi: 'मोहम्मद नईम', ur: 'محمد نعیم', en: 'Mohd Nayeem' },
  'mohammad nayeem': { hi: 'मोहम्मद नईम', ur: 'محمد نعیم', en: 'Mohammad Nayeem' },
  'nayeem': { hi: 'नईम', ur: 'نعیم', en: 'Nayeem' },
  'gulam raza': { hi: 'गुलाम रज़ा', ur: 'غلام رضا', en: 'Gulam Raza' },
  'ghulam raza': { hi: 'गुलाम रज़ा', ur: 'غلام رضا', en: 'Ghulam Raza' },
  'farhan ali siddiqui': { hi: 'फरहान अली सिद्दीकी', ur: 'فرحان علی صدیقی', en: 'Farhan Ali Siddiqui' },
  'dr. shakeel ahmad usmani': { hi: 'डॉ. शकील अहमद उस्मानी', ur: 'ڈاکٹر شکیل احمد عثمانی', en: 'Dr. Shakeel Ahmad Usmani' },
  'shakeel ahmad usmani': { hi: 'शकील अहमद उस्मानी', ur: 'شکیل احمد عثمانی', en: 'Shakeel Ahmad Usmani' },
  'er. mohammad zahid': { hi: 'इंजी. मोहम्मद जाहिद', ur: 'انجینئر محمد زاہد', en: 'Er. Mohammad Zahid' },
  'er mohammad zahid': { hi: 'इंजी. मोहम्मद जाहिद', ur: 'انجینئر محمد زاہد', en: 'Er. Mohammad Zahid' },
  'mohammad zahid': { hi: 'मोहम्मद जाहिद', ur: 'محمد زاہد', en: 'Mohammad Zahid' },
  'mohd arshad': { hi: 'मोहम्मद अरशद', ur: 'محمد ارشد', en: 'Mohd Arshad' },
  'tariq khan': { hi: 'तारिक खान', ur: 'طارق خان', en: 'Tariq Khan' },
  'salman khan': { hi: 'सलमान खान', ur: 'سلمان खान', en: 'Salman Khan' },
  'rehan ali': { hi: 'रेहान अली', ur: 'ریحان علی', en: 'Rehan Ali' },
  'sohail ahmad': { hi: 'सोहेल अहमद', ur: 'سہیل احمد', en: 'Sohail Ahmad' },
  'imran khan': { hi: 'इमरान खान', ur: 'عمران خان', en: 'Imran Khan' },
  'adnan siddiqui': { hi: 'अदनान सिद्दीकी', ur: 'عدنان صدیقی', en: 'Adnan Siddiqui' },

  // States & UTs
  'uttar pradesh': { hi: 'उत्तर प्रदेश', ur: 'اتر پردیش', en: 'Uttar Pradesh' },
  'up': { hi: 'उत्तर प्रदेश', ur: 'اتر پردیش', en: 'Uttar Pradesh' },
  'delhi': { hi: 'दिल्ली', ur: 'دہلی', en: 'Delhi' },
  'bihar': { hi: 'बिहार', ur: 'بہار', en: 'Bihar' },
  'uttarakhand': { hi: 'उत्तराखंड', ur: 'اتراکھنڈ', en: 'Uttarakhand' },
  'madhya pradesh': { hi: 'मध्य प्रदेश', ur: 'مدھیہ پردیش', en: 'Madhya Pradesh' },
  'mp': { hi: 'मध्य प्रदेश', ur: 'مدھیہ پردیش', en: 'Madhya Pradesh' },
  'rajasthan': { hi: 'राजस्थान', ur: 'راجستھان', en: 'Rajasthan' },
  'haryana': { hi: 'हरियाणा', ur: 'ہریانہ', en: 'Haryana' },
  'punjab': { hi: 'पंजाब', ur: 'پنجاب', en: 'Punjab' },
  'west bengal': { hi: 'पश्चिम बंगाल', ur: 'مغربی بنگال', en: 'West Bengal' },
  'maharashtra': { hi: 'महाराष्ट्र', ur: 'مہاراشٹر', en: 'Maharashtra' },
  'gujarat': { hi: 'गुजरात', ur: 'گجرات', en: 'Gujarat' },
  'jharkhand': { hi: 'झारखंड', ur: 'جھارکھنڈ', en: 'Jharkhand' },

  // Districts & Cities
  'bareilly': { hi: 'बरेली', ur: 'بریلی', en: 'Bareilly' },
  'lucknow': { hi: 'लखनऊ', ur: 'لکھنؤ', en: 'Lucknow' },
  'moradabad': { hi: 'मुरादाबाद', ur: 'مرادآباد', en: 'Moradabad' },
  'rampur': { hi: 'रामपुर', ur: 'رام پور', en: 'Rampur' },
  'pilibhit': { hi: 'पीलीभीत', ur: 'پیلی بھیत', en: 'Pilibhit' },
  'shahjahanpur': { hi: 'शाहजहांपुर', ur: 'شاہجہاں پور', en: 'Shahjahanpur' },
  'budaun': { hi: 'बदायूँ', ur: 'بدایوں', en: 'Budaun' },
  'bijnor': { hi: 'बिजनौर', ur: 'بجنور', en: 'Bijnor' },
  'sambhal': { hi: 'संभल', ur: 'سنبھل', en: 'Sambhal' },
  'meerut': { hi: 'मेरठ', ur: 'میرٹھ', en: 'Meerut' },
  'aligarh': { hi: 'अलीगढ़', ur: 'علی گڑھ', en: 'Aligarh' },
  'agra': { hi: 'आगरा', ur: 'آگرہ', en: 'Agra' },
  'varanasi': { hi: 'वाराणसी', ur: 'وارانسی', en: 'Varanasi' },
  'kanpur': { hi: 'कानपुर', ur: 'کانپور', en: 'Kanpur' },
  'gorakhpur': { hi: 'गोरखपुर', ur: 'گورکھپور', en: 'Gorakhpur' },
  'maharajganj': { hi: 'महराजगंज', ur: 'مہراج گنج', en: 'Maharajganj' },

  // Common Communities
  'bareilly central care society (headquarters)': { hi: 'बरेली सेंट्रल केयर सोसाइटी (मुख्यालय)', ur: 'بریلی سنٹرل کیئر سوسائٹی (ہیڈ کوارٹر)', en: 'Bareilly Central Care Society (Headquarters)' },
  'bareilly central care society': { hi: 'बरेली सेंट्रल केयर सोसाइटी', ur: 'بریلی سنٹرل کیئر سوسائٹی', en: 'Bareilly Central Care Society' },
  'rohilkhand educational & nikah trust': { hi: 'रुहेलखंड एजुकेशनल एवं निकाह ट्रस्ट', ur: 'روہیل کھنڈ ایجوکیشنل اینڈ نکاح ٹرسٹ', en: 'Rohilkhand Educational & Nikah Trust' },
  'maharajganj welfare foundation': { hi: 'महराजगंज वेलफेयर फाउंडेशन', ur: 'مہراج گنج ویلفیئر فاؤنڈیشن', en: 'Maharajganj Welfare Foundation' },
};

export function lookupDictionary(text: string, targetLang: Language): string | null {
  if (!text) return null;
  const trimmed = text.trim().toLowerCase();
  const entry = AUTO_TRANSLATE_DICTIONARY[trimmed];
  if (entry) {
    if (targetLang === 'en') return entry.en || text;
    if (targetLang === 'hi') return entry.hi;
    if (targetLang === 'ur') return entry.ur;
  }

  // Reverse lookup if text is in Hindi or Urdu
  for (const [enKey, val] of Object.entries(AUTO_TRANSLATE_DICTIONARY)) {
    if (val.hi.toLowerCase() === trimmed || val.ur.toLowerCase() === trimmed) {
      if (targetLang === 'en') return val.en || enKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (targetLang === 'hi') return val.hi;
      if (targetLang === 'ur') return val.ur;
    }
  }

  return null;
}

export function isValidScript(text: string, targetLang: Language): boolean {
  if (!text) return false;
  if (targetLang === 'hi') return /[\u0900-\u097F]/.test(text);
  if (targetLang === 'ur') return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  if (targetLang === 'en') return /[a-zA-Z]/.test(text);
  return true;
}

// Initialize memory cache from AsyncStorage on module load
(async () => {
  try {
    const raw = await AsyncStorage.getItem(TRANSLATION_CACHE_KEY);
    if (raw) {
      memoryCache = { ...memoryCache, ...JSON.parse(raw) };
    }
  } catch { }
  isCacheLoaded = true;
})();

export function getMemoryCache(): Record<string, string> {
  return memoryCache;
}

export function setMemoryCache(key: string, value: string) {
  memoryCache[key] = value;
  try {
    AsyncStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(memoryCache)).catch(() => { });
  } catch { }
}

const LANGUAGE_LABEL: Record<string, string> = {
  hi: 'Hindi (हिन्दी / Devanagari script)',
  ur: 'Urdu (اردو / Nastaliq or Perso-Arabic script)',
  en: 'English',
};

function normalizeHonorifics(text: string): string {
  return text
    .replace(/\bMohd\.?\b/gi, 'Mohammad')
    .replace(/\bMd\.?\b/gi, 'Mohammad')
    .replace(/\bEr\.?\b/gi, 'Engineer')
    .replace(/\bDr\.?\b/gi, 'Doctor');
}

/**
 * Groq Cloud AI
 */
async function translateWithGroq(text: string, targetLang: Language): Promise<string | null> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) return null;

  const targetLangLabel = LANGUAGE_LABEL[targetLang] || targetLang;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert multilingual translator specializing in NGO campaigns, donor testimonials, community updates, names, and quotes.
Translate the provided text into ${targetLangLabel}.

CRITICAL GUIDELINES:
1. Return ONLY the translated text. Do NOT add preamble, quotes, notes, formatting, or explanations.
2. For personal names and city names, phonetically transliterate into the target script (e.g. Devanagari for Hindi, Perso-Arabic script for Urdu, Latin for English).
3. Maintain the sincere, empathetic, and respectful tone of the testimonial or story.
4. Keep numbers, currencies (₹, $, INR), and punctuation properly intact.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const result: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    if (result) {
      const clean = result.replace(/^["'«»\u201C\u201D\u201E\u2018\u2019\u00AB\u00BB]+|["'«»\u201C\u201D\u201E\u2018\u2019\u00AB\u00BB]+$/g, '').trim();
      if (isValidScript(clean, targetLang)) {
        return clean;
      }
    }
  } catch (err) {
    console.warn('[autoTranslate] Groq direct call failed:', err);
  }
  return null;
}

export function detectScript(text: string): 'hi' | 'ur' | 'en' {
  if (!text) return 'en';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) return 'ur';
  return 'en';
}

/** MyMemory Translation API (reliable for Hindi & Urdu names and places). */
async function translateWithMyMemory(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string | null> {
  try {
    const normalized = normalizeHonorifics(text);
    const langPair = `${sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      normalized
    )}&langpair=${encodeURIComponent(langPair)}`;

    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return null;
    const data = await response.json();
    const result = data?.responseData?.translatedText;
    if (result && !result.includes('MYMEMORY WARNING') && isValidScript(result, targetLang as Language)) {
      return result.trim();
    }
  } catch { }
  return null;
}

/** Google Translate with explicit source script (sl=en / sl=hi / sl=ur). */
async function translateWithGoogle(text: string, targetLang: string, sourceLang: string): Promise<string | null> {
  try {
    const normalized = normalizeHonorifics(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(
      targetLang
    )}&dt=t&q=${encodeURIComponent(normalized)}`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item: any) => item[0]).filter(Boolean).join('');
      if (translated && isValidScript(translated, targetLang as Language)) {
        return translated.trim();
      }
    }
  } catch { }
  return null;
}

/** Google Input Tools Transliteration (for names/places into Hindi & Urdu). */
async function transliterateWithInputTools(text: string, targetLang: Language): Promise<string | null> {
  if (targetLang !== 'hi' && targetLang !== 'ur') return null;
  try {
    const itc = targetLang === 'hi' ? 'hi-t-i0-und' : 'ur-t-i0-und';
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${itc}&num=1`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (Array.isArray(data) && data[0] === 'SUCCESS' && data[1]?.[0]?.[1]?.[0]) {
      const transliterated = data[1][0][1][0];
      if (isValidScript(transliterated, targetLang)) {
        return transliterated.trim();
      }
    }
  } catch { }
  return null;
}

/**
 * Universal dynamic translation function for any text / name / story across Hindi, Urdu, English.
 * Engine cascade: Dictionary → Groq AI → MyMemory → Google Translate → InputTools.
 * Automatically caches responses in AsyncStorage for instant reload.
 */
export async function autoTranslateText(text: string, targetLang: Language): Promise<string> {
  if (!text || !text.trim()) return text || '';

  const trimmed = text.trim();
  const sourceLang = detectScript(trimmed);

  // If already in target language script, no translation needed
  if (sourceLang === targetLang) return trimmed;

  // If already pure ASCII and targeting English, no translation needed
  const isPureAscii = /^[\x00-\x7F]*$/.test(trimmed);
  if (targetLang === 'en' && isPureAscii) return trimmed;

  // 0. Check built-in dictionary (Instant 0ms)
  const dictMatch = lookupDictionary(trimmed, targetLang);
  if (dictMatch) {
    setMemoryCache(`${targetLang}:${trimmed}`, dictMatch);
    return dictMatch;
  }

  const cacheKey = `${targetLang}:${trimmed}`;
  if (memoryCache[cacheKey] && isValidScript(memoryCache[cacheKey], targetLang)) {
    return memoryCache[cacheKey];
  }
  if (inFlightRequests[cacheKey]) return inFlightRequests[cacheKey];

  const translationPromise = (async (): Promise<string> => {
    try {
      // 1. Primary: Groq AI
      const groqResult = await translateWithGroq(trimmed, targetLang);
      if (groqResult) return groqResult;
    } catch { }

    try {
      // 2. Engine: MyMemory Translation API
      const myMemoryResult = await translateWithMyMemory(trimmed, targetLang, sourceLang);
      if (myMemoryResult) return myMemoryResult;
    } catch { }

    try {
      // 3. Engine: Google Translate with explicit source script
      const googleResult = await translateWithGoogle(trimmed, targetLang, sourceLang);
      if (googleResult) return googleResult;
    } catch { }

    try {
      // 4. Engine: Google Input Tools transliteration for names
      if (sourceLang === 'en' && (targetLang === 'hi' || targetLang === 'ur')) {
        const translit = await transliterateWithInputTools(trimmed, targetLang);
        if (translit) return translit;
      }
    } catch { }

    return trimmed;
  })();

  inFlightRequests[cacheKey] = translationPromise;
  const translated = await translationPromise;
  delete inFlightRequests[cacheKey];

  if (translated && translated !== trimmed && isValidScript(translated, targetLang)) {
    setMemoryCache(cacheKey, translated);
  }
  return translated;
}

/**
 * React hook to dynamically translate names, titles, quotes or any dynamic entity in real time
 * based on the active user-selected language.
 */
export function useDynamicTranslatedText(rawText: string | undefined, targetLang: Language): string {
  const text = rawText || '';

  const getImmediateValue = (str: string, lang: Language): string => {
    if (!str) return '';
    const trimmed = str.trim();
    if (detectScript(trimmed) === lang) return trimmed;
    if (lang === 'en' && /^[\x00-\x7F]*$/.test(trimmed)) return trimmed;

    // Fast dictionary match
    const dict = lookupDictionary(trimmed, lang);
    if (dict) return dict;

    // Validated memory cache check
    const cached = memoryCache[`${lang}:${trimmed}`];
    if (cached && isValidScript(cached, lang)) {
      return cached;
    }

    return str;
  };

  const [translated, setTranslated] = useState<string>(() => getImmediateValue(text, targetLang));

  useEffect(() => {
    if (!text) {
      setTranslated('');
      return;
    }

    const immediate = getImmediateValue(text, targetLang);
    setTranslated(immediate);

    const trimmed = text.trim();
    if (detectScript(trimmed) === targetLang) return;
    if (targetLang === 'en' && /^[\x00-\x7F]*$/.test(trimmed)) return;
    if (immediate !== text && isValidScript(immediate, targetLang)) return;

    let isMounted = true;
    autoTranslateText(text, targetLang).then((result) => {
      if (isMounted && result && isValidScript(result, targetLang)) {
        setTranslated(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [text, targetLang]);

  return translated;
}
