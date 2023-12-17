import SSLcommerzBase from "../core/sslcommerz-base";
import { PaymentIntentOptions, PaymentProviderKeys } from "../types";

class MastercardProviderService extends SSLcommerzBase {
  static identifier = PaymentProviderKeys.MASTERCARD

  constructor(_: any, options: any) {
    super(_, options)
  }

  get paymentIntentOptions(): PaymentIntentOptions {
    return {
      payment_method_types: ["mastercard"],
      capture_method: "automatic",
    }
  }
}

export default MastercardProviderService
