import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, Lock, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
import { calculateOrderTotal, calculateShippingCost } from '@/lib/pricing';
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const Checkout = () => {
  const location = useLocation();
  const { items, updateQuantity, removeItem, totalPrice, totalItems, addItem, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  // 🔥 Check if cart contains FREE SHIPPING product
  const hasFreeShipping = items.some(item =>
  item.name.toLowerCase().includes("gxz glp")
);

  const shippingCost = hasFreeShipping ? 0 : 10;
  const orderTotal = totalPrice + shippingCost;
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  useEffect(() => {
  const params = new URLSearchParams(location.search);
  const orderParam = params.get("order");

  if (orderParam) {
    try {
      const decoded = JSON.parse(decodeURIComponent(orderParam));

      // 🔥 CLEAR EXISTING CART
      clearCart();

      // 🔥 ADD ITEMS INTO REACT STATE (NOT JUST localStorage)
     decoded.items.forEach((item: any, index: number) => {
  const cleanName = item.name
    .replace(/&#8211;/g, "-")
    .replace(/&amp;/g, "&");

  // First item
  addItem({
    id: `${index}-${cleanName}`,
    name: cleanName,
    price: item.price,
    image: item.image || "/placeholder.png"
  });

  // Handle quantity
  for (let i = 1; i < item.quantity; i++) {
    addItem({
      id: `${index}-${cleanName}`,
      name: cleanName,
      price: item.price,
      image: item.image || "/placeholder.png"
    });
  }
});

      // ✅ CLEAN URL (NO RELOAD)
      window.history.replaceState({}, document.title, "/checkout");

    } catch (err) {
      console.error("Invalid order data", err);
    }
  }
}, []);
  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive"
      });
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const orderNumber = `ORD-${Date.now()}`;
    const orderData = {
      items: items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
      })),
      totalItems: totalItems,
      subtotal: totalPrice,
      shippingCost: shippingCost,
      totalPrice: orderTotal,
      customer: customerInfo
    };

    // Save order to database as "processing"
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
      total_price: orderTotal,
      status: 'processing'
    });

    if (error) {
      console.error('Error saving order:', error);
      toast({
        title: "Order error",
        description: error.message,   // ✅ FIXED: shows actual error
        variant: "destructive"
      });
      return;                         // ✅ FIXED: stop if insert failed
    }

    const encodedData = encodeURIComponent(JSON.stringify({...orderData, orderNumber}));
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
            {/* Back link */}
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
                {/* Cart Items & Customer Info */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Customer Information Form */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="font-semibold mb-4">Shipping Information</h2>
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
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
                            onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
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
                            onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
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
                          onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
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
                            onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                            placeholder="New York"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={customerInfo.state}
                            onChange={(e) => setCustomerInfo({...customerInfo, state: e.target.value})}
                            placeholder="NY"
                          />
                        </div>
                        <div>
                          <Label htmlFor="zipCode">Zip Code</Label>
                          <Input
                            id="zipCode"
                            value={customerInfo.zipCode}
                            onChange={(e) => setCustomerInfo({...customerInfo, zipCode: e.target.value})}
                            placeholder="10001"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                      <h2 className="font-semibold">Order Items ({totalItems})</h2>
                    </div>
                    
                    <div className="divide-y divide-border">
                      {items.map(item => (
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

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-card rounded-2xl border border-border p-6 sticky top-32">
                    <h2 className="font-semibold mb-6">Order Summary</h2>
                    
                    <div className="space-y-3 pb-6 border-b border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${totalPrice.toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>${shippingCost.toFixed(2)} USD</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between py-6">
                      <span className="font-semibold">Total</span>
                      <span className="font-display text-2xl font-bold">${orderTotal.toFixed(2)} USD</span>
                    </div>
                    
                    <Button 
                      variant="buy" 
                      className="w-full" 
                      size="lg"
                      onClick={handleCheckout}
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

      {/* Disclaimer */}
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
