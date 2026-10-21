export type OlfactiveFamily =
  | 'Amaderada'
  | 'Oriental & Ámbar'
  | 'Cuero & Humo'
  | 'Floral Oscuro'
  | 'Cítrico Noble';

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  brand: string;
  volume: string;
  priceCOP: number;
  stock: number;
  threshold: number;
  family: OlfactiveFamily;
  status: 'active' | 'paused' | 'sold-out';
  description: string;
  notesTop: string[];
  notesHeart: string[];
  notesBase: string[];
  image: string;
  featured: boolean;
  intensity: number; // 1-5
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
