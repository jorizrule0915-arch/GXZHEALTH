import type { Json, Tables } from '@/integrations/supabase/types';
import syringeImage from '@/assets/products/syringe.png';
import cartridgeImage from '@/assets/products/cartridge.png';
import penImage from '@/assets/products/reusable-pen.png';
import needlesImage from '@/assets/products/needles.png';
import bodyBalmImage from '@/assets/products/Body Balm.jpg';
import creatineImage from '@/assets/products/Creatine.jpg';
import creatineSide1 from '@/assets/products/side1.png';
import creatineSide2 from '@/assets/products/side2.png';
import creatineLifestyle from '@/assets/products/lifestylecreatine.jpeg';
import backBalmImage from '@/assets/products/backbalm.png';
import lifestyleBalmImage from '@/assets/products/lifestylebalm.png';

export interface ProductOption {
  label: string;
  value: string;
  price?: number;
}

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  category: string;
  image: string;
  gallery: string[];
  features: string[];
  highlights: string[];
  options: ProductOption[];
  inStock: boolean;
  isActive: boolean;
  sortOrder: number;
  imageUrl?: string | null;
}

export type ProductRecord = Tables<'products'>;

type BuiltInSeed = Omit<CatalogProduct, 'id' | 'image' | 'gallery' | 'imageUrl'>;

const placeholderGallery = (image: string) => [image, image, image];

const builtInMedia: Record<string, { image: string; gallery: string[] }> = {
  syringe: {
    image: syringeImage,
    gallery: placeholderGallery(syringeImage),
  },
  cartridge: {
    image: cartridgeImage,
    gallery: placeholderGallery(cartridgeImage),
  },
  pen: {
    image: penImage,
    gallery: placeholderGallery(penImage),
  },
  needles: {
    image: needlesImage,
    gallery: placeholderGallery(needlesImage),
  },
  'body-balm': {
    image: bodyBalmImage,
    gallery: [bodyBalmImage, backBalmImage, lifestyleBalmImage],
  },
  creatine: {
    image: creatineImage,
    gallery: [creatineImage, creatineSide1, creatineSide2, creatineLifestyle],
  },
};

const builtInSeeds: BuiltInSeed[] = [
  {
    slug: 'syringe',
    name: 'Syringe',
    description: 'Available in Small (1ml 30g), Mini (0.5ml 30g), and Large (3ml 23g) with sterile packaging.',
    longDescription:
      'GXZ syringes are designed for clean, precise handling with dependable sterile packaging. Choose from multiple sizes depending on the application, with each box including 100 pieces for consistent lab or wellness support use.',
    price: 15,
    category: 'Accessory',
    features: ['Sterile packaging', 'Multiple sizes', '100 per box'],
    highlights: ['Small, mini, and large sizes', 'Easy-to-read barrel markings', 'Individually prepared for reliable handling'],
    options: [
      { label: 'Small (1ml 30g)', value: 'small', price: 15 },
      { label: 'Mini (0.5ml 30g)', value: 'mini', price: 15 },
      { label: 'Large (3ml 23g)', value: 'large', price: 15 },
    ],
    inStock: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    slug: 'cartridge',
    name: 'Disposable 3mL Cartridges',
    description: 'Standard 3mL cartridges compatible with GXZ reusable pens.',
    longDescription:
      'GXZ disposable cartridges are built for a clean fit inside reusable GXZ injection pens. Each set includes 10 cartridges with a stable 3mL capacity to keep replacements easy and consistent.',
    price: 10,
    category: 'Cartridge',
    features: ['3mL capacity', 'Universal GXZ fit', '10 per set'],
    highlights: ['Reliable replacement option', 'Built for GXZ reusable pens', 'Compact set for easy stocking'],
    options: [],
    inStock: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    slug: 'pen',
    name: 'Reusable Injection Pens',
    description: 'Precision-engineered metal injection pen with adjustable dosing dial.',
    longDescription:
      'The GXZ reusable injection pen is built for repeat use with a durable metal body and a comfortable adjustable dosing dial. It is designed to feel premium in hand while keeping daily use simple and dependable.',
    price: 20,
    category: 'Pen',
    features: ['Metal construction', 'Adjustable dial', 'Reusable design'],
    highlights: ['Premium metal finish', 'Smooth dose control', 'Designed for long-term use'],
    options: [
      { label: 'Matte Black', value: 'matte-black', price: 20 },
      { label: 'Silver', value: 'silver', price: 20 },
      { label: 'Rose Gold', value: 'rose-gold', price: 20 },
    ],
    inStock: true,
    isActive: true,
    sortOrder: 3,
  },
  {
    slug: 'needles',
    name: 'Single-Use Pen Needles',
    description: 'Standard micro-tip pen needles with a smooth sterile finish.',
    longDescription:
      'GXZ single-use pen needles are designed for a smoother, more comfortable attachment experience. Every box includes 100 ultra-fine needles, making them a convenient staple alongside reusable pens.',
    price: 8,
    category: 'Needle',
    features: ['Ultra-fine micro-tip', '100 per box', 'Clean sterile finish'],
    highlights: ['Works with GXZ pens', 'Designed for controlled use', 'Compact, easy-to-store packaging'],
    options: [
      { label: 'Standard Micro-Tip (32g x 4mm)', value: '32g-4mm', price: 8 },
      { label: 'Standard Micro-Tip (31g x 8mm)', value: '31g-8mm', price: 8 },
    ],
    inStock: true,
    isActive: true,
    sortOrder: 4,
  },
  {
    slug: 'body-balm',
    name: 'GXZ Health Nourishing Body Balm',
    description: 'Deeply moisturizing body balm with cocoa butter, shea butter, and squalane.',
    longDescription:
      'GXZ Health Nourishing Body Balm is a deeply moisturizing skin treatment formulated with cocoa butter, shea butter, and squalane. Its lightweight, fast-absorbing formula leaves skin silky smooth all day long without grease or heavy residue.',
    price: 16.99,
    category: 'Skincare',
    features: ['Cocoa butter', 'Shea butter', 'Squalane'],
    highlights: ['Deep moisture for dry skin', 'Lightweight and non-greasy', 'Comfortable daily-use finish'],
    options: [
      { label: 'Aloe Scent', value: 'aloe', price: 16.99 },
      { label: 'Unscented', value: 'unscented', price: 16.99 },
      { label: 'Pack (Both)', value: 'pack', price: 23.99 },
    ],
    inStock: true,
    isActive: true,
    sortOrder: 5,
  },
  {
    slug: 'creatine',
    name: 'GXZ Health Creatine Performance Matrix Powder',
    description: 'Micronized creatine blend to support strength, endurance, and recovery.',
    longDescription:
      'GXZ Health Creatine Performance Matrix Powder is built to support strength output, workout endurance, and hydration support during training. The formula mixes cleanly and fits easily into a daily performance routine.',
    price: 29.99,
    category: 'Supplement',
    features: ['Boosts strength', 'Enhances endurance', 'Supports recovery'],
    highlights: ['Easy daily performance support', 'Mixes smoothly', 'Clean supplement profile'],
    options: [],
    inStock: true,
    isActive: true,
    sortOrder: 6,
  },
];

function stringArrayFromJson(value: Json | null | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

function optionArrayFromJson(value: Json | null | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return [];
    }

    const label = typeof entry.label === 'string' ? entry.label.trim() : '';
    const rawValue = typeof entry.value === 'string' ? entry.value.trim() : '';
    const rawPrice = typeof entry.price === 'number' ? entry.price : undefined;

    if (!label) {
      return [];
    }

    return [{
      label,
      value: rawValue || slugify(label),
      ...(typeof rawPrice === 'number' ? { price: rawPrice } : {}),
    }];
  });
}

function galleryFromRecord(record: Pick<ProductRecord, 'slug' | 'image_url' | 'gallery'>) {
  const builtIn = builtInMedia[record.slug];
  const customGallery = stringArrayFromJson(record.gallery);
  const primaryImage = record.image_url?.trim() || builtIn?.image || syringeImage;

  if (customGallery.length > 0) {
    return [primaryImage, ...customGallery.filter((entry) => entry !== primaryImage)];
  }

  if (builtIn?.gallery.length) {
    return builtIn.gallery;
  }

  return [primaryImage];
}

function builtInSeedBySlug(slug: string) {
  return builtInSeeds.find((product) => product.slug === slug);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function normalizeCatalogProduct(record: ProductRecord): CatalogProduct {
  const builtIn = builtInSeedBySlug(record.slug);
  const builtInVisuals = builtInMedia[record.slug];
  const options = optionArrayFromJson(record.options);

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    longDescription: record.long_description || builtIn?.longDescription || record.description,
    price: Number(record.price),
    category: record.category,
    image: record.image_url?.trim() || builtInVisuals?.image || syringeImage,
    gallery: galleryFromRecord(record),
    features: stringArrayFromJson(record.features).length > 0
      ? stringArrayFromJson(record.features)
      : builtIn?.features ?? [],
    highlights: stringArrayFromJson(record.highlights).length > 0
      ? stringArrayFromJson(record.highlights)
      : builtIn?.highlights ?? [],
    options: options.length > 0 ? options : builtIn?.options ?? [],
    inStock: record.in_stock,
    isActive: record.is_active,
    sortOrder: record.sort_order ?? 0,
    imageUrl: record.image_url,
  };
}

export const fallbackProducts: CatalogProduct[] = builtInSeeds.map((seed) => ({
  ...seed,
  id: seed.slug,
  image: builtInMedia[seed.slug]?.image ?? syringeImage,
  gallery: builtInMedia[seed.slug]?.gallery ?? [syringeImage],
  imageUrl: null,
}));

export function parseLineSeparatedList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}
