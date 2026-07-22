import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, Lock, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';

interface PromoValidationResult {
  valid: boolean;
  message: string;
  promo_code_id: string | null;
  promo_product_id: string | null;
  promo_product_name: string | null;
  code: string | null;
  influencer_name: string | null;
  discount_percent: number | null;
  expires_at: string | null;
  usage_limit: number | null;
  total_uses: number | null;
  minimum_order_requirement: number | null;
}

interface AppliedPromoCode {
  promoCodeId: string;
  promoProductId: string;
  promoProductName: string;
  code: string;
  influencerName: string;
  discountPercent: number;
}

const ALL_PRODUCTS_PROMO_NAME = 'All Products';

function normalizePromoCode(value: string) {
  return value.toUpperCase().replace(/\s+/g, '').trim();
}

function normalizePromoMatchValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function calculatePromoDiscount(baseTotal: number, discountPercent: number) {
  return Math.min(baseTotal, Number(((baseTotal * discountPercent) / 100).toFixed(2)));
}

function getOrderSaveErrorMessage(error: { message?: string }) {
  const message = error.message ?? 'Something went wrong while saving your order.';

  if (message.toLowerCase().includes('failed to fetch')) {
    return 'Checkout backend is unreachable. Please check that VITE_SUPABASE_URL points to an active Supabase project and redeploy the site.';
  }

  return message;
}

function decodeExternalText(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/&#8211;|&#x2013;/gi, '-')
    .replace(/&#8212;|&#x2014;/gi, '-')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&#39;/gi, "'")
    .trim();
}

function getExternalOptionLabel(item: Record<string, unknown>) {
  const directCandidates = [
    item.selectedOptionLabel,
    item.size,
    item.vialSize,
    item.vial_size,
    item.option,
    item.variant,
    item.variation,
  ];

  for (const candidate of directCandidates) {
    const label = decodeExternalText(candidate);
    if (label) {
      return label;
    }
  }

  const collections = [item.attributes, item.variation, item.variations, item.meta_data];
  const labels: string[] = [];

  for (const collection of collections) {
    if (Array.isArray(collection)) {
      for (const entry of collection) {
        if (!entry || typeof entry !== 'object') continue;
        const attribute = entry as Record<string, unknown>;
        const key = decodeExternalText(attribute.name ?? attribute.attribute ?? attribute.key ?? attribute.label);
        const value = decodeExternalText(attribute.option ?? attribute.value ?? attribute.display_value);

        if (value && (!key || /size|vial|strength|dose|mg|ml/i.test(key))) {
          labels.push(key && !/^(size|vial size)$/i.test(key) ? `${key}: ${value}` : value);
        }
      }
    } else if (collection && typeof collection === 'object') {
      for (const [rawKey, rawValue] of Object.entries(collection)) {
        const key = decodeExternalText(rawKey.replace(/^attribute_/, '').replace(/^pa_/, '').replace(/[-_]+/g, ' '));
        const value = decodeExternalText(rawValue);
        if (value && /size|vial|strength|dose|mg|ml/i.test(key)) {
          labels.push(key && !/^(size|vial size)$/i.test(key) ? `${key}: ${value}` : value);
        }
      }
    }
  }

  return [...new Set(labels)].join(' / ');
}

const Checkout = () => {
  const location = useLocation();
  const { items, updateQuantity, removeItem, totalPrice, totalItems, addItem, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<AppliedPromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromoCode, setApplyingPromoCode] = useState(false);
  const [pendingUrlPromoCode, setPendingUrlPromoCode] = useState<string | null>(null);

  const hasFreeShipping = items.some((item) =>
    item.name.toLowerCase().includes('gxz glp')
  );

  const shippingCost = hasFreeShipping ? 0 : 10;
  const subtotal = totalPrice;
  const preDiscountTotal = subtotal + shippingCost;
  const getPromoDiscountBase = (promo: AppliedPromoCode) => {
    if (promo.promoProductName.toLowerCase() === ALL_PRODUCTS_PROMO_NAME.toLowerCase()) {
      return preDiscountTotal;
    }

    const normalizedPromoProduct = normalizePromoMatchValue(promo.promoProductName);

    return items.reduce((sum, item) => {
      const normalizedItemName = normalizePromoMatchValue(item.name);
      const isMatchingProduct =
        normalizedItemName.includes(normalizedPromoProduct) ||
        normalizedPromoProduct.includes(normalizedItemName);

      return isMatchingProduct ? sum + item.price * item.quantity : sum;
    }, 0);
  };
  const getMatchingPromoQuantity = (promoProductName: string) => {
    if (promoProductName.toLowerCase() === ALL_PRODUCTS_PROMO_NAME.toLowerCase()) {
      return totalItems;
    }

    const normalizedPromoProduct = normalizePromoMatchValue(promoProductName);

    return items.reduce((sum, item) => {
      const normalizedItemName = normalizePromoMatchValue(item.name);
      const isMatchingProduct =
        normalizedItemName.includes(normalizedPromoProduct) ||
        normalizedPromoProduct.includes(normalizedItemName);

      return isMatchingProduct ? sum + item.quantity : sum;
    }, 0);
  };
  const previewPromoDiscount = appliedPromoCode
    ? calculatePromoDiscount(getPromoDiscountBase(appliedPromoCode), appliedPromoCode.discountPercent)
    : 0;
  const orderTotal = Math.max(preDiscountTotal - previewPromoDiscount, 0);

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const validatePromoCode = async (rawCode: string): Promise<{ valid: boolean; message: string; result?: PromoValidationResult }> => {
    const normalizedCode = normalizePromoCode(rawCode);

    if (!normalizedCode) {
      return {
        valid: false,
        message: 'Please enter a promo code.',
      };
    }

    // Require email for promo code validation
    if (!customerInfo.email || customerInfo.email.trim() === '') {
      return {
        valid: false,
        message: 'Please enter your email address before applying a promo code.',
      };
    }

    const { data: directPromoCode, error: directPromoCodeError } = await supabase
      .from('promo_codes')
      .select('*')
      .ilike('code', normalizedCode)
      .maybeSingle();

    if (directPromoCodeError) {
      return {
        valid: false,
        message: directPromoCodeError.message,
      };
    }

    if (!directPromoCode) {
      return {
        valid: false,
        message: 'Promo code not found.',
      };
    }

    const { data: directPromoProduct, error: directPromoProductError } = await supabase
      .from('promo_products')
      .select('*')
      .eq('id', directPromoCode.promo_product_id)
      .maybeSingle();

    if (directPromoProductError) {
      return {
        valid: false,
        message: directPromoProductError.message,
      };
    }

    if (!directPromoProduct) {
      return {
        valid: false,
        message: 'This promo code is not linked to a product.',
      };
    }

    if (directPromoCode.expires_at && new Date(directPromoCode.expires_at) < new Date()) {
      return {
        valid: false,
        message: 'This promo code has expired.',
      };
    }

    if (directPromoCode.usage_limit !== null && directPromoCode.total_uses >= directPromoCode.usage_limit) {
      return {
        valid: false,
        message: 'This promo code has reached its usage limit.',
      };
    }

    const isDirectAllProductsCode =
      directPromoProduct.sku === '__ALL__' ||
      directPromoProduct.name.toLowerCase() === ALL_PRODUCTS_PROMO_NAME.toLowerCase();
    const directMatchingQuantity = isDirectAllProductsCode ? totalItems : getMatchingPromoQuantity(directPromoProduct.name);
    const directRequiredQuantity = Number(directPromoCode.minimum_order_requirement ?? 0);

    if (directMatchingQuantity === 0) {
      return {
        valid: false,
        message: isDirectAllProductsCode
          ? 'Add items to your cart before applying this code.'
          : `This code only works for ${directPromoProduct.name}.`,
      };
    }

    if (directRequiredQuantity > 0 && directMatchingQuantity < directRequiredQuantity) {
      return {
        valid: false,
        message: `This code requires at least ${directRequiredQuantity} ${directPromoProduct.name} item(s) in your cart. You have ${directMatchingQuantity}.`,
      };
    }

    return {
      valid: true,
      message: 'Promo code applied successfully.',
      result: {
        valid: true,
        message: 'Promo code applied successfully.',
        promo_code_id: directPromoCode.id,
        promo_product_id: directPromoProduct.id,
        promo_product_name: directPromoProduct.name,
        code: directPromoCode.code,
        influencer_name: directPromoCode.influencer_name,
        discount_percent: Number(directPromoCode.discount_percent ?? 0),
        expires_at: directPromoCode.expires_at,
        usage_limit: directPromoCode.usage_limit,
        total_uses: directPromoCode.total_uses,
        minimum_order_requirement: directPromoCode.minimum_order_requirement,
      },
    };

    const validationArgs = {
      input_code: normalizedCode,
      cart_items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
      })),
    };

    let { data, error } = await supabase.rpc('validate_promo_code', {
      ...validationArgs,
      customer_email: customerInfo.email.trim().toLowerCase(),
    });

    const errorMessage = error?.message?.toLowerCase() ?? '';
    const canRetryWithoutEmail =
      errorMessage.includes('customer_email') ||
      (errorMessage.includes('validate_promo_code') && errorMessage.includes('ambiguous'));

    if (canRetryWithoutEmail) {
      const retry = await supabase.rpc('validate_promo_code', validationArgs);
      data = retry.data;
      error = retry.error;
    }

    const shouldUseDirectPromoLookup =
      errorMessage.includes('could not choose the best candidate function') ||
      errorMessage.includes('validate_promo_code');

    if (error && shouldUseDirectPromoLookup) {
      const { data: promoCode, error: promoCodeError } = await supabase
        .from('promo_codes')
        .select('*')
        .ilike('code', normalizedCode)
        .maybeSingle();

      if (promoCodeError) {
        return {
          valid: false,
          message: promoCodeError.message,
        };
      }

      if (!promoCode) {
        return {
          valid: false,
          message: 'Promo code not found.',
        };
      }

      const { data: promoProduct, error: promoProductError } = await supabase
        .from('promo_products')
        .select('*')
        .eq('id', promoCode.promo_product_id)
        .maybeSingle();

      if (promoProductError) {
        return {
          valid: false,
          message: promoProductError.message,
        };
      }

      if (!promoProduct) {
        return {
          valid: false,
          message: 'This promo code is not linked to a product.',
        };
      }

      if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
        return {
          valid: false,
          message: 'This promo code has expired.',
        };
      }

      if (promoCode.usage_limit !== null && promoCode.total_uses >= promoCode.usage_limit) {
        return {
          valid: false,
          message: 'This promo code has reached its usage limit.',
        };
      }

      const isAllProductsCode =
        promoProduct.sku === '__ALL__' ||
        promoProduct.name.toLowerCase() === ALL_PRODUCTS_PROMO_NAME.toLowerCase();
      const matchingQuantity = isAllProductsCode ? totalItems : getMatchingPromoQuantity(promoProduct.name);
      const requiredQuantity = Number(promoCode.minimum_order_requirement ?? 0);

      if (matchingQuantity === 0) {
        return {
          valid: false,
          message: isAllProductsCode
            ? 'Add items to your cart before applying this code.'
            : `This code only works for ${promoProduct.name}.`,
        };
      }

      if (requiredQuantity > 0 && matchingQuantity < requiredQuantity) {
        return {
          valid: false,
          message: `This code requires at least ${requiredQuantity} ${promoProduct.name} item(s) in your cart. You have ${matchingQuantity}.`,
        };
      }

      return {
        valid: true,
        message: 'Promo code applied successfully.',
        result: {
          valid: true,
          message: 'Promo code applied successfully.',
          promo_code_id: promoCode.id,
          promo_product_id: promoProduct.id,
          promo_product_name: promoProduct.name,
          code: promoCode.code,
          influencer_name: promoCode.influencer_name,
          discount_percent: Number(promoCode.discount_percent ?? 0),
          expires_at: promoCode.expires_at,
          usage_limit: promoCode.usage_limit,
          total_uses: promoCode.total_uses,
          minimum_order_requirement: promoCode.minimum_order_requirement,
        },
      };
    }

    if (error) {
      return {
        valid: false,
        message: error.message,
      };
    }

    const firstResult = (data?.[0] as PromoValidationResult | undefined) ?? undefined;

    if (!firstResult) {
      return {
        valid: false,
        message: 'Promo validation is temporarily unavailable.',
      };
    }

    const isAllProductsCompatibilityMatch =
      firstResult.promo_product_name?.toLowerCase() === ALL_PRODUCTS_PROMO_NAME.toLowerCase() &&
      firstResult.message.toLowerCase().includes('only works for all products') &&
      items.length > 0;

    const requiredQuantity = Number(firstResult.minimum_order_requirement ?? 0);
    const matchingQuantity = firstResult.promo_product_name
      ? getMatchingPromoQuantity(firstResult.promo_product_name)
      : 0;

    if (requiredQuantity > 0 && matchingQuantity < requiredQuantity) {
      return {
        valid: false,
        message: `This code requires at least ${requiredQuantity} ${firstResult.promo_product_name ?? 'matching'} item(s) in your cart. You have ${matchingQuantity}.`,
      };
    }

    const isOldPreviousOrderRequirementMessage =
      firstResult.message.toLowerCase().includes('completed order');

    if (!firstResult.valid && !isAllProductsCompatibilityMatch && !(isOldPreviousOrderRequirementMessage && matchingQuantity >= requiredQuantity)) {
      return {
        valid: false,
        message: firstResult.message,
      };
    }

    return {
      valid: true,
      message: firstResult.message,
      result: firstResult,
    };
  };

  const applyPromoCode = async (providedCode?: string, silent = false): Promise<{ ok: boolean; promo?: AppliedPromoCode; message?: string }> => {
    if (items.length === 0) {
      const message = 'Add items to your cart before applying a promo code.';
      setPromoError(message);
      if (!silent) {
        toast({
          title: 'Cannot apply code yet',
          description: message,
          variant: 'destructive',
        });
      }
      return { ok: false, message };
    }

    setApplyingPromoCode(true);
    setPromoError(null);

    const validation = await validatePromoCode(providedCode ?? promoInput);

    setApplyingPromoCode(false);

    if (!validation.valid || !validation.result || !validation.result.promo_code_id || !validation.result.promo_product_id || !validation.result.code || !validation.result.promo_product_name || !validation.result.influencer_name) {
      const message = validation.message || 'Unable to validate promo code.';
      setPromoError(message);
      setAppliedPromoCode(null);

      if (!silent) {
        toast({
          title: 'Invalid promo code',
          description: message,
          variant: 'destructive',
        });
      }

      return { ok: false, message };
    }

    const nextAppliedPromo: AppliedPromoCode = {
      promoCodeId: validation.result.promo_code_id,
      promoProductId: validation.result.promo_product_id,
      promoProductName: validation.result.promo_product_name,
      code: validation.result.code,
      influencerName: validation.result.influencer_name,
      discountPercent: Number(validation.result.discount_percent ?? 0),
    };

    setAppliedPromoCode(nextAppliedPromo);
    setPromoInput(nextAppliedPromo.code);
    setPromoError(null);

    if (!silent) {
      toast({
        title: 'Promo code applied',
        description: `${nextAppliedPromo.code} is active for ${nextAppliedPromo.promoProductName}.`,
      });
    }

    return {
      ok: true,
      promo: nextAppliedPromo,
      message: validation.message,
    };
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderParam = params.get('order');
    const codeParam = params.get('code');

    const normalizedCode = codeParam ? normalizePromoCode(codeParam) : '';
    if (normalizedCode) {
      setPromoInput(normalizedCode);
      setPendingUrlPromoCode(normalizedCode);
    }

    if (orderParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(orderParam));

        clearCart();

        decoded.items.forEach((item: Record<string, unknown>, index: number) => {
          const cleanName = decodeExternalText(item.name);
          const optionLabel = getExternalOptionLabel(item);
          const cartId = `${index}-${cleanName}-${optionLabel}`;
          const price = Number(item.price ?? 0);
          const image = typeof item.image === 'string' && item.image ? item.image : '/placeholder.png';
          const quantity = Math.max(1, Math.floor(Number(item.quantity ?? 1)) || 1);

          addItem({
            id: cartId,
            name: cleanName,
            price,
            image,
            option: optionLabel || undefined,
          });

          for (let i = 1; i < quantity; i++) {
            addItem({
              id: cartId,
              name: cleanName,
              price,
              image,
              option: optionLabel || undefined,
            });
          }
        });
      } catch (error) {
        console.error('Invalid order data', error);
      }
    }

    if (orderParam || codeParam) {
      const nextParams = new URLSearchParams();
      if (normalizedCode) {
        nextParams.set('code', normalizedCode);
      }

      const queryString = nextParams.toString();
      window.history.replaceState({}, document.title, queryString ? `/checkout?${queryString}` : '/checkout');
    }
  }, []);

  useEffect(() => {
    if (!pendingUrlPromoCode || items.length === 0) {
      return;
    }

    void (async () => {
      const result = await applyPromoCode(pendingUrlPromoCode, true);
      if (!result.ok && result.message) {
        toast({
          title: 'Promo code unavailable',
          description: result.message,
          variant: 'destructive',
        });
      }
    })();

    setPendingUrlPromoCode(null);
  }, [items.length, pendingUrlPromoCode]);

  useEffect(() => {
    if (!appliedPromoCode) {
      return;
    }

    if (appliedPromoCode.promoProductName.toLowerCase() === ALL_PRODUCTS_PROMO_NAME.toLowerCase()) {
      return;
    }

    const normalizedPromoProduct = normalizePromoMatchValue(appliedPromoCode.promoProductName);
    const stillHasAssignedProduct = items.some((item) => {
      const normalizedItemName = normalizePromoMatchValue(item.name);
      return normalizedItemName.includes(normalizedPromoProduct) || normalizedPromoProduct.includes(normalizedItemName);
    });

    if (stillHasAssignedProduct) {
      return;
    }

    setAppliedPromoCode(null);
    setPromoError(`${appliedPromoCode.code} was removed because ${appliedPromoCode.promoProductName} is no longer in your cart.`);
  }, [appliedPromoCode, items]);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart before checking out.',
        variant: 'destructive',
      });
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    let promoForOrder = appliedPromoCode;

    if (promoForOrder || promoInput.trim()) {
      const promoResult = await applyPromoCode(promoForOrder?.code ?? promoInput, true);
      if (!promoResult.ok || !promoResult.promo) {
        toast({
          title: 'Promo code is no longer valid',
          description: promoResult.message ?? 'Please remove or fix the code before checkout.',
          variant: 'destructive',
        });
        return;
      }

      promoForOrder = promoResult.promo;
    }

    const promoDiscountAmount = promoForOrder
      ? calculatePromoDiscount(getPromoDiscountBase(promoForOrder), promoForOrder.discountPercent)
      : 0;

    const finalOrderTotal = Math.max(subtotal + shippingCost - promoDiscountAmount, 0);

    const orderNumber = `ORD-${Date.now()}`;
    const orderData = {
      items: items.map((item) => ({
        name: item.name,
        selectedOptionLabel: item.option,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      })),
      totalItems,
      subtotal,
      shippingCost,
      totalPrice: finalOrderTotal,
      promoCode: promoForOrder?.code ?? null,
      promoProductName: promoForOrder?.promoProductName ?? null,
      promoInfluencerName: promoForOrder?.influencerName ?? null,
      promoDiscountPercent: promoForOrder?.discountPercent ?? null,
      promoDiscountAmount,
      customer: customerInfo,
    };

    const { error } = await supabase.from('orders').insert({
      order_number: orderNumber,
      customer_name: customerInfo.name,
      customer_email: customerInfo.email.trim().toLowerCase(),
      customer_phone: customerInfo.phone,
      customer_address: customerInfo.address,
      customer_city: customerInfo.city,
      customer_state: customerInfo.state,
      customer_zip: customerInfo.zipCode,
      items: orderData.items,
      total_items: totalItems,
      total_price: finalOrderTotal,
      promo_code_id: promoForOrder?.promoCodeId ?? null,
      promo_product_id: promoForOrder?.promoProductId ?? null,
      promo_code: promoForOrder?.code ?? null,
      promo_discount_percent: promoForOrder?.discountPercent ?? null,
      promo_discount_amount: promoDiscountAmount,
      status: 'processing',
    });

    if (error) {
      console.error('Error saving order:', error);
      toast({
        title: 'Order error',
        description: getOrderSaveErrorMessage(error),
        variant: 'destructive',
      });
      return;
    }

    const encodedData = encodeURIComponent(JSON.stringify({ ...orderData, orderNumber }));
    navigate(`/payment?order=${encodedData}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
              Checkout
            </h1>

            {items.length === 0 ? (
              <div className="text-center py-16 bg-muted rounded-2xl">
                <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">Add some products to get started.</p>
                <Button asChild>
                  <Link to="/products">Browse Products</Link>
                </Button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="font-semibold mb-4">Shipping Information</h2>
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={customerInfo.name}
                          onChange={(event) => setCustomerInfo({ ...customerInfo, name: event.target.value })}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={customerInfo.email}
                            onChange={(event) => setCustomerInfo({ ...customerInfo, email: event.target.value })}
                            placeholder="john@example.com"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={customerInfo.phone}
                            onChange={(event) => setCustomerInfo({ ...customerInfo, phone: event.target.value })}
                            placeholder="(555) 123-4567"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address">Address *</Label>
                        <Input
                          id="address"
                          value={customerInfo.address}
                          onChange={(event) => setCustomerInfo({ ...customerInfo, address: event.target.value })}
                          placeholder="123 Main St"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={customerInfo.city}
                            onChange={(event) => setCustomerInfo({ ...customerInfo, city: event.target.value })}
                            placeholder="New York"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={customerInfo.state}
                            onChange={(event) => setCustomerInfo({ ...customerInfo, state: event.target.value })}
                            placeholder="NY"
                          />
                        </div>
                        <div>
                          <Label htmlFor="zipCode">Zip Code</Label>
                          <Input
                            id="zipCode"
                            value={customerInfo.zipCode}
                            onChange={(event) => setCustomerInfo({ ...customerInfo, zipCode: event.target.value })}
                            placeholder="10001"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                      <h2 className="font-semibold">Order Items ({totalItems})</h2>
                    </div>

                    <div className="divide-y divide-border">
                      {items.map((item) => (
                        <div key={item.id} className="p-6 flex gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded-xl"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{item.name}</h3>
                            {item.option && <p className="mt-1 text-sm text-muted-foreground">Size: {item.option}</p>}
                            <p className="text-secondary font-semibold mt-1">
                              ${item.price.toFixed(2)} USD each
                            </p>

                            <div className="flex items-center gap-3 mt-4">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-accent transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-accent transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">
                              ${(item.price * item.quantity).toFixed(2)} USD
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-card rounded-2xl border border-border p-6 sticky top-32">
                    <h2 className="font-semibold mb-6">Order Summary</h2>

                    <div className="space-y-3 pb-6 border-b border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${subtotal.toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>${shippingCost.toFixed(2)} USD</span>
                      </div>
                      {appliedPromoCode && (
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span>Promo ({appliedPromoCode.code})</span>
                          <span>- ${previewPromoDiscount.toFixed(2)} USD</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between py-6">
                      <span className="font-semibold">Total</span>
                      <span className="font-display text-2xl font-bold">${orderTotal.toFixed(2)} USD</span>
                    </div>

                    <div className="space-y-2 pb-6">
                      <Label htmlFor="promo-code">Have a code? Apply it here</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="promo-code"
                          value={promoInput}
                          onChange={(event) => {
                            setPromoInput(normalizePromoCode(event.target.value));
                            if (promoError) {
                              setPromoError(null);
                            }
                          }}
                          placeholder="Have a code?"
                          className="min-w-0 flex-1 placeholder:text-sm"
                        />
                        <Button
                          variant="outline"
                          className="shrink-0 px-4"
                          onClick={() => void applyPromoCode()}
                          disabled={applyingPromoCode}
                        >
                          {applyingPromoCode ? 'Applying...' : 'Apply'}
                        </Button>
                      </div>

                      {appliedPromoCode && (
                        <p className="text-xs text-emerald-600">
                          {appliedPromoCode.code} applied for {appliedPromoCode.promoProductName} ({appliedPromoCode.discountPercent}% off).
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedPromoCode(null);
                              setPromoError(null);
                            }}
                            className="ml-2 underline hover:text-emerald-700"
                          >
                            Remove
                          </button>
                        </p>
                      )}

                      {!appliedPromoCode && promoError && (
                        <p className="text-xs text-destructive">{promoError}</p>
                      )}
                    </div>

                    <Button
                      variant="buy"
                      className="w-full"
                      size="lg"
                      onClick={handleCheckout}
                      disabled={applyingPromoCode}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Proceed to Checkout
                    </Button>

                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      Secure checkout
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-8 bg-muted">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-muted-foreground text-sm">
              <strong>Research Use Only:</strong> All products are intended for research purposes only.
              Not FDA approved. Not intended for medical, clinical, or insulin use on humans or animals.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Checkout;
