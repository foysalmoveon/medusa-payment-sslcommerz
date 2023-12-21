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
  SSLCOMMERZ: "sslcommerz",
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


export interface ISslCommerceRespose{
  session_data: SessionData;
  update_requests: UpdateRequests;
}


type Gateway = {
  visa: string;
  master: string;
  amex: string;
  othercards: string;
  internetbanking: string;
  mobilebanking: string;
};

type SessionData = {
  status: string;
  failedreason: string;
  sessionkey: string;
  gw: Gateway;
  redirectGatewayURL: string;
  directPaymentURLBank: string;
  directPaymentURLCard: string;
  directPaymentURL: string;
  redirectGatewayURLFailed: string;
  GatewayPageURL: string;
  storeBanner: string;
  storeLogo: string;
  store_name: string;
  desc: {
    name: string;
    type: string;
    logo: string;
    gw: string;
    r_flag: string;
    redirectGatewayURL: string;
  }[];
  is_direct_pay_enable: string;
};

type UpdateRequests = {
  customer_metadata: {};
};



//  VALID / FAILED / CANCELLED


export enum SslCommerzStatus{ 
  VALID = "VALID",
  VALIDATED = "VALIDATED",
  FAILED = "FAILED", 
  CANCELLED = "CANCELLED"
}