import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform, Share, Alert } from 'react-native';
import { Donation, User, Language, FemaleFamilyMember } from '../types';
import {
  getLanguageCode,
  translateCampaignTitle,
  translateCommunityName,
  translateCategory,
} from '../lib/translateEntity';
import { MFCT_LOGO_BASE64 } from './mfctLogoBase64';

export interface GeneratePdfResult {
  uri: string;
  filename: string;
}

/**
 * Builds localized, professional 80G tax exemption receipt HTML string
 */
export function generateReceiptHtml(
  don: Donation,
  user?: User | null,
  language: Language = 'en'
): string {
  const lang = getLanguageCode(language);
  const isRtl = lang === 'ur';

  const campaignTitle = translateCampaignTitle(don.campaignTitle || 'General Relief Fund', lang);
  const commName = translateCommunityName(don.communityName || 'MFCT Community', lang);
  const category = translateCategory(don.category || 'Emergency Aid', lang);
  const cleanId = (don.receiptNumber || don.id || 'DON').replace(/[^a-zA-Z0-9_-]/g, '');
  const receiptNo = don.receiptNumber || 'REC-' + cleanId.slice(0, 8).toUpperCase();
  const donorName = don.donorName || user?.name || (lang === 'hi' ? 'सम्मानित दानदाता' : lang === 'ur' ? 'معزز عطیہ دہندہ' : 'Valued Contributor');
  const amountStr = (don.amountINR || 0).toLocaleString('en-IN');
  const paymentDate = don.date || new Date().toISOString().split('T')[0];
  const utr = don.utrNumber || 'N/A';
  const txnId = don.transactionId || 'N/A';
  const paymentMethod = don.paymentMethod || don.payment_method || 'UPI / Online';

  // Localized dictionary for PDF
  const text = {
    en: {
      trustName: 'Mohammad Faeem Charitable Trust',
      trustSub: 'Section 8 Registered NGO | 80G Income Tax Exempted',
      receiptTag: 'Official 80G Receipt',
      watermark: 'MFCT 80G VERIFIED',
      trustPan: 'Trust PAN',
      reg80G: '80G Registration',
      date: 'Date',
      donorName: 'Donor Full Name',
      campaign: 'Campaign / Cause',
      community: 'Community Hub',
      category: 'Donation Category',
      utr: 'Bank UTR Number',
      txnId: 'Transaction ID',
      method: 'Payment Mode',
      status: 'Payment Status',
      statusVerified: '✓ 100% Verified & Escrow Audited',
      statusPending: '⏳ Pending Verification',
      statusFailed: '❌ Failed',
      totalAmount: 'Total Donated Amount',
      auditTitle: '✓ Audit & Transparency Verification Complete',
      auditDesc: 'Verified by Executive Audit Team and direct vendor/hospital escrow routing.',
      sealHeader: 'MFCT DIGITAL SEAL',
      sealSub: 'Digitally Signed & Validated',
      footer1: 'This is a computer-generated tax exemption receipt for donation to',
      footer2: 'Donations are eligible for 50% tax deduction under',
      footer3: 'Section 80G of the Income Tax Act, 1961',
      footer4: 'Approval No: AAATM9081EF20214. No physical signature required. Thank you for empowering communities in need.',
    },
    hi: {
      trustName: 'Mohammad Faeem Charitable Trust',
      trustSub: 'मोहम्मद फ़ईम चैरिटेबल ट्रस्ट | 80G आयकर छूट प्राप्त NGO',
      receiptTag: 'आधिकारिक 80G रसीद',
      watermark: 'MFCT 80G सत्यापित',
      trustPan: 'ट्रस्ट पैन',
      reg80G: '80G पंजीकरण सं.',
      date: 'दिनांक',
      donorName: 'दानदाता का पूरा नाम',
      campaign: 'अभियान / कारण',
      community: 'समुदाय केंद्र',
      category: 'दान की श्रेणी',
      utr: 'बैंक यूटीआर संख्या (UTR)',
      txnId: 'लेन-देन आईडी (Txn ID)',
      method: 'भुगतान माध्यम',
      status: 'भुगतान स्थिति',
      statusVerified: '✓ 100% सत्यापित एवं ऑडिटेड',
      statusPending: '⏳ सत्यापन लंबित',
      statusFailed: '❌ विफल',
      totalAmount: 'कुल दान राशि',
      auditTitle: '✓ ऑडिट एवं वित्तीय पारदर्शिता सत्यापन पूर्ण',
      auditDesc: 'कार्यकारी ऑडिट टीम एवं प्रत्यक्ष एस्क्रो भुगतान द्वारा सत्यापित।',
      sealHeader: 'MFCT डिजिटल सील',
      sealSub: 'डिजिटल रूप से हस्ताक्षरित व प्रमाणित',
      footer1: 'यह Mohammad Faeem Charitable Trust (MFCT) को प्राप्त दान हेतु कंप्यूटर जनरेटेड रसीद है।',
      footer2: 'यह दान आयकर अधिनियम 1961 की',
      footer3: 'धारा 80G के अंतर्गत 50% कर कटौती हेतु मान्य है',
      footer4: 'पंजीकरण संख्या: AAATM9081EF20214। किसी भौतिक हस्ताक्षर की आवश्यकता नहीं है।',
    },
    ur: {
      trustName: 'Mohammad Faeem Charitable Trust',
      trustSub: 'محمد فہیم چیریٹیبل ٹرسٹ | 80G انکم ٹیکس چھوٹ',
      receiptTag: 'سرکاری 80G رسید',
      watermark: 'MFCT 80G تصدیق شدہ',
      trustPan: 'ٹرسٹ PAN',
      reg80G: '80G رجسٹریشن',
      date: 'تاریخ',
      donorName: 'عطیہ دہندہ کا نام',
      campaign: 'فلاحی مہم / مقصد',
      community: 'کمیونٹی ہب',
      category: 'عطیہ کی کیٹیگری',
      utr: 'بینک UTR نمبر',
      txnId: 'ٹرانزیکشن ID',
      method: 'ادائیگی کا طریقہ',
      status: 'ادائیگی کی حیثیت',
      statusVerified: '✓ 100% تصدیق شدہ اور آڈٹ شدہ',
      statusPending: '⏳ تصدیق زیر التواء',
      statusFailed: '❌ ناکام',
      totalAmount: 'کل عطیہ رقم',
      auditTitle: '✓ آڈٹ اور مالیاتی شفافیت کی تصدیق مکمل',
      auditDesc: 'ایگزیکٹو آڈٹ ٹیم اور براہ راست اسکرو ادائیگی سے تصدیق شدہ۔',
      sealHeader: 'MFCT ڈیجیٹل مہر',
      sealSub: 'ڈیجیٹل تصدیق شدہ',
      footer1: 'یہ Mohammad Faeem Charitable Trust (MFCT) کو دیے گئے عطیہ کی کمپیوٹر سے تیار کردہ رسید ہے۔',
      footer2: 'یہ عطیہ انکم ٹیکس ایکٹ 1961 کی',
      footer3: 'سیکشن 80G کے تحت ٹیکس چھوٹ کے لیے اہل ہے',
      footer4: 'رجسٹریشن نمبر: AAATM9081EF20214۔ شکریہ۔',
    },
  }[lang] || {
    trustName: 'Mohammad Faeem Charitable Trust',
    trustSub: 'Section 8 Registered NGO | 80G Income Tax Exempted',
    receiptTag: 'Official 80G Receipt',
    watermark: 'MFCT 80G VERIFIED',
    trustPan: 'Trust PAN',
    reg80G: '80G Registration',
    date: 'Date',
    donorName: 'Donor Full Name',
    campaign: 'Campaign / Cause',
    community: 'Community Hub',
    category: 'Donation Category',
    utr: 'Bank UTR Number',
    txnId: 'Transaction ID',
    method: 'Payment Mode',
    status: 'Payment Status',
    statusVerified: '✓ 100% Verified & Escrow Audited',
    statusPending: '⏳ Pending Verification',
    statusFailed: '❌ Failed',
    totalAmount: 'Total Donated Amount',
    auditTitle: '✓ Audit & Transparency Verification Complete',
    auditDesc: 'Verified by Executive Audit Team and direct vendor/hospital escrow routing.',
    sealHeader: 'MFCT DIGITAL SEAL',
    sealSub: 'Digitally Signed & Validated',
    footer1: 'This is a computer-generated tax exemption receipt for donation to',
    footer2: 'Donations are eligible for 50% tax deduction under',
    footer3: 'Section 80G of the Income Tax Act, 1961',
    footer4: 'Approval No: AAATM9081EF20214. No physical signature required. Thank you for empowering communities in need.',
  };

  const statusLabel =
    don.status === 'verified'
      ? text.statusVerified
      : don.status === 'pending_verification'
        ? text.statusPending
        : text.statusFailed;

  return `
<!DOCTYPE html>
<html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>Receipt_${cleanId}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: ${isRtl
      ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Tahoma', 'Arial', sans-serif"
      : lang === 'hi'
        ? "'Nirmala UI', 'Mangal', 'Arial Unicode MS', sans-serif"
        : "'Helvetica Neue', Helvetica, Arial, sans-serif"
    };
      color: #0f172a;
      margin: 0;
      padding: 16px;
      background-color: #ffffff;
      line-height: ${isRtl ? '1.8' : '1.5'};
      direction: ${isRtl ? 'rtl' : 'ltr'};
      text-align: ${isRtl ? 'right' : 'left'};
    }
    .receipt-container {
      border: 2px solid #047857;
      border-radius: 16px;
      padding: 28px;
      position: relative;
      background: #ffffff;
    }
    .watermark-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 280px;
      height: 280px;
      opacity: 0.08;
      pointer-events: none;
      object-fit: contain;
      z-index: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #047857;
      padding-bottom: 18px;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
      flex-direction: ${isRtl ? 'row-reverse' : 'row'};
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-direction: ${isRtl ? 'row-reverse' : 'row'};
    }
    .logo-badge {
      width: 52px;
      height: 52px;
      background: #047857;
      border: 2px solid #d97706;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
    }
    .trust-name {
      font-size: 19px;
      font-weight: 800;
      color: #064e3b;
      margin: 0;
      letter-spacing: 0.3px;
    }
    .trust-sub {
      font-size: 11px;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .receipt-badge {
      text-align: ${isRtl ? 'left' : 'right'};
    }
    .receipt-tag {
      background: #ecfdf5;
      border: 1px solid #059669;
      color: #047857;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      display: inline-block;
      text-transform: uppercase;
    }
    .receipt-no {
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 5px;
    }
    .tax-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 18px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #475569;
      position: relative;
      z-index: 1;
      flex-direction: ${isRtl ? 'row-reverse' : 'row'};
    }
    .tax-box strong {
      color: #0f172a;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    .table th, .table td {
      padding: 10px 14px;
      text-align: ${isRtl ? 'right' : 'left'};
      font-size: 12px;
    }
    .table tr {
      border-bottom: 1px solid #f1f5f9;
    }
    .table tr:nth-child(even) {
      background: #fafafa;
    }
    .table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      width: 32%;
    }
    .table td {
      color: #0f172a;
      font-weight: 600;
    }
    .amount-highlight {
      font-size: 18px;
      font-weight: 900;
      color: #047857;
      font-family: monospace;
    }
    .status-badge {
      color: #047857;
      background: #d1fae5;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      display: inline-block;
    }
    .audit-section {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 1;
      flex-direction: ${isRtl ? 'row-reverse' : 'row'};
    }
    .audit-title {
      font-size: 12px;
      font-weight: 800;
      color: #92400e;
      margin: 0;
    }
    .audit-desc {
      font-size: 10px;
      color: #b45309;
      margin: 2px 0 0 0;
    }
    .seal-text {
      text-align: ${isRtl ? 'left' : 'right'};
      font-size: 10px;
      color: #78350f;
    }
    .seal-text strong {
      font-size: 11px;
      color: #047857;
      display: block;
    }
    .footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 14px;
      font-size: 10px;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
      position: relative;
      z-index: 1;
    }
    .footer strong {
      color: #047857;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <img class="watermark-logo" src="${MFCT_LOGO_BASE64}" alt="MFCT Logo" />

    <!-- Header Section -->
    <div class="header">
      <div class="logo-section">
        <div class="logo-badge">M</div>
        <div>
          <h1 class="trust-name">${text.trustName}</h1>
          <p class="trust-sub">${text.trustSub}</p>
        </div>
      </div>
      <div class="receipt-badge">
        <span class="receipt-tag">${text.receiptTag}</span>
        <div class="receipt-no">${receiptNo}</div>
      </div>
    </div>

    <!-- Tax & Registration Details -->
    <div class="tax-box">
      <div><strong>${text.trustPan}:</strong> AABTM8912E</div>
      <div><strong>${text.reg80G}:</strong> AAATM9081EF20214</div>
      <div><strong>${text.date}:</strong> ${paymentDate}</div>
    </div>

    <!-- Table of Donation Details -->
    <table class="table">
      <tr>
        <th>${text.donorName}</th>
        <td>${donorName}</td>
      </tr>
      <tr>
        <th>${text.campaign}</th>
        <td><strong>${campaignTitle}</strong></td>
      </tr>
      <tr>
        <th>${text.community}</th>
        <td>${commName}</td>
      </tr>
      <tr>
        <th>${text.category}</th>
        <td>${category}</td>
      </tr>
      <tr>
        <th>${text.utr}</th>
        <td><span style="font-family: monospace; font-weight: bold;">${utr}</span></td>
      </tr>
      <tr>
        <th>${text.txnId}</th>
        <td><span style="font-family: monospace; color: #64748b;">${txnId}</span></td>
      </tr>
      <tr>
        <th>${text.method}</th>
        <td>${paymentMethod}</td>
      </tr>
      <tr>
        <th>${text.status}</th>
        <td><span class="status-badge">${statusLabel}</span></td>
      </tr>
      <tr style="background: #ecfdf5;">
        <th style="background: #d1fae5; color: #064e3b; font-size: 13px;">${text.totalAmount}</th>
        <td class="amount-highlight">₹${amountStr} INR</td>
      </tr>
    </table>

    <!-- Audit Seal -->
    <div class="audit-section">
      <div>
        <h3 class="audit-title">${text.auditTitle}</h3>
        <p class="audit-desc">${text.auditDesc}</p>
      </div>
      <div class="seal-text">
        <strong>${text.sealHeader}</strong>
        ${text.sealSub}
      </div>
    </div>

    <!-- Legal 80G Footer -->
    <div class="footer">
      ${text.footer1} <strong>${text.trustName}</strong>.<br>
      ${text.footer2} <strong>${text.footer3}</strong>.<br>
      ${text.footer4}
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generates a local PDF file and saves it with a structured filename: Donation_Payment_Slip_<ID>.pdf
 */
export async function generateReceiptPdf(
  don: Donation,
  user?: User | null,
  language: Language = 'en'
): Promise<GeneratePdfResult> {
  return downloadDonationPaymentSlipPdf(don);
}

/**
 * Downloads and saves / exports PDF to device storage (matches website Donation Payment Slip)
 */
export async function downloadReceiptPdf(
  don: Donation,
  user?: User | null,
  language: Language = 'en'
): Promise<GeneratePdfResult> {
  return downloadDonationPaymentSlipPdf(don);
}

/**
 * Opens standard share dialog for the generated PDF file
 */
export async function shareReceiptPdf(
  don: Donation,
  user?: User | null,
  language: Language = 'en'
): Promise<void> {
  return shareDonationPaymentSlipPdf(don);
}

function toTitleCase(str: string): string {
  return (str ?? '').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

function escapeReceiptHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function formatSlipDate(rawDate?: string | Date | null): string {
  if (!rawDate) {
    return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  if (rawDate instanceof Date) {
    if (!isNaN(rawDate.getTime())) {
      const d = String(rawDate.getDate()).padStart(2, '0');
      const m = String(rawDate.getMonth() + 1).padStart(2, '0');
      const y = rawDate.getFullYear();
      return `${d}/${m}/${y}`;
    }
    return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const str = String(rawDate).trim();
  if (!str) return 'N/A';

  // 1) Match DD/MM/YYYY or DD-MM-YYYY (e.g. 21/10/2026 or 21-10-2026)
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3];
    return `${d}/${m}/${y}`;
  }

  // 2) Match YYYY-MM-DD or YYYY/MM/DD (e.g. 2026-10-21)
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }

  // 3) Try standard Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}/${m}/${y}`;
  }

  // 4) Clean any ISO or timestamp suffix
  const cleaned = str.split(/[T\s,]/)[0];
  if (cleaned && cleaned.length >= 8 && !cleaned.toLowerCase().includes('invalid')) {
    return cleaned;
  }

  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const MFCT_LOGO_URL = 'https://www.mfcttrust.com/mfct-logo.png';

/**
 * Generates the updated Registration Payment Slip HTML matching the website design
 */
export function generateRegistrationPaymentSlipHtml(user: User): string {
  if (user.status !== 'approved' || !user.paymentUtr) {
    throw new Error('An approved member with a recorded payment UTR is required.');
  }

  const receiptNumber = `MFCT-REG-${user.membershipId || user.id}`;
  const paymentDate = formatSlipDate(user.joinDate);
  const details: [string, string][] = [
    ['Member Name', user.name],
    ['Member ID', user.membershipId || user.id],
    ['Email', user.email || 'N/A'],
    ['Registration Payment', `₹${(user.membershipFee ?? 100).toFixed(2)}`],
    ['Payment Date', paymentDate],
    ['Transaction / UTR ID', user.paymentUtr],
    ['Payment Method', user.paymentMethod || 'N/A'],
    ['Purpose', 'Membership Registration Fee'],
  ];
  const tableRows = details
    .map(
      ([label, value]) =>
        `<tr><th>${escapeReceiptHtml(label)}</th><td class="${label === 'Registration Payment' ? 'amount' : ''}">${escapeReceiptHtml(value)}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Registration Payment Slip - ${escapeReceiptHtml(receiptNumber)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 14mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; color: #17211c; font-family: Arial, sans-serif; font-size: 12px; }

    .slip {
      position: relative;
      max-width: 680px;
      margin: 10px auto;
      border: 2.5px dashed #c0392b;
      padding: 24px 34px;
      background: #fff;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* MFCT Logo watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 250px;
      height: 250px;
      opacity: 0.10;
      pointer-events: none;
      object-fit: contain;
      z-index: 0;
    }

    .content { position: relative; z-index: 1; }

    header {
      text-align: center;
      color: #c0392b;
      padding-bottom: 12px;
      border-bottom: 1.5px solid #f5cac5;
      margin-bottom: 10px;
    }
    h1 {
      margin: 0 0 3px;
      font-size: 19px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    header .subtitle {
      margin: 3px 0 0;
      color: #555;
      font-size: 11.5px;
    }

    .receipt-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 11px;
      color: #666;
    }
    .receipt-row .badge {
      background: #f0fff4;
      border: 1px solid #6ee7b7;
      color: #065f46;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 10px;
    }

    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid; }
    th, td {
      padding: 8px 8px;
      border-bottom: 1px solid #e8eee9;
      text-align: left;
      vertical-align: middle;
    }
    th {
      width: 42%;
      color: #1a3328;
      font-weight: 700;
      font-size: 11.5px;
    }
    td {
      overflow-wrap: anywhere;
      color: #2d2d2d;
      font-size: 11.5px;
    }
    .amount { color: #087443; font-size: 16px; font-weight: 900; }

    footer {
      margin-top: 10px;
      text-align: center;
      color: #c0392b;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.3px;
      padding-top: 10px;
      border-top: 1.5px solid #f5cac5;
    }
    .footer-note {
      margin-top: 3px;
      font-size: 9.5px;
      font-weight: 400;
      color: #777;
    }

    @media print {
      html, body {
        width: 100%;
        height: auto;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .slip {
        margin: 0 auto !important;
        border: 2.5px dashed #c0392b !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <main class="slip">
    <img class="watermark" src="${MFCT_LOGO_BASE64}" alt="MFCT Logo" />
    <div class="content">
      <header>
        <h1>Mohammad Faeem Charitable Trust</h1>
        <p class="subtitle">Membership Registration Payment Slip</p>
      </header>

      <div class="receipt-row">
        <span>Receipt No: <strong>${escapeReceiptHtml(receiptNumber)}</strong></span>
        <span class="badge">✓ Payment Recorded</span>
      </div>

      <table>${tableRows}</table>

      <footer>
        Thank You For Becoming a Member of MFCT
        <p class="footer-note">This is a computer-generated payment slip. For support: contact@mfct.org</p>
      </footer>
    </div>
  </main>
</body>
</html>`;
}

/**
 * Downloads and saves / exports Registration Payment Slip PDF
 */
export async function downloadRegistrationPaymentSlipPdf(user: User): Promise<GeneratePdfResult> {
  const html = generateRegistrationPaymentSlipHtml(user);
  const cleanId = (user.membershipId || user.id).replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `Registration_Payment_Slip_${cleanId}.pdf`;
  const { uri: tempUri } = await Print.printToFileAsync({ html, base64: false });
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  const targetUri = `${baseDir}${filename}`;
  let result: GeneratePdfResult;

  try {
    await FileSystem.copyAsync({ from: tempUri, to: targetUri });
    result = { uri: targetUri, filename };
  } catch (copyErr) {
    console.warn('Could not rename registration slip PDF; using temporary file:', copyErr);
    result = { uri: tempUri, filename };
  }

  if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
    try {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const fileContent = await FileSystem.readAsStringAsync(result.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const createdFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename,
          'application/pdf'
        );
        await FileSystem.writeAsStringAsync(createdFileUri, fileContent, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return { uri: createdFileUri, filename };
      }
    } catch (saveErr) {
      console.warn('Could not save registration slip through Android storage access:', saveErr);
    }
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Save ${filename}`,
    });
  } else {
    await Print.printAsync({ html });
  }

  return result;
}

/**
 * Generates the updated Donation Payment Slip HTML matching the website donationPaymentSlip.ts design
 */
export function generateDonationPaymentSlipHtml(donation: Donation): string {
  const receiptNumber = donation.receiptNumber || `MFCT-DON-${donation.id.slice(0, 8).toUpperCase()}`;
  const donorName = toTitleCase(donation.donorName || 'N/A');
  const campaignTitle = donation.campaignTitle || 'General Donation';
  const communityName = donation.communityName || 'MFCT Community';
  const category = donation.category || 'General';
  const paymentMethod = donation.paymentMethod || (donation as any).payment_method || 'N/A';
  const utr = donation.utrNumber || donation.transactionId || 'N/A';
  const amount = `₹${Number(donation.amountINR || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const dateStr = formatSlipDate(donation.date);

  const details: [string, string][] = [
    ['Donation Recipient', 'Mohammad Faeem Charitable Trust (MFCT)'],
    ['Donor Name', donorName],
    ['Campaign / Cause', campaignTitle],
    ['Donation Category', category],
    ['Community', communityName],
    ['Donated Amount', amount],
    ['Date', dateStr],
    ['Transaction / UTR ID', utr],
    ['Payment Method', paymentMethod],
    ['Receipt No.', receiptNumber],
  ];

  const tableRows = details
    .map(
      ([label, value]) =>
        `<tr><th>${escapeReceiptHtml(label)}</th><td class="${label === 'Donated Amount' ? 'amount' : ''}">${escapeReceiptHtml(value)}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Donation Payment Slip - ${escapeReceiptHtml(receiptNumber)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 14mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; color: #17211c; font-family: Arial, sans-serif; font-size: 12px; }

    .slip {
      position: relative;
      max-width: 680px;
      margin: 10px auto;
      border: 2.5px dashed #c0392b;
      padding: 24px 34px;
      background: #fff;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* MFCT Logo watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 250px;
      height: 250px;
      opacity: 0.10;
      pointer-events: none;
      object-fit: contain;
      z-index: 0;
    }

    /* Everything above watermark */
    .content { position: relative; z-index: 1; }

    header {
      text-align: center;
      color: #c0392b;
      padding-bottom: 12px;
      border-bottom: 1.5px solid #f5cac5;
      margin-bottom: 10px;
    }
    h1 {
      margin: 0 0 3px;
      font-size: 19px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    header .subtitle {
      margin: 3px 0 0;
      color: #555;
      font-size: 11.5px;
    }

    .receipt-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 11px;
      color: #666;
    }
    .receipt-row .badge {
      background: #f0fff4;
      border: 1px solid #6ee7b7;
      color: #065f46;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 10px;
    }

    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid; }
    th, td {
      padding: 7px 8px;
      border-bottom: 1px solid #e8eee9;
      text-align: left;
      vertical-align: middle;
    }
    th {
      width: 44%;
      color: #1a3328;
      font-weight: 700;
      font-size: 11.5px;
    }
    td {
      overflow-wrap: anywhere;
      color: #2d2d2d;
      font-size: 11.5px;
    }
    .amount {
      color: #0f3322;
      font-size: 16px;
      font-weight: 900;
    }

    footer {
      margin-top: 10px;
      text-align: center;
      color: #c0392b;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.3px;
      padding-top: 10px;
      border-top: 1.5px solid #f5cac5;
    }
    .footer-note {
      margin-top: 3px;
      font-size: 9.5px;
      font-weight: 400;
      color: #777;
    }

    @media print {
      html, body {
        width: 100%;
        height: auto;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .slip {
        margin: 0 auto !important;
        border: 2.5px dashed #c0392b !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <main class="slip">
    <img class="watermark" src="${MFCT_LOGO_BASE64}" alt="MFCT Logo" />
    <div class="content">
      <header>
        <h1>Mohammad Faeem Charitable Trust</h1>
        <p class="subtitle">Donation Payment Slip &nbsp;|&nbsp; Reg. Trust — 80G Exempt</p>
      </header>

      <div class="receipt-row">
        <span>Receipt No: <strong>${escapeReceiptHtml(receiptNumber)}</strong></span>
        <span class="badge">✓ Donation Recorded</span>
      </div>

      <table>${tableRows}</table>

      <footer>
        Thank You For Your Donation
        <p class="footer-note">This is a computer-generated payment slip. For support: contact@mfct.org</p>
      </footer>
    </div>
  </main>
</body>
</html>`;
}

/**
 * Downloads and saves / exports Donation Payment Slip PDF
 */
export async function downloadDonationPaymentSlipPdf(donation: Donation): Promise<GeneratePdfResult> {
  const html = generateDonationPaymentSlipHtml(donation);
  const cleanId = (donation.receiptNumber || donation.id || 'DON').replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `Donation_Payment_Slip_${cleanId}.pdf`;
  const { uri: tempUri } = await Print.printToFileAsync({ html, base64: false });
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  const targetUri = `${baseDir}${filename}`;
  let result: GeneratePdfResult;

  try {
    await FileSystem.copyAsync({ from: tempUri, to: targetUri });
    result = { uri: targetUri, filename };
  } catch (copyErr) {
    console.warn('Could not rename donation slip PDF; using temporary file:', copyErr);
    result = { uri: tempUri, filename };
  }

  if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
    try {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const fileContent = await FileSystem.readAsStringAsync(result.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const createdFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename,
          'application/pdf'
        );
        await FileSystem.writeAsStringAsync(createdFileUri, fileContent, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return { uri: createdFileUri, filename };
      }
    } catch (saveErr) {
      console.warn('Could not save donation slip through Android storage access:', saveErr);
    }
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Save ${filename}`,
    });
  } else {
    await Print.printAsync({ html });
  }

  return result;
}

/**
 * Shares Donation Payment Slip PDF
 */
export async function shareDonationPaymentSlipPdf(donation: Donation): Promise<void> {
  const result = await downloadDonationPaymentSlipPdf(donation);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Share ${result.filename}`,
    });
  }
}

/**
 * Generates and downloads the Official PDF slip for Female Family Member Registration (₹50)
 */
export async function downloadFemaleMemberSlipPdf(
  user: User,
  member: FemaleFamilyMember
): Promise<GeneratePdfResult> {
  const slipNo = `MFCT-FFM-${(member.id || 'FFM').replace('ffm_', '').slice(-8).toUpperCase()}`;
  const paymentDate = member.created_at
    ? new Date(member.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MFCT Family Female Member Registration Slip</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #fff; color: #17211c; padding: 20px; font-size: 13px; line-height: 1.5; }
    .slip {
      max-width: 650px;
      margin: 0 auto;
      border: 2px dashed #0c4a2b;
      padding: 30px;
      background: #fafaf8;
      border-radius: 12px;
    }
    .header { text-align: center; border-bottom: 2px solid #c8a84b; padding-bottom: 14px; margin-bottom: 18px; }
    .logo { width: 75px; height: 75px; object-fit: contain; margin-bottom: 8px; }
    .trust-name { font-size: 20px; font-weight: 800; color: #0c4a2b; margin: 0; }
    .trust-sub { font-size: 11px; color: #666; margin-top: 2px; }
    .badge { display: inline-block; background: #c8a84b; color: #0c2016; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 20px; margin-top: 8px; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .details-table th, .details-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e0dfd5; font-size: 12px; }
    .details-table th { width: 45%; color: #444; font-weight: 600; background: rgba(200,168,75,0.08); }
    .details-table td { font-weight: 700; color: #111; }
    .amount { font-size: 16px; color: #0c4a2b; font-weight: 900; }
    .footer { margin-top: 25px; text-align: center; font-size: 11px; color: #777; border-top: 1px solid #e0dfd5; padding-top: 12px; }
    .stamp { margin-top: 15px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 10px; }
    .seal-box { border: 1.5px solid #0c4a2b; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 11px; color: #0c4a2b; text-align: center; }
  </style>
</head>
<body>
  <div class="slip">
    <div class="header">
      <img src="${MFCT_LOGO_BASE64}" class="logo" alt="MFCT Logo" />
      <h1 class="trust-name">Mohammad Faeem Charitable Trust (MFCT)</h1>
      <p class="trust-sub">Regd. Public Charitable Trust • Supporting Community & Empowering Families</p>
      <div class="badge">महिला पारिवारिक सदस्य पंजीकरण रसीद • FEMALE FAMILY MEMBER SLIP</div>
    </div>
    
    <table class="details-table">
      <tr><th>रसीद संख्या (Receipt No.)</th><td>${slipNo}</td></tr>
      <tr><th>मुख्य सदस्य (Primary Member)</th><td>${user.name} (${user.membershipId || user.id})</td></tr>
      <tr><th>महिला सदस्य (Female Member Name)</th><td>${member.name}</td></tr>
      <tr><th>संबंध (Relationship)</th><td>${member.relation}</td></tr>
      <tr><th>आयु / जन्म तिथि (Age / DOB)</th><td>${member.age ? `${member.age} वर्ष (Years)` : member.date_of_birth || 'N/A'}</td></tr>
      <tr><th>मोबाइल नंबर (Phone)</th><td>${member.phone || 'N/A'}</td></tr>
      <tr><th>आधार संख्या (Aadhaar No.)</th><td>${member.aadhaar_number || 'N/A'}</td></tr>
      <tr><th>पंजीकरण शुल्क (Fee Amount)</th><td class="amount">₹50.00 (Fifty Rupees Only)</td></tr>
      <tr><th>भुगतान माध्यम (Payment Mode)</th><td>${member.payment_method || 'UPI'}</td></tr>
      <tr><th>बैंक UTR संदर्भ (UTR No.)</th><td style="font-family: monospace;">${member.payment_utr || 'Pending'}</td></tr>
      <tr><th>पंजीकरण तिथि (Registration Date)</th><td>${paymentDate}</td></tr>
      <tr><th>सत्यापन स्थिति (Status)</th><td>${member.status === 'approved' ? '✓ VERIFIED & ACTIVE' : '⏳ PENDING EXECUTIVE AUDIT'}</td></tr>
    </table>

    <div class="stamp">
      <div class="seal-box">
        MOHAMMAD FAEEM CHARITABLE TRUST<br/>
        <span style="font-size: 9px; font-weight: 500;">OFFICIAL WELFARE ENROLLMENT</span>
      </div>
      <div style="text-align: right;">
        <p style="font-size: 11px; font-weight: 700; margin: 0; color: #0c4a2b;">Authorized Signatory</p>
        <p style="font-size: 10px; color: #666; margin: 2px 0 0 0;">MFCT Welfare Desk</p>
      </div>
    </div>

    <div class="footer">
      This is an official computer-generated fee receipt of Mohammad Faeem Charitable Trust for family female member welfare enrollment.
    </div>
  </div>
</body>
</html>`;

  const filename = `MFCT-Female-Member-${member.name.replace(/\s+/g, '_')}-${slipNo}.pdf`;
  const result = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Save / Share ${filename}`,
    });
  } else {
    await Print.printAsync({ html });
  }

  return { uri: result.uri, filename };
}

