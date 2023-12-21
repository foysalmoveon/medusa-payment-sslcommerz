import { CartService, LineItemService } from "@medusajs/medusa";
import SSLcommerzBase from "../core/sslcommerz-base";
import { PaymentIntentOptions } from "../types";


class SslcommerzProviderService extends SSLcommerzBase {
  static identifier = "sslcommerz"

  protected readonly cartService_: CartService
  protected readonly lineItemService_: LineItemService

  constructor({cartService, lineItemService}, options: any ) {
    super(arguments[0], options)
    this.cartService_ = cartService
    this.lineItemService_ = lineItemService
  }

  get paymentIntentOptions(): PaymentIntentOptions {
    return {}
  }

}

export default SslcommerzProviderService
