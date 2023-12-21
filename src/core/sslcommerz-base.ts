import {
  AbstractPaymentProcessor,
  CartService,
  isPaymentProcessorError,
  LineItemService,
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
  ISslCommerceRespose,
  PaymentIntentOptions,
  SSLcommerzOptions,
  SslCommerzStatus
} from "../types";


const SSLCommerzPayment = require('sslcommerz-lts');

abstract class SSLcommerzBase extends AbstractPaymentProcessor {
  static identifier: string = "sslcommerz"

  protected readonly options_: SSLcommerzOptions
  protected sslcommerce_:any
  protected readonly cartService_: CartService;
  protected readonly lineItemService_: LineItemService;

  protected constructor({cartService, lineItemService }, options, ) {
    super(arguments[0] , options)
    this.options_ = options
    this.sslcommerce_ = null
    this.cartService_ = cartService;
    this.lineItemService_ = lineItemService;
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
    const paymentIntentStatus:SslCommerzStatus = await this.sslcommerce_.init(id).status

    switch (paymentIntentStatus) {
      case SslCommerzStatus.VALID:
        return PaymentSessionStatus.AUTHORIZED
      case SslCommerzStatus.VALIDATED:
      case SslCommerzStatus.FAILED:
        return PaymentSessionStatus.ERROR
      case SslCommerzStatus.CANCELLED:
        return PaymentSessionStatus.CANCELED
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  async initiatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {

    const {
      email,
      currency_code,
      amount,
      customer,
      resource_id,
      context:cartContext,
      paymentSessionData
    } = context


    this.sslInit(SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_SECRCT_KEY, IS_LIVE);
    const trans_id = generateTransactionId();

    const product = await this.lineItemService_.list({cart_id:resource_id},  {
      relations: ["variant", "variant.product"],
    })

    const cart = await this.cartService_.retrieve(resource_id, {
        relations: [ "billing_address", "payment", "region", "customer" ,"shipping_methods", "shipping_methods.shipping_option" , "shipping_address"],
    });

    const data = {
      total_amount: amount,
      currency: currency_code.toUpperCase(),
      tran_id: trans_id,
      success_url: `http://localhost:9000/store/carts/success/${resource_id}`,
      fail_url: `http://localhost:9000/store/carts/fail/${resource_id}`,
      cancel_url: `http://localhost:9000/store/carts/cancel/${resource_id}`,
      ipn_url: `http://localhost:9000/ipn/${resource_id}`,
      shipping_method: cart.shipping_methods[0]?.shipping_option?.name || 'Default Shipping',
      product_name:  product[0].title,
      product_category: 'Electronic',
      product_profile: 'general',
      cus_name: customer?.first_name ? customer.first_name : cart.billing_address.first_name,
      cus_email: email,
      cus_add1: cart.billing_address?.address_1,
      cus_add2: cart.billing_address?.address_2,
      cus_city: cart.billing_address?.city,
      cus_state: cart.billing_address?.province,
      cus_postcode: cart.billing_address?.postal_code,
      cus_country: cart.billing_address?.country,
      cus_phone: cart.billing_address?.phone,
      cus_fax: null,
      ship_name: cart.shipping_methods[0]?.shipping_option.name,
      ship_add1: cart.shipping_address?.address_1,
      ship_add2: cart.shipping_address?.address_2,
      ship_city: cart.shipping_address?.city,
      ship_state: cart.shipping_address?.province,
      ship_postcode: cart.shipping_address?.postal_code,
      ship_country: cart.shipping_address?.phone
    };

    let sslCommerzResponse: ISslCommerceRespose | null = null
    
    try {
      const sslcommer = this.sslcommerce_;
      sslCommerzResponse = await sslcommer.init(data);
      
    } catch (e) {
      return this.buildError(
        "An error occurred in initiatePayment when initiating SSLCommerz payment",
        e
      );
    }

    if (!sslCommerzResponse) {
      return this.buildError(
        "An error occurred in initiatePayment when initiating SSLCommerz payment",
        null
      );

    } else { 
      return {
        session_data: {
          redirectUrl: sslCommerzResponse.session_data.GatewayPageURL, 
          sessionKey: sslCommerzResponse.session_data.sessionkey, 
          status: sslCommerzResponse.session_data.status
        },
        update_requests: customer?.metadata?.sessionkey
          ? undefined
          : {
            customer_metadata: {
              sessionkey: sslCommerzResponse.session_data.sessionkey,
            },
          },
      } 
      
    }
  }


  async validateNotification(validateNotification) {
    const val_id = validateNotification.val_id
    try {
      let sslCommerzResponse;
  
      const sslcommer = this.sslcommerce_;
      sslCommerzResponse = await sslcommer.validate(val_id);
    } catch (e) {
      return this.buildError(
        "An error occurred in initiatePayment when initiating SSLCommerz payment",
        e
      );
    }
  
    return { data: val_id };
  }



  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<
    PaymentProcessorError |
    {
      status: PaymentSessionStatus;
      data: Record<string, unknown>;
    }
  > {
    try {
   const status = await this.getPaymentStatus(paymentSessionData)

      return {
        status: status,
        data: {
          id: paymentSessionData.id
        }
      }
    } catch (e) {
      return {
        error: e.message
      }
    }
  }

  // async authorizePayment(
  //   paymentSessionData: Record<string, unknown>,
  //   context: Record<string, unknown>
  // ): Promise<
  //   | PaymentProcessorError
  //   | {
  //       status: PaymentSessionStatus;
  //       data: PaymentProcessorSessionResponse["session_data"];
  //     }
  //   > {
    
    
    
  //     const status = await this.getPaymentStatus(paymentSessionData)
    
  //   console.log(context,'context')
    
  //   // let data = paymentSessionData;
  //   // let status: PaymentSessionStatus; // Declare the 'status' variable

  //   // console.log(data, "data")
  
  //   // try {
  //   //   let sslCommerzResponse;
  
  //   //   const sslcommer = this.sslcommerce_;
  //   //   sslCommerzResponse = await sslcommer.validate(data);
  
  //   //   // Assuming you get a status from sslCommerzResponse or context, assign it to 'status'
  //   //   // For example:
  //   //   status = sslCommerzResponse.status || 'success';
  //   // } catch (e) {
  //   //   return this.buildError(
  //   //     "An error occurred in initiatePayment when initiating SSLCommerz payment",
  //   //     e
  //   //   );
  //   // }
  
  //   return {
  //     status: PaymentSessionStatus.AUTHORIZED,
  //     data: {
  //       id: paymentSessionData.id
  //     }
  //   }

  // }
  


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
        if (error?.status === ErrorIntentStatus.SUCCEEDED) {
          return error.status
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
        payment_intent: id as string,
        amount: refundAmount,
        refund_remarks:'',
        bank_tran_id:paymentSessionData.bank_tran_id,
        refe_id:paymentSessionData.refe_id,
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
        const sessionData = (await this.sslcommerce_.update(id, {
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

      return (await this.sslcommerce_.update(sessionId, {
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
