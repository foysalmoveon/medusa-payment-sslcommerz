
//import { authenticate } from "@medusajs/medusa";
import { ConfigModule } from "@medusajs/types";
import getConfigFile from "@medusajs/utils/dist/common/get-config-file";
import bodyParser from "body-parser";
import cors from "cors";
import { Router } from "express";
import { getSSLCommerzPayments } from "../controllers/get-payments";
import { generateTransactionId } from "../controllers/helpers";



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
    `/orders/sslcommerz-payments/:order_id`,
    cors(corsOptions)
  )

  app.get(`/orders/sslcommerz-payments/:order_id`, async (req, res) => {
    const payments = await getSSLCommerzPayments(req)
    console.log(payments)
    res.json({ payments })
  })
  
  return app
}