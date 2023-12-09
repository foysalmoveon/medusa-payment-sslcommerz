import { Region } from "@medusajs/medusa";

export interface SSLcommerzOptions {
  api_key: string;
  IS_LIVE: false,
  SSLCOMMERZ_STORE_SECRCT_KEY : 'foysa656c03bc600f4@ssl',
  SSLCOMMERZ_STORE_ID: 'foysa656c03bc600f4',
  /**
   * Use this flag to capture payment immediately (default is false)
   */
  capture?: boolean
  /**
   * set `automatic_payment_methods` to `{ enabled: true }`
   */
  automatic_payment_methods?: boolean
  /**
   * Set a default description on the intent if the context does not provide one
   */
  payment_description?: string
}

export interface PaymentIntentOptions {
  capture_method?: "automatic" | "manual"
  setup_future_usage?: "on_session" | "off_session"
  payment_method_types?: string[]
}

export const ErrorCodes = {
  PAYMENT_INTENT_UNEXPECTED_STATE: "payment_intent_unexpected_state",
}

export const ErrorIntentStatus = {
  SUCCEEDED: "succeeded",
  CANCELED: "canceled",
}

export const PaymentProviderKeys = {
  SSLCOMMERZ: "ssl_commerce",
  INTERNETBANK: "internetbank", 
  MOBILEBANK : "mobilebank",
  OTHERCARD: "othercard",
  VISACARD : "visacard",
  MASTERCARD: "mastercard",
  AMEXCARD : "amexcard",
}

export type WidgetPayment = {
  id: string
  amount: number
  created: number
  risk_score: number | null
  risk_level: string | null
  region: Region
  type: "order" | "swap"
}

export type ListStripeIntentRes = {
  payments: WidgetPayment[]
}
