import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import {
  Sparkles,
  ShieldCheck,
  Heart,
  HeartHandshake,
  Coins,
  Scale,
  Building2,
  FileCheck,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  Phone,
  UserCheck,
  Landmark,
  Share2,
  Lock,
  UserPlus,
  ArrowRight,
  BookOpen,
  Layers,
  MessageCircle,
  PhoneCall,
  Clock,
  Ban,
  Printer,
  Award,
  Users,
} from 'lucide-react-native';

// ─── Theme Colors ──────────────────────────────────────────────────────────
const C = {
  darkGreen: '#091f15',
  midGreen: '#0e2a1d',
  deepGreen: '#0a2e1d',
  richGreen: '#1a4230',
  emeraldDark: '#064e3b',
  gold: '#c8a84b',
  goldLight: '#f5d77f',
  goldBg: 'rgba(200,168,75,0.12)',
  goldBorder: 'rgba(200,168,75,0.35)',
  goldDark: '#a0832e',
  white: '#ffffff',
  offWhite: '#f8faf9',
  border: 'rgba(26,60,44,0.12)',
  borderDark: 'rgba(255,255,255,0.12)',
  textMuted: '#6b7280',
  textMutedDark: '#94a3b8',
};

export interface RuleModel {
  num: number;
  category: 'foundation' | 'support' | 'verification' | 'organization' | 'transparency';
  titleHi: string;
  titleEn: string;
  titleUr: string;
  paragraphsHi: string[];
  paragraphsEn: string[];
  paragraphsUr: string[];
  alertHi?: string;
  alertEn?: string;
  alertUr?: string;
  alertType?: 'warning' | 'danger' | 'info' | 'success' | 'gold';
  listItemsHi?: string[];
  listItemsEn?: string[];
  listItemsUr?: string[];
  slabs?: { titleHi: string; titleEn: string; titleUr: string; valHi: string; valEn: string; valUr: string; subHi: string; subEn: string; subUr: string; color: string }[];
  gridItemsHi?: string[];
  gridItemsEn?: string[];
  gridItemsUr?: string[];
}

export default function NiyamawaliScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedScheme, setSelectedScheme] = useState<'all' | 'death' | 'nikah'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const lang = i18n.language === 'ur' ? 'ur' : i18n.language === 'en' ? 'en' : 'hi';

  // ─── Categories ────────────────────────────────────────────────────────
  const categories = [
    { id: 'all', labelHi: 'सभी नियम', labelEn: 'All Clauses', labelUr: 'تمام قواعد' },
    { id: 'foundation', labelHi: 'उद्देश्य व सदस्यता', labelEn: 'Objectives & Membership', labelUr: 'مقاصد و رکنیت' },
    { id: 'support', labelHi: 'सहयोग व लॉक-इन', labelEn: 'Support & Lock-in', labelUr: 'تعاون و لاک اِن' },
    { id: 'verification', labelHi: 'पात्रता व दस्तावेज', labelEn: 'Eligibility & Documents', labelUr: 'اہلیت و اسناد' },
    { id: 'organization', labelHi: 'संगठन व आचार संहिता', labelEn: 'Organization & Conduct', labelUr: 'تنظیم و ضوابط' },
    { id: 'transparency', labelHi: 'पारदर्शिता व नियम', labelEn: 'Transparency & Audit', labelUr: 'شفافیت و آڈٹ' },
  ];

  // ─── Scheme 1: MFCT आकस्मिक निधन परिवार सहारा योजना (30 Rules) ────────
  const deathSchemeRules: RuleModel[] = useMemo(
    () => [
      {
        num: 1,
        category: 'foundation',
        titleHi: 'योजना का नाम एवं उद्देश्य',
        titleEn: '1. Scheme Name & Core Objective',
        titleUr: '1. اسکیم کا نام اور بنیادی مقصد',
        paragraphsHi: [
          'इस योजना का नाम “MFCT आकस्मिक निधन परिवार सहारा योजना” होगा। यह योजना MOHAMMAD FAEEM CHARITABLE TRUST (MFCT) द्वारा सामाजिक, मानवीय एवं पारस्परिक सहयोग की भावना से संचालित की जाएगी।',
          'योजना का उद्देश्य ट्रस्ट के वैधानिक सदस्य के असामयिक निधन की स्थिति में उसके पात्र नॉमिनी/परिवार को सामूहिक सहयोग के माध्यम से आर्थिक सहारा उपलब्ध कराने का प्रयास करना है।',
        ],
        paragraphsEn: [
          'This scheme shall be officially named “MFCT Accidental Death Family Support Scheme” (MFCT आकस्मिक निधन परिवार सहारा योजना), administered by MOHAMMAD FAEEM CHARITABLE TRUST (MFCT) with the spirit of social, humanitarian, and mutual solidarity.',
          'The primary objective of the scheme is to provide collective mutual financial solace and relief to the eligible nominee/family in the tragic event of an untimely demise of a verified member.',
        ],
        paragraphsUr: [
          'اس اسکیم کا باضابطہ نام “MFCT ناگہانی انتقال فیملی سہارا اسکیم” ہوگا، جو محمد فہیم چیریٹیبل ٹرسٹ (MFCT) کے زیر اہتمام سماجی اور باہمی ہمدردی کے جذبے سے چلائی جائے گی۔',
          'اس کا بنیادی مقصد تصدیق شدہ رکن کے ناگہانی انتقال کی صورت میں اس کے نامزد وارث/خاندان کو باہمی امداد کے ذریعے مالی سہارا فراہم کرنا ہے۔',
        ],
      },
      {
        num: 2,
        category: 'foundation',
        titleHi: 'सदस्यता एवं पात्रता',
        titleEn: '2. Membership & Eligibility',
        titleUr: '2. رکنیت اور اہلیت',
        paragraphsHi: [
          'योजना की सदस्यता ट्रस्ट द्वारा निर्धारित नियमों, पात्रता, पंजीकरण प्रक्रिया एवं आवश्यक दस्तावेजों के आधार पर प्रदान की जाएगी।',
        ],
        paragraphsEn: [
          'Scheme membership is granted strictly on the basis of prescribed regulations, eligibility verification, registration procedures, and validated documentation.',
        ],
        paragraphsUr: [
          'اسکیم کی رکنیت مقررہ قواعد، تصدیقی طریقہ کار اور مستند دستاویزات کی جانچ کی بنیاد پر دی جائے گی۔',
        ],
        alertHi: '⚠️ सदस्यता प्राप्त कर लेने मात्र से किसी निश्चित आर्थिक सहायता की गारंटी नहीं होगी।',
        alertEn: '⚠️ Merely obtaining membership does NOT constitute a commercial guarantee of any fixed monetary aid.',
        alertUr: '⚠️ محض رکنیت حاصل کرنے سے کسی مقررہ مالی امداد کی کوئی قانونی ضمانت پیدا نہیں ہوگی۔',
        alertType: 'warning',
      },
      {
        num: 3,
        category: 'foundation',
        titleHi: 'सदस्यता की आयु सीमा',
        titleEn: '3. Membership Age Bracket & Tenure',
        titleUr: '3. رکنیت کے لیے عمر کی حد',
        paragraphsHi: [
          'वर्तमान व्यवस्था के अनुसार सदस्यता के लिए आयु सीमा निम्नवत निर्धारित है:',
        ],
        paragraphsEn: [
          'Under current regulations, membership age limits are defined as follows:',
        ],
        paragraphsUr: [
          'موجودہ ضوابط کے تحت عمر کی حدود درج ذیل ہیں:',
        ],
        listItemsHi: [
          'वर्तमान व्यवस्था के अनुसार सदस्यता प्राप्त करने की न्यूनतम आयु 18 वर्ष तथा अधिकतम आयु 60 वर्ष होगी।',
          'एक बार वैधानिक सदस्य बनने के बाद सदस्यता अधिकतम 65 वर्ष की आयु तक बनाए रखने की अनुमति होगी।',
          '65 वर्ष की आयु पूर्ण होते ही सदस्यता स्वतः समाप्त मानी जाएगी।',
        ],
        listItemsEn: [
          'Under current regulations, the minimum enrollment age is 18 years and maximum is 60 years.',
          'Once registered as a verified member, membership can be retained up to a maximum age of 65 years.',
          'Upon reaching 65 years of age, membership ceases automatically.',
        ],
        listItemsUr: [
          'رکنیت کے اندراج کے لیے کم از کم عمر 18 سال اور زیادہ سے زیادہ 60 سال ہے۔',
          'ایک بار باقاعدہ رکن بننے کے بعد 65 سال کی عمر تک رکنیت برقرار رکھی جا سکتی ہے۔',
          '65 سال کی عمر مکمل ہوتے ہی رکنیت خود بخود ختم ہو جائے گی۔',
        ],
      },
      {
        num: 4,
        category: 'support',
        titleHi: 'वार्षिक ₹100 सहयोग',
        titleEn: '4. Annual ₹100 Administrative Support',
        titleUr: '4. سالانہ ₹100 انتظامی تعاون',
        paragraphsHi: [
          'वैधानिक सदस्यता बनाए रखने के लिए प्रत्येक सदस्य द्वारा ट्रस्ट को ₹100 वार्षिक सहयोग देना आवश्यक होगा।',
          'यह राशि ट्रस्ट के सामाजिक, प्रशासनिक, तकनीकी एवं मानवीय उद्देश्यों के लिए निर्धारित नियमों के अनुसार उपयोग की जाएगी।',
        ],
        paragraphsEn: [
          'To maintain active and verified membership, every member is required to contribute an annual administrative support of ₹100 to the Trust.',
          'This fund is utilized strictly for social, administrative, cloud-tech, and humanitarian operational objectives as governed by bylaws.',
        ],
        paragraphsUr: [
          'رکنیت کو فعال اور برقرار رکھنے کے لیے ہر ممبر پر سالانہ ₹100 کا انتظامی تعاون ٹرسٹ کو ادا کرنا لازمی ہے۔',
          'یہ رقم ٹرسٹ کے تکنیکی سرور، ہیلپ لائن اور فلاحی سرگرمیوں کے انتظام پر خرچ کی جاتی ہے۔',
        ],
      },
      {
        num: 5,
        category: 'support',
        titleHi: 'वार्षिक सहयोग जमा करने की अतिरिक्त अवधि (45 दिन)',
        titleEn: '5. 45-Day Grace Period for Annual Support',
        titleUr: '5. سالانہ تعاون کے لیے 45 دن کی اضافی مہلت',
        paragraphsHi: [
          'वार्षिक ₹100 सहयोग जमा करने के लिए निर्धारित वार्षिक अवधि समाप्त होने के बाद 45 दिन की अतिरिक्त अवधि (Grace Period) दी जाएगी।',
          'सदस्य को सहयोग जमा करके निर्धारित माध्यम से ट्रांजेक्शन विवरण/रसीद अपलोड करनी होगी।',
        ],
        paragraphsEn: [
          'A 45-day grace period is granted following the conclusion of the yearly tenure to deposit the annual ₹100 contribution.',
          'Members must upload the verified transaction receipt/UTR reference through the official portal.',
        ],
        paragraphsUr: [
          'سالانہ ₹100 کے تعاون کے لیے مدت ختم ہونے کے بعد 45 دن کی اضافی رعایتی مہلت (Grace Period) دی جائے گی۔',
          'ممبر کو ادائیگی کر کے پورٹل پر ٹرانزیکشن کی رسید اپ لوڈ کرنا لازمی ہے۔',
        ],
        alertHi: 'निर्धारित अवधि में सहयोग जमा न करने पर सदस्यता समाप्त की जा सकती है तथा संबंधित योजनाओं में अपात्र किया जा सकता है।',
        alertEn: 'Failure to contribute within the grace period may lead to membership termination and ineligibility for scheme benefits.',
        alertUr: 'مقررہ مہلت میں تعاون ادا نہ کرنے پر رکنیت ختم کی جا سکتی ہے۔',
        alertType: 'danger',
      },
      {
        num: 6,
        category: 'organization',
        titleHi: 'आधिकारिक सूचना माध्यम',
        titleEn: '6. Official Communication Channels',
        titleUr: '6. باضابطہ مواصلاتی ذرائع',
        paragraphsHi: [
          'सदस्यों को ट्रस्ट के आधिकारिक WhatsApp Group, Telegram Group, वेबसाइट अथवा अन्य अधिकृत सूचना माध्यमों से जुड़े रहना आवश्यक होगा।',
        ],
        paragraphsEn: [
          'Members must remain connected with the Trust\'s official WhatsApp Groups, Telegram Channel, Official Website, or other designated communication portals.',
        ],
        paragraphsUr: [
          'اراکین کے لیے ٹرسٹ کے باضابطہ واٹس ایپ گروپ، ٹیلی گرام، ویب سائٹ یا موبائل ایپ سے جڑے رہنا لازمی ہے۔',
        ],
      },
      {
        num: 7,
        category: 'support',
        titleHi: 'सदस्य के निधन पर आर्थिक सहयोग',
        titleEn: '7. Solidarity Appeal Upon Demise',
        titleUr: '7. انتقال پر باہمی مالی تعاون کی اپیل',
        paragraphsHi: [
          'किसी वैधानिक सदस्य के आकस्मिक/असामयिक निधन की स्थिति में पात्रता एवं दस्तावेजों की जांच के बाद ट्रस्ट द्वारा पात्र सदस्यों से निर्धारित आर्थिक सहयोग का आधिकारिक आह्वान किया जा सकता है।',
        ],
        paragraphsEn: [
          'Upon the untimely demise of an active verified member, following thorough audit of eligibility and documents, the Trust issues an official collective solidarity appeal to all verified members.',
        ],
        paragraphsUr: [
          'کسی فعال رکن کے ناگہانی انتقال پر تمام دستاویزات کی تصدیق کے بعد ٹرسٹ تمام تصدیق شدہ اراکین سے باہمی مالی تعاون کی اپیل جاری کرے گا۔',
        ],
      },
      {
        num: 8,
        category: 'support',
        titleHi: 'वर्तमान न्यूनतम सहयोग राशि (₹100)',
        titleEn: '8. Current Minimum Contribution (₹100)',
        titleUr: '8. موجودہ کم از کم تعاون کی رقم (₹100)',
        paragraphsHi: [
          'वर्तमान व्यवस्था के अनुसार पात्र दिवंगत सदस्य के मामले में प्रत्येक पात्र सदस्य द्वारा न्यूनतम ₹100 आर्थिक सहयोग किया जाएगा।',
          'सदस्य संख्या एवं उपलब्ध संसाधनों के अनुसार सहयोग राशि को घटाने या बढ़ाने का अधिकार सक्षम/संस्थापक मंडल के पास सुरक्षित रहेगा।',
        ],
        paragraphsEn: [
          'Under the active framework, in the approved demise of a verified member, every verified active member contributes a minimum of ₹100.',
          'The Trust Board reserves the right to modify the contribution quantum based on total active membership count and resource availability.',
        ],
        paragraphsUr: [
          'موجودہ نظام کے تحت منظور شدہ انتقال کے کیس میں ہر فعال ممبر کم از کم ₹100 کا باہمی مالی تعاون پیش کرے گا۔',
          'بورڈ کو ممبران کی تعداد کے لحاظ سے رقم میں ردوبدل کا حق حاصل ہے۔',
        ],
      },
      {
        num: 9,
        category: 'support',
        titleHi: 'लॉक-इन पीरियड (12 माह)',
        titleEn: '9. Mandatory Lock-in Period (12 Months)',
        titleUr: '9. لازمی لاک اِن مدت (12 ماہ)',
        paragraphsHi: [
          'वर्तमान व्यवस्था के अनुसार सदस्यता लेने वाले सदस्यों के लिए 12 माह (1 वर्ष) का लॉक-इन पीरियड रहेगा।',
        ],
        paragraphsEn: [
          'Under active rules, all newly registered members are subject to a mandatory 12-Month Lock-in Period.',
        ],
        paragraphsUr: [
          'موجودہ قوانین کے مطابق تمام نئے اراکین کے لیے 12 ماہ (1 سال) کا لازمی لاک اِن پیریڈ ہوگا۔',
        ],
        alertHi: 'लॉक-इन अवधि पूरी होने से पहले सदस्य की मृत्यु होने पर सामान्यतः उसके नॉमिनी को योजना के अंतर्गत आर्थिक सहयोग के लिए पात्र नहीं माना जाएगा।',
        alertEn: 'If a member passes away prior to completing the 12-month lock-in tenure, the nominee shall generally not be eligible for scheme financial aid.',
        alertUr: 'لاک اِن مدت مکمل ہونے سے قبل انتقال کی صورت میں وارث اسکیم کے تحت مالی امداد کا حقدار نہیں ہوگا۔',
        alertType: 'warning',
      },
      {
        num: 10,
        category: 'support',
        titleHi: 'लॉक-इन अवधि में सहयोग',
        titleEn: '10. Mandatory Contributions During Lock-in',
        titleUr: '10. لاک اِن کے دوران باقاعدہ تعاون',
        paragraphsHi: [
          'लॉक-इन अवधि के दौरान जारी सभी निर्धारित सहयोगों में भाग लेना आवश्यक होगा। सहयोग न करने पर सदस्य की वैधानिकता एवं भविष्य की पात्रता प्रभावित हो सकती है।',
        ],
        paragraphsEn: [
          'Active participation in all collective solidarity appeals issued during the lock-in period is mandatory. Non-participation impacts member standing and future eligibility.',
        ],
        paragraphsUr: [
          'لاک اِن مدت کے دوران جاری ہونے والی تمام امدادی اپیلوں میں حصہ لینا لازمی ہے۔ عدم تعاون سے رکنیت کی اہلیت متاثر ہو سکتی ہے۔',
        ],
      },
      {
        num: 11,
        category: 'support',
        titleHi: '90% सहयोग की अनिवार्यता',
        titleEn: '11. Mandatory 90% Contribution Rate',
        titleUr: '11. 90 فیصد تعاون کی لازمی شرط',
        paragraphsHi: [
          'लॉक-इन अवधि पूर्ण होने के बाद सदस्य को निर्धारित सहयोगों में कम से कम 90% सहयोग करना आवश्यक होगा।',
        ],
        paragraphsEn: [
          'Upon completing the lock-in period, members must maintain a minimum 90% participation track record across all official appeals.',
        ],
        paragraphsUr: [
          'لاک اِن مکمل ہونے کے بعد ممبر کا تمام امدادی مہمات میں کم از کم 90% حصہ لینا لازمی ہوگا۔',
        ],
        alertHi: 'यदि सदस्यता से मृत्यु तक 2 वर्ष से अधिक समय हो चुका है, तो मृत्यु से पूर्व के 2 वर्षों में हुए निर्धारित सहयोगों में 90% सहयोग की पात्रता देखी जाएगी।',
        alertEn: 'If the membership tenure exceeds 2 years, eligibility requires at least 90% contribution compliance during the 2 years immediately preceding the demise.',
        alertUr: 'اگر رکنیت کو 2 سال سے زائد ہو چکے ہوں تو انتقال سے قبل کے 2 سالوں میں 90% تعاون کا ریکارڈ دیکھا جائے گا۔',
        alertType: 'success',
      },
      {
        num: 12,
        category: 'verification',
        titleHi: 'सहयोग की गणना',
        titleEn: '12. Computation of Contribution Records',
        titleUr: '12. مالی تعاون کے ریکارڈ کا حساب',
        paragraphsHi: [
          'सदस्य के सहयोग की गणना ट्रस्ट के उपलब्ध डिजिटल रिकॉर्ड के आधार पर की जाएगी। तकनीकी समस्या, बैंकिंग समस्या या अन्य वास्तविक परिस्थितियों के संबंध में उपलब्ध साक्ष्यों पर सक्षम मंडल विचार कर सकता है।',
        ],
        paragraphsEn: [
          'Member contribution track records are verified through the Trust\'s central digital database. The Board reserves discretion to review genuine banking or technical discrepancies based on verifiable proof.',
        ],
        paragraphsUr: [
          'اراکین کے مالی تعاون کی تصدیق ٹرسٹ کے مرکزی ڈیجیٹل ریکارڈ سے ہوگی۔ بینکنگ خرابی کی صورت میں مناسب ثبوت پیش کرنے پر بورڈ غور کر سکتا ہے۔',
        ],
      },
      {
        num: 13,
        category: 'verification',
        titleHi: 'नॉमिनी के खाते में सहयोग',
        titleEn: '13. Direct Transfer to Nominee Bank Account',
        titleUr: '13. وارث کے بینک اکاؤنٹ میں براہ راست ادائیگی',
        paragraphsHi: [
          'पात्रता एवं सत्यापन पूर्ण होने के बाद आर्थिक सहयोग दिवंगत सदस्य द्वारा दर्ज किए गए पात्र नॉमिनी के अधिकृत बैंक खाते में सीधे भेजने की व्यवस्था की जाएगी।',
        ],
        paragraphsEn: [
          'Following audit and validation, mutual assistance funds are routed directly into the authorized bank account of the designated verified nominee.',
        ],
        paragraphsUr: [
          'مکمل تصدیق کے بعد امدادی رقم مرحوم ممبر کے تصدیق شدہ وارث کے بینک اکاؤنٹ میں براہ راست منتقل کی جائے گی۔',
        ],
      },
      {
        num: 14,
        category: 'verification',
        titleHi: 'मृत्यु के बाद आवेदन (20 दिन)',
        titleEn: '14. Application Window Post-Demise (20 Days)',
        titleUr: '14. انتقال کے بعد درخواست کی مدت (20 دن)',
        paragraphsHi: [
          'आर्थिक सहयोग हेतु मृत्यु की तारीख के बाद 20 दिनों के अंदर ट्रस्ट के निर्धारित ऑनलाइन माध्यम से आवेदन करना आवश्यक होगा।',
          'विशेष परिस्थितियों में सक्षम मंडल कारण एवं उपलब्ध साक्ष्यों के आधार पर विचार कर सकता है।',
        ],
        paragraphsEn: [
          'Formal application for mutual relief must be lodged through the official online system within 20 days of the date of demise.',
          'Under extenuating circumstances, the Board may consider condonation of delay based on authentic documentary rationale.',
        ],
        paragraphsUr: [
          'مالی امداد کے لیے انتقال کی تاریخ سے 20 دنوں کے اندر آن لائن پورٹل پر باضابطہ درخواست دینا لازمی ہے۔',
        ],
      },
      {
        num: 15,
        category: 'verification',
        titleHi: 'मृत्यु प्रमाण-पत्र उपलब्ध न होने पर',
        titleEn: '15. Procedure When Death Certificate is Pending',
        titleUr: '15. ڈیتھ سرٹیفکیٹ تاخیر سے ملنے کی صورت میں',
        paragraphsHi: [
          'यदि निर्धारित अवधि में मृत्यु प्रमाण-पत्र जारी नहीं हुआ है, तो उपलब्ध वैध प्रमाण के आधार पर प्रारंभिक आवेदन किया जा सकता है। मृत्यु प्रमाण-पत्र जारी होने के बाद उसकी प्रति ट्रस्ट के अधिकृत माध्यम पर उपलब्ध कराना आवश्यक होगा।',
        ],
        paragraphsEn: [
          'If the official Death Certificate has not been issued within the stipulated window, initial application can be submitted with interim proof (hospital/cremation/burial proof), with mandatory final certificate submission upon issuance.',
        ],
        paragraphsUr: [
          'اگر مقررہ مدت میں ڈیتھ سرٹیفکیٹ نہ بنا ہو تو ہسپتال یا تدفین کے عبوری ثبوت کے ساتھ ابتدائی درخواست دی جا سکتی ہے، اور سرٹیفکیٹ ملتے ہی اپ لوڈ کرنا ہوگا۔',
        ],
      },
      {
        num: 16,
        category: 'verification',
        titleHi: 'आत्महत्या की स्थिति',
        titleEn: '16. Suicide Cases Policy',
        titleUr: '16. خودکشی کے معاملات پر اصول',
        paragraphsHi: [],
        paragraphsEn: [],
        paragraphsUr: [],
        alertHi: '🚫 आत्महत्या की स्थिति: यदि सदस्य की मृत्यु आत्महत्या के कारण हुई हो, तो इस योजना के अंतर्गत सामान्य आर्थिक सहयोग अपील नहीं की जाएगी। आत्महत्या के अतिरिक्त अन्य मृत्यु की परिस्थितियों में पात्रता एवं नियमों के अधीन सहयोग हेतु अपील की जा सकती है।',
        alertEn: '🚫 Suicide Exclusion: In cases where member demise results from suicide, collective financial solidarity appeals are strictly barred. For all other genuine causes of demise, appeals are processed subject to standard verification bylaws.',
        alertUr: '🚫 خودکشی کا اخراج: اگر رکن کا انتقال خودکشی کی وجہ سے ہوا ہو تو اس اسکیم کے تحت امدادی اپیل بالکل جاری نہیں کی جائے گی۔',
        alertType: 'danger',
      },
      {
        num: 17,
        category: 'verification',
        titleHi: 'नॉमिनी द्वारा सदस्य की हत्या',
        titleEn: '17. Demise Caused by Nominee',
        titleUr: '17. وارث کی مجرمانہ شمولیت پر اصول',
        paragraphsHi: [],
        paragraphsEn: [],
        paragraphsUr: [],
        alertHi: '⚖️ कानूनी प्रावधान: यदि आधिकारिक/विश्वसनीय साक्ष्यों से यह सामने आता है कि दिवंगत सदस्य की हत्या उसके नॉमिनी द्वारा की गई है, तो ऐसे नॉमिनी को आर्थिक सहयोग नहीं दिया जाएगा। ऐसी स्थिति में अन्य पात्र परिजन के संबंध में सक्षम मंडल उपलब्ध साक्ष्यों के आधार पर निर्णय ले सकता है।',
        alertEn: '⚖️ Legal Exclusion: If credible judicial/police records indicate that the member was murdered by their nominee, financial aid is strictly prohibited to such nominee. The Board may adjudicate aid for other innocent dependent family members based on judicial findings.',
        alertUr: '⚖️ قانونی شق: اگر ثابت ہو جائے کہ ممبر کا قتل نامزد وارث نے کیا ہے تو ایسے وارث کو رقم نہیں دی جائے گی۔ بورڈ دیگر بے قصور اہل خانہ کے حق میں فیصلہ کر سکتا ہے۔',
        alertType: 'danger',
      },
      {
        num: 18,
        category: 'transparency',
        titleHi: 'गलती से अधिक राशि भेजे जाने पर',
        titleEn: '18. Inadvertent Excess Remittance',
        titleUr: '18. غلطی سے اضافی رقم منتقل ہونے پر',
        paragraphsHi: [
          'यदि किसी सदस्य द्वारा गलती से निर्धारित राशि से अधिक धनराशि नॉमिनी के खाते में भेज दी जाती है, तो साक्ष्य प्रस्तुत होने पर अतिरिक्त राशि वापस कराने के लिए नॉमिनी से अनुरोध किया जाएगा। ट्रस्ट वापसी के लिए यथासंभव प्रयास करेगा, लेकिन इसकी पूर्ण गारंटी नहीं देगा।',
        ],
        paragraphsEn: [
          'If a member inadvertently transfers excess funds to a nominee\'s account, the Trust will formally request the nominee to refund the excess upon submission of banking proof. The Trust facilitates recovery efforts but cannot provide absolute guarantee.',
        ],
        paragraphsUr: [
          'اگر کسی ممبر کی طرف سے غلطی سے اضافی رقم منتقل ہو جائے تو بینک ثبوت کی بنیاد پر وارث سے واپسی کی درخواست کی جائے گی۔ ٹرسٹ بھرپور کوشش کرے گا مگر قطعی ضمانت نہیں۔',
        ],
      },
      {
        num: 19,
        category: 'support',
        titleHi: 'सहयोग न करने वाले सदस्य की पुनः वैधानिकता',
        titleEn: '19. Reinstatement of Lapsed Membership',
        titleUr: '19. غیر فعال رکن کی دوبارہ بحالی',
        paragraphsHi: [
          'यदि कोई सदस्य निर्धारित सहयोग नहीं करता अथवा 90% सहयोग की पात्रता से बाहर हो जाता है, तो नियमों के अनुसार लगातार 12 माह सहयोग एवं 12 माह की अवधि पूर्ण करने के बाद पुनः वैधानिकता के लिए विचार किया जा सकता है।',
        ],
        paragraphsEn: [
          'If a member defaults on required appeals or drops below the 90% participation threshold, reinstatement of full eligibility may be reviewed only after 12 continuous months of uninterrupted active contributions and tenure.',
        ],
        paragraphsUr: [
          'اگر کوئی رکن 90 فیصد سے کم تعاون کی وجہ سے غیر اہل ہو جائے تو مسلسل 12 ماہ باقاعدہ تعاون کے بعد ہی بحالی پر غور کیا جا سکتا ہے۔',
        ],
      },
      {
        num: 20,
        category: 'organization',
        titleHi: 'हेल्पलाइन एवं तकनीकी सहायता',
        titleEn: '20. Official Helpdesk & Technical Support',
        titleUr: '20. سرکاری ہیلپ لائن اور تکنیکی رہنمائی',
        paragraphsHi: [
          'ट्रस्ट द्वारा सदस्यों की सुविधा के लिए आधिकारिक हेल्पलाइन (+91 82180 17226) उपलब्ध कराई जाएगी। हेल्पलाइन से सदस्यता, आवेदन, दस्तावेज, भुगतान एवं तकनीकी सहायता प्राप्त की जा सकेगी।',
        ],
        paragraphsEn: [
          'The Trust operates an official dedicated Helpdesk (+91 82180 17226). Members can resolve queries concerning enrollment, claims, document uploads, payments, and digital support.',
        ],
        paragraphsUr: [
          'اراکین کی سہولت کے لیے باضابطہ ہیلپ لائن (+91 82180 17226) دستیاب ہے جہاں سے رجسٹریشن، دستاویزات اور تکنیکی مسائل کا حل ملے گا۔',
        ],
      },
      {
        num: 21,
        category: 'verification',
        titleHi: 'सत्यापन एवं दस्तावेज',
        titleEn: '21. Verification & Document Auditing',
        titleUr: '21. دستاویزات کی سخت جانچ پڑتال',
        paragraphsHi: [
          'मृत्यु, सदस्यता, नॉमिनी, बैंक खाता, पहचान एवं अन्य आवश्यक दस्तावेजों की तस्दीक ट्रस्ट द्वारा की जा सकती है। गलत अथवा फर्जी जानकारी मिलने पर आवेदन अस्वीकार अथवा सदस्यता के संबंध में नियमानुसार निर्णय लिया जा सकता है।',
        ],
        paragraphsEn: [
          'The Trust conducts thorough verification of death records, membership tenure, nominee credentials, bank KYC, and identity documents. Falsified submissions result in outright cancellation and membership termination.',
        ],
        paragraphsUr: [
          'ڈیتھ سرٹیفکیٹ، رکنیت، وارث کے کوائف اور بینک اکاؤنٹ کی مکمل تصدیق کی جائے گی۔ جعلی معلومات پر رکنیت فوری منسوخ ہوگی۔',
        ],
      },
      {
        num: 22,
        category: 'transparency',
        titleHi: 'आर्थिक सहयोग की प्रकृति',
        titleEn: '22. Nature of Solidarity Assistance',
        titleUr: '22. مالی تعاون کی سماجی نوعیت',
        paragraphsHi: [
          'यह आर्थिक सहयोग सामाजिक एवं मानवीय सहयोग होगा। सदस्यता मात्र से किसी निश्चित राशि का गारंटीकृत अधिकार उत्पन्न नहीं होगा।',
          'वास्तविक सहायता उपलब्ध निधि, पात्र मामलों, सत्यापन एवं लागू नियमों के अनुसार निर्धारित होगी।',
        ],
        paragraphsEn: [
          'All mutual assistance is purely voluntary social and humanitarian solidarity. Membership does not create an actionable legal claim or guaranteed financial return.',
          'Actual relief disbursed depends on active participation pool, verified cases, and operational bylaws.',
        ],
        paragraphsUr: [
          'یہ امداد خالصتاً رضاکارانہ سماجی اور انسانی اخوت کا مظہر ہے۔ رکنیت سے کسی مخصوص رقم کا کوئی قانونی دعویٰ پیدا نہیں ہوتا۔',
        ],
      },
      {
        num: 23,
        category: 'transparency',
        titleHi: 'व्यक्तिगत खाते एवं निजी UPI का उपयोग निषिद्ध',
        titleEn: '23. Strict Prohibition on Personal UPI/Accounts',
        titleUr: '23. ذاتی کھاتوں اور نجی UPI پر پابندی',
        paragraphsHi: [],
        paragraphsEn: [],
        paragraphsUr: [],
        alertHi: '❌ कड़ा प्रतिबंध: योजना के लिए धन संग्रह हेतु किसी पदाधिकारी अथवा सदस्य के निजी बैंक खाते, निजी UPI या निजी QR Code का उपयोग नहीं किया जाएगा। सभी आधिकारिक भुगतान ट्रस्ट के अधिकृत माध्यम से ही किए जाएंगे।',
        alertEn: '❌ Strict Prohibition: No office bearer or member is permitted to solicit or collect Trust funds into personal bank accounts, private UPI IDs, or private QR codes. All official contributions are routed strictly through institutional channels.',
        alertUr: '❌ سخت ممانعت: اسکیم کے لیے کسی بھی عہدیدار یا ممبر کے ذاتی بینک اکاؤنٹ، ذاتی UPI یا QR کوڈ پر رقوم وصول کرنا سختی سے منع ہے۔',
        alertType: 'danger',
      },
      {
        num: 24,
        category: 'organization',
        titleHi: 'दुष्प्रचार एवं गलत सूचना',
        titleEn: '24. Misinformation & Defamation Clause',
        titleUr: '24. جھوٹی افواہوں اور منفی تشہیر پر ضابطہ',
        paragraphsHi: [
          'यदि कोई सदस्य जानबूझकर ट्रस्ट के संबंध में गलत सूचना, अफवाह अथवा भ्रामक प्रचार करता है और पर्याप्त साक्ष्य उपलब्ध हैं, तो ट्रस्ट नियमों एवं लागू कानून के अनुसार कार्रवाई कर सकता है।',
        ],
        paragraphsEn: [
          'If any individual knowingly spreads false rumors, disparaging remarks, or misleading propaganda against the Trust, statutory disciplinary and legal actions shall be initiated based on evidence.',
        ],
        paragraphsUr: [
          'اگر کوئی رکن جان بوجھ کر ٹرسٹ کے خلاف جھوٹی افواہیں یا گمراہ کن تشہیر کرے تو تادیبی اور قانونی کارروائی کی جائے گی۔',
        ],
      },
      {
        num: 25,
        category: 'organization',
        titleHi: 'पदाधिकारियों के साथ अभद्र व्यवहार',
        titleEn: '25. Zero Tolerance for Indiscipline & Misbehavior',
        titleUr: '25. بدسلوکی پر زیرو ٹالرنس پالیسی',
        paragraphsHi: [
          'यदि कोई सदस्य ट्रस्ट के पदाधिकारी, कर्मचारी अथवा अधिकृत प्रतिनिधि के साथ गंभीर अभद्र व्यवहार करता है या ट्रस्ट की गतिविधियों को नुकसान पहुंचाने वाली गतिविधि में संलिप्त पाया जाता है, तो पर्याप्त साक्ष्य के आधार पर उसकी सदस्यता समाप्त की जा सकती है।',
        ],
        paragraphsEn: [
          'Zero tolerance is maintained against abuse, harassment, or defamatory conduct towards office bearers, volunteers, or staff. Proven misconduct results in immediate forfeiture of membership.',
        ],
        paragraphsUr: [
          'ٹرسٹ کے نمائندوں یا رضاکاروں کے ساتھ بدسلوکی کرنے کی صورت میں رکنیت فوری طور پر منسوخ کی جا سکتی ہے۔',
        ],
      },
      {
        num: 26,
        category: 'transparency',
        titleHi: 'वार्षिक ₹100 सहयोग का उपयोग (A से O)',
        titleEn: '26. Detailed Utilization of Annual ₹100 Fund (A to O)',
        titleUr: '26. سالانہ ₹100 فنڈ کا باضابطہ استعمال (A تا O)',
        paragraphsHi: [
          'वार्षिक ₹100 सहयोग का उपयोग ट्रस्ट के उद्देश्यों के अनुसार निम्न 15 मुख्य कार्यों (A से O) में किया जा सकता है:',
        ],
        paragraphsEn: [
          'The annual ₹100 administrative support fund is strictly utilized across the following 15 approved operational facets (A to O):',
        ],
        paragraphsUr: [
          'سالانہ ₹100 کے فنڈ کا استعمال درج ذیل 15 فلاحی اور انتظامی امور (A تا O) کے لیے کیا جاتا ہے:',
        ],
        gridItemsHi: [
          'A. वेबसाइट निर्माण एवं संचालन',
          'B. ऐप निर्माण एवं संचालन',
          'C. जिला एवं प्रदेश कार्यालय खर्च',
          'D. हेल्पलाइन स्टाफ मानदेय व खर्च',
          'E. परिवार का स्थलीय सत्यापन',
          'F. प्रचार-प्रसार व सदस्यता अभियान',
          'G. तकनीकी एवं डिजिटल व्यवस्था',
          'H. जरूरतमंदों व छात्रों में सहयोग',
          'I. ब्लॉक/जिला/प्रदेश कार्यशालाएं',
          'J. कंबल एवं राहत वितरण',
          'K. प्राकृतिक आपदा राहत',
          'L. कार्यालय किराया व संचालन',
          'M. अनाथ बच्चों की शिक्षा सहयोग',
          'N. अंतिम संस्कार हेतु सहायता',
          'O. अन्य सामाजिक व मानवीय कार्य',
        ],
        gridItemsEn: [
          'A. Website Development & Cloud Hosting',
          'B. Mobile App Maintenance & Security',
          'C. District & State Office Running Costs',
          'D. Helpdesk Staff Honorarium & Telecom',
          'E. Physical Ground Verifications',
          'F. Public Outreach & Membership Drives',
          'G. Digital Server Infrastructure',
          'H. Direct Needy Student & Patient Aid',
          'I. District & State Level Workshops',
          'J. Winter Blanket & Emergency Relief',
          'K. Disaster Relief & Crisis Response',
          'L. Office Rents & Administrative Utilities',
          'M. Orphan Education Scholarships',
          'N. Funeral & Final Rite Assistance',
          'O. Other Humanitarian Welfare Works',
        ],
        gridItemsUr: [
          'A. ویب سائٹ ڈیولپمنٹ و ہوسٹنگ',
          'B. موبائل ایپ کا انتظام',
          'C. ضلعی و صوبائی دفتری اخراجات',
          'D. ہیلپ لائن اسٹاف کے اخراجات',
          'E. فیلڈ میں زمینی تصدیق',
          'F. ممبرشپ مہم و تشہیر',
          'G. ڈیجیٹل سرور کا نظام',
          'H. ضرورت مند طلبہ و مریضوں کی امداد',
          'I. ضلعی ورکشاپس کا انعقاد',
          'J. کمبل و ایمرجنسی راشن تقسیم',
          'K. قدرتی آفات میں ریلیف',
          'L. دفتری کرایہ و بلز',
          'M. یتیم بچوں کی تعلیمی کفالت',
          'N. تجہیز و تکفین میں مدد',
          'O. دیگر سماجی و فلاحی خدمات',
        ],
      },
      {
        num: 27,
        category: 'transparency',
        titleHi: 'रिकॉर्ड एवं पारदर्शिता',
        titleEn: '27. Immutable Record Keeping & Transparency',
        titleUr: '27. ریکارڈ کا تحفظ اور شفافیت',
        paragraphsHi: [
          'सदस्यता, वार्षिक सहयोग, मृत्यु संबंधी आवेदन, नॉमिनी, आर्थिक सहयोग, दस्तावेज एवं बैंक/भुगतान रिकॉर्ड पूर्णतः सुरक्षित और पारदर्शी रखा जाएगा।',
        ],
        paragraphsEn: [
          'All records pertaining to membership rosters, annual contributions, bereavement claims, nominee assignments, digital UTR transactions, and bank statements are digitally maintained with strict transparency.',
        ],
        paragraphsUr: [
          'تمام ممبر لسٹ، سالانہ فنڈز، امدادی دعوے، وارث اور ادائیگیوں کا ڈیجیٹل ریکارڈ مکمل شفافیت کے ساتھ رکھا جائے گا۔',
        ],
      },
      {
        num: 28,
        category: 'verification',
        titleHi: 'पात्रता पर निर्णय',
        titleEn: '28. Board Adjudication on Eligibility',
        titleUr: '28. اہلیت پر بورڈ کا حتمی فیصلہ',
        paragraphsHi: [
          'लॉक-इन, 90% सहयोग, सदस्यता, मृत्यु, नॉमिनी एवं दस्तावेजों की समग्र जांच के बाद सक्षम/संस्थापक मंडल अंतिम निर्णय लेगा।',
        ],
        paragraphsEn: [
          'Final adjudication on claims is rendered exclusively by the Competent Trust Board following rigorous audit of lock-in compliance, 90% participation ratios, identity verification, and authentic documentation.',
        ],
        paragraphsUr: [
          'لاک اِن، 90% تعاون، شناخت اور تمام کاغذات کی تفصیلی جانچ کے بعد مجاز بورڈ حتمی فیصلہ کرے گا۔',
        ],
      },
      {
        num: 29,
        category: 'organization',
        titleHi: 'नियमों में संशोधन',
        titleEn: '29. Bylaw Amendment Procedures',
        titleUr: '29. ضوابط میں ترمیم کا طریقہ کار',
        paragraphsHi: [
          'योजना के नियमों में आवश्यकता के अनुसार संशोधन किया जा सकता है। संशोधन Trust Deed, लागू कानून एवं ट्रस्ट की सक्षम संस्था की प्रक्रिया के अनुसार होगा।',
        ],
        paragraphsEn: [
          'Regulations may be revised periodically in accordance with prevailing circumstances. All amendments remain subject to the registered Trust Deed and statutory regulations.',
        ],
        paragraphsUr: [
          'وقت اور ضرورت کے مطابق ٹرسٹ ڈیڈ اور ملکی قوانین کی حدود میں رہتے ہوئے ضوابط میں ترامیم کی جا سکتی ہیں۔',
        ],
      },
      {
        num: 30,
        category: 'foundation',
        titleHi: 'Trust Deed सर्वोपरि',
        titleEn: '30. Supremacy of Registered Trust Deed',
        titleUr: '30. رجسٹرڈ ٹرسٹ ڈیڈ کی بالادستی',
        paragraphsHi: [],
        paragraphsEn: [],
        paragraphsUr: [],
        alertHi: '⚖️ इस नियमावली और Trust Deed अथवा लागू कानून के बीच किसी विरोधाभास की स्थिति में Trust Deed एवं लागू कानून प्रभावी होंगे।',
        alertEn: '⚖️ In any event of conflict between these bylaws and the registered Trust Deed or prevailing statutory laws, the registered Trust Deed and Indian law shall prevail supreme.',
        alertUr: '⚖️ کسی بھی تضاد کی صورت میں رجسٹرڈ ٹرسٹ ڈیڈ اور ملکی قوانین کو ہی فوقیت حاصل ہوگی۔',
        alertType: 'gold',
      },
    ],
    []
  );

  // ─── Scheme 2: MFCT बेटी निकाह सहारा योजना (26 Rules) ─────────────────
  const nikahSchemeRules: RuleModel[] = useMemo(
    () => [
      {
        num: 1,
        category: 'foundation',
        titleHi: 'योजना का नाम',
        titleEn: '1. Scheme Name & Objective',
        titleUr: '1. اسکیم کا نام اور مقصد',
        paragraphsHi: [
          'इस योजना का नाम “MFCT बेटी निकाह सहारा योजना” होगा। यह योजना MOHAMMAD FAEEM CHARITABLE TRUST (MFCT) द्वारा सामाजिक सहयोग एवं जरूरतमंद परिवारों की सहायता के उद्देश्य से संचालित की जाएगी।',
        ],
        paragraphsEn: [
          'This initiative is officially named “MFCT Daughter Marriage Support Scheme” (MFCT बेटी निकाह सहारा योजना), administered by MOHAMMAD FAEEM CHARITABLE TRUST (MFCT) to extend mutual community solidarity to families during daughter marriages.',
        ],
        paragraphsUr: [
          'اس اسکیم کا نام “MFCT بیٹی نکاح سہارا اسکیم” ہوگا، جو ضرورت مند خاندانوں کی بچیوں کے نکاح میں باہمی سماجی تعاون کے لیے چلائی جائے گی۔',
        ],
      },
      {
        num: 2,
        category: 'support',
        titleHi: 'सदस्यता एवं Lock-in Period (Slabs)',
        titleEn: '2. Tiered Membership Lock-in Period',
        titleUr: '2. رکنیت اور مرحلہ وار لاک اِن مدت',
        paragraphsHi: [
          'सदस्यता की तिथि से सदस्य संख्या के आधार पर निम्न लॉक-इन अवधि लागू होगी:',
        ],
        paragraphsEn: [
          'The lock-in period applies based on the member registration sequence at enrollment:',
        ],
        paragraphsUr: [
          'رکنیت کے وقت ممبر رجسٹریشن نمبر کے لحاظ سے درج ذیل لاک اِن مدت لاگو ہوگی:',
        ],
        slabs: [
          {
            titleHi: 'सदस्य क्रमांक 1 से 1,000',
            titleEn: 'Member No. 1 to 1,000',
            titleUr: 'ممبر نمبر 1 تا 1,000',
            valHi: '180 दिन',
            valEn: '180 Days',
            valUr: '180 دن',
            subHi: 'प्रारंभिक सदस्य',
            subEn: 'Early Phase',
            subUr: 'ابتدائی ممبرز',
            color: '#10b981',
          },
          {
            titleHi: 'सदस्य क्रमांक 1,001 से 10,000',
            titleEn: 'Member No. 1,001 to 10,000',
            titleUr: 'ممبر نمبر 1,001 تا 10,000',
            valHi: '365 दिन (1 वर्ष)',
            valEn: '365 Days (1 Yr)',
            valUr: '365 دن (1 سال)',
            subHi: 'द्वितीय चरण',
            subEn: 'Phase II',
            subUr: 'دوسرا مرحلہ',
            color: '#f59e0b',
          },
          {
            titleHi: 'सदस्य क्रमांक 10,001 से आगे',
            titleEn: 'Member No. 10,001 Onwards',
            titleUr: 'ممبر نمبر 10,001 سے آگے',
            valHi: '2 वर्ष (24 माह)',
            valEn: '2 Years (24 Mo)',
            valUr: '2 سال (24 ماہ)',
            subHi: 'मानक चरण',
            subEn: 'Standard Phase',
            subUr: 'معیاری مرحلہ',
            color: '#3b82f6',
          },
        ],
        alertHi: '💡 महत्वपूर्ण: सदस्यता के समय लागू लॉक-इन अवधि बाद में सदस्य संख्या बढ़ने पर भी नहीं बदलेगी।',
        alertEn: '💡 Grandfather Clause: The lock-in slab assigned at enrollment remains unchanged even if the total membership scales later.',
        alertUr: '💡 اہم نکتہ: اندراج کے وقت ملنے والا لاک اِن سلیب بعد میں ممبرز کی تعداد بڑھنے سے تبدیل نہیں ہوگا۔',
        alertType: 'info',
      },
      {
        num: 3,
        category: 'support',
        titleHi: '90% तआवुन (सहयोग) की अनिवार्यता',
        titleEn: '3. Mandatory 90% Ta’awun Compliance',
        titleUr: '3. 90 فیصد تعاون (تعاون) کی لازمی شرط',
        paragraphsHi: [
          'सदस्यता की तिथि से बेटी के निकाह की तिथि तक निर्धारित सभी सहयोगों में कम से कम 90% तआवुन (सहयोग) करना आवश्यक होगा।',
        ],
        paragraphsEn: [
          'Members must maintain at least 90% active contribution (Ta\'awun) across all official solidarity campaigns from their date of enrollment until the date of the daughter\'s wedding.',
        ],
        paragraphsUr: [
          'رکنیت کے دن سے بیٹی کے نکاح کی تاریخ تک تمام امدادی مہمات میں کم از کم 90% تعاون پیش کرنا لازمی ہوگا۔',
        ],
      },
      {
        num: 4,
        category: 'support',
        titleHi: 'मरहूम सदस्य के परिवार में तआवुन',
        titleEn: '4. Mutual Aid for Bereaved Families',
        titleUr: '4. مرحوم ممبر کے اہل خانہ کے لیے تعاون',
        paragraphsHi: [
          'किसी वैधानिक सदस्य के इंतकाल की स्थिति में योजना के नियमों के अनुसार उसके पात्र परिवार के लिए जारी सहयोग में अन्य पात्र सदस्यों द्वारा निर्धारित सहयोग करना आवश्यक होगा।',
        ],
        paragraphsEn: [
          'Upon the demise of an active verified member, all verified members must contribute to the mutual assistance appeal issued for the bereaved family under scheme rules.',
        ],
        paragraphsUr: [
          'کسی رکن کے انتقال پر اس کے خاندان کے لیے جاری کی گئی امدادی مہم میں تمام اراکین کا مقررہ تعاون ادا کرنا ضروری ہے۔',
        ],
      },
      {
        num: 5,
        category: 'verification',
        titleHi: 'बेटी निकाह सहारा की पात्रता',
        titleEn: '5. Daughter Marriage Aid Eligibility',
        titleUr: '5. بیٹی نکاح سہارا کی بنیادی اہلیت',
        paragraphsHi: [
          'सदस्य की जैविक बेटी (Biological Daughter) के निकाह के लिए निर्धारित लॉक-इन पूरा होना तथा 90% सहयोग की शर्त पूरी होना आवश्यक होगा।',
          'सहायता की वास्तविक राशि उपलब्ध निधि, पात्रता, दस्तावेजों की तस्दीक एवं लागू नियमों के आधार पर निर्धारित होगी।',
        ],
        paragraphsEn: [
          'Assistance applies exclusively for the marriage of a member\'s biological daughter, subject to completion of the applicable lock-in period and 90% contribution compliance.',
          'Disbursed amount depends on collective voluntary pool, case audit, and operational bylaws.',
        ],
        paragraphsUr: [
          'امداد کا اطلاق صرف سگی بیٹی (Biological Daughter) کے نکاح پر ہوگا بشرطیکہ لاک اِن اور 90% تعاون پورا ہو۔',
        ],
      },
      {
        num: 6,
        category: 'verification',
        titleHi: 'अधिकतम दो बेटियों की पात्रता',
        titleEn: '6. Maximum Two Daughters Benefit Limit',
        titleUr: '6. زیادہ سے زیادہ 2 بیٹیوں کی حد',
        paragraphsHi: [
          'एक सदस्य की अधिकतम दो जैविक बेटियों (Max 2 Daughters) के निकाह के लिए पात्रता हो सकती है। प्रत्येक बेटी के मामले में निर्धारित शर्तों का पालन आवश्यक होगा।',
        ],
        paragraphsEn: [
          'A verified member is eligible to apply for aid for a maximum of two biological daughters during their lifetime membership, subject to independent fulfillment of all criteria for each daughter.',
        ],
        paragraphsUr: [
          'ایک ممبر زیادہ سے زیادہ دو سگی بیٹیوں (Max 2 Daughters) کے نکاح کے لیے امداد حاصل کر سکتا ہے۔',
        ],
      },
      {
        num: 7,
        category: 'verification',
        titleHi: 'भाई के लिए विशेष पात्रता',
        titleEn: '7. Special Eligibility for Biological Brothers',
        titleUr: '7. کفالت کرنے والے سگے بھائی کے لیے خصوصی اہلیت',
        paragraphsHi: [
          'यदि कोई जैविक भाई अपनी बहन/बहनों अथवा बेटियों की जिम्मेदारी निभा रहा है, तो वह नियमों के अनुसार सदस्य बन सकता है।',
        ],
        paragraphsEn: [
          'If a biological brother is maintaining and supporting dependent sisters/daughters as head of household, he may register under special provisions.',
        ],
        paragraphsUr: [
          'اگر کوئی سگا بھائی بہنوں یا بیٹیوں کی کفالت کی ذمہ داری سنبھال رہا ہو تو وہ خصوصی قواعد کے تحت ممبر بن سکتا ہے۔',
        ],
        alertHi: 'अधिकतम पात्रता सीमा:\n• 2 बहनें, अथवा\n• 2 बेटियाँ, अथवा\n• 1 बहन + 1 बेटी।\n(संबंध का वैध दस्तावेज प्रमाण अनिवार्य होगा)',
        alertEn: 'Maximum Benefit Cap:\n• 2 Sisters, OR\n• 2 Daughters, OR\n• 1 Sister + 1 Daughter.\n(Valid proof of kinship is mandatory)',
        alertUr: 'زیادہ سے زیادہ حد:\n• 2 بہنیں، یا\n• 2 بیٹیاں، یا\n• 1 بہن + 1 بیٹی۔\n(خونی رشتے کا قانونی ثبوت لازمی ہے)',
        alertType: 'success',
      },
      {
        num: 8,
        category: 'verification',
        titleHi: 'माता-पिता के इंतकाल की स्थिति',
        titleEn: '8. Both Parents Deceased Provision',
        titleUr: '8. والدین کی وفات کی صورت میں شق',
        paragraphsHi: [
          'यदि दोनों माता-पिता का इंतकाल हो चुका है और कोई वयस्क जैविक भाई बहन की जिम्मेदारी निभा रहा है, तो निर्धारित लॉक-इन एवं 90% सहयोग की शर्तों के अधीन पात्रता पर विचार किया जा सकता है।',
        ],
        paragraphsEn: [
          'In tragic circumstances where both parents are deceased and an adult biological brother assumes guardianship of unmarried sisters, eligibility may be sanctioned under standard lock-in and 90% compliance rules.',
        ],
        paragraphsUr: [
          'اگر والدین وفات پا چکے ہوں اور سگا بھائی غیر شادی شدہ بہنوں کی کفالت کر رہا ہو تو معیار کے مطابق اہلیت دیکھی جائے گی۔',
        ],
      },
      {
        num: 9,
        category: 'verification',
        titleHi: 'माता-पिता की आयु 60 वर्ष से अधिक',
        titleEn: '9. Parents Aged Above 60 Years Provision',
        titleUr: '9. والدین کی عمر 60 سال سے زائد ہونے پر',
        paragraphsHi: [
          'यदि दोनों माता-पिता की आयु 60 वर्ष से अधिक है और जैविक भाई परिवार की जिम्मेदारी निभा रहा है, तो निर्धारित शर्तों के अनुसार पात्रता पर विचार किया जा सकता है।',
        ],
        paragraphsEn: [
          'Where both parents have crossed 60 years of age and the biological brother bears sole family responsibility, the scheme accommodates eligibility under standard verification bylaws.',
        ],
        paragraphsUr: [
          'اگر دونوں والدین کی عمر 60 سال سے زیادہ ہو اور سگا بھائی کفالت کر رہا ہو تو اہلیت پر غور کیا جائے گا۔',
        ],
      },
      {
        num: 10,
        category: 'verification',
        titleHi: 'बेटी की सदस्यता',
        titleEn: '10. Daughter Enrollment Protocol',
        titleUr: '10. بیٹی کے اندراج کا ضابطہ',
        paragraphsHi: [
          'जहाँ योजना के अनुसार आवश्यक हो, संबंधित बेटी की सदस्यता भी निर्धारित प्रक्रिया के अनुसार आवश्यक होगी।',
          'योजना का उद्देश्य बेटियों को योजना से जोड़ना तथा कानूनी विवाह योग्य आयु में ही निकाह को प्रोत्साहित करना है।',
        ],
        paragraphsEn: [
          'Where prescribed by bylaws, registration of the beneficiary daughter is required under standard onboarding protocols.',
          'The objective is empowering daughters and strictly encouraging weddings within legally permissible marriageable ages.',
        ],
        paragraphsUr: [
          'جہاں ضروری ہو بیٹی کا باضابطہ رجسٹریشن کرایا جائے گا۔ مقصد قانونی عمر میں نکاح کی حوصلہ افزائی ہے۔',
        ],
      },
      {
        num: 11,
        category: 'verification',
        titleHi: 'निकाह की आयु (कानूनी आयु)',
        titleEn: '11. Legal Age of Marriage Compliance',
        titleUr: '11. شادی کی قانونی عمر کی پابندی',
        paragraphsHi: [],
        paragraphsEn: [],
        paragraphsUr: [],
        alertHi: '⚖️ वैधानिक आयु अनिवार्यता: सहायता तभी विचारणीय होगी जब बेटी ने लागू कानून के अनुसार विवाह की वैधानिक आयु पूरी कर ली हो। आयु प्रमाण (Aadhaar/10th Certificate/Birth Certificate) की गहन तस्दीक की जाएगी।',
        alertEn: '⚖️ Statutory Age Compliance: Applications are sanctioned ONLY if the bride has fulfilled the minimum statutory legal age of marriage under prevailing Indian law. Rigorous verification of official age proof (Aadhaar/Birth Certificate) is mandatory.',
        alertUr: '⚖️ قانونی عمر کی شرط: امداد صرف اسی صورت ملے گی جب بیٹی نے ملکی قانون کے تحت شادی کی مقررہ قانونی عمر مکمل کر لی ہو۔ عمر کے اسناد کی سخت تصدیق ہوگی۔',
        alertType: 'warning',
      },
      {
        num: 12,
        category: 'verification',
        titleHi: 'पति-पत्नी दोनों सदस्य होने पर',
        titleEn: '12. Single Claim Policy for Spouses',
        titleUr: '12. میاں بیوی دونوں کے ممبر ہونے پر اصول',
        paragraphsHi: [
          'यदि पति और पत्नी दोनों सदस्य हैं, तो एक ही बेटी के निकाह के लिए दोनों में से केवल एक सदस्य आवेदन कर सकेगा। एक ही बेटी के लिए दोहरा लाभ नहीं दिया जाएगा।',
        ],
        paragraphsEn: [
          'If both husband and wife are registered members, only one parent can claim assistance for a given daughter. Dual claims for the same wedding are strictly prohibited.',
        ],
        paragraphsUr: [
          'اگر والدین دونوں الگ الگ ممبر ہوں تو ایک بیٹی کے نکاح پر صرف ایک ہی کلیم کر سکے گا۔ دہرا فائدہ نہیں دیا جائے گا۔',
        ],
      },
      {
        num: 13,
        category: 'support',
        titleHi: 'सदस्य के स्वयं के निकाह पर इमदाद',
        titleEn: '13. Self-Marriage Aid Policy',
        titleUr: '13. ممبر کے اپنے ذاتی نکاح پر پالیسی',
        paragraphsHi: [
          'सदस्य के अपने स्वयं के निकाह के लिए इस योजना के अंतर्गत सामान्यतः आर्थिक सहायता उपलब्ध नहीं होगी।',
        ],
        paragraphsEn: [
          'Assistance under this scheme is strictly oriented towards daughters/sisters and is not applicable for a member\'s own wedding.',
        ],
        paragraphsUr: [
          'رکن کے اپنے ذاتی نکاح کے لیے اس اسکیم کے تحت امداد نہیں دی جاتی۔',
        ],
      },
      {
        num: 14,
        category: 'support',
        titleHi: 'तआवुन की राशि (अधिकतम ₹50)',
        titleEn: '14. Maximum Contribution Quantum (₹50)',
        titleUr: '14. فی ممبر تعاون کی حد (زیادہ سے زیادہ ₹50)',
        paragraphsHi: [
          'प्रत्येक पात्र बेटी के निकाह के मामले में प्रत्येक पात्र सदस्य द्वारा वर्तमान व्यवस्था के अनुसार अधिकतम ₹50 तक निर्धारित आर्थिक सहयोग किया जा सकता है।',
          'सभी सहयोग ट्रस्ट के अधिकृत माध्यम से किए जाएंगे।',
        ],
        paragraphsEn: [
          'For each sanctioned daughter wedding appeal, every active verified member contributes a maximum of ₹50 under active operational bylaws.',
          'All contributions must flow via verified Trust payment gateways.',
        ],
        paragraphsUr: [
          'ہر منظور شدہ نکاح کی مہم میں ہر فعال ممبر سے زیادہ سے زیادہ ₹50 کا تعاون لیا جائے گا۔',
        ],
      },
      {
        num: 15,
        category: 'verification',
        titleHi: 'निकाह से पहले आवेदन (कम से कम 30 दिन)',
        titleEn: '15. Prior Application Notice (Min 30 Days)',
        titleUr: '15. نکاح سے کم از کم 30 دن قبل درخواست',
        paragraphsHi: [
          'निकाह की प्रस्तावित तिथि से कम से कम 30 दिन पहले आवेदन करना आवश्यक होगा। विशेष परिस्थितियों में सक्षम समिति विचार कर सकती है।',
        ],
        paragraphsEn: [
          'Applications must be submitted at least 30 days prior to the scheduled date of Nikah to permit field audit and campaign scheduling.',
        ],
        paragraphsUr: [
          'نکاح کی طے شدہ تاریخ سے کم از کم 30 دن پہلے باقاعدہ درخواست دینا ضروری ہے۔',
        ],
      },
      {
        num: 16,
        category: 'verification',
        titleHi: 'आवश्यक दस्तावेज',
        titleEn: '16. Compulsory Documentation Checklist',
        titleUr: '16. لازمی دستاویزات کی فہرست',
        paragraphsHi: [
          'आवश्यकतानुसार निम्न 8 अनिवार्य दस्तावेज प्रस्तुत करने होंगे:',
        ],
        paragraphsEn: [
          'Standard document verification audit checklist (8 items):',
        ],
        paragraphsUr: [
          'جانچ پڑتال کے لیے درج ذیل 8 دستاویزات لازمی ہیں:',
        ],
        gridItemsHi: [
          '1. सदस्यता प्रमाण व KYC',
          '2. सदस्य पहचान पत्र',
          '3. बेटी का आयु व आधार',
          '4. अभिभावक दस्तावेज',
          '5. वैध संबंध प्रमाण',
          '6. निकाहनामा / शादी कार्ड',
          '7. बैंक खाता पासबुक/चेक',
          '8. ग्राउंड सत्यापन रिपोर्ट',
        ],
        gridItemsEn: [
          '1. Member KYC & ID',
          '2. Member ID Proof',
          '3. Bride Age & Aadhaar',
          '4. Guardian Documents',
          '5. Proof of Kinship',
          '6. Wedding Card / Proof',
          '7. Bank Passbook / KYC',
          '8. Ground Audit Report',
        ],
        gridItemsUr: [
          '1. ممبرشپ ثبوت و KYC',
          '2. ممبر کا شناختی کارڈ',
          '3. بیٹی کا آدھار و عمر ثبوت',
          '4. سرپرست کے اسناد',
          '5. خونی رشتے کا ثبوت',
          '6. نکاح نامہ / شادی کارڈ',
          '7. بینک اکاؤنٹ کا ثبوت',
          '8. فیلڈ کی تصدیقی رپورٹ',
        ],
      },
      {
        num: 17,
        category: 'verification',
        titleHi: 'दस्तावेजों की तस्दीक',
        titleEn: '17. Multi-Tier Verification Audit',
        titleUr: '17. کاغذات کی تصدیق اور آڈٹ',
        paragraphsHi: [
          'ट्रस्ट द्वारा प्रस्तुत दस्तावेजों एवं जानकारी की तस्दीक की जाएगी। गलत, अधूरी अथवा फर्जी जानकारी मिलने पर आवेदन रोकने, अस्वीकार करने अथवा सदस्यता के संबंध में नियमानुसार निर्णय लिया जा सकता है।',
        ],
        paragraphsEn: [
          'The Trust undertakes stringent physical and digital audits of all submissions. Incomplete, dubious, or forged records invite summary rejection and membership revocation.',
        ],
        paragraphsUr: [
          'پیش کردہ تمام کاغذات کی زمینی و تکنیکی تصدیق ہوگی۔ جعلی اسناد پر درخواست مسترد اور رکنیت معطل کر دی جائے گی۔',
        ],
      },
      {
        num: 18,
        category: 'transparency',
        titleHi: 'इमदाद की प्रकृति',
        titleEn: '18. Humanitarian Nature of Imdaad',
        titleUr: '18. امداد کی باہمی فلاحی حیثیت',
        paragraphsHi: [
          'इस योजना के अंतर्गत आर्थिक सहायता सामाजिक एवं मानवीय सहयोग के रूप में होगी। सदस्यता लेने मात्र से किसी निश्चित राशि की गारंटी नहीं होगी।',
        ],
        paragraphsEn: [
          'Assistance under this scheme is voluntary mutual solidarity (Imdaad). Enrollment does not create any contractual guarantee or entitlement of fixed financial returns.',
        ],
        paragraphsUr: [
          'یہ امداد رضاکارانہ سماجی اور انسانی اخوت پر مبنی ہے۔ رکنیت سے کسی لازمی فکسڈ رقم کی قانونی گارنٹی پیدا نہیں ہوتی۔',
        ],
      },
      {
        num: 19,
        category: 'support',
        titleHi: 'इमदाद प्राप्त करने के बाद सदस्य की जिम्मेदारी (10 वर्ष)',
        titleEn: '19. Post-Aid Member Commitment (10 Years 90% Support)',
        titleUr: '19. امداد ملنے کے بعد 10 سالہ مسلسل تعاون کا عہد',
        paragraphsHi: [],
        paragraphsEn: [],
        paragraphsUr: [],
        alertHi: '🤝 10 वर्ष निरंतर सहयोग संकल्प: बेटी के निकाह की सहायता प्राप्त करने के बाद सदस्य से अपेक्षा होगी कि वह कम से कम 10 वर्षों तक 90% सहयोग की व्यवस्था में भाग लेता रहे। नियमित सहयोग न करने पर भविष्य की पात्रता एवं अन्य पारिवारिक योजनाओं की वैधानिकता प्रभावित हो सकती है।',
        alertEn: '🤝 10-Year Solidarity Commitment: Upon receiving daughter wedding financial assistance, the beneficiary member is committed to participating in at least 90% of all future mutual appeals for a minimum of 10 continuous years. Failure to maintain participation affects future eligibility and standing.',
        alertUr: '🤝 10 سالہ یکجہتی کا عہد: بیٹی کے نکاح کی امداد ملنے کے بعد ممبر کم از کم 10 سال تک 90% باہمی امدادی مہمات میں باقاعدہ حصہ لینے کا پابند ہوگا۔',
        alertType: 'success',
      },
      {
        num: 20,
        category: 'transparency',
        titleHi: 'व्यक्तिगत खाते या निजी UPI का उपयोग निषिद्ध',
        titleEn: '20. Prohibition on Private Bank Accounts/UPI',
        titleUr: '20. ذاتی بینک اکاؤنٹس اور نجی UPI پر سختی سے ممانعت',
        paragraphsHi: [],
        paragraphsEn: [],
        paragraphsUr: [],
        alertHi: '❌ निजी खाते प्रतिबंधित: ट्रस्ट की योजना के अंतर्गत किसी पदाधिकारी अथवा सदस्य के निजी बैंक खाते, निजी UPI अथवा निजी QR Code के माध्यम से धन संग्रह नहीं किया जाएगा।',
        alertEn: '❌ Prohibition on Private Channels: Solicitation or collection of scheme contributions via private personal bank accounts, private UPI IDs, or personal QR codes is strictly prohibited.',
        alertUr: '❌ نجی کھاتوں پر ممانعت: کسی بھی عہدیدار یا ممبر کے ذاتی بینک اکاؤنٹ، ذاتی UPI یا QR کوڈ پر فنڈز وصول کرنا سختی سے ممنوع ہے۔',
        alertType: 'danger',
      },
      {
        num: 21,
        category: 'transparency',
        titleHi: 'सामूहिक सहयोग की व्यवस्था',
        titleEn: '21. Collective Social Assistance Model',
        titleUr: '21. اجتماعی سماجی یکجہتی کا ماڈل',
        paragraphsHi: [
          'सदस्यों का सहयोग सामूहिक सामाजिक सहायता व्यवस्था का हिस्सा होगा। किसी सदस्य द्वारा दिया गया सहयोग किसी विशेष व्यक्ति को व्यक्तिगत भुगतान नहीं माना जाएगा।',
        ],
        paragraphsEn: [
          'Contributions form part of an institutional collective social solidarity ecosystem and cannot be treated as private personal transactions between individual members.',
        ],
        paragraphsUr: [
          'اراکین کا تعاون اجتماعی فلاحی نظام کا حصہ ہے، اسے کسی فرد کا نجی لین دین تصور نہیں کیا جائے گا۔',
        ],
      },
      {
        num: 22,
        category: 'transparency',
        titleHi: 'रिकॉर्ड एवं पारदर्शिता',
        titleEn: '22. Records & Complete Transparency',
        titleUr: '22. ریکارڈ اور مکمل شفافیت',
        paragraphsHi: [
          'सदस्यता, सहयोग, सहायता प्राप्त मामलों, लाभार्थियों, दस्तावेजों एवं बैंक/भुगतान संबंधी रिकॉर्ड सुरक्षित रखे जाएंगे।',
        ],
        paragraphsEn: [
          'All records regarding member directories, case approvals, beneficiaries, disbursement proofs, and bank accounts are securely archived with full digital transparency.',
        ],
        paragraphsUr: [
          'تمام ممبر لسٹ، امدادی کیسز، بینک ٹرانزیکشنز اور دستاویزات کا مکمل شفاف ریکارڈ محفوظ رہے گا۔',
        ],
      },
      {
        num: 23,
        category: 'verification',
        titleHi: 'पात्रता पर अंतिम निर्णय',
        titleEn: '23. Board Adjudication on Marriage Aid',
        titleUr: '23. بیٹی نکاح امداد پر بورڈ کا حتمی فیصلہ',
        paragraphsHi: [
          'सदस्यता मात्र से सहायता का अधिकार स्वतः उत्पन्न नहीं होगा। लॉक-इन, 90% सहयोग, दस्तावेज, संबंध, आयु एवं निकाह संबंधी शर्तों की जांच के बाद सक्षम मंडल निर्णय लेगा।',
        ],
        paragraphsEn: [
          'Membership does not confer automatic right to financial aid. Sanctions are governed by Board review following verification of lock-in compliance, 90% contribution records, kinship proofs, and marriage eligibility.',
        ],
        paragraphsUr: [
          'صرف رکنیت سے امداد کا خودکار حق پیدا نہیں ہوگا۔ تمام شرائط، قانونی عمر اور 90% تعاون کی تصدیق کے بعد ہی بورڈ فیصلہ کرے گا۔',
        ],
      },
      {
        num: 24,
        category: 'organization',
        titleHi: 'गलत जानकारी एवं धोखाधड़ी',
        titleEn: '24. Fraud & Misrepresentation Clause',
        titleUr: '24. جعلسازی اور دھوکہ دہی پر قانونی کارروائی',
        paragraphsHi: [
          'फर्जी दस्तावेज, गलत जानकारी अथवा धोखाधड़ी पाए जाने पर आवेदन अस्वीकार किया जा सकता है तथा सदस्यता एवं भविष्य की पात्रता के संबंध में नियमानुसार निर्णय लिया जा सकता है।',
        ],
        paragraphsEn: [
          'Any falsification, counterfeit documentation, or fraud leads to immediate disqualification, cancellation of membership, and potential legal actions under prevailing laws.',
        ],
        paragraphsUr: [
          'جعلی دستاویزات یا غلط بیانی کی صورت میں کیس فوری طور پر مسترد اور رکنیت مستقل ختم کر دی جائے گی۔',
        ],
      },
      {
        num: 25,
        category: 'organization',
        titleHi: 'नियमों में संशोधन',
        titleEn: '25. Bylaw Amendments',
        titleUr: '25. ضوابط میں ترمیم کا اختیار',
        paragraphsHi: [
          'योजना के नियमों में आवश्यकता के अनुसार संशोधन किया जा सकता है। संशोधन Trust Deed, लागू कानून एवं ट्रस्ट की सक्षम संस्था की प्रक्रिया के अनुसार होगा।',
        ],
        paragraphsEn: [
          'The Trust Board reserves the right to amend scheme rules in line with operational requirements, subject to the registered Trust Deed and applicable statutory laws.',
        ],
        paragraphsUr: [
          'ٹرسٹ ڈیڈ اور ملکی قوانین کی روشنی میں ضرورت کے تحت ضوابط میں ضروری ترامیم کا حق محفوظ ہے۔',
        ],
      },
      {
        num: 26,
        category: 'foundation',
        titleHi: 'Trust Deed सर्वोपरि',
        titleEn: '26. Supremacy of Registered Trust Deed',
        titleUr: '26. رجسٹرڈ ٹرسٹ ڈیڈ کی بالادستی',
        paragraphsHi: [],
        paragraphsEn: [],
        paragraphsUr: [],
        alertHi: '⚖️ इस नियमावली और Trust Deed अथवा लागू कानून के बीच विरोधाभास होने पर Trust Deed एवं लागू कानून प्रभावी होंगे।',
        alertEn: '⚖️ In any circumstance of divergence between this policy and the registered Trust Deed or statutory enactments, the registered Trust Deed and Indian law shall prevail supreme.',
        alertUr: '⚖️ کسی بھی تضاد کی صورت میں رجسٹرڈ ٹرسٹ ڈیڈ اور ملکی قوانین کو ہی فوقیت حاصل ہوگی۔',
        alertType: 'gold',
      },
    ],
    []
  );

  // ─── Filtered Rules ──────────────────────────────────────────────────
  const filteredDeathRules = useMemo(() => {
    return deathSchemeRules.filter((rule) => {
      const matchesCat = activeCategory === 'all' || rule.category === activeCategory;
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const numMatch = rule.num.toString().includes(q);
      const titleMatch =
        rule.titleHi.toLowerCase().includes(q) ||
        rule.titleEn.toLowerCase().includes(q) ||
        rule.titleUr.toLowerCase().includes(q);
      return numMatch || titleMatch;
    });
  }, [deathSchemeRules, activeCategory, searchQuery]);

  const filteredNikahRules = useMemo(() => {
    return nikahSchemeRules.filter((rule) => {
      const matchesCat = activeCategory === 'all' || rule.category === activeCategory;
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const numMatch = rule.num.toString().includes(q);
      const titleMatch =
        rule.titleHi.toLowerCase().includes(q) ||
        rule.titleEn.toLowerCase().includes(q) ||
        rule.titleUr.toLowerCase().includes(q);
      return numMatch || titleMatch;
    });
  }, [nikahSchemeRules, activeCategory, searchQuery]);

  const totalFilteredCount =
    (selectedScheme === 'all' || selectedScheme === 'death' ? filteredDeathRules.length : 0) +
    (selectedScheme === 'all' || selectedScheme === 'nikah' ? filteredNikahRules.length : 0);

  // ─── Actions ──────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      await Share.share({
        title: 'MOHAMMAD FAEEM CHARITABLE TRUST (MFCT) — नियमावली',
        message:
          'MFCT नियमावली एवं संचालन नियम (कुल 56 नियम — आकस्मिक निधन एवं बेटी निकाह सहारा) — “याद उनकी, सेवा हमारी”\nhttps://mohammadfaeemtrust.org/niyamawali',
      });
    } catch {
      // Ignored
    }
  };

  const handleCall = () => {
    Linking.openURL('tel:+918218017226');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/918218017226?text=MFCT%20Niyamawali%20Enquiry');
  };

  // Helper for text styling
  const cardBgStyle = { backgroundColor: isDark ? '#0f172a' : C.white };
  const borderStyle = { borderColor: isDark ? '#1e293b' : C.border };
  const textColorStyle = { color: isDark ? C.white : '#0f172a' };
  const textMutedStyle = { color: isDark ? C.textMutedDark : C.textMuted };

  // Helper for alert box styling
  const renderAlertBox = (rule: RuleModel) => {
    const text =
      lang === 'ur' ? rule.alertUr || rule.alertHi : lang === 'en' ? rule.alertEn || rule.alertHi : rule.alertHi;
    if (!text) return null;

    let bg = 'rgba(239,68,68,0.08)';
    let border = 'rgba(239,68,68,0.25)';
    let color = '#dc2626';

    if (rule.alertType === 'warning') {
      bg = 'rgba(245,158,11,0.08)';
      border = 'rgba(245,158,11,0.3)';
      color = isDark ? '#fbbf24' : '#b45309';
    } else if (rule.alertType === 'success') {
      bg = 'rgba(16,185,129,0.08)';
      border = 'rgba(16,185,129,0.3)';
      color = isDark ? '#34d399' : '#047857';
    } else if (rule.alertType === 'info') {
      bg = 'rgba(59,130,246,0.08)';
      border = 'rgba(59,130,246,0.3)';
      color = isDark ? '#60a5fa' : '#1d4ed8';
    } else if (rule.alertType === 'gold') {
      bg = C.deepGreen;
      border = C.gold;
      color = C.goldLight;
    }

    return (
      <View
        style={{
          marginTop: 8,
          padding: 10,
          borderRadius: 12,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: border,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: color,
            lineHeight: 16,
          }}
        >
          {text}
        </Text>
      </View>
    );
  };

  // Helper for rendering a rule card
  const renderRuleCard = (rule: RuleModel, schemePrefix: string) => {
    const title =
      lang === 'ur' ? rule.titleUr || rule.titleHi : lang === 'en' ? rule.titleEn || rule.titleHi : rule.titleHi;
    const paragraphs =
      lang === 'ur'
        ? rule.paragraphsUr && rule.paragraphsUr.length > 0
          ? rule.paragraphsUr
          : rule.paragraphsHi
        : lang === 'en'
        ? rule.paragraphsEn && rule.paragraphsEn.length > 0
          ? rule.paragraphsEn
          : rule.paragraphsHi
        : rule.paragraphsHi;

    const listItems =
      lang === 'ur'
        ? rule.listItemsUr || rule.listItemsHi
        : lang === 'en'
        ? rule.listItemsEn || rule.listItemsHi
        : rule.listItemsHi;

    const gridItems =
      lang === 'ur'
        ? rule.gridItemsUr || rule.gridItemsHi
        : lang === 'en'
        ? rule.gridItemsEn || rule.gridItemsHi
        : rule.gridItemsHi;

    return (
      <View
        key={`${schemePrefix}-${rule.num}`}
        style={[
          {
            borderRadius: 18,
            borderWidth: 1,
            padding: 15,
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2,
            marginBottom: 12,
          },
          cardBgStyle,
          borderStyle,
        ]}
      >
        {/* Rule Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 10,
            marginBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#1e293b' : 'rgba(26,60,44,0.06)',
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: C.deepGreen,
              borderWidth: 1,
              borderColor: C.gold,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
              flexShrink: 0,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '900', color: C.goldLight }}>
              {rule.num}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                {
                  fontSize: 13,
                  fontWeight: '800',
                  lineHeight: 18,
                },
                textColorStyle,
              ]}
            >
              {title}
            </Text>
            <Text
              style={{
                fontSize: 9,
                color: C.goldDark,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginTop: 2,
              }}
            >
              MFCT Rule #{rule.num} • {rule.category}
            </Text>
          </View>
        </View>

        {/* Rule Paragraphs */}
        {paragraphs && paragraphs.length > 0 && (
          <View style={{ gap: 6 }}>
            {paragraphs.map((para, pIdx) => (
              <Text
                key={pIdx}
                style={[
                  {
                    fontSize: 11.5,
                    lineHeight: 18,
                  },
                  isDark ? { color: '#cbd5e1' } : { color: '#334155' },
                ]}
              >
                {para}
              </Text>
            ))}
          </View>
        )}

        {/* Rule Bullet Lists (e.g. Rule 3) */}
        {listItems && listItems.length > 0 && (
          <View style={{ marginTop: 6, gap: 5 }}>
            {listItems.map((item, lIdx) => (
              <View key={lIdx} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text style={{ color: C.goldDark, fontWeight: '900', marginRight: 6, fontSize: 12 }}>
                  •
                </Text>
                <Text
                  style={[
                    { flex: 1, fontSize: 11, lineHeight: 17 },
                    isDark ? { color: '#cbd5e1' } : { color: '#334155' },
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Slabs Display (e.g. Nikah Rule 2) */}
        {rule.slabs && rule.slabs.length > 0 && (
          <View style={{ marginTop: 8, gap: 6 }}>
            {rule.slabs.map((slab, sIdx) => {
              const sTitle = lang === 'ur' ? slab.titleUr : lang === 'en' ? slab.titleEn : slab.titleHi;
              const sVal = lang === 'ur' ? slab.valUr : lang === 'en' ? slab.valEn : slab.valHi;
              const sSub = lang === 'ur' ? slab.subUr : lang === 'en' ? slab.subEn : slab.subHi;
              return (
                <View
                  key={sIdx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: isDark ? '#1e293b' : '#f8faf9',
                    borderLeftWidth: 4,
                    borderLeftColor: slab.color,
                    borderWidth: 1,
                    borderColor: isDark ? '#334155' : 'rgba(0,0,0,0.06)',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 11, fontWeight: '700' }, textColorStyle]}>{sTitle}</Text>
                    <Text style={[{ fontSize: 9.5, marginTop: 1 }, textMutedStyle]}>{sSub}</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: slab.color }}>{sVal}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Grid Items Display (e.g. Death Rule 26 A-O, Nikah Rule 16 8 Docs) */}
        {gridItems && gridItems.length > 0 && (
          <View style={{ marginTop: 8, gap: 5 }}>
            {gridItems.map((gItem, gIdx) => (
              <View
                key={gIdx}
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                }}
              >
                <Text style={[{ fontSize: 10.5, fontWeight: '600' }, isDark ? { color: '#e2e8f0' } : { color: '#1e293b' }]}>
                  {gItem}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Alert / Highlight Box */}
        {renderAlertBox(rule)}
      </View>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? '#080d1a' : '#f8faf9' }}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── 1. LUXURY HERO HEADER BANNER ─────────────────────────────── */}
      <View
        style={{
          backgroundColor: C.deepGreen,
          paddingHorizontal: 16,
          paddingTop: 18,
          paddingBottom: 24,
          borderBottomWidth: 2,
          borderBottomColor: C.gold,
        }}
      >
        {/* Trust Badge */}
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: C.goldBg,
              borderWidth: 1,
              borderColor: C.gold,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
              gap: 5,
            }}
          >
            <Sparkles size={12} color={C.goldLight} />
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: C.goldLight, letterSpacing: 0.6 }}>
              MOHAMMAD FAEEM CHARITABLE TRUST (MFCT)
            </Text>
          </View>
        </View>

        {/* Header Title */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: '900',
            color: C.white,
            textAlign: 'center',
            lineHeight: 26,
            marginBottom: 4,
          }}
        >
          {lang === 'hi'
            ? 'नियमावली एवं संचालन नियम'
            : lang === 'ur'
            ? 'سرکاری قواعد و ضوابط'
            : 'Official Rules & Regulations'}
        </Text>

        {/* Tagline */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '900',
            color: C.goldLight,
            textAlign: 'center',
            letterSpacing: 0.5,
            marginBottom: 6,
          }}
        >
          {lang === 'hi'
            ? '“याद उनकी, सेवा हमारी”'
            : lang === 'ur'
            ? '“یاد ان کی، خدمت ہماری”'
            : '“In Their Memory, In Our Service”'}
        </Text>

        <Text
          style={{
            fontSize: 11,
            color: '#cbd5e1',
            textAlign: 'center',
            lineHeight: 16,
            marginBottom: 14,
          }}
        >
          {lang === 'hi'
            ? 'MFCT की वैधानिक नियमावली, सामूहिक सहयोग संरचना, सदस्यता दायित्व एवं पारदर्शिता दिशानिर्देश (कुल 56 नियम)।'
            : lang === 'ur'
            ? 'ٹرسٹ کے تمام باضابطہ قوانین، باہمی مالی تعاون اور شفافیت کے رہنما اصول (کل 56 قواعد)۔'
            : 'Official bylaws, mutual solidarity frameworks, membership duties, and transparency guidelines (All 56 Rules).'}
        </Text>

        {/* 4 Quick Summary Highlight Cards */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Card 1: Annual Support */}
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.35)',
                borderRadius: 14,
                padding: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <Text style={{ fontSize: 9, color: C.goldLight, fontWeight: '800', textTransform: 'uppercase' }}>
                {lang === 'hi' ? 'वार्षिक संचालन सहयोग' : lang === 'ur' ? 'سالانہ انتظامی تعاون' : 'Annual Support'}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: C.white, marginVertical: 2 }}>₹100</Text>
              <Text style={{ fontSize: 9, color: '#94a3b8' }}>
                {lang === 'hi' ? '45 दिन अतिरिक्त अवधि' : lang === 'ur' ? '45 دن اضافی مہلت' : '45-Day Grace Period'}
              </Text>
            </View>

            {/* Card 2: Death Scheme */}
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.35)',
                borderRadius: 14,
                padding: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <Text style={{ fontSize: 9, color: C.goldLight, fontWeight: '800', textTransform: 'uppercase' }}>
                {lang === 'hi' ? 'आकस्मिक निधन योजना' : lang === 'ur' ? 'ناگہانی انتقال اسکیم' : 'Bereavement Scheme'}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#34d399', marginVertical: 2 }}>
                {lang === 'hi' ? 'न्यूनतम ₹100' : lang === 'ur' ? 'کم از کم ₹100' : 'Min ₹100'}
              </Text>
              <Text style={{ fontSize: 9, color: '#94a3b8' }}>
                {lang === 'hi' ? '12 माह लॉक-इन • 90% सहयोग' : lang === 'ur' ? '12 ماہ لاک اِن • 90% تعاون' : '12-Mo Lock-in • 90% Aid'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Card 3: Nikah Scheme */}
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.35)',
                borderRadius: 14,
                padding: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <Text style={{ fontSize: 9, color: C.goldLight, fontWeight: '800', textTransform: 'uppercase' }}>
                {lang === 'hi' ? 'बेटी निकाह सहारा' : lang === 'ur' ? 'بیٹی نکاح سہارا' : 'Marriage Support'}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#f59e0b', marginVertical: 2 }}>
                {lang === 'hi' ? 'अधिकतम ₹50' : lang === 'ur' ? 'زیادہ سے زیادہ ₹50' : 'Max ₹50'}
              </Text>
              <Text style={{ fontSize: 9, color: '#94a3b8' }}>
                {lang === 'hi' ? '180d / 365d / 2yr • 2 बेटियाँ' : lang === 'ur' ? 'سلیب لاک اِن • 2 بیٹیاں' : 'Tiered Slabs • 2 Daughters'}
              </Text>
            </View>

            {/* Card 4: 100% Direct */}
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.35)',
                borderRadius: 14,
                padding: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <Text style={{ fontSize: 9, color: C.goldLight, fontWeight: '800', textTransform: 'uppercase' }}>
                {lang === 'hi' ? 'पारदर्शिता व भुगतान' : lang === 'ur' ? 'براہ راست ادائیگی' : '100% Direct Transfer'}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: C.white, marginVertical: 2 }}>
                100% {lang === 'hi' ? 'प्रत्यक्ष' : lang === 'ur' ? 'براہ راست' : 'Direct'}
              </Text>
              <Text style={{ fontSize: 9, color: '#94a3b8' }}>
                {lang === 'hi' ? 'सीधे नॉमिनी खाते में' : lang === 'ur' ? 'وارث کے اکاؤنٹ میں' : 'Direct to Nominee Bank'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TouchableOpacity
            onPress={handleShare}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: 10,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
            }}
          >
            <Share2 size={13} color={C.white} />
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: C.white }}>
              {lang === 'hi' ? 'शेयर करें' : lang === 'ur' ? 'شیئر کریں' : 'Share Bylaws'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCall}
            style={{
              flex: 1.2,
              backgroundColor: '#059669',
              borderRadius: 10,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <PhoneCall size={13} color={C.goldLight} />
            <Text style={{ fontSize: 10.5, fontWeight: '800', color: C.white }}>+91 82180 17226</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── 2. SCHEME SELECTOR TABS & SEARCH / FILTER ────────────────── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        {/* Scheme Selector Tabs */}
        <View style={{ gap: 6, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setSelectedScheme('all')}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 14,
              borderWidth: 1.5,
              backgroundColor: selectedScheme === 'all' ? C.deepGreen : isDark ? '#0f172a' : C.white,
              borderColor: selectedScheme === 'all' ? C.gold : isDark ? '#1e293b' : C.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Layers size={16} color={selectedScheme === 'all' ? C.goldLight : isDark ? '#94a3b8' : '#64748b'} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '900',
                color: selectedScheme === 'all' ? C.goldLight : isDark ? C.white : '#0f172a',
              }}
            >
              {lang === 'hi'
                ? '🌟 दोनों योजनाएं (सभी 56 नियम)'
                : lang === 'ur'
                ? '🌟 دونوں اسکیمیں (کل 56 قواعد)'
                : '🌟 Both Schemes (All 56 Rules)'}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              onPress={() => setSelectedScheme('death')}
              style={{
                flex: 1,
                paddingVertical: 9,
                paddingHorizontal: 8,
                borderRadius: 12,
                borderWidth: 1.5,
                backgroundColor: selectedScheme === 'death' ? C.deepGreen : isDark ? '#0f172a' : C.white,
                borderColor: selectedScheme === 'death' ? C.gold : isDark ? '#1e293b' : C.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <HeartHandshake size={14} color={selectedScheme === 'death' ? '#34d399' : '#10b981'} />
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '800',
                  color: selectedScheme === 'death' ? C.goldLight : isDark ? C.white : '#0f172a',
                }}
              >
                {lang === 'hi'
                  ? '🕊️ आकस्मिक निधन (30)'
                  : lang === 'ur'
                  ? '🕊️ ناگہانی انتقال (30)'
                  : '🕊️ Bereavement (30)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedScheme('nikah')}
              style={{
                flex: 1,
                paddingVertical: 9,
                paddingHorizontal: 8,
                borderRadius: 12,
                borderWidth: 1.5,
                backgroundColor: selectedScheme === 'nikah' ? C.deepGreen : isDark ? '#0f172a' : C.white,
                borderColor: selectedScheme === 'nikah' ? C.gold : isDark ? '#1e293b' : C.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <Heart size={14} color={selectedScheme === 'nikah' ? '#f59e0b' : '#a855f7'} />
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '800',
                  color: selectedScheme === 'nikah' ? C.goldLight : isDark ? C.white : '#0f172a',
                }}
              >
                {lang === 'hi'
                  ? '💍 बेटी निकाह (26)'
                  : lang === 'ur'
                  ? '💍 بیٹی نکاح (26)'
                  : '💍 Marriage (26)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: Platform.OS === 'ios' ? 10 : 6,
              borderWidth: 1,
              marginBottom: 10,
            },
            cardBgStyle,
            borderStyle,
          ]}
        >
          <Search size={15} color={isDark ? '#64748b' : '#94a3b8'} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              lang === 'hi'
                ? 'नियम खोजें (उदा. 90%, लॉक-इन, नॉमिनी, ₹100)...'
                : lang === 'ur'
                ? 'قواعد تلاش کریں (لاک اِن، 90%، وارث)...'
                : 'Search rules (e.g. 90%, lock-in, nominee, ₹100)...'
            }
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            style={[
              {
                flex: 1,
                fontSize: 11.5,
                padding: 0,
              },
              textColorStyle,
            ]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          style={{ marginBottom: 10 }}
        >
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            const label = lang === 'ur' ? cat.labelUr : lang === 'en' ? cat.labelEn : cat.labelHi;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={{
                  paddingHorizontal: 11,
                  paddingVertical: 6,
                  borderRadius: 10,
                  borderWidth: 1,
                  backgroundColor: isSelected ? C.deepGreen : isDark ? '#0f172a' : '#ebf3ef',
                  borderColor: isSelected ? C.gold : isDark ? '#1e293b' : '#deede5',
                }}
              >
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: '700',
                    color: isSelected ? C.goldLight : isDark ? '#94a3b8' : '#2c4035',
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results Counter */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[{ fontSize: 10, fontWeight: '600' }, textMutedStyle]}>
            {lang === 'hi'
              ? `${totalFilteredCount} नियम प्रदर्शित हो रहे हैं`
              : lang === 'ur'
              ? `${totalFilteredCount} قواعد دستیاب ہیں`
              : `Showing ${totalFilteredCount} matching rules`}
          </Text>
          {(searchQuery || activeCategory !== 'all') && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
            >
              <Text style={{ fontSize: 10, color: '#10b981', fontWeight: '800' }}>
                {lang === 'hi' ? 'फ़िल्टर हटाएं ✕' : lang === 'ur' ? 'فلٹر صاف کریں ✕' : 'Clear Filter ✕'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── 3. SCHEME 1: MFCT आकस्मिक निधन परिवार सहारा योजना ──────── */}
      {(selectedScheme === 'all' || selectedScheme === 'death') && (
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          {/* Scheme 1 Banner */}
          <View
            style={{
              backgroundColor: C.deepGreen,
              borderRadius: 18,
              padding: 16,
              borderWidth: 1.5,
              borderColor: C.gold,
              marginBottom: 14,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(200,168,75,0.2)',
                borderWidth: 1,
                borderColor: 'rgba(200,168,75,0.4)',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
                marginBottom: 6,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '900', color: C.goldLight }}>
                {lang === 'hi' ? 'योजना 1 • SCHEME 01' : lang === 'ur' ? 'اسکیم 01 • ناگہانی انتقال' : 'SCHEME 01 • BEREAVEMENT'}
              </Text>
            </View>

            <Text style={{ fontSize: 16, fontWeight: '900', color: C.white, lineHeight: 22, marginBottom: 3 }}>
              {lang === 'hi'
                ? 'MFCT आकस्मिक निधन परिवार सहारा योजना'
                : lang === 'ur'
                ? 'MFCT ناگہانی انتقال فیملی سہارا اسکیم'
                : 'MFCT Accidental Death Family Support Scheme'}
            </Text>

            <Text style={{ fontSize: 12, fontWeight: '800', color: C.goldLight, marginBottom: 6 }}>
              {lang === 'hi'
                ? 'टैगलाइन — “याद उनकी, सेवा हमारी”'
                : lang === 'ur'
                ? 'نعرہ — “یاد ان کی، خدمت ہماری”'
                : 'Tagline — “In Their Memory, In Our Service”'}
            </Text>

            <Text style={{ fontSize: 10.5, color: '#cbd5e1', lineHeight: 15 }}>
              {lang === 'hi'
                ? 'ट्रस्ट के वैधानिक सदस्य के असामयिक निधन की स्थिति में उसके पात्र नॉमिनी/परिवार को सामूहिक सहयोग की नियमावली (नियम 1 से 30)।'
                : lang === 'ur'
                ? 'تصدیق شدہ رکن کے ناگہانی انتقال پر اہل وارث کو باہمی مالی امداد فراہم کرنے کے مکمل 30 قواعد۔'
                : 'Official bylaws governing mutual collective financial support upon untimely demise (Rules 1 to 30).'}
            </Text>
          </View>

          {/* Scheme 1 Rules List */}
          {filteredDeathRules.length === 0 ? (
            <View
              style={[
                {
                  borderRadius: 14,
                  padding: 20,
                  alignItems: 'center',
                  borderWidth: 1,
                  marginBottom: 10,
                },
                cardBgStyle,
                borderStyle,
              ]}
            >
              <Text style={[{ fontSize: 11 }, textMutedStyle]}>
                {lang === 'hi'
                  ? 'योजना 1 में कोई नियम नहीं मिला।'
                  : lang === 'ur'
                  ? 'اسکیم 1 میں کوئی قاعدہ نہیں ملا۔'
                  : 'No rules found in Scheme 1.'}
              </Text>
            </View>
          ) : (
            filteredDeathRules.map((rule) => renderRuleCard(rule, 'death'))
          )}

          {/* Scheme 1 Quote Card */}
          <View
            style={{
              backgroundColor: C.deepGreen,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1.5,
              borderColor: C.gold,
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: C.goldLight, textTransform: 'uppercase', marginBottom: 4 }}>
              {lang === 'hi' ? 'विशेष घोषणा (SPECIAL DECLARATION)' : lang === 'ur' ? 'خصوصی اعلان' : 'SPECIAL DECLARATION'}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '900',
                color: C.white,
                fontStyle: 'italic',
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 6,
              }}
            >
              {lang === 'hi'
                ? '“आज हम किसी जरूरतमंद परिवार के साथ खड़े हों, ताकि कल जरूरत के समय समाज हमारे साथ खड़ा हो।”'
                : lang === 'ur'
                ? '“آج ہم کسی ضرورت مند خاندان کے ساتھ کھڑے ہوں، تاکہ کل ضرورت کے وقت معاشرہ ہمارے ساتھ کھڑا ہو۔”'
                : '“Stand with a family in need today, so tomorrow in your hour of need, society stands united with you.”'}
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '800', color: C.goldLight }}>
              MOHAMMAD FAEEM CHARITABLE TRUST (MFCT)
            </Text>
          </View>
        </View>
      )}

      {/* ─── 4. SCHEME 2: MFCT बेटी निकाह सहारा योजना ──────────────── */}
      {(selectedScheme === 'all' || selectedScheme === 'nikah') && (
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          {/* Scheme 2 Banner */}
          <View
            style={{
              backgroundColor: C.deepGreen,
              borderRadius: 18,
              padding: 16,
              borderWidth: 1.5,
              borderColor: C.gold,
              marginBottom: 14,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(200,168,75,0.2)',
                borderWidth: 1,
                borderColor: 'rgba(200,168,75,0.4)',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
                marginBottom: 6,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '900', color: C.goldLight }}>
                {lang === 'hi' ? 'योजना 2 • SCHEME 02' : lang === 'ur' ? 'اسکیم 02 • بیٹی نکاح' : 'SCHEME 02 • DAUGHTER MARRIAGE'}
              </Text>
            </View>

            <Text style={{ fontSize: 16, fontWeight: '900', color: C.white, lineHeight: 22, marginBottom: 3 }}>
              {lang === 'hi'
                ? 'MFCT बेटी निकाह सहारा योजना'
                : lang === 'ur'
                ? 'MFCT بیٹی نکاح سہارا اسکیم'
                : 'MFCT Daughter Marriage Support Scheme'}
            </Text>

            <Text style={{ fontSize: 12, fontWeight: '800', color: C.goldLight, marginBottom: 6 }}>
              {lang === 'hi'
                ? 'टैगलाइन — “याद उनकी, सेवा हमारी”'
                : lang === 'ur'
                ? 'نعرہ — “یاد ان کی، خدمت ہماری”'
                : 'Tagline — “In Their Memory, In Our Service”'}
            </Text>

            <Text style={{ fontSize: 10.5, color: '#cbd5e1', lineHeight: 15 }}>
              {lang === 'hi'
                ? 'पात्र एवं सक्रिय सदस्य की जैविक बेटी/बहन के निकाह के अवसर पर सामूहिक आर्थिक सहयोग नियमावली (नियम 1 से 26)।'
                : lang === 'ur'
                ? 'فعال رکن کی سگی بیٹی/بہن کے نکاح پر باہمی سماجی تعاون کے مکمل 26 قواعد۔'
                : 'Official bylaws governing mutual community solidarity during daughter/sister marriages (Rules 1 to 26).'}
            </Text>
          </View>

          {/* Scheme 2 Rules List */}
          {filteredNikahRules.length === 0 ? (
            <View
              style={[
                {
                  borderRadius: 14,
                  padding: 20,
                  alignItems: 'center',
                  borderWidth: 1,
                  marginBottom: 10,
                },
                cardBgStyle,
                borderStyle,
              ]}
            >
              <Text style={[{ fontSize: 11 }, textMutedStyle]}>
                {lang === 'hi'
                  ? 'योजना 2 में कोई नियम नहीं मिला।'
                  : lang === 'ur'
                  ? 'اسکیم 2 میں کوئی قاعدہ نہیں ملا۔'
                  : 'No rules found in Scheme 2.'}
              </Text>
            </View>
          ) : (
            filteredNikahRules.map((rule) => renderRuleCard(rule, 'nikah'))
          )}

          {/* Scheme 2 Quote Card */}
          <View
            style={{
              backgroundColor: C.deepGreen,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1.5,
              borderColor: C.gold,
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: C.goldLight, textTransform: 'uppercase', marginBottom: 4 }}>
              {lang === 'hi' ? 'विशेष घोषणा (SPECIAL DECLARATION)' : lang === 'ur' ? 'خصوصی اعلان' : 'SPECIAL DECLARATION'}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '900',
                color: C.white,
                fontStyle: 'italic',
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 6,
              }}
            >
              {lang === 'hi'
                ? '“आज हम किसी की बेटी के निकाह में सहारा बनें, ताकि कल जरूरत के वक्त समाज हमारे साथ खड़ा हो।”'
                : lang === 'ur'
                ? '“آج ہم کسی کی بیٹی کے نکاح میں سہارا بنیں، تاکہ کل ضرورت کے وقت معاشرہ ہمارے ساتھ کھڑا ہو۔”'
                : '“Be a supporting pillar in someone’s daughter’s wedding today, so tomorrow in your time of need, society stands with you.”'}
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '800', color: C.goldLight }}>
              MOHAMMAD FAEEM CHARITABLE TRUST (MFCT)
            </Text>
          </View>
        </View>
      )}

      {/* ─── 5. GRAND CLOSING SOLEMN PLEDGE & JOIN CTA ─────────────── */}
      <View style={{ paddingHorizontal: 16 }}>
        <View
          style={{
            backgroundColor: C.deepGreen,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1.5,
            borderColor: C.gold,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: C.goldLight,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 4,
            }}
          >
            {lang === 'hi' ? 'MFCT का अंतिम संकल्प' : lang === 'ur' ? 'ٹرسٹ کا بنیادی منشور' : 'MFCT SOLEMN PLEDGE'}
          </Text>

          <Text
            style={{
              fontSize: 15,
              fontWeight: '900',
              color: C.white,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 6,
            }}
          >
            {lang === 'hi'
              ? 'MFCT का संकल्प है: '
              : lang === 'ur'
              ? 'ٹرسٹ کا عہد ہے: '
              : 'MFCT Solemn Pledge: '}
            <Text style={{ color: C.goldLight }}>
              {lang === 'hi'
                ? 'कोई परिवार मुश्किल में अकेला न रहे।'
                : lang === 'ur'
                ? 'کوئی خاندان مشکل میں تنہا نہ رہے۔'
                : 'No family shall face calamity alone.'}
            </Text>
          </Text>

          {/* 4 Pillars */}
          <View style={{ gap: 6, marginVertical: 12 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: C.white }}>
                  {lang === 'hi' ? 'यादें → सेवा बनें' : lang === 'ur' ? 'یادیں → خدمت بنیں' : 'Memories → Service'}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: C.white }}>
                  {lang === 'hi' ? 'मोहब्बत → मदद बने' : lang === 'ur' ? 'محبت → مدد بنے' : 'Compassion → Support'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: C.white }}>
                  {lang === 'hi' ? 'सदस्यता → जिम्मेदारी बने' : lang === 'ur' ? 'رکنیت → ذمہ داری بنے' : 'Membership → Duty'}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: C.white }}>
                  {lang === 'hi' ? 'एकता → ताकत बने' : lang === 'ur' ? 'اتحاد → طاقت بنے' : 'Unity → Strength'}
                </Text>
              </View>
            </View>
          </View>

          <Text
            style={{
              fontSize: 10.5,
              color: '#cbd5e1',
              textAlign: 'center',
              lineHeight: 16,
              marginBottom: 14,
            }}
          >
            {lang === 'hi'
              ? '₹100 वार्षिक व्यवस्था संचालन सहयोग देकर MFCT कम्युनिटी के सत्यापित सदस्य बनें।'
              : lang === 'ur'
              ? '₹100 کا سالانہ انتظامی تعاون ادا کر کے تصدیق شدہ رکن بنیں۔'
              : 'Contribute the ₹100 annual support and become a verified MFCT member.'}
          </Text>

          {/* Action Buttons */}
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/sign-up')}
              style={{
                backgroundColor: C.gold,
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: C.gold,
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 3,
                gap: 6,
              }}
            >
              <UserPlus size={15} color={C.darkGreen} />
              <Text style={{ color: C.darkGreen, fontWeight: '900', fontSize: 12 }}>
                {lang === 'hi'
                  ? 'सदस्य बनें (₹100/वर्ष)'
                  : lang === 'ur'
                  ? 'رکن بنیں (₹100/سال)'
                  : 'Become a Member (₹100/yr)'}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={handleWhatsApp}
                style={{
                  flex: 1,
                  backgroundColor: '#25D366',
                  paddingVertical: 10,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <MessageCircle size={14} color="#000" />
                <Text style={{ color: '#000', fontWeight: '800', fontSize: 11 }}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCall}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                  paddingVertical: 10,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <PhoneCall size={14} color={C.goldLight} />
                <Text style={{ color: C.white, fontWeight: '700', fontSize: 11 }}>
                  {lang === 'hi' ? 'कॉल करें' : lang === 'ur' ? 'کال کریں' : 'Call Helpdesk'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
