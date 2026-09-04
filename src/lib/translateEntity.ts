import { Language, Campaign, Community, Testimonial, CommunityStory } from '../types';
import { GalleryPhoto } from '../services/galleryService';
import { getMemoryCache, lookupDictionary, isValidScript } from './autoTranslate';

export function getLanguageCode(langOrI18n: any): Language {
  if (typeof langOrI18n === 'string') {
    if (langOrI18n.startsWith('hi')) return 'hi';
    if (langOrI18n.startsWith('ur')) return 'ur';
    return 'en';
  }
  if (langOrI18n && typeof langOrI18n === 'object') {
    const code = langOrI18n.resolvedLanguage || langOrI18n.language || 'en';
    if (code.startsWith('hi')) return 'hi';
    if (code.startsWith('ur')) return 'ur';
    return 'en';
  }
  return 'en';
}

/**
 * Universal dynamic data localization helper.
 * If data contains { en, hi, ur }, extracts value for current language.
 * Fallback chain: current language → English → first available value.
 */
export function getLocalizedValue(data: any, lang: Language): string {
  if (data === null || data === undefined) return '';
  if (typeof data === 'object' && !Array.isArray(data)) {
    if (typeof data[lang] === 'string' && data[lang].trim()) return data[lang];
    if (typeof data.en === 'string' && data.en.trim()) return data.en;
    for (const key of Object.keys(data)) {
      if (typeof data[key] === 'string' && data[key].trim()) return data[key];
    }
    return '';
  }
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return getLocalizedValue(parsed, lang);
        }
      } catch { }
    }
    return trimmed;
  }
  return String(data);
}


const STATUS_MAP: Record<string, { hi: string; ur: string }> = {
  'active': { hi: 'सक्रिय', ur: 'فعال' },
  'Active': { hi: 'सक्रिय', ur: 'فعال' },
  'verified': { hi: 'सत्यापित', ur: 'تصدیق شدہ' },
  'Verified': { hi: 'सत्यापित', ur: 'تصدیق شدہ' },
  'pending': { hi: 'लंबित', ur: 'زیر التواء' },
  'Pending': { hi: 'लंबित', ur: 'زیر التواء' },
  'pending_verification': { hi: 'सत्यापन लंबित', ur: 'تصدیق زیر التواء' },
  'approved': { hi: 'स्वीकृत', ur: 'منظور شدہ' },
  'Approved': { hi: 'स्वीकृत', ur: 'منظور شدہ' },
  'rejected': { hi: 'अस्वीकृत', ur: 'مسترد شدہ' },
  'Rejected': { hi: 'अस्वीकृत', ur: 'مسترد شدہ' },
  'completed': { hi: 'पूर्ण', ur: 'مکمل' },
  'Completed': { hi: 'पूर्ण', ur: 'مکمل' },
  'success': { hi: 'सफल', ur: 'کامیاب' },
  'failed': { hi: 'असफल', ur: 'नाकाम' },
};

const CATEGORY_MAP: Record<string, { hi: string; ur: string; en?: string }> = {
  All: { hi: 'सभी', ur: 'تمام', en: 'All' },
  all: { hi: 'सभी', ur: 'تمام', en: 'All' },
  Urgent: { hi: 'तत्काल', ur: 'فوری', en: 'Urgent' },
  Medical: { hi: 'चिकित्सा सहायता', ur: 'طبی امداد', en: 'Medical Aid' },
  'Medical Aid': { hi: 'चिकित्सा सहायता', ur: 'طبی امداد', en: 'Medical Aid' },
  Education: { hi: 'शिक्षा सहायता', ur: 'تعلیمی امداد', en: 'Education Aid' },
  'Education Aid': { hi: 'शिक्षा सहायता', ur: 'تعلیمی امداد', en: 'Education Aid' },
  'Child Education': { hi: 'बाल शिक्षा', ur: 'بچوں کی تعلیم', en: 'Child Education' },
  Marriage: { hi: 'विवाह सहायता', ur: 'نکاح معاونت', en: 'Marriage Aid' },
  'Marriage Aid': { hi: 'विवाह सहायता', ur: 'نکاح معاونت', en: 'Marriage Aid' },
  'Nikah Support': { hi: 'निकाह सहायता', ur: 'نکاح معاونت', en: 'Nikah Support' },
  Food: { hi: 'राशन / भोजन राहत', ur: 'राशन و خوراک', en: 'Food Relief' },
  'Food Relief': { hi: 'राशन / भोजन राहत', ur: 'राशन و خوراک', en: 'Food Relief' },
  Janazah: { hi: 'जनाज़ा व कफ़न सहायता', ur: 'جنازہ و تجہیز و تکفین', en: 'Janazah Aid' },
  'Janazah Aid': { hi: 'जनाज़ा व कफ़न सहायता', ur: 'جनाزہ و تجہیز و تکفین', en: 'Janazah Aid' },
  Community: { hi: 'सामुदायिक कार्य', ur: 'کمیونٹی فلاح', en: 'Community' },
  Zakat: { hi: 'ज़कात पात्र', ur: 'مستحقین زکوٰۃ', en: 'Zakat' },
  Sadqa: { hi: 'सदका पात्र', ur: 'صدقہ کے اہل', en: 'Sadaka' },
  Sadakah: { hi: 'सदका पात्र', ur: 'صدقہ کے اہل', en: 'Sadaka' },
  Sadaqah: { hi: 'सदका पात्र', ur: 'صدقہ के اہل', en: 'Sadaka' },
  Fitra: { hi: 'फ़ितरा पात्र', ur: 'فطرہ के اہل', en: 'Fitrah' },
  Fitrah: { hi: 'फ़ितरा पात्र', ur: 'فطرہ کے اہل', en: 'Fitrah' },
  Masjid: { hi: 'मस्जिद सहायता', ur: 'مسجد امداد', en: 'Masjid' },
  Madarsa: { hi: 'मदरसा सहायता', ur: 'مدرسہ امداد', en: 'Madarsa' },
  'Emergency Relief': { hi: 'आपातकालीन राहत', ur: 'ہنگامی امداد', en: 'Emergency Relief' },
  Emergency: { hi: 'आपातकालीन राहत', ur: 'ہنگامی امداد', en: 'Emergency Relief' },
  Shelter: { hi: 'आवास सहायता', ur: 'رہائش امداد', en: 'Shelter' },
  'Disability Support': { hi: 'दिव्यांग सहायता', ur: 'معذور افراد کی امداد', en: 'Disability Support' },
  'Widow Support': { hi: 'विधवा सहायता', ur: 'بیوہ امداد', en: 'Widow Support' },
  'Orphan Support': { hi: 'अनाथ सहायता', ur: 'یتیم امداد', en: 'Orphan Support' },
  General: { hi: 'सामान्य दान', ur: 'عام عطیہ', en: 'General' },
};

const ROLE_MAP: Record<string, { en: string, hi: string; ur: string }> = {
  'Beneficiary Father': { en: 'Beneficiary Father', hi: 'लाभार्थी पिता', ur: 'مستفید والد' },
  'Widow Mother': { en: 'Widow Mother', hi: 'विधवा मां', ur: 'بیوہ ماں' },
  'Community Admin': { en: 'Community Admin', hi: 'सामुदायिक प्रशासक', ur: 'کمیونٹی ایڈمن' },
  'Headquarters Administrator': { en: 'Headquarters Administrator', hi: 'मुख्यालय प्रशासक', ur: 'مرکزی ایڈمن' },
  'Community Administrator': { en: 'Community Administrator', hi: 'सामुदायिक प्रशासक', ur: 'کمیونٹی ایڈمنسٹریٹر' },
  'Verified Beneficiary': { en: 'Verified Beneficiary', hi: 'सत्यापित लाभार्थी', ur: 'تصدیق شدہ مستفید' },
  'Beneficiary': { en: 'Beneficiary', hi: 'लाभार्थी', ur: 'مستفید' },
  'Member': { en: 'Member', hi: 'सदस्य', ur: 'ممبر' },
  'Volunteer': { en: 'Volunteer', hi: 'स्वयंसेवक', ur: 'رضاکار' },
  'Regular Monthly Donor': { en: 'Regular Monthly Donor', hi: 'नियमित मासिक दानदाता', ur: 'ماہانہ ڈونر' },
  'Grassroots Field Volunteer': { en: 'Grassroots Field Volunteer', hi: 'ज़मीनी स्वयंसेवक', ur: 'فیلڈ رضاکار' },
  'Community Organiser': { en: 'Community Organiser', hi: 'सामुदायिक आयोजक', ur: 'کمیونٹی آرگنائزر' },
  'super_admin': { en: 'Super Admin', hi: 'मुख्य प्रशासक', ur: 'سپر ایڈمن' },
  'executive_admin': { en: 'Executive Admin', hi: 'कार्यकारी प्रशासक', ur: 'ایگزیکٹو ایڈمن' },
  'community_admin': { en: 'Community Admin', hi: 'सामुदायिक प्रशासक', ur: 'کمیونٹی ایڈمن' },
  'member': { en: 'Member', hi: 'सदस्य', ur: 'ممبر' },
  'premium_donor': { en: 'Premium Donor', hi: 'विशिष्ट दानदाता', ur: 'پریمیم ڈونر' },
  'district_president': { en: 'District President', hi: 'जिला अध्यक्ष', ur: 'ضلعی صدر' },
  'District President': { en: 'District President', hi: 'जिला अध्यक्ष', ur: 'ضلعی صدر' },
  'district_coordinator': { en: 'District Coordinator', hi: 'जिला समन्वयक', ur: 'ضلعی کوآرڈینیٹر' },
  'District Coordinator': { en: 'District Coordinator', hi: 'जिला समन्वयक', ur: 'ضلعی کوآرڈینیٹر' },
  'district_gen_secretary': { en: 'District General Secretary', hi: 'जिला महासचिव', ur: 'ضلعی جنرل سیکرٹری' },
  'District General Secretary': { en: 'District General Secretary', hi: 'जिला महासचिव', ur: 'ضلعی جنرل سیکرٹری' },
  'district_secretary': { en: 'District Secretary', hi: 'जिला सचिव', ur: 'ضلعی سیکرٹری' },
  'District Secretary': { en: 'District Secretary', hi: 'जिला सचिव', ur: 'ضلعی سیکرٹری' },
  'district_finance_coord': { en: 'District Finance Coordinator', hi: 'जिला वित्त समन्वयक', ur: 'ضلعی فنانس کوآرڈینیٹر' },
  'District Finance Coordinator': { en: 'District Finance Coordinator', hi: 'जिला वित्त समन्वयक', ur: 'ضلعی فنانس کوآرڈینیٹر' },
};

export const DISTRICT_ROLE_MAP: Record<string, { en: string; hi: string; ur: string }> = {
  'district_president': { en: 'District President', hi: 'जिला अध्यक्ष', ur: 'ضلعی صدر' },
  'district_coordinator': { en: 'District Coordinator', hi: 'जिला समन्वयक', ur: 'ضلعی کوآرڈینیٹر' },
  'district_gen_secretary': { en: 'District General Secretary', hi: 'जिला महासचिव', ur: 'ضلعی جنرل سیکرٹری' },
  'district_secretary': { en: 'District Secretary', hi: 'जिला सचिव', ur: 'ضلعی سیکرٹری' },
  'district_finance_coord': { en: 'District Finance Coordinator', hi: 'जिला वित्त समन्वयक', ur: 'ضلعی فنانس کوآرڈینیٹر' },
  'District President': { en: 'District President', hi: 'जिला अध्यक्ष', ur: 'ضلعی صدر' },
  'District Coordinator': { en: 'District Coordinator', hi: 'जिला समन्वयक', ur: 'ضلعی کوآرڈینیٹر' },
  'District General Secretary': { en: 'District General Secretary', hi: 'जिला महासचिव', ur: 'ضلعی جنرل سیکرٹری' },
  'District Secretary': { en: 'District Secretary', hi: 'जिला सचिव', ur: 'ضلعی سیکرٹری' },
  'District Finance Coordinator': { en: 'District Finance Coordinator', hi: 'जिला वित्त समन्वयक', ur: 'ضلعی فنانس کوآرڈینیٹر' },
};


export function detectScript(text: string): 'hi' | 'ur' | 'en' {
  if (!text) return 'en';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) return 'ur';
  return 'en';
}

function resolveEnumTranslation(
  val: string,
  map: Record<string, { hi: string; ur: string; en?: string }>,
  targetLang: Language
): string {
  if (!val) return '';
  const trimmed = val.trim();
  // 1. Direct key match (e.g. key is 'Medical')
  if (map[trimmed]) {
    if (targetLang === 'en') return map[trimmed].en || trimmed;
    return map[trimmed][targetLang] || trimmed;
  }
  // 2. Reverse lookup across entries (e.g. val is 'चिकित्सा सहायता' or 'طبی امداد')
  for (const [key, item] of Object.entries(map)) {
    if (
      key.toLowerCase() === trimmed.toLowerCase() ||
      item.hi === trimmed ||
      item.ur === trimmed ||
      (item.en && item.en.toLowerCase() === trimmed.toLowerCase())
    ) {
      if (targetLang === 'en') return item.en || key;
      return item[targetLang] || (item.en || key);
    }
  }
  return trimmed;
}

export function getCachedTranslation(text: string, lang: Language): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (detectScript(trimmed) === lang) return trimmed;
  const dict = lookupDictionary(trimmed, lang);
  if (dict) return dict;
  try {
    const cache = getMemoryCache();
    const val = cache[`${lang}:${trimmed}`];
    if (val && isValidScript(val, lang)) return val;
    return null;
  } catch {
    return null;
  }
}

export function translateStatus(status: string, lang: Language): string {
  if (!status) return '';
  const localized = getLocalizedValue(status, lang);
  if (localized !== status) return localized;
  return resolveEnumTranslation(status, STATUS_MAP, lang);
}

export function translateCategory(cat: string, lang: Language): string {
  if (!cat) return '';
  const localized = getLocalizedValue(cat, lang);
  if (localized !== cat) return localized;
  return resolveEnumTranslation(cat, CATEGORY_MAP, lang);
}

export function translateRole(role: string, lang: Language): string {
  if (!role) return '';
  const localized = getLocalizedValue(role, lang);
  if (localized !== role) return localized;
  return resolveEnumTranslation(role, ROLE_MAP, lang);
}

export function translateDistrictRole(districtRole: string, lang: Language): string {
  if (!districtRole) return '';
  const localized = getLocalizedValue(districtRole, lang);
  if (localized !== districtRole) return localized;
  return resolveEnumTranslation(districtRole, DISTRICT_ROLE_MAP, lang);
}

function normalizeQuote(str: string): string {
  return str.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').trim();
}

// ─── Groq-cache-aware passthrough stubs ────────────────────────────────────
// These functions check the autoTranslate memory cache (filled by Groq AI)
// and fall back to the original text. Actual translation is handled async by
// useDynamicTranslatedText in each component.

function fromCache(text: string, lang: Language): string | null {
  if (!text) return null;
  return getCachedTranslation(text.trim(), lang);
}

export function translateCity(city: string, lang: Language): string {
  if (!city) return '';
  const localized = getLocalizedValue(city, lang);
  if (localized !== city) return localized;
  if (detectScript(city) === lang) return city;
  return fromCache(city, lang) || city;
}

export function translateState(state: string, lang: Language): string {
  if (!state) return '';
  const localized = getLocalizedValue(state, lang);
  if (localized !== state) return localized;
  if (detectScript(state) === lang) return state;
  return fromCache(state, lang) || state;
}

export function translateAdminName(name: string, lang: Language): string {
  if (!name) return '';
  const localized = getLocalizedValue(name, lang);
  if (localized !== name) return localized;
  if (detectScript(name) === lang) return name;
  return fromCache(name, lang) || name;
}

export function translateCommunityName(name: string, lang: Language): string {
  if (!name) return '';
  const localized = getLocalizedValue(name, lang);
  if (localized !== name) return localized;
  if (detectScript(name) === lang) return name;
  return fromCache(name, lang) || name;
}

export function translateCommunityDesc(desc: string, lang: Language): string {
  if (!desc) return '';
  const localized = getLocalizedValue(desc, lang);
  if (localized !== desc) return localized;
  if (detectScript(desc) === lang) return desc;
  return fromCache(desc, lang) || desc;
}

export function translateDonorName(name: string, lang: Language): string {
  if (!name) return '';
  const localized = getLocalizedValue(name, lang);
  if (localized !== name) return localized;
  if (detectScript(name) === lang) return name;
  return fromCache(name, lang) || name;
}

export function translateQuote(quote: string, lang: Language): string {
  if (!quote) return '';
  const localized = getLocalizedValue(quote, lang);
  if (localized !== quote) return localized;
  const norm = normalizeQuote(quote);
  const cached = fromCache(norm, lang) || fromCache(quote, lang);
  return cached || quote;
}

export function translateCampaignTitle(title: string, lang: Language): string {
  if (!title) return '';
  const localized = getLocalizedValue(title, lang);
  if (localized !== title) return localized;
  if (detectScript(title) === lang) return title;
  return fromCache(title, lang) || title;
}

export function translateCampaignStory(story: string, lang: Language): string {
  if (!story) return '';
  const localized = getLocalizedValue(story, lang);
  if (localized !== story) return localized;
  if (detectScript(story) === lang) return story;
  return fromCache(story, lang) || story;
}

export function translateTestimonial(t: Testimonial, lang: Language): Testimonial {
  return {
    ...t,
    name: translateDonorName(t.name, lang),
    role: translateRole(t.role || 'Verified Beneficiary', lang),
    city: translateCity(t.city, lang),
    quote: translateQuote(t.quote, lang),
    campaignTitle: t.campaignTitle ? translateCampaignTitle(t.campaignTitle, lang) : undefined,
  };
}

export function translateCommunity(c: Community, lang: Language): Community {
  return {
    ...c,
    name: translateCommunityName(c.name, lang),
    description: translateCommunityDesc(c.description, lang),
    adminName: translateAdminName(c.adminName, lang),
    city: translateCity(c.city, lang),
    state: translateState(c.state, lang),
  };
}

export function translateCampaign(c: Campaign, lang: Language): Campaign {
  return {
    ...c,
    title: translateCampaignTitle(c.title, lang),
    story: translateCampaignStory(c.story, lang),
    city: translateCity(c.city, lang),
    communityName: translateCommunityName(c.communityName, lang),
    category: translateCategory(c.category, lang) as any,
  };
}

export function translateGalleryPhoto(p: GalleryPhoto, lang: Language): GalleryPhoto {
  const localizedTitle = getLocalizedValue(p.title, lang);
  const title = localizedTitle !== p.title ? localizedTitle : (fromCache(p.title, lang) || p.title);
  const localizedDesc = p.description ? getLocalizedValue(p.description, lang) : undefined;
  const description = localizedDesc && localizedDesc !== p.description
    ? localizedDesc
    : p.description ? (fromCache(p.description, lang) || p.description) : undefined;
  return {
    ...p,
    title,
    city: translateCity(p.city, lang),
    category: translateCategory(p.category, lang),
    description,
  };
}


