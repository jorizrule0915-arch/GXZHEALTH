import { motion } from 'framer-motion';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { products } from '@/lib/products';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const Products = () => {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (product: typeof products[0]) => {
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
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-muted via-background to-muted relative overflow-hidden">
        {/* Decorative elements */}
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
              Professional-grade injection supplies and accessories designed for precision, 
              safety, and reliability in research applications.
            </p>
            
            {/* Stats */}
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
            {products.map((product, index) => (
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
                <div className="relative h-64 bg-gradient-to-br from-muted to-background overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Category badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-secondary uppercase tracking-wider shadow-md">
                    {product.category}
                  </div>
                </div>
                
                {/* Card Content */}
                <div className="p-8">
                  <h3 className="font-display text-2xl font-bold text-card-foreground mb-3">
                    {product.name}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {product.description}
                  </p>
                  
                  {/* Features */}
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
                  
                  {/* Price & CTA */}
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
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
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
            <Button asChild variant="hero" size="lg">
              <a href="https://gxzhealth.com/shop/" target="_blank" rel="noopener noreferrer">
                Shop Now at GXZ Health
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-muted">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-muted-foreground text-sm">
              <strong>Research Use Only:</strong> All products are intended for research purposes only. 
              Not intended for medical, clinical, or insulin use on humans or animals.
              Ensure compliance with all applicable laws and institutional guidelines.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Products;
