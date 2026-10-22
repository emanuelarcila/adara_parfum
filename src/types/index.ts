export type OlfactiveFamily =
  | 'Amaderada'
  | 'Oriental & Ámbar'
  | 'Cuero & Humo'
  | 'Floral Oscuro'
  | 'Cítrico Noble'
  | 'Ámbar Amaderada'
  | 'Ámbar Vainilla'
  | 'Amaderada Aromática'
  | 'Ámbar Especiada'
  | 'Floral Frutal'
  | 'Chipre Frutal'
  | 'Ámbar Floral'
  | 'Aromática Frutal'
  | 'Aromática Acuática'
  | 'Amaderada Especiada'
  | 'Oriental Floral'
  | 'Floral Acuática'
  | 'Cítrica Aromática'
  | 'Aromática Fougère'
  | (string & {});

export interface Product {
  id: string;
  name: string;
  subtitle?: string | null;
  brand: string;
  volume?: string | null;
  priceCOP: number | null;
  stock: number;
  threshold?: number;
  family: OlfactiveFamily;
  status: 'active' | 'paused' | 'sold-out' | 'draft';
  description?: string | null;
  notesTop?: string[];
  notesHeart?: string[];
  notesBase?: string[];
  accords?: string[];
  image?: string | null;
  featured: boolean;
  intensity?: number | null; // 1-5
}

// Criterios de validación de precio e inventario para la tienda
export function isPricedProduct(p: { priceCOP?: number | null } | null | undefined): boolean {
  if (!p) return false;
  return typeof p.priceCOP === 'number' && !isNaN(p.priceCOP) && p.priceCOP > 0;
}

export function isPurchasableProduct(
  p: { status?: string; priceCOP?: number | null; stock?: number | null } | null | undefined
): boolean {
  if (!p) return false;
  return (
    p.status === 'active' &&
    typeof p.priceCOP === 'number' &&
    !isNaN(p.priceCOP) &&
    p.priceCOP > 0 &&
    typeof p.stock === 'number' &&
    !isNaN(p.stock) &&
    p.stock > 0
  );
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending' | 'on_delivery';
export type SalesChannel = 'Tienda Web' | 'WhatsApp' | 'Boutique Bogotá' | 'Distribuidor';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCOP: number;
}

export interface Order {
  id: string;
  reference: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  channel: SalesChannel;
  items: OrderItem[];
  totalCOP: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes?: string;
}

export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface ManualSaleItem {
  productId: string;
  quantity: number;
}
