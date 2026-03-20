import { motion } from 'framer-motion';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { products } from '@/lib/products';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import ProductDetailModal, { buildProductDetail } from '@/components/ProductDetailModal';


const DETAIL_MODAL_IDS = new Set(['creatine', 'body-balm']);

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const Products = () => {
  const { addItem } = useCart();
  const { toast } = useToast();

  // ── Existing option-picker dialog (for non-detail products) ──
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // ── New Amazon-style detail modal ──
  const [detailProduct, setDetailProduct] = useState<ReturnType<typeof buildProductDetail> | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleAddToCart = (product: typeof products[0]) => {
    // Products with a detail page open the detail modal instead
    if (DETAIL_MODAL_IDS.has(product.id)) {
      setDetailProduct(buildProductDetail(product));
      setIsDetailOpen(true);
      return;
    }

    if (product.options && product.options.length > 0) {
      setSelectedProduct(product);
      setSelectedOption(product.options[0].value);
      setIsDialogOpen(true);
    } else {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image
      });
      toast({
        title: "Added to cart!",
        description: `${product.name} has been added to your cart.`
      });
    }
  };

  const handleConfirmAddToCart = () => {
    if (!selectedProduct) return;

    const option = selectedProduct.options?.find(opt => opt.value === selectedOption);
    const finalPrice = option?.price || selectedProduct.price;
    const optionLabel = option?.label || '';

    addItem({
      id: `${selectedProduct.id}-${selectedOption}`,
      name: `${selectedProduct.name} - ${optionLabel}`,
      price: finalPrice,
      image: selectedProduct.image
    });

    toast({
      title: "Added to cart!",
      description: `${selectedProduct.name} (${optionLabel}) has been added to your cart.`
    });

    setIsDialogOpen(false);
    setSelectedProduct(null);
  };

  // Called from the detail modal's "Add to Cart" button
  const handleDetailAddToCart = (
    productId: string,
    option?: { value: string; label: string; price?: number }
  ) => {
    if (!detailProduct) return;

    const finalPrice = option?.price ?? detailProduct.price;
    const nameSuffix = option ? ` - ${option.label}` : '';
    const cartId = option ? `${productId}-${option.value}` : productId;

    addItem({
      id: cartId,
      name: `${detailProduct.name}${nameSuffix}`,
      price: finalPrice,
      image: detailProduct.images[0]
    });

    toast({
      title: "Added to cart!",
      description: `${detailProduct.name}${nameSuffix} has been added to your cart.`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-muted via-background to-muted relative overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Our Catalog</span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 mb-6">
              Research Supplies
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Performance & Wellness Essentials
              High-quality tools and formulations designed to support strength, recovery, and daily performance.
            </p>
            
            <div className="flex justify-center gap-12 mt-10">
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-secondary">6+</div>
                <div className="text-sm text-muted-foreground">Product Categories</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-secondary">100%</div>
                <div className="text-sm text-muted-foreground">Sterile</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-secondary">Fast</div>
                <div className="text-sm text-muted-foreground">Shipping</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {products.map((product, index) => {
              const hasDetailModal = DETAIL_MODAL_IDS.has(product.id);
              return (
                <motion.div
                  key={product.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-card rounded-3xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-500 border border-border"
                >
                  {/* Product Image */}
                  <div
                    className={`relative h-64 bg-gradient-to-br from-muted to-background overflow-hidden ${
                      hasDetailModal ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => hasDetailModal && handleAddToCart(product)}
                  >
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-secondary uppercase tracking-wider shadow-md">
                      {product.category}
                    </div>
                    {/* "View Details" hover hint */}
                    {hasDetailModal && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-semibold text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                          View Details
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-8">
                    <h3
                      className={`font-display text-2xl font-bold text-card-foreground mb-3 ${
                        hasDetailModal ? 'cursor-pointer hover:text-secondary transition-colors' : ''
                      }`}
                      onClick={() => hasDetailModal && handleAddToCart(product)}
                    >
                      {product.name}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {product.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {product.features.map((feature, i) => (
                        <span 
                          key={i}
                          className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-border">
                      <div>
                        <span className="text-sm text-muted-foreground">Starting at</span>
                        <div className="font-display text-3xl font-bold text-foreground">
                          ${product.price.toFixed(2)}
                        </div>
                      </div>
                      <Button
                        variant="buy"
                        size="lg"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {hasDetailModal ? 'View & Buy' : 'Add to Cart'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Shop Now CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              Want More Options?
            </h3>
            <p className="text-muted-foreground mb-6">
              Explore our complete collection with exclusive deals and bulk pricing options.
            </p>
            <Button 
              variant="hero" 
              size="lg"
              onClick={() => toast({ title: "COMING SOON!!" })}
            >
              Shop Now at GXZ Health
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* ── Amazon-style Detail Modal (Creatine & Body Balm only) ── */}
      <ProductDetailModal
        product={detailProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onAddToCart={handleDetailAddToCart}
      />

      {/* ── Existing option-picker Dialog (all other products) ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Option</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="relative h-48 rounded-xl overflow-hidden">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedProduct.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{selectedProduct.description}</p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Choose an option:</Label>
                <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                  {selectedProduct.options?.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:border-foreground transition-colors cursor-pointer">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        {option.label}
                        {option.price && (
                          <span className="ml-2 font-semibold text-secondary">${option.price.toFixed(2)}</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button onClick={handleConfirmAddToCart} className="w-full" variant="buy" size="lg">
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;