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

function normalizePromoCode(value: string) {
  return value.toUpperCase().replace(/\s+/g, '').trim();
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
  const previewPromoDiscount = appliedPromoCode
    ? Math.min(subtotal, Number(((subtotal * appliedPromoCode.discountPercent) / 100).toFixed(2)))
    : 0;
  const orderTotal = Math.max(subtotal + shippingCost - previewPromoDiscount, 0);

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

    const { data, error } = await supabase.rpc('validate_promo_code', {
      input_code: normalizedCode,
      cart_items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
      })),
      customer_email: customerInfo.email || null,
    });

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

    if (!firstResult.valid) {
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

        decoded.items.forEach((item: any, index: number) => {
          const cleanName = item.name
            .replace(/&#8211;/g, '-')
            .replace(/&amp;/g, '&');

          addItem({
            id: `${index}-${cleanName}`,
            name: cleanName,
            price: item.price,
            image: item.image || '/placeholder.png',
          });

          for (let i = 1; i < item.quantity; i++) {
            addItem({
              id: `${index}-${cleanName}`,
              name: cleanName,
              price: item.price,
              image: item.image || '/placeholder.png',
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

    const stillHasAssignedProduct = items.some((item) =>
      item.name.toLowerCase().includes(appliedPromoCode.promoProductName.toLowerCase())
    );

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
      ? Math.min(subtotal, Number(((subtotal * promoForOrder.discountPercent) / 100).toFixed(2)))
      : 0;

    const finalOrderTotal = Math.max(subtotal + shippingCost - promoDiscountAmount, 0);

    const orderNumber = `ORD-${Date.now()}`;
    const orderData = {
      items: items.map((item) => ({
        name: item.name,
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
      customer_email: customerInfo.email,
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
        description: error.message,
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
