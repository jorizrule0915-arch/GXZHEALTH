import syringeImage from '@/assets/products/syringe.jpg';
import cartridgeImage from '@/assets/products/cartridge.jpg';
import penImage from '@/assets/products/reusable-pen.jpeg';
import needlesImage from '@/assets/products/needles.jpg';
import bodyBalmImage from '@/assets/products/Body Balm.jpg';
import creatineImage from '@/assets/products/Creatine.jpg';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  features: string[];
}

export const products: Product[] = [
  {
    id: 'syringe',
    name: 'Syringe',
    description: 'Available in Small (1ml 30g), Mini (0.5ml 30g), and Large (3ml 23g) — $15 per box (100 pieces included)',
    price: 15.00,
    category: 'Accessory',
    image: syringeImage,
    features: ['Sterile packaging', 'Multiple sizes', '100 per box']
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
    description: 'Standard Micro-Tip (32g x 4mm) — $8 per box (100 pieces included)',
    price: 8.00,
    category: 'Needle',
    image: needlesImage,
    features: ['Ultra-fine 32g', '4mm length', '100 per box']
  },
  {
    id: 'body-balm',
    name: 'GXZ Health Nourishing Body Balm',
    description: 'GXZ Health Nourishing Body Balm deeply moisturizes dry skin with cocoa butter, shea butter, and squalane. Its gentle, unscented formula leaves your skin soft and smooth all day.',
    price: 23.99,
    category: 'Skincare',
    image: bodyBalmImage,
    features: ['Cocoa butter', 'Shea butter', 'Unscented']
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
