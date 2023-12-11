
//import { authenticate } from "@medusajs/medusa";
import { OrderService, PaymentProcessorContext } from "@medusajs/medusa";
import { ConfigModule } from "@medusajs/types";
import getConfigFile from "@medusajs/utils/dist/common/get-config-file";
import bodyParser from "body-parser";
import cors from "cors";
import { Router } from "express";
import { generateTransactionId } from "../controllers/helpers";
import SSLcommerzBase from "../core/sslcommerz-base";



export default (rootDirectory: string) => {
  const app = Router()
  
  const tran_id = generateTransactionId(); 

  const { configModule } = getConfigFile<ConfigModule>(
    rootDirectory,
    "medusa-config"
  )

  const corsOptions = {
    origin: configModule?.projectConfig?.admin_cors?.split(","),
    credentials: true,
  }
  

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(
    `/admin/orders/sslcommerz-payments/:order_id`,
    cors(corsOptions)
  )

  app.get(`/admin/orders/sslcommerz-payments/:order_id`, async (req, res) => {
    console.log(req);
    const { order_id } = req.params
    const sslCommerz: SSLcommerzBase = req.scope.resolve("stripeProviderService")
    const orderService: OrderService = req.scope.resolve("orderService")

    const order = await orderService.retrieve(order_id, {
      relations: ["payments", "swaps", "swaps.payment", "region" ,"cart" , "customer"],
    })

    const context: PaymentProcessorContext  = {
      email: order.customer.email,
      context: order.metadata,
      currency_code: order.currency_code,
      amount: 100,
      resource_id: "1",
      customer: order.customer,
      paymentSessionData: order.metadata };
    const paymentResponse = await sslCommerz.initiatePayment(context)
    res.json(paymentResponse);
  })



  app.post(`/payments/success/:tran_id`, async (req, res) => {
    console.log(req.body)
    res.status(200).json({data: req.body})
  })

  app.post(`/payments/failed/:tran_id`, async (req, res) => {
    return res.status(400).json({data: req.body})
  })

  app.post(`/payments/cancel/:tran_id`, async (req, res) => {
    return res.status(200).json({data: req.body})
  })

  
  return app
}