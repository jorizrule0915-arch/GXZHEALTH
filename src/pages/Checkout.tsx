import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, Lock, CreditCard, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const Checkout = () => {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, clearCart } = useCart();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          items: items.map(item => ({
            priceId: item.priceId,
            quantity: item.quantity
          })),
          customerEmail: email || undefined
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
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
                    
                    {/* Email input */}
                    <div className="mb-6">
                      <Label htmlFor="email" className="text-sm text-muted-foreground">
                        Email (for order confirmation)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    
                    <div className="space-y-3 pb-6 border-b border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${totalPrice.toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-secondary">Calculated at checkout</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between py-6">
                      <span className="font-semibold">Total</span>
                      <span className="font-display text-2xl font-bold">${totalPrice.toFixed(2)} USD</span>
                    </div>
                    
                    <Button 
                      variant="buy" 
                      className="w-full" 
                      size="lg"
                      onClick={handleCheckout}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        "Processing..."
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Checkout with Stripe
                        </>
                      )}
                    </Button>
                    
                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      Secure checkout powered by Stripe
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
