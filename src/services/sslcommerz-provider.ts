import SSLcommerzBase from "../core/sslcommerz-base";
import { PaymentIntentOptions } from "../types";

class SslcommerzProviderService extends SSLcommerzBase {
  static identifier = "sslcommerz"

  constructor(_: any, options: any) {
    super(_, options)
  }

  get paymentIntentOptions(): PaymentIntentOptions {
    return {}
  }

}

export default SslcommerzProviderService
