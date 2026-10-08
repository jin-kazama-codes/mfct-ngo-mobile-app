import { DistrictPostDefinition } from '../types';

export interface DistrictInfo {
  id: string;
  nameEn: string;
  nameHi: string;
  nameUr: string;
  stateEn: string;
  stateHi: string;
  stateUr: string;
  headquarters?: string;
  isPriority?: boolean;
}

export const DISTRICT_POSTS: DistrictPostDefinition[] = [
  {
    slotNumber: '01',
    key: 'district_president',
    titleEn: 'District President',
    titleHi: 'जिला अध्यक्ष',
    titleUr: 'ضلعی صدر',
    dutyEn: 'Leadership and coordination of all MFCT activities in the district.',
    dutyHi: 'जिले में MFCT की समस्त गतिविधियों का नेतृत्व एवं समन्वय।',
    dutyUr: 'ضلع میں MFCT کی تمام سرگرمیوں کی قیادت اور رابطہ کاری۔',
    color: '#d97706', // amber
  },
  {
    slotNumber: '02',
    key: 'district_coordinator',
    titleEn: 'District Coordinator',
    titleHi: 'जिला संयोजक',
    titleUr: 'ضلعی کوآرڈینیٹر',
    dutyEn: 'Daily coordination, membership expansion, team formation and reporting.',
    dutyHi: 'दैनिक समन्वय, सदस्यता विस्तार, टीम गठन एवं रिपोर्टिंग।',
    dutyUr: 'روزمرہ رابطہ کاری، رکنیت سازی، ٹیم کی تشکیل اور رپورٹنگ۔',
    color: '#059669', // emerald
  },
  {
    slotNumber: '03',
    key: 'district_gen_secretary',
    titleEn: 'District General Secretary / Org Incharge',
    titleHi: 'जिला महासचिव / संगठन प्रभारी',
    titleUr: 'ضلعی جنرل سیکرٹری / انچارج تنظیم',
    dutyEn: 'Organization expansion and coordination of block / municipal teams.',
    dutyHi: 'संगठन विस्तार एवं ब्लॉक / नगर टीमों का समन्वय।',
    dutyUr: 'تنظیمی توسیع اور بلاک / بلدیاتی ٹیموں کی رابطہ کاری۔',
    color: '#7c3aed', // violet/purple
  },
  {
    slotNumber: '04',
    key: 'district_secretary',
    titleEn: 'District Secretary',
    titleHi: 'जिला सचिव',
    titleUr: 'ضلعی سیکرٹری',
    dutyEn: 'Correspondence, meeting proceedings, minutes and documentation.',
    dutyHi: 'पत्राचार, बैठक कार्यवाही एवं दस्तावेजीकरण।',
    dutyUr: 'خط و کتابت، میٹنگ کی کارروائی اور دفتری ریکارڈ۔',
    color: '#2563eb', // blue
  },
  {
    slotNumber: '05',
    key: 'district_finance_coord',
    titleEn: 'District Finance Coordinator',
    titleHi: 'जिला वित्त समन्वयक',
    titleUr: 'ضلعی فنانس کوآرڈینیٹر',
    dutyEn: 'Financial records and documentary support for official transactions.',
    dutyHi: 'वित्तीय रिकॉर्ड एवं आधिकारिक लेन-देन के दस्तावेजी सहयोग।',
    dutyUr: 'مالیاتی ریکارڈ اور سرکاری لین دین میں دستاویزی معاونت۔',
    color: '#ea580c', // orange
  },
];

export const STANDARD_DISTRICTS: DistrictInfo[] = [
  {
    id: 'Bareilly',
    nameEn: 'Bareilly',
    nameHi: 'बरेली',
    nameUr: 'بریلی',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
    headquarters: 'Bareilly Central',
    isPriority: true,
  },
  {
    id: 'Lucknow',
    nameEn: 'Lucknow',
    nameHi: 'लखनऊ',
    nameUr: 'لکھنؤ',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
    headquarters: 'Lucknow City',
    isPriority: true,
  },
  {
    id: 'Moradabad',
    nameEn: 'Moradabad',
    nameHi: 'मुरादाबाद',
    nameUr: 'مرادآباد',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
    headquarters: 'Moradabad Central',
    isPriority: true,
  },
  {
    id: 'Rampur',
    nameEn: 'Rampur',
    nameHi: 'रामपुर',
    nameUr: 'رام پور',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
    headquarters: 'Rampur City',
  },
  {
    id: 'Pilibhit',
    nameEn: 'Pilibhit',
    nameHi: 'पीलीभीत',
    nameUr: 'پیلی بھیت',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
    headquarters: 'Pilibhit Sadar',
  },
  {
    id: 'Shahjahanpur',
    nameEn: 'Shahjahanpur',
    nameHi: 'शाहजहांपुर',
    nameUr: 'شاہجہاں پور',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
    headquarters: 'Shahjahanpur City',
  },
  {
    id: 'Budaun',
    nameEn: 'Budaun',
    nameHi: 'बदायूँ',
    nameUr: 'بدایوں',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
    headquarters: 'Budaun Sadar',
  },
  {
    id: 'Bijnor',
    nameEn: 'Bijnor',
    nameHi: 'बिजनौर',
    nameUr: 'بجنور',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
  },
  {
    id: 'Sambhal',
    nameEn: 'Sambhal',
    nameHi: 'संभल',
    nameUr: 'سنبھل',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
  },
  {
    id: 'Aligarh',
    nameEn: 'Aligarh',
    nameHi: 'अलीगढ़',
    nameUr: 'علی گڑھ',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
  },
  {
    id: 'Meerut',
    nameEn: 'Meerut',
    nameHi: 'मेरठ',
    nameUr: 'میرٹھ',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
  },
  {
    id: 'Agra',
    nameEn: 'Agra',
    nameHi: 'आगरा',
    nameUr: 'آگرہ',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
  },
  {
    id: 'Kanpur',
    nameEn: 'Kanpur',
    nameHi: 'कानपुर',
    nameUr: 'کانپور',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
  },
  {
    id: 'Varanasi',
    nameEn: 'Varanasi',
    nameHi: 'वाराणसी',
    nameUr: 'وارانسی',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
  },
  {
    id: 'Prayagraj',
    nameEn: 'Prayagraj',
    nameHi: 'प्रयागराज',
    nameUr: 'پریاگ راج',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
  },
  {
    id: 'Gorakhpur',
    nameEn: 'Gorakhpur',
    nameHi: 'गोरखपुर',
    nameUr: 'گورکھپور',
    stateEn: 'Uttar Pradesh',
    stateHi: 'उत्तर प्रदेश',
    stateUr: 'اتر پردیش',
  },
];
