import { OrderService } from "@medusajs/medusa";
import Stripe from "stripe";
import StripeBase from "../core/stripe-base";
import { WidgetPayment } from "../types";

export async function getSSLCommerzPayments(req): Promise<WidgetPayment[]> {
  const { order_id } = req.params
  console.log(order_id, "order");

  const orderService: OrderService = req.scope.resolve("orderService")
  console.log(orderService)
  const stripeBase: StripeBase = req.scope.resolve("stripeProviderService")

  const order = await orderService.retrieve(order_id, {
    relations: ["payments", "swaps", "swaps.payment", "region"],
  })

  console.log(order, "order");

  const paymentIds = order.payments
    .filter((p) => p.provider_id === "ssl_commerce")
    .map((p) => ({ id: p.data.id as string, type: "order" }))
  
  console.log(paymentIds)

  if (order.swaps.length) {
    const swapPayments = order.swaps
      .filter((p) => p.payment.provider_id === "ssl_commerce")
      .map((p) => ({ id: p.payment.data.id as string, type: "swap" }))

    paymentIds.push(...swapPayments)
  }

  const payments = await Promise.all(
    paymentIds.map(async (payment) => {
      const intent = await stripeBase
        .getStripe()
        .paymentIntents.retrieve(payment.id, {
          expand: ["latest_charge"],
        })

      const charge = intent.latest_charge as Stripe.Charge

      return {
        id: intent.id,
        amount: intent.amount,
        created: intent.created,
        risk_score: charge?.outcome?.risk_score ?? null,
        risk_level: charge?.outcome?.risk_level ?? null,
        type: payment.type as "order" | "swap",
        region: order.region,
      }
    })
  )

  return payments
}
