import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ShoppingCart, Shield, Truck, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductOption {
  value: string;
  label: string;
  price?: number;
}

interface ProductDetail {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  longDescription: string;
  features: string[];
  options?: ProductOption[];
  images: string[]; // array of 5 image URLs (front, back, side1, side2, detail)
  highlights: string[];
  inStock: boolean;
}

interface ProductDetailModalProps {
  product: ProductDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: string, option?: ProductOption) => void;
}

// ─── Mock extended product data (swap images with real ones) ──────────────────

export const PRODUCT_DETAILS: Record<string, Omit<ProductDetail, keyof ReturnType<typeof getBaseProduct>>> = {
  creatine: {
    longDescription:
      'GXZ Creatine Monohydrate is micronized for maximum absorption and mixability. Each serving delivers 5g of pharmaceutical-grade creatine to fuel explosive strength, enhance lean muscle gains, and accelerate post-workout recovery. Unflavored and free from fillers — just pure performance.',
    highlights: [
      'Micronized for faster absorption',
      'No artificial colors or fillers',
      'Mixes instantly with water or juice',
      'Supports ATP regeneration',
      'Clinically studied 5g dose per serving',
    ],
    inStock: true,
  },
  'body-balm': {
    longDescription:
      'GXZ Nourishing Body Balm is a deeply moisturizing skin treatment formulated with cocoa butter, shea butter, and squalane. Its lightweight, fast-absorbing formula leaves your skin silky smooth all day long — without grease, without fragrance, and without compromise.',
    highlights: [
      'Deeply moisturizes for 24 hours',
      'Unscented & hypoallergenic formula',
      'Non-greasy, fast-absorbing',
      'Dermatologist tested',
      'No parabens or artificial dyes',
    ],
    inStock: true,
  },
};

function getBaseProduct(p: ProductDetail) {
  return { id: p.id, name: p.name, category: p.category, price: p.price, description: p.description, features: p.features, options: p.options, images: p.images };
}

// ─── Placeholder image generator (replace with real product photos) ───────────

function getPlaceholderImages(productId: string): string[] {
  // These use picsum with fixed seeds so they're consistent.
  // Replace each URL with your actual product images.
  const seeds: Record<string, string[]> = {
    'creatine': [
    '/src/assets/products/creatine.jpg',
    '/src/assets/products/side1.png',
    '/src/assets/products/side2.png',
    '/src/assets/products/lifestylecreatine.jpeg',
    ],
    'body-balm': [
    '/src/assets/products/Body Balm.jpg',
    '/src/assets/products/backbalm.png',
    '/src/assets/products/lifestylebalm.png',
  
    ],
  };
  return seeds[productId] ?? Array(5).fill('https://placehold.co/600x600/f0f0f0/999?text=Product');
}

// ─── Image Carousel ───────────────────────────────────────────────────────────

function ImageCarousel({ images, productName }: { images: string[]; productName: string }) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(0);

  const go = (idx: number) => {
    setDirection(idx > active ? 1 : -1);
    setActive(idx);
  };

  const prev = () => go((active - 1 + images.length) % images.length);
  const next = () => go((active + 1) % images.length);

  const labels = ['Front View', 'Back View', 'Side View', 'Detail', 'Lifestyle'];

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Main image */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted border border-border group">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.img
            key={active}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.25 }}
            src={images[active]}
            alt={`${productName} - ${labels[active]}`}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Label badge */}
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white font-medium">
          {labels[active] ?? `View ${active + 1}`}
        </div>

        {/* Nav arrows */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 justify-center">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
              i === active ? 'border-secondary scale-105 shadow-md' : 'border-border hover:border-muted-foreground'
            }`}
          >
            <img src={img} alt={labels[i]} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart }: ProductDetailModalProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product?.options?.length) {
      setSelectedOption(product.options[0].value);
    }
    setAdded(false);
  }, [product]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!product) return null;

  const selectedOpt = product.options?.find(o => o.value === selectedOption);
  const displayPrice = selectedOpt?.price ?? product.price;

  const handleAdd = () => {
    onAddToCart(product.id, selectedOpt);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-start justify-center"
          >
            <div className="relative w-full max-w-5xl max-h-full bg-background rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col">
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 p-6 md:p-10">
                <div className="grid md:grid-cols-2 gap-10">

                  {/* LEFT: Image Carousel */}
                  <ImageCarousel images={product.images} productName={product.name} />

                  {/* RIGHT: Product Info */}
                  <div className="flex flex-col gap-5">
                    {/* Category badge */}
                    <span className="w-fit px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold uppercase tracking-wider rounded-full">
                      {product.category}
                    </span>

                    {/* Name */}
                    <h2 className="font-display text-3xl font-bold text-foreground leading-tight">
                      {product.name}
                    </h2>

                    {/* Divider */}
                    <div className="border-t border-border" />

                    {/* Price */}
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-4xl font-bold text-foreground">
                          ${displayPrice.toFixed(2)}
                        </span>
                        {selectedOpt?.price && selectedOpt.price !== product.price && (
                          <span className="text-muted-foreground text-sm line-through">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.inStock ? (
                          <span className="text-green-600 font-medium">✓ In Stock</span>
                        ) : (
                          <span className="text-red-500 font-medium">Out of Stock</span>
                        )}
                      </p>
                    </div>

                    {/* Short description */}
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {product.longDescription}
                    </p>

                    {/* Options (size/flavor/etc.) */}
                    {product.options && product.options.length > 0 && (
                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-foreground">
                          Choose option:
                        </Label>
                        <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="gap-2">
                          {product.options.map((opt) => (
                            <div
                              key={opt.value}
                              onClick={() => setSelectedOption(opt.value)}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                selectedOption === opt.value
                                  ? 'border-secondary bg-secondary/5 shadow-sm'
                                  : 'border-border hover:border-muted-foreground'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <RadioGroupItem value={opt.value} id={opt.value} />
                                <Label htmlFor={opt.value} className="cursor-pointer font-medium text-sm">
                                  {opt.label}
                                </Label>
                              </div>
                              {opt.price && (
                                <span className="text-secondary font-bold text-sm">${opt.price.toFixed(2)}</span>
                              )}
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}

                    {/* Add to Cart */}
                    <Button
                      variant="buy"
                      size="lg"
                      onClick={handleAdd}
                      disabled={!product.inStock}
                      className="w-full transition-all"
                    >
                      {added ? (
                        <>
                          <Check className="w-4 h-4" />
                          Added to Cart!
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </>
                      )}
                    </Button>

                    {/* Trust badges */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: Truck, label: 'Fast Shipping' },
                        { icon: Shield, label: 'Quality Guaranteed' },
                        { icon: RotateCcw, label: 'Easy Returns' },
                      ].map(({ icon: Icon, label }) => (
                        <div
                          key={label}
                          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted text-center"
                        >
                          <Icon className="w-4 h-4 text-secondary" />
                          <span className="text-xs text-muted-foreground font-medium leading-tight">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Bottom: Highlights + Features ── */}
                <div className="mt-10 grid md:grid-cols-2 gap-8 border-t border-border pt-8">
                  {/* Highlights */}
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-4">Product Highlights</h3>
                    <ul className="space-y-3">
                      {product.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="mt-0.5 w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            ✓
                          </span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tags / Features */}
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.features.map((f, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-muted-foreground border border-border"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Helper: Build full ProductDetail from your products array ────────────────
// Call this in Products.tsx to enrich the product before passing to the modal.

export function buildProductDetail(product: {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  features: string[];
  options?: ProductOption[];
  image: string;
}): ProductDetail {
  const extra = PRODUCT_DETAILS[product.id];
  if (!extra) {
    // Non-detail product: return minimal data with repeated placeholder image
    return {
      ...product,
      images: Array(5).fill(product.image),
      longDescription: product.description,
      highlights: product.features,
      inStock: true,
    };
  }
  return {
    ...product,
    images: getPlaceholderImages(product.id),
    longDescription: extra.longDescription,
    highlights: extra.highlights,
    inStock: extra.inStock,
  };
}