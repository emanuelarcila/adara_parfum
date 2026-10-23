import { Order, OrderStatus, PaymentStatus } from '../types';
import {
  FirestoreProductDocument,
  InventoryMovement,
  IProductRepository,
  IOrderRepository,
  IInventoryRepository,
  validateProductData,
  calculateVerifiedOrderTotal
} from '../types/firestore';

/**
 * ADARA PARFUM — Capa de Servicios y Abstracción de Datos (Preparación Firestore)
 *
 * NOTA DE SEGURIDAD FASE 2.1:
 * Esta capa define los contratos de acceso sin ejecutar ninguna petición de red
 * ni interacción con Cloud Firestore. Las operaciones remotas permanecen inactivas
 * hasta que las reglas de seguridad sean desplegadas y auditadas.
 */

export class FirestoreNotConnectedError extends Error {
  constructor(operation: string) {
    super(
      `[ADARA PARFUM] La operación '${operation}' no está conectada a Firestore. ` +
      'Las reglas remotas se mantienen cerradas y la aplicación opera en modo local seguro.'
    );
    this.name = 'FirestoreNotConnectedError';
  }
}

/**
 * Repositorio de Productos (Stub preparatorio para Firestore)
 */
export const ProductService: IProductRepository = {
  async getPublishedProducts(): Promise<FirestoreProductDocument[]> {
    // En Fase 2.1 no realiza lecturas de red. Devuelve vacío o lanza error controlado si se invoca.
    throw new FirestoreNotConnectedError('getPublishedProducts');
  },

  async getAllProducts(): Promise<FirestoreProductDocument[]> {
    throw new FirestoreNotConnectedError('getAllProducts');
  },

  async getProductById(id: string): Promise<FirestoreProductDocument | null> {
    throw new FirestoreNotConnectedError(`getProductById(${id})`);
  },

  async saveProduct(product: FirestoreProductDocument, adminUid: string): Promise<void> {
    const validation = validateProductData(product);
    if (!validation.isValid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }
    throw new FirestoreNotConnectedError(`saveProduct by ${adminUid}`);
  },

  async toggleProductStatus(id: string, adminUid: string): Promise<void> {
    throw new FirestoreNotConnectedError(`toggleProductStatus(${id}) by ${adminUid}`);
  },

  async deleteProduct(id: string, adminUid: string): Promise<void> {
    throw new FirestoreNotConnectedError(`deleteProduct(${id}) by ${adminUid}`);
  }
};

/**
 * Repositorio de Pedidos (Stub preparatorio para Firestore)
 */
export const OrderService: IOrderRepository = {
  async getAllOrders(): Promise<Order[]> {
    throw new FirestoreNotConnectedError('getAllOrders');
  },

  async createOrder(order: Omit<Order, 'id'>): Promise<string> {
    throw new FirestoreNotConnectedError('createOrder');
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, adminUid: string): Promise<void> {
    throw new FirestoreNotConnectedError(`updateOrderStatus(${orderId}, ${status}) by ${adminUid}`);
  },

  async updatePaymentStatus(orderId: string, status: PaymentStatus, adminUid: string): Promise<void> {
    throw new FirestoreNotConnectedError(`updatePaymentStatus(${orderId}, ${status}) by ${adminUid}`);
  }
};

/**
 * Repositorio de Inventario (Stub preparatorio para Firestore)
 */
export const InventoryService: IInventoryRepository = {
  async adjustStock(productId: string, delta: number, reason: string, adminUid: string): Promise<void> {
    throw new FirestoreNotConnectedError(`adjustStock(${productId}, delta: ${delta}) by ${adminUid}`);
  },

  async getInventoryLogs(productId?: string): Promise<InventoryMovement[]> {
    throw new FirestoreNotConnectedError('getInventoryLogs');
  }
};

export { calculateVerifiedOrderTotal };
