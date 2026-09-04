import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform, Share, Alert } from 'react-native';
import { Donation, User, Language } from '../types';
import {
  getLanguageCode,
  translateCampaignTitle,
  translateCommunityName,
  translateCategory,
} from '../lib/translateEntity';

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
  const commName = translateCommunityName(don.communityName || 'Bareilly Central Care Society', lang);
  const category = translateCategory(don.category || 'Emergency Aid', lang);
  const cleanId = (don.receiptNumber || don.id || 'DON').replace(/[^a-zA-Z0-9_-]/g, '');
  const receiptNo = don.receiptNumber || 'REC-' + cleanId.slice(0, 8).toUpperCase();
  const donorName = don.donorName || user?.name || (lang === 'hi' ? 'सम्मानित दानदाता' : lang === 'ur' ? 'معزز عطیہ دہندہ' : 'Valued Contributor');
  const amountStr = (don.amountINR || 0).toLocaleString('en-IN');
  const paymentDate = don.date || new Date().toISOString().split('T')[0];
  const utr = don.utrNumber || 'N/A';
  const txnId = don.transactionId || 'N/A';
  const paymentMethod = don.paymentMethod || 'UPI / Online';

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
      trustName: 'मुस्लिम फैमिली केयर ट्रस्ट',
      trustSub: 'सेक्शन 8 पंजीकृत गैर-सरकारी संगठन | 80G आयकर छूट प्राप्त',
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
      footer1: 'यह मुस्लिम फैमिली केयर ट्रस्ट (MFCT) को प्राप्त दान हेतु कंप्यूटर जनरेटेड रसीद है।',
      footer2: 'यह दान आयकर अधिनियम 1961 की',
      footer3: 'धारा 80G के अंतर्गत 50% कर कटौती हेतु मान्य है',
      footer4: 'पंजीकरण संख्या: AAATM9081EF20214। किसी भौतिक हस्ताक्षर की आवश्यकता नहीं है।',
    },
    ur: {
      trustName: 'مسلم فیملی کیئر ٹرسٹ',
      trustSub: 'سیکشن 8 رجسٹرڈ این جی او | 80G انکم ٹیکس چھوٹ',
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
      footer1: 'یہ مسلم فیملی کیئر ٹرسٹ (MFCT) کو دیے گئے عطیہ کی کمپیوٹر سے تیار کردہ رسید ہے۔',
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
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(${isRtl ? '30deg' : '-30deg'});
      font-size: 64px;
      font-weight: 900;
      color: rgba(4, 120, 87, 0.04);
      pointer-events: none;
      z-index: 0;
      white-space: nowrap;
      text-transform: uppercase;
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
    <div class="watermark">${text.watermark}</div>

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
 * Generates a local PDF file and saves it with a structured filename: Donation_Receipt_<ID>.pdf
 */
export async function generateReceiptPdf(
  don: Donation,
  user?: User | null,
  language: Language = 'en'
): Promise<GeneratePdfResult> {
  const cleanId = (don.receiptNumber || don.id || 'DON').replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `Donation_Receipt_${cleanId}.pdf`;
  const html = generateReceiptHtml(don, user, language);

  // 1. Generate temp PDF
  const { uri: tempUri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // 2. Copy to document / cache directory with clear standard filename
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  const targetUri = `${baseDir}${filename}`;

  try {
    await FileSystem.copyAsync({
      from: tempUri,
      to: targetUri,
    });
    return { uri: targetUri, filename };
  } catch (copyErr) {
    console.warn('Could not rename to targetUri, using tempUri:', copyErr);
    return { uri: tempUri, filename };
  }
}

/**
 * Downloads and saves / exports PDF to device storage
 */
export async function downloadReceiptPdf(
  don: Donation,
  user?: User | null,
  language: Language = 'en'
): Promise<GeneratePdfResult> {
  const result = await generateReceiptPdf(don, user, language);

  if (Platform.OS === 'android') {
    try {
      // If StorageAccessFramework is available, allow saving directly to Android downloads/folder
      if (FileSystem.StorageAccessFramework) {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const fileContent = await FileSystem.readAsStringAsync(result.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const createdFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            result.filename,
            'application/pdf'
          );
          await FileSystem.writeAsStringAsync(createdFileUri, fileContent, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return { uri: createdFileUri, filename: result.filename };
        }
      }
    } catch (safErr) {
      console.warn('SAF download fallback to sharing/printing:', safErr);
    }
  }

  // Fallback / Standard: Open system save/share/print sheet
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Save ${result.filename}`,
    });
  } else {
    const html = generateReceiptHtml(don, user, language);
    await Print.printAsync({ html });
  }

  return result;
}

/**
 * Opens standard share dialog for the generated PDF file
 */
export async function shareReceiptPdf(
  don: Donation,
  user?: User | null,
  language: Language = 'en'
): Promise<void> {
  const result = await generateReceiptPdf(don, user, language);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Share ${result.filename}`,
    });
  } else {
    // Text fallback
    const lang = getLanguageCode(language);
    const campaignTitle = translateCampaignTitle(don.campaignTitle, lang);
    const commName = translateCommunityName(don.communityName, lang);

    const message = `
=========================================
   Mohammad Faeem Charitable Trust (MFCT)
   OFFICIAL DONATION RECEIPT (80G TAX EXEMPTION)
=========================================
Receipt No: ${don.receiptNumber || 'REC-' + don.id.slice(0, 8)}
Date: ${don.date}
Donor: ${don.donorName || user?.name || 'Supporter'}
Cause: ${campaignTitle}
Community: ${commName}
Amount: ₹${(don.amountINR || 0).toLocaleString('en-IN')}
UTR: ${don.utrNumber || 'N/A'}
Txn ID: ${don.transactionId || 'N/A'}
Status: ${don.status === 'verified' ? '100% Verified & Escrow Audited' : 'Pending'}

Trust PAN: AABTM8912E | 80G Reg: AAATM9081EF20214
`;
    await Share.share({
      title: `Donation Receipt - ${don.receiptNumber || don.id.slice(0, 8)}`,
      message: message.trim(),
    });
  }
}
