import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export type RazorpayPurpose = 'donation' | 'membership' | 'female_member';

export interface VerifiedMobileRazorpayPayment {
  orderId: string;
  paymentId: string;
  signature: string;
  amountINR: number;
  method: string;
  paymentMethodLabel: string;
}

export class RazorpayCancelledError extends Error {
  constructor(message = 'Payment cancelled before completion.') {
    super(message);
    this.name = 'RazorpayCancelledError';
  }
}

export const RAZORPAY_API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://www.mfcttrust.com'
).replace(/\/+$/, '');

function loadWebCheckoutScript(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false);
  }
  const win = window as any;
  if (win.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(win.Razorpay)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean(win.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function postRazorpayApi<T>(
  path: string,
  body: Record<string, unknown>,
  fallbackError: string
): Promise<T> {
  const endpointUrl = `${RAZORPAY_API_BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr: any) {
    throw new Error(
      `Cannot reach Razorpay backend at ${endpointUrl}. Check your internet connection or EXPO_PUBLIC_API_URL (${networkErr?.message || 'network error'}).`
    );
  }

  const rawText = await response.text().catch(() => '');
  let parsed: any = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
  }

  if (response.status === 404 || (response.status >= 400 && !parsed)) {
    throw new Error(
      `Razorpay API endpoint returned HTTP ${response.status} at ${endpointUrl}. Please deploy the updated ngo-website-and-panel backend to ${RAZORPAY_API_BASE_URL} (or point EXPO_PUBLIC_API_URL to your running backend).`
    );
  }

  if (!response.ok || !parsed?.success) {
    throw new Error(parsed?.error || fallbackError);
  }

  return parsed.data as T;
}

export function isNativeRazorpaySdkAvailable(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    const checkoutModule =
      TurboModuleRegistry?.get?.('RNRazorpayCheckout') ||
      (NativeModules as Record<string, unknown>)?.RNRazorpayCheckout;
    const emitterModule =
      TurboModuleRegistry?.get?.('RazorpayEventEmitter') ||
      (NativeModules as Record<string, unknown>)?.RazorpayEventEmitter;
    return Boolean(checkoutModule && emitterModule);
  } catch {
    return false;
  }
}

async function verifyPaymentWithBackend(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  expectedAmountINR: number;
}): Promise<VerifiedMobileRazorpayPayment> {
  const verifiedData = await postRazorpayApi<{
    verified?: boolean;
    amountINR?: number;
    method?: string;
    paymentMethodLabel?: string;
  }>(
    '/api/razorpay/verify-payment',
    {
      razorpay_order_id: params.orderId,
      razorpay_payment_id: params.paymentId,
      razorpay_signature: params.signature,
      expectedAmountINR: params.expectedAmountINR,
    },
    'Razorpay payment verification failed.'
  );

  if (!verifiedData?.verified) {
    throw new Error('Razorpay payment verification failed.');
  }

  return {
    orderId: params.orderId,
    paymentId: params.paymentId,
    signature: params.signature,
    amountINR: Number(verifiedData.amountINR ?? params.expectedAmountINR),
    method: String(verifiedData.method || 'online'),
    paymentMethodLabel: String(verifiedData.paymentMethodLabel || 'Razorpay'),
  };
}

function extractCallbackParams(url: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const parsed = Linking.parse(url);
    if (parsed.queryParams) {
      for (const [k, v] of Object.entries(parsed.queryParams)) {
        if (v !== undefined && v !== null) {
          result[k] = Array.isArray(v) ? String(v[0] ?? '') : String(v);
        }
      }
    }
  } catch {
    // Fallback query extraction below
  }

  const qIdx = url.indexOf('?');
  if (qIdx !== -1) {
    const qs = url.slice(qIdx + 1).split('#')[0];
    const search = new URLSearchParams(qs);
    search.forEach((value, key) => {
      if (!result[key]) {
        result[key] = value;
      }
    });
  }

  return result;
}

export async function startMobileRazorpayPayment(params: {
  amountINR: number;
  purpose: RazorpayPurpose;
  description: string;
  receipt?: string;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  notes?: Record<string, string>;
}): Promise<VerifiedMobileRazorpayPayment> {
  // 1. Create order on secure backend
  const orderData = await postRazorpayApi<{
    orderId?: string;
    amount?: number;
    currency?: string;
    keyId?: string;
    amountINR?: number;
  }>(
    '/api/razorpay/create-order',
    {
      amountINR: params.amountINR,
      purpose: params.purpose,
      receipt: params.receipt,
      notes: params.notes,
    },
    'Could not start Razorpay payment. Please try again.'
  );

  if (!orderData?.orderId || !orderData?.keyId) {
    throw new Error('Could not start Razorpay payment. Incomplete order payload returned.');
  }

  const { orderId, amount = Math.round(params.amountINR * 100), currency = 'INR', keyId, amountINR = params.amountINR } =
    orderData as {
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      amountINR: number;
    };

  // 2A. Expo Web flow
  if (Platform.OS === 'web') {
    const loaded = await loadWebCheckoutScript();
    const win = typeof window !== 'undefined' ? (window as any) : null;
    if (!loaded || !win?.Razorpay) {
      throw new Error('Unable to load Razorpay Checkout in browser.');
    }

    return new Promise<VerifiedMobileRazorpayPayment>((resolve, reject) => {
      let settled = false;
      const done = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      const rzp = new win.Razorpay({
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'Mohammad Faeem Charitable Trust',
        description: params.description,
        image: `${RAZORPAY_API_BASE_URL}/mfct-logo.png`,
        order_id: orderId,
        prefill: {
          name: params.prefill?.name || '',
          contact: params.prefill?.contact || '',
          email: params.prefill?.email || '',
        },
        notes: params.notes || {},
        theme: { color: '#0f3322' },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verified = await verifyPaymentWithBackend({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              expectedAmountINR: amountINR,
            });
            done(() => resolve(verified));
          } catch (err: any) {
            done(() => reject(new Error(err?.message || 'Payment verification failed.')));
          }
        },
        modal: {
          ondismiss: () => {
            done(() => reject(new RazorpayCancelledError()));
          },
        },
      });

      rzp.on('payment.failed', (failure: any) => {
        done(() =>
          reject(
            new Error(
              failure?.error?.description ||
                failure?.error?.reason ||
                'Payment failed. Please try again.'
            )
          )
        );
      });

      rzp.open();
    });
  }

  // 2B. Native Android / iOS Razorpay SDK (react-native-razorpay) when linked in custom dev client / EAS build
  if (isNativeRazorpaySdkAvailable()) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rzpModule = require('react-native-razorpay');
    const RazorpayCheckout = rzpModule?.default || rzpModule;
    if (RazorpayCheckout && typeof RazorpayCheckout.open === 'function') {
      let sdkResult: {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
      };

      try {
        sdkResult = await RazorpayCheckout.open({
          description: params.description,
          image: `${RAZORPAY_API_BASE_URL}/mfct-logo.png`,
          currency: currency || 'INR',
          key: keyId,
          amount: String(amount),
          name: 'Mohammad Faeem Charitable Trust',
          order_id: orderId,
          prefill: {
            email: params.prefill?.email || '',
            contact: params.prefill?.contact || '',
            name: params.prefill?.name || '',
          },
          notes: params.notes || {},
          theme: { color: '#0f3322' },
        });
      } catch (sdkErr: any) {
        const errPayload = sdkErr?.error || sdkErr || {};
        const code = errPayload?.code;
        const reason = String(errPayload?.reason || '');
        const desc = String(
          errPayload?.description ||
            reason ||
            sdkErr?.message ||
            'Payment failed or was cancelled.'
        );
        const isCancelled =
          code === 0 ||
          code === '0' ||
          /cancel/i.test(desc) ||
          /cancel/i.test(reason);

        if (isCancelled) {
          throw new RazorpayCancelledError();
        }
        throw new Error(desc);
      }

      const sdkOrderId = String(sdkResult?.razorpay_order_id || orderId || '');
      const sdkPaymentId = String(sdkResult?.razorpay_payment_id || '');
      const sdkSignature = String(sdkResult?.razorpay_signature || '');
      if (!sdkPaymentId || !sdkSignature) {
        throw new Error('Incomplete Razorpay payment response returned from SDK.');
      }

      return verifyPaymentWithBackend({
        orderId: sdkOrderId,
        paymentId: sdkPaymentId,
        signature: sdkSignature,
        expectedAmountINR: amountINR,
      });
    }
  }

  // 2C. Fallback hosted checkout bridge via expo-web-browser (for Expo Go when native SDK module isn't linked)
  const redirectUrl = Linking.createURL('razorpay-callback');
  const query = new URLSearchParams({
    orderId,
    amount: String(amount),
    keyId,
    description: params.description,
    prefillName: params.prefill?.name || '',
    prefillContact: params.prefill?.contact || '',
    prefillEmail: params.prefill?.email || '',
    redirectUrl,
  });

  const checkoutUrl = `${RAZORPAY_API_BASE_URL}/razorpay-checkout?${query.toString()}`;
  const authResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, redirectUrl, {
    showTitle: true,
    toolbarColor: '#0f3322',
    controlsColor: '#f0c868',
  });

  if (authResult.type !== 'success' || !('url' in authResult) || !authResult.url) {
    throw new RazorpayCancelledError();
  }

  const callbackParams = extractCallbackParams(authResult.url);
  if (callbackParams.status === 'cancelled') {
    throw new RazorpayCancelledError();
  }
  if (callbackParams.status === 'failed') {
    throw new Error(callbackParams.error || 'Payment failed. Please try again.');
  }

  const rzpOrderId = callbackParams.razorpay_order_id || '';
  const rzpPaymentId = callbackParams.razorpay_payment_id || '';
  const rzpSignature = callbackParams.razorpay_signature || '';

  if (callbackParams.status !== 'success' || !rzpOrderId || !rzpPaymentId || !rzpSignature) {
    throw new Error('Incomplete Razorpay payment response returned from checkout.');
  }

  return verifyPaymentWithBackend({
    orderId: rzpOrderId,
    paymentId: rzpPaymentId,
    signature: rzpSignature,
    expectedAmountINR: amountINR,
  });
}

