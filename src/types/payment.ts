// ============================================================================
// SECCIÓN 1: IMPORTACIONES Y DEPENDENCIAS
// ============================================================================

import { Order, PaymentMethod } from './index';

// ============================================================================
// SECCIÓN 2: INFORMACIÓN DE CLIENTE Y FACTURACIÓN
// ============================================================================

/**
 * Información de contacto, fiscal y despacho del comprador para pasarelas de pago.
 *
 * @remarks
 * Diseñado conforme a los estándares de pasarelas de recaudo y crédito en Colombia
 * (Wompi, Addi, Sistecrédito).
 */
export interface CustomerCheckoutInfo {
  /** Nombre completo del titular de la compra. */
  fullName: string;
  /** Correo electrónico para confirmación de la transacción y factura electrónica. */
  email: string;
  /** Número móvil (ej. `'+573001234567'`). */
  phone: string;
  /** Tipo de documento de identidad en Colombia (Cédula de Ciudadanía, Extranjería, NIT, Pasaporte). */
  docType?: 'CC' | 'CE' | 'NIT' | 'PP';
  /** Número de identificación fiscal o tributaria. */
  docNumber?: string;
  /** Dirección física para entrega del pedido. */
  shippingAddress?: {
    street: string;
    city: string;
    department: string;
    postalCode?: string;
  };
}

// ============================================================================
// SECCIÓN 3: INTENCIONES DE COBRO (PAYMENT INTENTS)
// ============================================================================

/**
 * Solicitud unificada para generar una intención de cobro ante cualquier pasarela de pago.
 */
export interface CreatePaymentIntentRequest {
  /** Identificador interno del pedido en ADARA. */
  orderId: string;
  /** Referencia comercial única del pedido (ej. `'AD-2026-085'`). */
  orderReference: string;
  /** Monto exacto a cobrar en pesos colombianos. */
  amountCOP: number;
  /** Moneda de liquidación (estrictamente COP). */
  currency: 'COP';
  /** Datos del comprador. */
  customer: CustomerCheckoutInfo;
  /** Desglose de fragancias para la pasarela. */
  items: Array<{
    name: string;
    quantity: number;
    unitPriceCOP: number;
  }>;
  /** URL de retorno tras finalizar o cancelar la transacción en la pasarela. */
  redirectUrl: string;
  /** Endpoint del webhook seguro en Cloud Functions que recibirá la notificación asíncrona. */
  webhookUrl: string;
  /** Clave de idempotencia única para prevenir cargos duplicados. */
  idempotencyKey: string;
}

/**
 * Respuesta normalizada tras solicitar una intención de cobro a la pasarela.
 */
export interface CreatePaymentIntentResult {
  /** Indicador de éxito en la comunicación con el proveedor. */
  success: boolean;
  /** Nombre del proveedor de pagos procesador. */
  provider: PaymentMethod;
  /** Identificador único asignado por la pasarela externa. */
  transactionId?: string;
  /** URL de redirección externa para pasarelas alojadas (ej. Addi, PSE Wompi). */
  redirectUrl?: string;
  /** Token o identificador para widgets modales embebidos. */
  widgetToken?: string;
  /** Estado preliminar de la intención de cobro. */
  status: 'pending' | 'requires_action' | 'rejected';
  /** Mensaje descriptivo en caso de rechazo o error en la solicitud. */
  error?: string;
}

// ============================================================================
// SECCIÓN 4: CONSULTA Y NOTIFICACIONES WEBHOOK
// ============================================================================

/**
 * Resultado de consultar el estado de una transacción ante la pasarela (polling o reconciliación).
 */
export interface PaymentStatusCheckResult {
  /** Indicador de si la consulta se completó exitosamente. */
  success: boolean;
  /** Referencia del pedido asociado. */
  orderReference: string;
  /** ID de la transacción en la pasarela. */
  transactionId: string;
  /** Proveedor que procesó el cobro. */
  provider: PaymentMethod;
  /** Estado financiero definitivo verificado. */
  status: 'approved' | 'declined' | 'pending' | 'voided';
  /** Monto efectivamente recaudado en COP. */
  amountPaidCOP?: number;
  /** Marca de tiempo ISO de confirmación del pago. */
  paidAt?: string;
  /** Respuesta cruda devuelta por la API para fines de auditoría. */
  rawResponse?: Record<string, unknown>;
}

/**
 * Notificación procesada y verificada criptográficamente recibida mediante Webhook.
 */
export interface VerifiedWebhookNotification {
  /** `true` si la firma criptográfica (HMAC-SHA256) del webhook fue validada con el secreto oficial. */
  isValidSignature: boolean;
  /** Referencia interna del pedido afectado. */
  orderReference: string;
  /** ID de la transacción externa. */
  transactionId: string;
  /** Pasarela emisora del webhook. */
  provider: PaymentMethod;
  /** Estado reportado por el webhook. */
  status: 'approved' | 'declined' | 'pending' | 'voided';
  /** Importe liquidado en COP. */
  amountPaidCOP: number;
  /** Marca de tiempo de emisión del evento. */
  timestamp: string;
  /** Payload íntegro para archivo de auditoría. */
  rawPayload: Record<string, unknown>;
}

// ============================================================================
// SECCIÓN 5: INTERFAZ DEL PATRÓN ADAPTADOR DE PASARELAS
// ============================================================================

/**
 * Interfaz de Adaptador de Pasarela (Patrón Adapter).
 *
 * @remarks
 * Cada proveedor específico (Wompi, Addi, Sistecrédito) implementará este contrato
 * en un módulo independiente, aislando al núcleo del e-commerce de particularidades de cada API.
 */
export interface IPaymentGatewayAdapter {
  /** Identificador del medio de pago implementado. */
  readonly providerName: PaymentMethod;

  /**
   * Genera la transacción inicial y retorna la URL o token de pago.
   *
   * @param order - Pedido confirmado en ADARA.
   * @param customer - Datos del cliente y facturación.
   * @param config - URLs de redirección y webhook.
   */
  createPaymentIntent(
    order: Order,
    customer: CustomerCheckoutInfo,
    config: { redirectUrl: string; webhookUrl: string }
  ): Promise<CreatePaymentIntentResult>;

  /**
   * Consulta activa de estado de transacción ante la pasarela.
   *
   * @param transactionId - Identificador único de la transacción.
   */
  checkTransactionStatus(transactionId: string): Promise<PaymentStatusCheckResult>;

  /**
   * Valida la firma criptográfica enviada por el proveedor en un webhook.
   *
   * @param rawBody - Cuerpo crudo de la petición HTTP recibida.
   * @param signatureHeader - Cabecera con la firma provista por la pasarela.
   * @param secretKey - Secreto de firma configurado en el servidor.
   */
  verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string,
    secretKey: string
  ): boolean;

  /**
   * Transforma el payload crudo del webhook en un evento canónico verificado.
   *
   * @param payload - Objeto JSON parseado de la notificación.
   */
  parseWebhookNotification(payload: Record<string, unknown>): VerifiedWebhookNotification;
}
