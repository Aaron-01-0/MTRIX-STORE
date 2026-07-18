export interface ShowcaseProduct {
  id: string;
  name: string;
  short_description: string;
  detailed_description: string;
  base_price: number;
  discount_price: number | null;
  sku: string;
  stock_quantity: number;
  stock_status: 'in_stock' | 'out_of_stock' | 'low_stock';
  ratings_avg: number;
  ratings_count: number;
  is_active: boolean;
  is_new: boolean;
  is_trending: boolean;
  is_featured: boolean;
  has_variants: boolean;
  variant_type: string;
  categories: { id: string; name: string };
  brands: { name: string };
  product_images: Array<{
    image_url: string;
    alt_text: string | null;
    is_main: boolean;
    display_order: number;
  }>;
  category_id: string;
}

export const SHOWCASE_CATEGORIES = [
  { id: 'cat-keyboards', name: 'Mechanical Keyboards', slug: 'mechanical-keyboards', count: 4, description: 'Premium gasket-mounted custom mechanical keyboards.' },
  { id: 'cat-desk-mats', name: 'Desk Mats', slug: 'desk-mats', count: 5, description: 'High-density micro-weave desk pads with stitched edges.' },
  { id: 'cat-keycaps', name: 'Keycap Sets', slug: 'keycap-sets', count: 3, description: 'Double-shot PBT custom artisan keycaps.' },
  { id: 'cat-apparel', name: 'Tech Apparel', slug: 'tech-apparel', count: 3, description: 'Heavyweight architectural gaming apparel.' },
  { id: 'cat-accessories', name: 'Desk Accessories', slug: 'desk-accessories', count: 3, description: 'Ergonomic wrist rests, cable management & stands.' },
];

export const SHOWCASE_PRODUCTS: ShowcaseProduct[] = [
  {
    id: 'mtrix-apex-65',
    name: 'MTRIX Apex 65% Wireless Mechanical Keyboard',
    short_description: 'CNC Anodized Aluminum Chassis with Gasket Mount & Hot-Swappable Switches.',
    detailed_description: `Engineered for extreme precision and sound signature perfection. The MTRIX Apex 65% is crafted from solid 6063 CNC aluminum, featuring flex-cut PCB engineering, IXPE switch foam, and multi-mode wireless connection (2.4GHz / Bluetooth 5.2 / USB-C).\n\n• Gasket Mounted Design for cushioned acoustics\n• Hot-Swappable 3/5-pin PCB\n• Per-key RGB with MTRIX Custom Lighting Presets\n• 4000mAh Battery for up to 200 hours continuous typing`,
    base_price: 14999,
    discount_price: 12999,
    sku: 'MTX-KB-65X',
    stock_quantity: 42,
    stock_status: 'in_stock',
    ratings_avg: 4.9,
    ratings_count: 128,
    is_active: true,
    is_new: true,
    is_trending: true,
    is_featured: true,
    has_variants: true,
    variant_type: 'multi',
    category_id: 'cat-keyboards',
    categories: { id: 'cat-keyboards', name: 'Mechanical Keyboards' },
    brands: { name: 'MTRIX Performance' },
    product_images: [
      { image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80', alt_text: 'MTRIX Apex Keyboard Top View', is_main: true, display_order: 1 },
      { image_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=80', alt_text: 'MTRIX Apex Keyboard Angle', is_main: false, display_order: 2 },
      { image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1000&q=80', alt_text: 'Keycaps Close Up', is_main: false, display_order: 3 },
    ]
  },
  {
    id: 'mtrix-zenith-mat',
    name: 'MTRIX Zenith Cyberpunk Desk Mat (900x400mm)',
    short_description: 'Waterproof Ultra-Dense Micro-Weave Cloth with Anti-Slip Natural Rubber Base.',
    detailed_description: `The ultimate aesthetic anchor for your setup. Precision woven with high-density fabric for low-friction tracking and edge-stitched glow borders.\n\n• XXL Size: 900mm x 400mm x 4mm\n• Water-resistant hydrophobic coating\n• Heavy natural rubber anti-slip base`,
    base_price: 2999,
    discount_price: 2499,
    sku: 'MTX-MAT-ZNT',
    stock_quantity: 85,
    stock_status: 'in_stock',
    ratings_avg: 4.8,
    ratings_count: 94,
    is_active: true,
    is_new: true,
    is_trending: true,
    is_featured: true,
    has_variants: false,
    variant_type: 'none',
    category_id: 'cat-desk-mats',
    categories: { id: 'cat-desk-mats', name: 'Desk Mats' },
    brands: { name: 'MTRIX Zen' },
    product_images: [
      { image_url: 'https://images.unsplash.com/photo-1616588589676-63b3d98dcd85?auto=format&fit=crop&w=1000&q=80', alt_text: 'MTRIX Zenith Desk Mat', is_main: true, display_order: 1 },
      { image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=80', alt_text: 'Setup Desk Mat Overview', is_main: false, display_order: 2 },
    ]
  },
  {
    id: 'mtrix-neon-keycaps',
    name: 'MTRIX Neon Matrix Double-shot PBT Keycap Set',
    short_description: '142-Key Cherry Profile Oil-Resistant Custom Keycaps with Translucent Legends.',
    detailed_description: `Unmatched durability and crisp legends. Molded from 1.5mm thick PBT plastic to eliminate shine over long typing and gaming sessions. Includes keycaps for 60%, 65%, 75%, TKL, and Full-size layouts.`,
    base_price: 4999,
    discount_price: 3999,
    sku: 'MTX-KC-NEON',
    stock_quantity: 26,
    stock_status: 'in_stock',
    ratings_avg: 4.9,
    ratings_count: 67,
    is_active: true,
    is_new: false,
    is_trending: true,
    is_featured: true,
    has_variants: false,
    variant_type: 'none',
    category_id: 'cat-keycaps',
    categories: { id: 'cat-keycaps', name: 'Keycap Sets' },
    brands: { name: 'MTRIX Artisan' },
    product_images: [
      { image_url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=1000&q=80', alt_text: 'Neon Matrix Keycaps', is_main: true, display_order: 1 },
      { image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1000&q=80', alt_text: 'Keycap Legends Detail', is_main: false, display_order: 2 }
    ]
  },
  {
    id: 'mtrix-stealth-hoodie',
    name: 'MTRIX Stealth 450GSM Architectural Hoodie',
    short_description: 'Heavyweight French Terry Cotton Hoodie with Minimalist Gold Embroidery.',
    detailed_description: `Designed for cold gaming rooms and urban solitude. Tailored with double-layered hood, reinforced cuffs, and hidden media pocket.`,
    base_price: 5999,
    discount_price: 4999,
    sku: 'MTX-APP-HD01',
    stock_quantity: 19,
    stock_status: 'in_stock',
    ratings_avg: 4.7,
    ratings_count: 45,
    is_active: true,
    is_new: true,
    is_trending: false,
    is_featured: true,
    has_variants: true,
    variant_type: 'size',
    category_id: 'cat-apparel',
    categories: { id: 'cat-apparel', name: 'Tech Apparel' },
    brands: { name: 'MTRIX Apparel' },
    product_images: [
      { image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80', alt_text: 'MTRIX Stealth Hoodie Front', is_main: true, display_order: 1 },
      { image_url: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80', alt_text: 'MTRIX Stealth Hoodie Detail', is_main: false, display_order: 2 }
    ]
  },
  {
    id: 'mtrix-titanium-wristrest',
    name: 'MTRIX Ergonomic Brushed Metal Wrist Rest',
    short_description: 'Solid Aircraft-grade Aluminum & Memory Foam Dual Support for Mechanical Keyboards.',
    detailed_description: `Eliminate wrist fatigue with optimal 8-degree incline angle. Features magnetic attachment and breathable vegan leather cushion cover.`,
    base_price: 3499,
    discount_price: 2999,
    sku: 'MTX-ACC-WR01',
    stock_quantity: 33,
    stock_status: 'in_stock',
    ratings_avg: 4.8,
    ratings_count: 53,
    is_active: true,
    is_new: false,
    is_trending: true,
    is_featured: false,
    has_variants: false,
    variant_type: 'none',
    category_id: 'cat-accessories',
    categories: { id: 'cat-accessories', name: 'Desk Accessories' },
    brands: { name: 'MTRIX Ergonomics' },
    product_images: [
      { image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80', alt_text: 'Wrist Rest Setup View', is_main: true, display_order: 1 }
    ]
  }
];
