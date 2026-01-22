import syringeImage from '@/assets/products/syringe.jpg';
import cartridgeImage from '@/assets/products/cartridge.jpg';
import penImage from '@/assets/products/reusable-pen.jpeg';
import needlesImage from '@/assets/products/needles.jpg';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  priceId: string;
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
    priceId: 'price_1SsGCuGuGeJUevIrW9Zw2WK8',
    category: 'Accessory',
    image: syringeImage,
    features: ['Sterile packaging', 'Multiple sizes', '100 per box']
  },
  {
    id: 'cartridge',
    name: 'Peptide Pen Cartridges',
    description: 'Standard 3mL capacity cartridges compatible with all GXZ pens — $10 per set (10 pieces included)',
    price: 10.00,
    priceId: 'price_1SsGEwGuGeJUevIrSIAypAjA',
    category: 'Cartridge',
    image: cartridgeImage,
    features: ['3mL capacity', 'Universal fit', '10 per set']
  },
  {
    id: 'pen',
    name: 'Reusable Peptide Pens',
    description: 'Precision-engineered metal injection pen with adjustable dosing dial — 1 Pen for $20',
    price: 20.00,
    priceId: 'price_1SsGJEGuGeJUevIrKwqX9c7k',
    category: 'Pen',
    image: penImage,
    features: ['Metal construction', 'Adjustable dial', 'Lifetime use']
  },
  {
    id: 'needles',
    name: 'Single-Use Pen Needles',
    description: 'Standard Micro-Tip (32g x 4mm) — $8 per box (100 pieces included)',
    price: 8.00,
    priceId: 'price_1SsGL0GuGeJUevIrt3V1XkkX',
    category: 'Needle',
    image: needlesImage,
    features: ['Ultra-fine 32g', '4mm length', '100 per box']
  }
];
