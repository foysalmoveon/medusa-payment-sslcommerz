import SSLcommerzBase from "../core/sslcommerz-base";
import { PaymentIntentOptions, PaymentProviderKeys } from "../types";

class OthersCardProviderService extends SSLcommerzBase {
  static identifier = PaymentProviderKeys.OTHERCARD

  constructor(_: any, options: any) {
    super(_, options)
  }

  get paymentIntentOptions(): PaymentIntentOptions {
    return {
      payment_method_types: ["giropay"],
      capture_method: "automatic",
    }
  }
}

export default OthersCardProviderService
