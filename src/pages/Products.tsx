import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingCart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductDetailModal, { buildProductDetail } from '@/components/ProductDetailModal';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fallbackProducts, normalizeCatalogProduct, type CatalogProduct } from '@/lib/products';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const Products = () => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [detailProduct, setDetailProduct] = useState<ReturnType<typeof buildProductDetail> | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (ignore) {
        return;
      }

      if (error || !data || data.length === 0) {
        setCatalogProducts(fallbackProducts);
        setLoading(false);
        return;
      }

      setCatalogProducts(data.map(normalizeCatalogProduct));
      setLoading(false);
    };

    fetchProducts();

    return () => {
      ignore = true;
    };
  }, []);

  const handleViewProduct = (product: CatalogProduct) => {
    setDetailProduct(buildProductDetail(product));
    setIsDetailOpen(true);
  };

  const handleDetailAddToCart = (
    productId: string,
    option?: { value: string; label: string; price?: number },
    image?: string,
  ) => {
    if (!detailProduct) {
      return;
    }

    const finalPrice = option?.price ?? detailProduct.price;
    const cartId = option ? `${productId}-${option.value}` : productId;
    const nameSuffix = option ? ` - ${option.label}` : '';

    addItem({
      id: cartId,
      name: `${detailProduct.name}${nameSuffix}`,
      price: finalPrice,
      image: image ?? detailProduct.images[0],
    });

    toast({
      title: 'Added to cart!',
      description: `${detailProduct.name}${nameSuffix} has been added to your cart.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-muted via-background to-muted pt-32 pb-16">
        <div className="absolute top-20 right-20 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-20 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />

        <div className="container relative z-10 mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl text-center"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-secondary">Our Catalog</span>
            <h1 className="mt-4 font-display text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              Research Supplies
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Performance & Wellness Essentials. Every product now opens with the same richer detail view so shoppers can read the item more precisely before adding it to cart.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-12">
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-secondary">{catalogProducts.length}+</div>
                <div className="text-sm text-muted-foreground">Products</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-secondary">100%</div>
                <div className="text-sm text-muted-foreground">Detail-first browsing</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-secondary">Fast</div>
                <div className="text-sm text-muted-foreground">Shopping flow</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-4 rounded-3xl border border-border bg-card p-6">
                  <Skeleton className="h-64 w-full rounded-2xl" />
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-16 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 xl:grid-cols-3">
              {catalogProducts.map((product, index) => (
                <motion.article
                  key={product.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  transition={{ delay: index * 0.08 }}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
                >
                  <button
                    type="button"
                    className="relative h-64 overflow-hidden bg-gradient-to-br from-muted to-background text-left"
                    onClick={() => handleViewProduct(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                    <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary shadow-md backdrop-blur-sm">
                      {product.category}
                    </div>
                    <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                      <Sparkles className="h-4 w-4" />
                      View Details
                    </div>
                  </button>

                  <div className="flex flex-1 flex-col p-8">
                    <button
                      type="button"
                      onClick={() => handleViewProduct(product)}
                      className="text-left"
                    >
                      <h3 className="font-display text-2xl font-bold text-card-foreground transition-colors group-hover:text-secondary">
                        {product.name}
                      </h3>
                    </button>

                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {product.description}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {product.features.slice(0, 3).map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-8">
                      <div className="mb-5 flex items-end justify-between border-t border-border pt-6">
                        <div>
                          <span className="text-sm text-muted-foreground">Starting at</span>
                          <div className="font-display text-3xl font-bold text-foreground">
                            ${product.price.toFixed(2)}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {product.options.length > 0 ? `${product.options.length} options` : 'Ready to shop'}
                        </span>
                      </div>

                      <Button
                        variant="buy"
                        size="lg"
                        className="w-full"
                        onClick={() => handleViewProduct(product)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <h3 className="mb-2 font-display text-2xl font-bold text-foreground">
              Want More Options?
            </h3>
            <p className="mb-6 text-muted-foreground">
              Explore the catalog and open any product to see options, highlights, and fuller details before buying.
            </p>
            <Button
              variant="hero"
              size="lg"
              onClick={() => toast({ title: 'Catalog refreshed from admin-supported product data.' })}
            >
              Browse the Full Catalog
              <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />

      <ProductDetailModal
        product={detailProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onAddToCart={handleDetailAddToCart}
      />
    </div>
  );
};

export default Products;
