import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../src/context/AppStateProvider';
import { getCampaigns, getCampaignById } from '../../src/services/campaignService';
import { getAccountDetails } from '../../src/services/adminService';
import { createDonation, updateCampaignRaised } from '../../src/services/donationService';
import { Campaign, DonationCategory, AccountDetails, Donation } from '../../src/types';
import {
  ArrowLeft,
  Check,
  Copy,
  QrCode,
  Upload,
  Heart,
  ShieldCheck,
  Sparkles,
  Building2,
  CheckCircle2,
  CreditCard,
  Phone,
  FileText,
  X,
} from 'lucide-react-native';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];
const CATEGORIES: DonationCategory[] = [
  'Medical',
  'Education',
  'Food',
  'Marriage',
  'Janazah',
  'Emergency Relief',
  'Zakat',
  'General',
];

export default function DonationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeUser } = useAppState();
  const params = useLocalSearchParams<{ campaignId?: string; initialCategory?: string }>();

  // Steps: 1 = Amount/Category, 2 = Payment/UTR, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [amount, setAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<DonationCategory>(
    (params.initialCategory as DonationCategory) || 'General'
  );
  const [donorName, setDonorName] = useState<string>(activeUser?.name || 'Generous Supporter');
  const [isOutsideCommunity, setIsOutsideCommunity] = useState<boolean>(false);

  // Campaign & Account data
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Step 2 payment inputs
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Bank Transfer'>('UPI');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 3 Result
  const [createdDonation, setCreatedDonation] = useState<Donation | null>(null);

  useEffect(() => {
    async function initData() {
      try {
        if (params.campaignId) {
          const camp = await getCampaignById(params.campaignId);
          if (camp) {
            setCampaign(camp);
            setSelectedCategory(camp.category);
          }
        } else {
          const allCamps = await getCampaigns();
          setCampaigns(allCamps);
          if (allCamps.length > 0) {
            setCampaign(allCamps[0]);
          }
        }

        const accData = await getAccountDetails();
        if (accData && accData.length > 0) {
          setAccountDetails(accData[0]);
        }
      } catch (err) {
        console.warn('Error loading donation screen data:', err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [params.campaignId]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setScreenshotUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const handleCopyUpi = () => {
    const upi = accountDetails?.upi_id || 'mfct@okicici';
    setCopiedUpi(true);
    Alert.alert('UPI ID Copied', upi);
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  const handleSubmitDonation = async () => {
    if (!utrNumber.trim() && !screenshotUri) {
      Alert.alert('Verification Needed', 'Please enter 12-digit UPI UTR number or upload payment screenshot.');
      return;
    }

    setSubmitting(true);
    try {
      const finalUtr = utrNumber.trim() || `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const donationData: Omit<Donation, 'id'> = {
        transactionId: `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
        utrNumber: finalUtr,
        donorName: donorName || 'Generous Supporter',
        donorId: activeUser?.id || 'anonymous',
        donorRole: activeUser?.role || 'member',
        campaignId: campaign?.id || 'general',
        campaignTitle: campaign?.title || `${selectedCategory} General Fund`,
        communityName: campaign?.communityName || 'Bareilly Central Care Society',
        amountINR: amount,
        category: selectedCategory,
        isOutsideCommunity,
        paymentMethod,
        paymentScreenshotUrl: screenshotUri || undefined,
        status: 'pending_verification',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        receiptNumber: `RCP-${Math.floor(1000 + Math.random() * 9000)}`,
      };

      const saved = await createDonation(donationData);
      if (campaign?.id) {
        await updateCampaignRaised(campaign.id, amount);
      }

      setCreatedDonation(saved);
      setStep(3);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View className="pt-12 pb-3 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => (step > 1 && step < 3 ? setStep((step - 1) as any) : router.back())}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
        >
          <ArrowLeft color="#334155" size={20} />
        </TouchableOpacity>
        <Text className="font-extrabold text-sm text-slate-900 dark:text-white">
          {step === 1 ? 'Make a Donation' : step === 2 ? 'Complete Payment' : 'Donation Receipt'}
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* STEP 1: Select Amount & Category */}
        {step === 1 && (
          <View className="space-y-4">
            {/* Selected Campaign Card Preview */}
            {campaign && (
              <View className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex-row items-center">
                <Image
                  source={{ uri: campaign.mainImage }}
                  className="w-14 h-14 rounded-xl mr-3"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {campaign.category} Relief
                  </Text>
                  <Text className="font-bold text-slate-900 dark:text-white text-xs leading-4" numberOfLines={2}>
                    {campaign.title}
                  </Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">
                    Goal: ₹{campaign.goalINR?.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            )}

            {/* Amount Selection */}
            <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Text className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Select Donation Amount (₹)
              </Text>

              {/* Preset Buttons */}
              <View className="flex-row flex-wrap gap-2 mb-3">
                {PRESET_AMOUNTS.map((val) => {
                  const isSelected = amount === val && !customAmount;
                  return (
                    <TouchableOpacity
                      key={val}
                      onPress={() => {
                        setAmount(val);
                        setCustomAmount('');
                      }}
                      className={`px-4 py-2.5 rounded-xl border ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        ₹{val.toLocaleString('en-IN')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Amount Input */}
              <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                <Text className="text-slate-500 font-bold text-sm mr-2">₹</Text>
                <TextInput
                  value={customAmount}
                  onChangeText={(txt) => {
                    setCustomAmount(txt);
                    const num = parseInt(txt, 10);
                    if (!isNaN(num) && num > 0) setAmount(num);
                  }}
                  keyboardType="numeric"
                  placeholder="Or enter custom amount"
                  placeholderTextColor="#94a3b8"
                  className="flex-1 text-slate-900 dark:text-white text-xs font-bold"
                />
              </View>
            </View>

            {/* Category Selection */}
            <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Text className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Giving Category
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      className={`px-3 py-2 rounded-xl border ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Donor Name Input */}
            <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Text className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Donor Name (Public Acknowledgement)
              </Text>
              <TextInput
                value={donorName}
                onChangeText={setDonorName}
                placeholder="Enter your name or Anonymous"
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
              />
            </View>

            {/* Next Button */}
            <TouchableOpacity
              onPress={() => {
                if (amount <= 0) {
                  Alert.alert('Invalid Amount', 'Please enter a valid donation amount.');
                  return;
                }
                setStep(2);
              }}
              className="w-full py-4 bg-emerald-600 rounded-2xl items-center justify-center shadow-md mt-2"
            >
              <Text className="text-white font-black text-sm">
                Proceed to Pay ₹{amount.toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: UPI & Bank Payment Details + UTR Submission */}
        {step === 2 && (
          <View className="space-y-4">
            {/* Amount Banner */}
            <View className="bg-emerald-700 dark:bg-emerald-800 p-4 rounded-2xl flex-row items-center justify-between">
              <View>
                <Text className="text-emerald-200 text-xs font-medium">Total Giving Amount</Text>
                <Text className="text-white font-black text-2xl">
                  ₹{amount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View className="bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-400/30">
                <Text className="text-emerald-200 font-bold text-xs uppercase">{selectedCategory}</Text>
              </View>
            </View>

            {/* UPI QR & Details Card */}
            <View className="bg-slate-900 p-5 rounded-2xl border border-slate-800 items-center">
              <Text className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-3">
                Scan UPI QR Code
              </Text>

              <View className="bg-white p-3 rounded-2xl mb-3 shadow-md">
                {accountDetails?.qr_code_url ? (
                  <Image
                    source={{ uri: accountDetails.qr_code_url }}
                    className="w-40 h-40"
                    resizeMode="contain"
                  />
                ) : (
                  <QrCode color="#0f172a" size={160} />
                )}
              </View>

              <View className="w-full bg-slate-800 p-3 rounded-xl flex-row items-center justify-between mb-3">
                <Text className="text-white font-mono font-bold text-xs flex-1 mr-2" numberOfLines={1}>
                  {accountDetails?.upi_id || 'mfct@okicici'}
                </Text>
                <TouchableOpacity
                  onPress={handleCopyUpi}
                  className="bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/40 flex-row items-center"
                >
                  {copiedUpi ? <Check color="#34d399" size={12} /> : <Copy color="#34d399" size={12} />}
                  <Text className="text-emerald-300 font-bold text-[10px] ml-1">
                    {copiedUpi ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Bank Details */}
              {accountDetails?.account_number && (
                <View className="w-full bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-left">
                  <Text className="text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Bank Transfer Details
                  </Text>
                  <Text className="text-white text-xs font-semibold">
                    A/C: {accountDetails.account_number}
                  </Text>
                  <Text className="text-slate-300 text-[11px]">
                    IFSC: {accountDetails.ifsc_code} • {accountDetails.bank_name}
                  </Text>
                  <Text className="text-slate-400 text-[10px]">
                    Holder: {accountDetails.account_holder_name}
                  </Text>
                </View>
              )}
            </View>

            {/* Verification Inputs (UTR / Screenshot) */}
            <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Text className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                12-Digit UPI Ref / UTR Number
              </Text>
              <TextInput
                value={utrNumber}
                onChangeText={setUtrNumber}
                placeholder="e.g. 423987654321"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs text-slate-900 dark:text-white font-mono mb-3"
              />

              {/* Upload Screenshot */}
              <TouchableOpacity
                onPress={handlePickImage}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 p-4 rounded-xl items-center justify-center bg-slate-50 dark:bg-slate-800/40"
              >
                {screenshotUri ? (
                  <View className="items-center">
                    <Image source={{ uri: screenshotUri }} className="w-24 h-24 rounded-lg mb-2" />
                    <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      Screenshot Attached (Tap to change)
                    </Text>
                  </View>
                ) : (
                  <View className="items-center">
                    <Upload color="#64748b" size={20} />
                    <Text className="text-slate-600 dark:text-slate-300 text-xs font-semibold mt-1">
                      Upload Payment Screenshot (Optional)
                    </Text>
                    <Text className="text-slate-400 text-[10px]">JPG or PNG from phone gallery</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmitDonation}
              disabled={submitting}
              className="w-full py-4 bg-emerald-600 rounded-2xl items-center justify-center shadow-md flex-row mt-2"
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Heart color="#ffffff" size={16} fill="#ffffff" />
                  <Text className="text-white font-black text-sm ml-2">
                    Verify & Submit Donation
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: Success Confirmation & Receipt */}
        {step === 3 && (
          <View className="space-y-4 items-center">
            <View className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 items-center justify-center mt-4">
              <CheckCircle2 color="#059669" size={40} />
            </View>

            <Text className="text-xl font-black text-slate-900 dark:text-white text-center">
              Donation Successful!
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 text-center px-4">
              JazakAllah Khair for your generous contribution. Your funds will directly reach the intended community beneficiaries.
            </Text>

            {/* Digital Receipt Card */}
            <View className="w-full bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-2">
              <View className="flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
                <Text className="text-xs text-slate-400">Receipt No.</Text>
                <Text className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                  {createdDonation?.receiptNumber || 'RCP-2024-9988'}
                </Text>
              </View>

              <View className="flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
                <Text className="text-xs text-slate-400">Amount Paid</Text>
                <Text className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  ₹{createdDonation?.amountINR?.toLocaleString('en-IN') || amount.toLocaleString('en-IN')}
                </Text>
              </View>

              <View className="flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
                <Text className="text-xs text-slate-400">Category</Text>
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {createdDonation?.category || selectedCategory}
                </Text>
              </View>

              <View className="flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
                <Text className="text-xs text-slate-400">Donor Name</Text>
                <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {createdDonation?.donorName || donorName}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-400">Status</Text>
                <View className="bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  <Text className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                    Pending Verification
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              className="w-full py-4 bg-emerald-600 rounded-2xl items-center justify-center shadow-md mt-4"
            >
              <Text className="text-white font-black text-sm">Done & Return Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/campaigns')}
              className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
            >
              <Text className="text-slate-700 dark:text-slate-300 font-bold text-xs">
                Explore More Campaigns
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
