import StripeBase from "../core/sslcommerz-base";
import { PaymentIntentOptions, PaymentProviderKeys } from "../types";

class InternetBankProviderService extends StripeBase {
  static identifier = PaymentProviderKeys.INTERNETBANK

  constructor(_: any, options: any) {
    super(_, options)
  }

  get paymentIntentOptions(): PaymentIntentOptions {
    return {
      payment_method_types: ["internetbank"],
      capture_method: "automatic",
    }
  }
}

export default InternetBankProviderService
