import syringeImage from '@/assets/products/syringe.png';
import cartridgeImage from '@/assets/products/cartridge.png';
import penImage from '@/assets/products/reusable-pen.png';
import needlesImage from '@/assets/products/needles.png';
import bodyBalmImage from '@/assets/products/Body Balm.jpg';
import creatineImage from '@/assets/products/Creatine.jpg';

export interface ProductOption {
  label: string;
  value: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  features: string[];
  options?: ProductOption[];
}

export const products: Product[] = [
  {
    id: 'syringe',
    name: 'Syringe',
    description: 'Available in Small (1ml 30g), Mini (0.5ml 30g), and Large (3ml 23g) — $15 per box (100 pieces included)',
    price: 15.00,
    category: 'Accessory',
    image: syringeImage,
    features: ['Sterile packaging', 'Multiple sizes', '100 per box'],
    options: [
      { label: 'Small (1ml 30g)', value: 'small' },
      { label: 'Mini (0.5ml 30g)', value: 'mini' },
      { label: 'Large (3ml 23g)', value: 'large' }
    ]
  },
  {
    id: 'cartridge',
    name: 'Disposable 3Ml cartridges',
    description: 'Standard 3mL capacity cartridges compatible with all GXZ pens — $10 per set (10 pieces included)',
    price: 10.00,
    category: 'Cartridge',
    image: cartridgeImage,
    features: ['3mL capacity', 'Universal fit', '10 per set']
  },
  {
    id: 'pen',
    name: 'Reusable Injection Pens',
    description: 'Precision-engineered metal injection pen with adjustable dosing dial — 1 Pen for $20',
    price: 20.00,
    category: 'Pen',
    image: penImage,
    features: ['Metal construction', 'Adjustable dial', 'Lifetime use']
  },
  {
    id: 'needles',
    name: 'Single-Use Pen Needles',
    description: 'Standard Micro-Tip — $8 per box (100 pieces included)',
    price: 8.00,
    category: 'Needle',
    image: needlesImage,
    features: ['Ultra-fine', '100 per box'],
    options: [
      { label: 'Standard Micro-Tip (32g x 4mm)', value: '32g-4mm' },
      { label: 'Standard Micro-Tip (31g x 8mm)', value: '31g-8mm' }
    ]
  },
  {
    id: 'body-balm',
    name: 'GXZ Health Nourishing Body Balm',
    description: 'GXZ Health Nourishing Body Balm deeply moisturizes dry skin with cocoa butter, shea butter, and squalane. Its gentle, unscented formula leaves your skin soft and smooth all day.',
    price: 16.99,
    category: 'Skincare',
    image: bodyBalmImage,
    features: ['Cocoa butter', 'Shea butter'],
    options: [
      { label: 'Aloe Scent', value: 'aloe', price: 16.99 },
      { label: 'Unscented', value: 'unscented', price: 16.99 },
      { label: 'Pack (Both)', value: 'pack', price: 23.99 }
    ]
  },
  {
    id: 'creatine',
    name: 'GXZ Health Creatine Performance Matrix Powder',
    description: 'GXZ Health Creatine helps boost strength, endurance, and hydration during workouts. It supports better performance and recovery to help you reach your fitness goals.',
    price: 29.99,
    category: 'Supplement',
    image: creatineImage,
    features: ['Boosts strength', 'Enhances endurance', 'Supports recovery']
  }
];
