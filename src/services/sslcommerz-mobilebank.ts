import SSLcommerzBase from "../core/sslcommerz-base";
import { PaymentIntentOptions, PaymentProviderKeys } from "../types";

class MobileBankingProviderService extends SSLcommerzBase {
  static identifier = PaymentProviderKeys.MOBILEBANK

  constructor(_: any, options: any) {
    super(_, options)
  }

  get paymentIntentOptions(): PaymentIntentOptions {
    return {
      payment_method_types: ["mobilebank"],
      capture_method: "automatic",
    }
  }
}

export default MobileBankingProviderService
