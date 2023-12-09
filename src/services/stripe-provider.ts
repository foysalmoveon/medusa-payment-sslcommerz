import SSLcommerzBase from "../core/sslcommerz-base";
import { PaymentIntentOptions, PaymentProviderKeys } from "../types";

class StripeProviderService extends SSLcommerzBase {
  static identifier = PaymentProviderKeys.SSLCOMMERZ

  constructor(_: any, options: any) {
    super(_, options)
  }

  get paymentIntentOptions(): PaymentIntentOptions {
    return {}
  }

}

export default StripeProviderService
