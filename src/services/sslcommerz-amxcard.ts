import SSLcommerzBase from "../core/sslcommerz-base";
import StripeBase from "../core/sslcommerz-base";
import { PaymentIntentOptions, PaymentProviderKeys } from "../types";

class AmexcardProviderService extends SSLcommerzBase {
  static identifier = PaymentProviderKeys.AMEXCARD

  constructor(_: any, options: any) {
    super(_, options)
  }

  get paymentIntentOptions(): PaymentIntentOptions {
    return {
      payment_method_types: ["amexcard"],
      capture_method: "automatic",
    }
  }
}

export default AmexcardProviderService
