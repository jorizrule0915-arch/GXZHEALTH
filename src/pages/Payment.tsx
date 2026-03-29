import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Landmark,
  Lock,
  QrCode,
  Receipt,
  ScanLine,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RecaptchaWidget from '@/components/RecaptchaWidget';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface OrderData {
  items: OrderItem[];
  totalItems: number;
  subtotal?: number;
  shippingCost?: number;
  totalPrice: number;
  orderNumber?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

interface PaymentProof {
  referenceId: string;
  accountName: string;
}

type MethodKey = 'paypal' | 'venmo' | 'apple' | 'zelle';

interface PaymentMethod {
  label: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  mode: 'proof' | 'contact';
  qrSrc?: string;
  gradientClass: string;
  iconClass: string;
  badgeClass: string;
  buttonClass: string;
  actionLabel: string;
  helperLabel: string;
  steps: string[];
}

const fadeInUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

const methodData: Record<MethodKey, PaymentMethod> = {
  paypal: {
    label: 'PayPal',
    subtitle: 'Scan, pay, and submit proof right away',
    description: 'Best for buyers who want a quick QR-based payment flow and can provide a transaction reference immediately.',
    icon: CreditCard,
    mode: 'proof',
    qrSrc: '/paypal.jpeg',
    gradientClass: 'from-[#003087] via-[#005ea6] to-[#009cde]',
    iconClass: 'bg-[#003087] text-white',
    badgeClass: 'border-[#003087]/20 bg-[#003087]/10 text-[#003087]',
    buttonClass: 'bg-[#003087] text-white hover:bg-[#00266f]',
    actionLabel: 'Pay with PayPal',
    helperLabel: 'Scan the QR, send payment, then submit your reference details.',
    steps: [
      'Open PayPal and choose Send & Request.',
      'Scan the QR code and confirm the receiver details.',
      'Send the full amount, then copy your transaction or reference ID.',
    ],
  },
  venmo: {
    label: 'Venmo',
    subtitle: 'Mobile-first payment with proof submission',
    description: 'Great for phone users who want to pay inside Venmo and immediately submit the proof details from the same flow.',
    icon: Smartphone,
    mode: 'proof',
    qrSrc: '/Venmo.png',
    gradientClass: 'from-[#008cff] via-[#22b8ff] to-[#3ddbd9]',
    iconClass: 'bg-[#008cff] text-white',
    badgeClass: 'border-[#008cff]/20 bg-[#008cff]/10 text-[#008cff]',
    buttonClass: 'bg-[#008cff] text-white hover:bg-[#0070d1]',
    actionLabel: 'Pay with Venmo',
    helperLabel: 'Use the app to scan and submit your proof after payment.',
    steps: [
      'Open the Venmo app and tap the QR icon.',
      'Switch to Scan and point your camera at the code.',
      'Send the payment, then paste your reference ID and account name.',
    ],
  },
  apple: {
    label: 'Apple Pay',
    subtitle: 'Ask the owner to send direct payment instructions',
    description: 'Use this if you want a direct Apple Pay setup instead of a static QR payment flow.',
    icon: Lock,
    mode: 'contact',
    gradientClass: 'from-slate-900 via-slate-700 to-slate-500',
    iconClass: 'bg-slate-900 text-white',
    badgeClass: 'border-slate-900/20 bg-slate-900/10 text-slate-700',
    buttonClass: 'bg-slate-900 text-white hover:bg-slate-800',
    actionLabel: 'Request Apple Pay',
    helperLabel: 'We will review your request and send the next steps.',
    steps: [
      'Choose Apple Pay if you prefer a direct setup.',
      'Submit your best contact details.',
      'The owner will follow up with payment instructions.',
    ],
  },
  zelle: {
    label: 'Zelle',
    subtitle: 'Request direct transfer details',
    description: 'Pick this when you want a bank-to-bank transfer and need the owner to provide the transfer destination first.',
    icon: Landmark,
    mode: 'contact',
    gradientClass: 'from-[#6d1ed4] via-[#8c3cf4] to-[#a855f7]',
    iconClass: 'bg-[#6d1ed4] text-white',
    badgeClass: 'border-[#6d1ed4]/20 bg-[#6d1ed4]/10 text-[#6d1ed4]',
    buttonClass: 'bg-[#6d1ed4] text-white hover:bg-[#5d17b7]',
    actionLabel: 'Request Zelle Details',
    helperLabel: 'We will follow up with the exact transfer details.',
    steps: [
      'Choose Zelle for a direct transfer option.',
      'Submit the best email and phone number to reach you.',
      'The owner will send the Zelle details to complete payment.',
    ],
  },
};

const trustCards = [
  {
    icon: ShieldCheck,
    title: 'Protected Submission',
    copy: 'reCAPTCHA protects the payment proof and contact forms before anything reaches the owner.',
  },
  {
    icon: Receipt,
    title: 'Order Linked',
    copy: 'Your payment details stay attached to the order number created during checkout.',
  },
  {
    icon: QrCode,
    title: 'Manual Review',
    copy: 'QR payments are reviewed before any order is marked paid or completed.',
  },
];

const bottomCards = [
  {
    icon: Lock,
    title: 'Protected forms',
    copy: 'Every payment submission is gated by reCAPTCHA before it reaches the owner.',
  },
  {
    icon: CheckCircle2,
    title: 'Manual verification',
    copy: 'Payment proof is reviewed before the order is marked complete.',
  },
  {
    icon: Receipt,
    title: 'Order-first flow',
    copy: 'The page stays tied to the same order total and number from checkout.',
  },
];

const Payment = () => {
  const location = useLocation();
  const { toast } = useToast();
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [activeProofMethod, setActiveProofMethod] = useState<MethodKey | null>(null);
  const [activeContactMethod, setActiveContactMethod] = useState<MethodKey | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [paymentProof, setPaymentProof] = useState<PaymentProof>({ referenceId: '', accountName: '' });
  const [contactData, setContactData] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactFormSuccess, setContactFormSuccess] = useState(false);
  const [paymentCaptchaToken, setPaymentCaptchaToken] = useState<string | null>(null);
  const [contactCaptchaToken, setContactCaptchaToken] = useState<string | null>(null);
  const [paymentCaptchaResetKey, setPaymentCaptchaResetKey] = useState(0);
  const [contactCaptchaResetKey, setContactCaptchaResetKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderParam = params.get('order');
    if (!orderParam) return;

    try {
      setOrderData(JSON.parse(decodeURIComponent(orderParam)));
    } catch (error) {
      console.error('Error parsing order data:', error);
    }
  }, [location]);

  const resetPaymentProof = () => setPaymentProof({ referenceId: '', accountName: '' });
  const resetPaymentCaptcha = () => {
    setPaymentCaptchaToken(null);
    setPaymentCaptchaResetKey((current) => current + 1);
  };
  const resetContactCaptcha = () => {
    setContactCaptchaToken(null);
    setContactCaptchaResetKey((current) => current + 1);
  };

  const openProofDialog = (method: MethodKey) => {
    resetPaymentProof();
    resetPaymentCaptcha();
    setActiveProofMethod(method);
  };

  const closeProofDialog = () => {
    setActiveProofMethod(null);
    resetPaymentProof();
    resetPaymentCaptcha();
  };

  const openContactDialog = (method: MethodKey) => {
    resetContactCaptcha();
    if (orderData?.customer) {
      setContactData({
        name: orderData.customer.name || '',
        email: orderData.customer.email || '',
        phone: orderData.customer.phone || '',
      });
    }
    setActiveContactMethod(method);
  };

  const closeContactDialog = () => {
    setActiveContactMethod(null);
    resetContactCaptcha();
  };

  const confirmPayment = async () => {
    if (!orderData || !activeProofMethod) {
      return;
    }

    if (!paymentProof.referenceId.trim() || !paymentProof.accountName.trim()) {
      toast({
        title: 'Missing payment proof',
        description: 'Please enter both the reference ID and the account name used for payment.',
        variant: 'destructive',
      });
      return;
    }

    if (!paymentCaptchaToken) {
      toast({
        title: 'Security check required',
        description: 'Please complete the reCAPTCHA before submitting your payment proof.',
        variant: 'destructive',
      });
      return;
    }

    const method = methodData[activeProofMethod];

    try {
      setIsSubmittingProof(true);

      const paymentMethod = method.label;
      const { error: emailError } = await supabase.functions.invoke('send-order-email', {
        body: {
          orderData,
          paymentMethod,
          paymentProof,
          recaptchaToken: paymentCaptchaToken,
        },
      });

      if (emailError) {
        throw emailError;
      }

      if (orderData.orderNumber) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_method: paymentMethod,
            payment_reference_id: paymentProof.referenceId.trim(),
            payer_account_name: paymentProof.accountName.trim(),
            payment_submitted_at: new Date().toISOString(),
            status: 'payment_submitted',
          })
          .eq('order_number', orderData.orderNumber);

        if (updateError) {
          throw updateError;
        }
      }

      localStorage.removeItem('gxz-cart');
      setContactFormSuccess(false);
      closeProofDialog();
      setShowThankYou(true);
      toast({
        title: 'Payment proof submitted',
        description: 'The owner received your payment details and will review them shortly.',
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      const message = error instanceof Error ? error.message : 'Something went wrong while sending your proof.';
      toast({
        title: 'Unable to submit payment proof',
        description: message,
        variant: 'destructive',
      });
      resetPaymentCaptcha();
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const submitContactForm = async () => {
    if (!orderData || !activeContactMethod) {
      return;
    }

    if (!contactData.name.trim() || !contactData.email.trim() || !contactData.phone.trim()) {
      toast({
        title: 'Missing contact details',
        description: 'Please fill in your name, email, and phone number first.',
        variant: 'destructive',
      });
      return;
    }

    if (!contactCaptchaToken) {
      toast({
        title: 'Security check required',
        description: 'Please complete the reCAPTCHA before requesting payment details.',
        variant: 'destructive',
      });
      return;
    }

    const method = methodData[activeContactMethod];
    const contactOrderData: OrderData = {
      ...orderData,
      customer: {
        name: contactData.name.trim(),
        email: contactData.email.trim(),
        phone: contactData.phone.trim(),
        address: orderData.customer?.address ?? '',
        city: orderData.customer?.city,
        state: orderData.customer?.state,
        zipCode: orderData.customer?.zipCode,
      },
    };

    try {
      setIsSubmitting(true);

      const { error: emailError } = await supabase.functions.invoke('send-order-email', {
        body: {
          orderData: contactOrderData,
          paymentMethod: method.label,
          recaptchaToken: contactCaptchaToken,
        },
      });

      if (emailError) {
        throw emailError;
      }

      if (orderData.orderNumber) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_method: method.label,
            customer_name: contactOrderData.customer?.name ?? null,
            customer_email: contactOrderData.customer?.email ?? null,
            customer_phone: contactOrderData.customer?.phone ?? null,
            status: 'payment_contact_requested',
          })
          .eq('order_number', orderData.orderNumber);

        if (updateError) {
          throw updateError;
        }
      }

      localStorage.removeItem('gxz-cart');
      setOrderData(contactOrderData);
      setContactFormSuccess(true);
      closeContactDialog();
      setShowThankYou(true);
      toast({
        title: `${method.label} request sent`,
        description: 'The owner received your request and will contact you with the next steps.',
      });
    } catch (error) {
      console.error('Error requesting payment details:', error);
      const message = error instanceof Error ? error.message : 'Something went wrong while sending your request.';
      toast({
        title: 'Unable to send request',
        description: message,
        variant: 'destructive',
      });
      resetContactCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethods = Object.entries(methodData) as [MethodKey, PaymentMethod][];
  const proofMethod = activeProofMethod ? methodData[activeProofMethod] : null;
  const contactMethod = activeContactMethod ? methodData[activeContactMethod] : null;
  const payNowMethods = paymentMethods.filter(([, method]) => method.mode === 'proof');
  const requestMethods = paymentMethods.filter(([, method]) => method.mode === 'contact');
  const subtotal = typeof orderData?.subtotal === 'number'
    ? orderData.subtotal
    : orderData?.items.reduce((sum, item) => sum + item.total, 0) ?? 0;
  const shippingCost = typeof orderData?.shippingCost === 'number'
    ? orderData.shippingCost
    : Math.max((orderData?.totalPrice ?? 0) - subtotal, 0);
  const customerLocation = [orderData?.customer?.city, orderData?.customer?.state, orderData?.customer?.zipCode]
    .filter(Boolean)
    .join(', ');

  const renderMethodCard = ([key, method]: [MethodKey, PaymentMethod]) => {
    const Icon = method.icon;
    const badgeLabel = method.mode === 'proof' ? 'QR payment' : 'Owner follow-up';

    return (
      <Card
        key={key}
        className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border-border/70 bg-card/95 shadow-[0_32px_90px_-60px_rgba(15,23,42,0.5)] transition-transform duration-300 hover:-translate-y-1"
      >
        <div className={cn('absolute inset-x-0 top-0 h-28 bg-gradient-to-r opacity-10', method.gradientClass)} />

        <CardHeader className="relative space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-4 ring-white/65 shadow-sm', method.iconClass)}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-2xl text-foreground">{method.label}</CardTitle>
                <CardDescription className="text-sm leading-6 text-muted-foreground">
                  {method.subtitle}
                </CardDescription>
              </div>
            </div>

            <Badge className={cn('w-fit rounded-full border px-3 py-1 text-xs font-semibold', method.badgeClass)}>
              {badgeLabel}
            </Badge>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-background/85 p-4 backdrop-blur">
            <p className="text-sm leading-6 text-muted-foreground">{method.description}</p>
          </div>
        </CardHeader>

        <CardContent className="relative flex flex-1 flex-col gap-5 p-5 pt-0 sm:p-6 sm:pt-0">
          <div className="rounded-[24px] border border-border/70 bg-muted/40 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">How this works</p>
            </div>
            <div className="space-y-3">
              {method.steps.map((step, index) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-sm font-semibold text-foreground shadow-sm">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">{method.helperLabel}</p>
            <Button
              className={cn('h-12 w-full rounded-full px-6 text-sm font-semibold shadow-lg shadow-black/5 lg:w-auto', method.buttonClass)}
              onClick={() => (method.mode === 'proof' ? openProofDialog(key) : openContactDialog(key))}
            >
              {method.actionLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-2xl">
              <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.45)]">
                <CardHeader className="space-y-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Receipt className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="font-display text-3xl text-foreground">Payment details unavailable</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      We could not find your order information for this payment page. Head back to checkout and generate a fresh payment link.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-8">
                  <p className="text-sm leading-6 text-muted-foreground">
                    This usually happens when the payment page is opened directly instead of from checkout, or if the order link expired.
                  </p>
                  <Button asChild className="h-12 rounded-full px-6">
                    <Link to="/checkout">
                      Return to Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20">
        <section className="relative">
          <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_50%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_42%),linear-gradient(180deg,_rgba(248,250,252,0.92),_rgba(248,250,252,0))]" />
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-10"
            >
              <div className="space-y-8">
                <motion.div variants={fadeInUp}>
                  <div className="overflow-hidden rounded-[32px] border border-border/70 bg-card/85 shadow-[0_34px_110px_-70px_rgba(15,23,42,0.52)] backdrop-blur">
                    <div className="grid gap-8 p-5 sm:p-6 lg:p-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
                      <div className="space-y-6">
                        <Link
                          to="/checkout"
                          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back to checkout
                        </Link>

                        <div className="space-y-5">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border-primary/15 bg-primary/10 px-4 py-1.5 text-primary">
                              Secure payment setup
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-4 py-1.5 text-muted-foreground">
                              Order #{orderData.orderNumber ?? 'Pending'}
                            </Badge>
                          </div>

                          <div className="max-w-3xl space-y-4">
                            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                              Finish checkout with the payment flow that feels easiest for your customer.
                            </h1>
                            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base md:text-lg">
                              The order total, shipping details, and customer information from checkout are already carried into this page. Use QR payments for fast proof submission, or request Apple Pay and Zelle instructions for a direct owner follow-up.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_28px_80px_-50px_rgba(15,23,42,0.85)] sm:p-6">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.18),_transparent_38%)]" />
                        <div className="relative space-y-5">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">Checkout snapshot</p>
                            <p className="text-sm leading-6 text-slate-300">
                              A quick view of what this payment page is tied to before the customer submits anything.
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Total due</p>
                              <p className="mt-2 text-3xl font-bold">${orderData.totalPrice.toFixed(2)}</p>
                            </div>
                            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Customer</p>
                              <p className="mt-2 text-base font-semibold">{orderData.customer?.name || 'Pending details'}</p>
                              {orderData.customer?.email && <p className="mt-1 text-sm text-slate-300">{orderData.customer.email}</p>}
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Pay now</p>
                              <p className="mt-2 text-lg font-semibold">{payNowMethods.length} QR options</p>
                            </div>
                            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Owner follow-up</p>
                              <p className="mt-2 text-lg font-semibold">{requestMethods.length} direct options</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {trustCards.map((card) => {
                    const Icon = card.icon;

                    return (
                      <Card
                        key={card.title}
                        className="rounded-[24px] border-border/70 bg-card/90 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.5)] backdrop-blur"
                      >
                        <CardContent className="space-y-4 p-6">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="space-y-2">
                            <h2 className="text-base font-semibold text-foreground">{card.title}</h2>
                            <p className="text-sm leading-6 text-muted-foreground">{card.copy}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </motion.div>

                <motion.div variants={fadeInUp} className="space-y-8">
                  <section className="space-y-4">
                    <div className="flex flex-col gap-4 rounded-[28px] border border-border/70 bg-card/75 p-5 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] sm:p-6 lg:flex-row lg:items-end lg:justify-between">
                      <div className="space-y-2">
                        <Badge className="rounded-full border-primary/15 bg-primary/10 px-4 py-1.5 text-primary">Pay now</Badge>
                        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Instant QR payment options</h2>
                        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                          Use these when the customer is ready to pay immediately and can provide proof after the transfer.
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
                        {payNowMethods.length} payment methods ready for immediate checkout
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      {payNowMethods.map(renderMethodCard)}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex flex-col gap-4 rounded-[28px] border border-border/70 bg-card/75 p-5 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] sm:p-6 lg:flex-row lg:items-end lg:justify-between">
                      <div className="space-y-2">
                        <Badge variant="outline" className="rounded-full px-4 py-1.5 text-muted-foreground">Owner follow-up</Badge>
                        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Request direct payment instructions</h2>
                        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                          Use these when the customer prefers Apple Pay or Zelle and needs the owner to send the exact payment destination first.
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
                        The owner receives the request with the order details and follows up manually
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      {requestMethods.map(renderMethodCard)}
                    </div>
                  </section>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <Card className="overflow-hidden rounded-[28px] border-border/70 shadow-[0_28px_90px_-62px_rgba(15,23,42,0.55)]">
                    <CardContent className="grid gap-0 p-0 md:grid-cols-[1.1fr_0.9fr]">
                      <div className="space-y-4 p-6 sm:p-8">
                        <Badge className="rounded-full border-primary/15 bg-primary/10 px-4 py-1.5 text-primary">
                          Review before completion
                        </Badge>
                        <div className="space-y-3">
                          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                            Orders are only marked paid after the owner checks the payment details.
                          </h2>
                          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                            QR-based payments should include your order number in the transfer note whenever possible. The payment proof form helps the
                            owner match your order, but it does not auto-complete the order by itself.
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-border/70 bg-muted/40 p-6 sm:p-8 md:border-t-0 md:border-l">
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Good to include</h3>
                          <div className="space-y-3">
                            {['Your order number in the payment note', 'The exact reference or transaction ID', 'The account name used for payment'].map((item) => (
                              <div key={item} className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                                <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={fadeInUp} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {bottomCards.map((card) => {
                    const Icon = card.icon;

                    return (
                      <Card key={card.title} className="rounded-[24px] border-border/70 bg-card/90">
                        <CardContent className="space-y-4 p-6">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">{card.title}</h3>
                            <p className="text-sm leading-6 text-muted-foreground">{card.copy}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </motion.div>
              </div>

              <motion.aside variants={fadeInUp} className="space-y-5 xl:sticky xl:top-32 xl:self-start">
                <Card className="overflow-hidden rounded-[30px] border-border/70 shadow-[0_34px_90px_-65px_rgba(15,23,42,0.55)]">
                  <CardHeader className="space-y-5 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <CardDescription className="text-sm uppercase tracking-[0.26em] text-muted-foreground">Order summary</CardDescription>
                        <CardTitle className="font-display text-3xl text-foreground">${orderData.totalPrice.toFixed(2)}</CardTitle>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Receipt className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-border/70 bg-background/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Order number</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">{orderData.orderNumber ?? 'Pending assignment'}</p>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 p-5 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Items</span>
                        <span className="font-medium text-foreground">{orderData.totalItems}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-medium text-foreground">${shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-dashed border-border pt-4">
                        <span className="text-sm font-semibold text-foreground">Total due</span>
                        <span className="text-xl font-bold text-primary">${orderData.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-[24px] border border-border/70 bg-muted/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Deliver to</p>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{orderData.customer?.name || 'Customer details pending'}</p>
                        {orderData.customer?.email && <p className="text-sm text-muted-foreground">{orderData.customer.email}</p>}
                        {orderData.customer?.phone && <p className="text-sm text-muted-foreground">{orderData.customer.phone}</p>}
                        {orderData.customer?.address && <p className="text-sm text-muted-foreground">{orderData.customer.address}</p>}
                        {customerLocation && <p className="text-sm text-muted-foreground">{customerLocation}</p>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Items in this order</p>
                      <div className="max-h-[19rem] space-y-3 overflow-y-auto pr-1">
                        {orderData.items.map((item, index) => (
                          <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-4 rounded-[20px] border border-border/60 bg-background/80 px-4 py-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} x ${item.price.toFixed(2)}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-foreground">${item.total.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border-border/70 bg-card/90">
                  <CardContent className="space-y-4 p-5 sm:p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold text-foreground">What happens next</h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Submit proof for PayPal or Venmo, or request owner instructions for Apple Pay or Zelle. In every case, the owner reviews the order before moving it forward.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.aside>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />

      <Dialog open={Boolean(proofMethod)} onOpenChange={(open) => (!open ? closeProofDialog() : undefined)}>
        <DialogContent className="max-h-[calc(100vh-1.5rem)] max-w-4xl overflow-hidden border-border/70 p-0 sm:max-h-[calc(100vh-2rem)]">
          {proofMethod && (
            <div className="grid max-h-[calc(100vh-1.5rem)] gap-0 lg:grid-cols-[0.95fr_1.05fr] sm:max-h-[calc(100vh-2rem)]">
              <div className={cn('space-y-6 overflow-y-auto p-5 text-white sm:p-6 lg:p-8', `bg-gradient-to-br ${proofMethod.gradientClass}`)}>
                <div className="space-y-3 pr-10 sm:pr-12">
                  <Badge className="rounded-full border-white/20 bg-white/15 px-4 py-1.5 text-white hover:bg-white/15">
                    QR payment
                  </Badge>
                  <DialogTitle className="font-display text-3xl">{proofMethod.label} payment</DialogTitle>
                  <DialogDescription className="text-white/80">
                    Scan the QR code, send the exact order total, then submit the required proof details below.
                  </DialogDescription>
                </div>

                <div className="rounded-[32px] bg-white/95 p-5 shadow-2xl shadow-black/10">
                  <img
                    src={proofMethod.qrSrc}
                    alt={`${proofMethod.label} QR code`}
                    className="mx-auto aspect-square w-full max-w-[16rem] rounded-[24px] object-cover sm:max-w-[20rem] lg:max-w-[22rem]"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/20 bg-white/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Amount to send</p>
                    <p className="mt-2 text-2xl font-bold">${orderData.totalPrice.toFixed(2)}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/20 bg-white/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Order number</p>
                    <p className="mt-2 text-lg font-semibold">{orderData.orderNumber ?? 'Pending assignment'}</p>
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-col bg-background">
                <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6 lg:p-8">
                  <DialogHeader className="space-y-3 pr-10 text-left sm:pr-12">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <ScanLine className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <DialogTitle className="text-2xl text-foreground">Submit payment proof</DialogTitle>
                      <DialogDescription className="text-sm leading-6 text-muted-foreground">
                        Both fields are required. The owner uses this information to match your transfer before marking the order as paid.
                      </DialogDescription>
                    </div>
                  </DialogHeader>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="referenceId">Reference ID / Transaction ID *</Label>
                      <Input
                        id="referenceId"
                        className="h-12 rounded-2xl"
                        placeholder="Please fill in your payment reference ID"
                        value={paymentProof.referenceId}
                        onChange={(event) => setPaymentProof((current) => ({ ...current, referenceId: event.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountName">Name on PayPal / Venmo account *</Label>
                      <Input
                        id="accountName"
                        className="h-12 rounded-2xl"
                        placeholder="Enter the account name used for payment"
                        value={paymentProof.accountName}
                        onChange={(event) => setPaymentProof((current) => ({ ...current, accountName: event.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-[28px] border border-border/70 bg-muted/35 p-4 sm:p-5">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">Security check</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Complete the captcha to protect the payment form from spam submissions.
                      </p>
                    </div>
                    <RecaptchaWidget
                      siteKey={recaptchaSiteKey}
                      onVerify={setPaymentCaptchaToken}
                      resetKey={paymentCaptchaResetKey}
                    />
                  </div>
                </div>

                <div className="border-t border-border/70 bg-background/95 px-5 py-4 backdrop-blur sm:px-6 lg:px-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button variant="outline" className="h-12 rounded-full px-6" onClick={closeProofDialog}>
                      Cancel
                    </Button>
                    <Button
                      className={cn('h-12 rounded-full px-6 text-sm font-semibold', proofMethod.buttonClass)}
                      onClick={confirmPayment}
                      disabled={
                        isSubmittingProof ||
                        !paymentProof.referenceId.trim() ||
                        !paymentProof.accountName.trim() ||
                        !paymentCaptchaToken
                      }
                    >
                      {isSubmittingProof ? 'Submitting proof...' : 'Done Paying'}
                      {!isSubmittingProof && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(contactMethod)} onOpenChange={(open) => (!open ? closeContactDialog() : undefined)}>
        <DialogContent className="max-h-[calc(100vh-1.5rem)] max-w-3xl overflow-hidden border-border/70 p-0 sm:max-h-[calc(100vh-2rem)]">
          {contactMethod && (
            <div className="grid max-h-[calc(100vh-1.5rem)] gap-0 lg:grid-cols-[0.92fr_1.08fr] sm:max-h-[calc(100vh-2rem)]">
              <div className={cn('space-y-6 overflow-y-auto p-5 text-white sm:p-6 lg:p-8', `bg-gradient-to-br ${contactMethod.gradientClass}`)}>
                <Badge className="w-fit rounded-full border-white/20 bg-white/15 px-4 py-1.5 text-white hover:bg-white/15">
                  Direct owner follow-up
                </Badge>
                <div className="space-y-3 pr-10 sm:pr-12">
                  <DialogTitle className="font-display text-3xl">{contactMethod.label} request</DialogTitle>
                  <DialogDescription className="text-white/80">
                    Share the best contact details so the owner can send the exact payment instructions for this order.
                  </DialogDescription>
                </div>

                <div className="space-y-3 rounded-[28px] border border-white/15 bg-white/10 p-5">
                  {contactMethod.steps.map((step, index) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-white/85">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[24px] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Order total</p>
                  <p className="mt-2 text-2xl font-bold">${orderData.totalPrice.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex min-h-0 flex-col bg-background">
                <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6 lg:p-8">
                  <DialogHeader className="space-y-3 pr-10 text-left sm:pr-12">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Lock className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <DialogTitle className="text-2xl text-foreground">Request payment details</DialogTitle>
                      <DialogDescription className="text-sm leading-6 text-muted-foreground">
                        This sends your order and contact details to the owner so they can follow up with Apple Pay or Zelle instructions.
                      </DialogDescription>
                    </div>
                  </DialogHeader>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Full name *</Label>
                      <Input
                        id="contactName"
                        className="h-12 rounded-2xl"
                        placeholder="John Doe"
                        value={contactData.name}
                        onChange={(event) => setContactData((current) => ({ ...current, name: event.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email address *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        className="h-12 rounded-2xl"
                        placeholder="john@example.com"
                        value={contactData.email}
                        onChange={(event) => setContactData((current) => ({ ...current, email: event.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone number *</Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        className="h-12 rounded-2xl"
                        placeholder="(555) 123-4567"
                        value={contactData.phone}
                        onChange={(event) => setContactData((current) => ({ ...current, phone: event.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-[28px] border border-border/70 bg-muted/35 p-4 sm:p-5">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">Security check</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Complete the captcha before sending your request to the owner.
                      </p>
                    </div>
                    <RecaptchaWidget
                      siteKey={recaptchaSiteKey}
                      onVerify={setContactCaptchaToken}
                      resetKey={contactCaptchaResetKey}
                    />
                  </div>
                </div>

                <div className="border-t border-border/70 bg-background/95 px-5 py-4 backdrop-blur sm:px-6 lg:px-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button variant="outline" className="h-12 rounded-full px-6" onClick={closeContactDialog}>
                      Cancel
                    </Button>
                    <Button
                      className={cn('h-12 rounded-full px-6 text-sm font-semibold', contactMethod.buttonClass)}
                      onClick={submitContactForm}
                      disabled={
                        isSubmitting ||
                        !contactData.name.trim() ||
                        !contactData.email.trim() ||
                        !contactData.phone.trim() ||
                        !contactCaptchaToken
                      }
                    >
                      {isSubmitting ? 'Sending request...' : contactMethod.actionLabel}
                      {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
        <DialogContent className="max-w-lg border-border/70 p-6 sm:p-8">
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-3">
              <DialogTitle className="font-display text-3xl text-foreground">
                {contactFormSuccess ? 'Request sent' : 'Payment proof submitted'}
              </DialogTitle>
              <DialogDescription className="text-sm leading-7 text-muted-foreground">
                {contactFormSuccess
                  ? 'The owner received your request and will contact you with the payment instructions for this order.'
                  : 'The owner received your payment proof and will manually verify it before updating the order status.'}
              </DialogDescription>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild variant="outline" className="h-12 rounded-full">
                <Link to="/products">Browse products</Link>
              </Button>
              <Button asChild className="h-12 rounded-full">
                <Link to="/">Return home</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payment;
