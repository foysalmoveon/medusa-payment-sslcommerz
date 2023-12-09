import SSLcommerzBase from "../core/sslcommerz-base";
import { PaymentIntentOptions, PaymentProviderKeys } from "../types";

class VisaCardProviderService extends SSLcommerzBase {
  static identifier = PaymentProviderKeys.VISACARD

  constructor(_: any, options: any) {
    super(_, options)
  }

  get paymentIntentOptions(): PaymentIntentOptions {
    return {
      payment_method_types: ["visacard"],
      capture_method: "automatic",
    }
  }
}

export default VisaCardProviderService
