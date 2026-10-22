/**
 * ADARA PARFUM — Contratos Arquitectónicos de Pasarelas y Medios de Pago
 * Fase 2.5: Preparación Arquitectónica (Sin Dependencias ni Credenciales Activas)
 *
 * Este módulo define las interfaces del patrón Adapter / Gateway para futuras
 * integraciones de pago en Colombia (Wompi, Addi, Sistecrédito, etc.).
 *
 * Principios de Diseño:
 * 1. Desacoplamiento total: El catálogo y el carrito no conocen la pasarela concreta.
 * 2. Cero secretos en frontend: Credenciales privadas solo en entorno seguro (Cloud Functions).
 * 3. Idempotencia y anti-tampering: El servidor verifica firmas y montos antes de alterar estados.
 */

import { Order, PaymentMethod } from './index';

/**
 * Información de contacto y facturación del cliente para la pasarela
 */
export interface CustomerCheckoutInfo {
  fullName: string;
  email: string;
  phone: string;
  docType?: 'CC' | 'CE' | 'NIT' | 'PP';
  docNumber?: string;
  shippingAddress?: {
    street: string;
    city: string;
    department: string;
    postalCode?: string;
  };
}

/**
 * Solicitud normalizada para generar una intención de cobro ante cualquier pasarela
 */
export interface CreatePaymentIntentRequest {
  orderId: string;
  orderReference: string;
  amountCOP: number;
  currency: 'COP';
  customer: CustomerCheckoutInfo;
  items: Array<{
    name: string;
    quantity: number;
    unitPriceCOP: number;
  }>;
  redirectUrl: string;
  webhookUrl: string;
  idempotencyKey: string;
}

/**
 * Respuesta normalizada tras solicitar una intención de cobro a la pasarela
 */
export interface CreatePaymentIntentResult {
  success: boolean;
  provider: PaymentMethod;
  transactionId?: string;
  redirectUrl?: string; // Para pasarelas con redirección externa (ej. Addi, Wompi PSE)
  widgetToken?: string; // Para checkout embebido o modales (ej. Wompi Widget)
  status: 'pending' | 'requires_action' | 'rejected';
  error?: string;
}

/**
 * Resultado de consultar el estado de una transacción ante la pasarela
 */
export interface PaymentStatusCheckResult {
  success: boolean;
  orderReference: string;
  transactionId: string;
  provider: PaymentMethod;
  status: 'approved' | 'declined' | 'pending' | 'voided';
  amountPaidCOP?: number;
  paidAt?: string;
  rawResponse?: Record<string, unknown>;
}

/**
 * Notificación procesada recibida mediante Webhook oficial
 */
export interface VerifiedWebhookNotification {
  isValidSignature: boolean;
  orderReference: string;
  transactionId: string;
  provider: PaymentMethod;
  status: 'approved' | 'declined' | 'pending' | 'voided';
  amountPaidCOP: number;
  timestamp: string;
  rawPayload: Record<string, unknown>;
}

/**
 * Interfaz de Adaptador de Pasarela (Patrón Adapter)
 * Cada proveedor (Addi, Sistecrédito, Wompi) implementará esta interfaz de forma aislada.
 */
export interface IPaymentGatewayAdapter {
  readonly providerName: PaymentMethod;

  /**
   * Genera la transacción inicial y retorna la URL o token de pago
   */
  createPaymentIntent(
    order: Order,
    customer: CustomerCheckoutInfo,
    config: { redirectUrl: string; webhookUrl: string }
  ): Promise<CreatePaymentIntentResult>;

  /**
   * Consulta activa de estado de transacción (Polling o reconciliación)
   */
  checkTransactionStatus(transactionId: string): Promise<PaymentStatusCheckResult>;

  /**
   * Valida la firma criptográfica enviada por el proveedor en un webhook
   */
  verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string,
    secretKey: string
  ): boolean;

  /**
   * Transforma el payload crudo del webhook en un evento canónico verificado
   */
  parseWebhookNotification(payload: Record<string, unknown>): VerifiedWebhookNotification;
}
