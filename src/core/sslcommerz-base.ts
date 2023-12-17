import {
  AbstractPaymentProcessor,
  isPaymentProcessorError,
  PaymentProcessorContext,
  PaymentProcessorError,
  PaymentProcessorSessionResponse,
  PaymentSessionStatus
} from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";
import { EOL } from "os";
import { IS_LIVE, SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_SECRCT_KEY } from "../constant";
import { generateTransactionId } from "../controllers/helpers";
import {
  ErrorCodes,
  ErrorIntentStatus,
  PaymentIntentOptions,
  SSLcommerzOptions
} from "../types";



const SSLCommerzPayment = require('sslcommerz-lts');

abstract class SSLcommerzBase extends AbstractPaymentProcessor {
  static identifier: string = "sslcommerz"

  protected readonly options_: SSLcommerzOptions
  protected sslcommerce_:any

  protected constructor(_, options) {
    super(_, options)

    this.options_ = options
    this.sslcommerce_ = null
  }

  public sslInit(storeId:string, secrctKey:string, mode:boolean): void{ 
    const sslcz = new SSLCommerzPayment(storeId, secrctKey, mode)

    this.sslcommerce_ = sslcz
  }

  abstract get paymentIntentOptions(): PaymentIntentOptions

  getSSLcommerz() {
    return this.sslcommerce_
  }

  getPaymentIntentOptions(): PaymentIntentOptions {
    const options: PaymentIntentOptions = {}

    if (this?.paymentIntentOptions?.capture_method) {
      options.capture_method = this.paymentIntentOptions.capture_method
    }

    if (this?.paymentIntentOptions?.payment_method_types) {
      options.payment_method_types =
        this.paymentIntentOptions.payment_method_types
    }

    return options
  }

  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentSessionStatus> {
    const id = paymentSessionData.id as string
    const paymentIntent = await this.sslcommerce_.status(id)

    switch (paymentIntent.status) {
      case "VALID":
      case "requires_confirmation":
      case "processing":
        return PaymentSessionStatus.PENDING
      case "requires_action":
        return PaymentSessionStatus.REQUIRES_MORE
      case "canceled":
        return PaymentSessionStatus.CANCELED
      case "requires_capture":
      case "succeeded":
        return PaymentSessionStatus.AUTHORIZED
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  async initiatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    const intentRequestData = this.getPaymentIntentOptions()
    const {
      email,
      currency_code,
      amount,
      customer,
    } = context

    this.sslInit(SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_SECRCT_KEY, IS_LIVE);
    const trans_id = generateTransactionId();

    const data = {
      total_amount: amount,
      currency: currency_code.toUpperCase(),
      tran_id: trans_id,
      success_url: `/sslcommerz-payments/success/${trans_id}`,
      fail_url: `/sslcommerz-payments/fail/${trans_id}`,
      cancel_url: `/sslcommerz-payments/cancel/${trans_id}`,
      ipn_url: '/ipn',
      shipping_method: 'Curireir',
      product_name: "Computer,Speaker",
      product_category: 'Electronic',
      product_profile: 'general',
      cus_name: customer?.first_name,
      cus_email: email,
      cus_add1: 'Dhaka',
      cus_add2: 'Dhaka',
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: null,
      cus_country: null,
      cus_phone: customer?.phone,
      cus_fax: null,
      ship_name: 'air',
      ship_add1: "Mirpur-10",
      ship_add2: "Mirpur-12",
      ship_city: "Dhaka",
      ship_state: null,
      ship_postcode: 1254,
      ship_country: "Dhaka",
      capture_method: this.options_.capture ? "automatic" : "manual",
    };

    let sslCommerzResponse: { sessionKey: any };
    
    try {
      const sslcommer = this.sslcommerce_;
      sslCommerzResponse = await sslcommer.init(data);
    } catch (e) {
      return this.buildError(
        "An error occurred in initiatePayment when initiating SSLCommerz payment",
        e
      );
    }
  
    console.log(sslCommerzResponse,"sslCommerzResponse")
    return {
      session_data: sslCommerzResponse,
      update_requests: customer?.metadata?.sessionkey
        ? undefined
        : {
          customer_metadata: {
            sessionkey: sslCommerzResponse.sessionKey,  // Fix the typo here
          },
        },
    } as PaymentProcessorSessionResponse
  }


  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<
    | PaymentProcessorError
    | {
        status: PaymentSessionStatus;
        data: PaymentProcessorSessionResponse["session_data"];
      }
    > {
    
    console.log(context,'context')
    
    let data = paymentSessionData;
    let status: PaymentSessionStatus; // Declare the 'status' variable

    console.log(data, "data")
  
    try {
      let sslCommerzResponse;
  
      const sslcommer = this.sslcommerce_;
      sslCommerzResponse = await sslcommer.validate(data);
  
      // Assuming you get a status from sslCommerzResponse or context, assign it to 'status'
      // For example:
      status = sslCommerzResponse.status || 'success';
    } catch (e) {
      return this.buildError(
        "An error occurred in initiatePayment when initiating SSLCommerz payment",
        e
      );
    }
  
    return { data: paymentSessionData, status };
  }
  


  async cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    try {
      const id = paymentSessionData.id as string
      return (await this.sslcommerce_.initiateRefund(
        id
      )) as unknown as PaymentProcessorSessionResponse["session_data"]
    } catch (error) {
      if (error.payment_intent?.status === ErrorIntentStatus.CANCELED) {
        return error.payment_intent
      }

      return this.buildError("An error occurred in cancelPayment", error)
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
    > {
    console.log(paymentSessionData, "paymentsesstionData")
    const id = paymentSessionData.id as string
    try {
      const intent = await this.sslcommerce_.validate(id);
      return intent as unknown as PaymentProcessorSessionResponse["session_data"]
    } catch (error) {
      if (error.code === ErrorCodes.PAYMENT_INTENT_UNEXPECTED_STATE) {
        if (error.payment_intent?.status === ErrorIntentStatus.SUCCEEDED) {
          return error.payment_intent
        }
      }

      return this.buildError("An error occurred in capturePayment", error)
    }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    return await this.cancelPayment(paymentSessionData)
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
    > {
    console.log( paymentSessionData,"paymentSessionData")
    const id = paymentSessionData.id as string
   

    try {
      await this.sslcommerce_.initiateRefund({
        amount: refundAmount,
        payment_intent: id as string,
      })
    } catch (e) {
      return this.buildError("An error occurred in refundPayment", e)
    }

    return paymentSessionData
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
  > {
    try {
      const id = paymentSessionData.id as string
      const intent = await this.sslcommerce_.retrieve(id)
      return intent as unknown as PaymentProcessorSessionResponse["session_data"]
    } catch (e) {
      return this.buildError("An error occurred in retrievePayment", e)
    }
  }

  async updatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse | void> {
    const { amount, customer, paymentSessionData } = context
    const sslcommerId = customer?.metadata?.sslcommer_id

    if (sslcommerId !== paymentSessionData.customer) {
      const result = await this.initiatePayment(context)
      if (isPaymentProcessorError(result)) {
        return this.buildError(
          "An error occurred in updatePayment during the initiate of the new payment for the new customer",
          result
        )
      }

      return result
    } else {
      if (amount && paymentSessionData.amount === Math.round(amount)) {
        return
      }

      try {
        const id = paymentSessionData.id as string
        const sessionData = (await this.sslcommerce_.updatePayment(id, {
          amount: Math.round(amount),
        })) as unknown as PaymentProcessorSessionResponse["session_data"]

        return { session_data: sessionData }
      } catch (e) {
        return this.buildError("An error occurred in updatePayment", e)
      }
    }
  }

  async updatePaymentData(sessionId: string, data: Record<string, unknown>) {
    try {
      // Prevent from updating the amount from here as it should go through
      // the updatePayment method to perform the correct logic
      if (data.amount) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot update amount, use updatePayment instead"
        )
      }

      return (await this.sslcommerce_.updatePayment(sessionId, {
        ...data,
      })) as unknown as PaymentProcessorSessionResponse["session_data"]
    } catch (e) {
      return this.buildError("An error occurred in updatePaymentData", e)
    }
  }

  protected buildError(
    message: string,
    e: any | PaymentProcessorError | Error
  ): PaymentProcessorError {
    return {
      error: message,
      code: "code" in e ? e.code : "",
      detail: isPaymentProcessorError(e)
        ? `${e.error}${EOL}${e.detail ?? ""}`
        : "detail" in e
        ? e.detail
        : e.message ?? "",
    }
  }
}

export default SSLcommerzBase
