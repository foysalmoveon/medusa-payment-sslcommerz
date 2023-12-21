import { OrderService } from "@medusajs/medusa";
import { IS_LIVE, SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_SECRCT_KEY } from "../constant";
import SSLcommerzBase from "../core/sslcommerz-base";
import { WidgetPayment } from "../types";

export async function getSSLCommerzPayments(req): Promise<WidgetPayment[]> {
  const { order_id } = req.params

  const orderService: OrderService = req.scope.resolve("orderService")
  const sslCommerz: SSLcommerzBase = req.scope.resolve("sslcommerzProviderService")

  sslCommerz.sslInit(SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_SECRCT_KEY, IS_LIVE);

  const order = await orderService.retrieve(order_id, {
    relations: ["payments", "swaps", "swaps.payment", "region" ,"cart" , "customer"],
  })
  console.log(order,"order")

  const paymentIds = order.payments
    .filter((p) => p.provider_id === "sslcommerz")
    .map((p) => ({ id: p.data.id as string, type: "order" }))
  

  if (order.swaps.length) {
    const swapPayments = order.swaps
      .filter((p) => p.payment.provider_id === "sslcommerz")
      .map((p) => ({ id: p.payment.data.id as string, type: "swap" }))
    paymentIds.push(...swapPayments)
  }

 
  const payments = await Promise.all(
    paymentIds.map(async (payment) => {
      console.log(payment, "payment")
      const intent = await sslCommerz
        .getSSLcommerz()
      
      console.log(intent);
      const charge = intent.latest_charge

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
