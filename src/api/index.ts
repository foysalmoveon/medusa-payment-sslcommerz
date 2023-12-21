
//import { authenticate } from "@medusajs/medusa";
import { CartService, PaymentProcessorContext } from "@medusajs/medusa";
import { ConfigModule } from "@medusajs/types";
import getConfigFile from "@medusajs/utils/dist/common/get-config-file";
import bodyParser from "body-parser";
import cors from "cors";
import { Router } from "express";
import SSLcommerzBase from "../core/sslcommerz-base";


const app = Router()
export default (rootDirectory: string) => {

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
    `/store/carts/`,
    cors(corsOptions)
  )

  app.get(`/store/carts/:cart_id`, async (req, res) => {
    const { cart_id } = req.params; 
    const sslCommerz: SSLcommerzBase = req.scope.resolve("sslcommerzProviderService");
    const cartService: CartService = req.scope.resolve("cartService");

    try {
        const cart = await cartService.retrieve(cart_id, {
            relations: [ "billing_address", "payment", "region", "customer" ,"shipping_methods", "shipping_methods.shipping_option"],
        });
        const context: PaymentProcessorContext = {
            email: cart.email,
            context: cart.metadata,
            currency_code: cart.region.currency_code,
            amount: 3500, 
            resource_id: cart.id,
            customer: cart.customer,
            paymentSessionData: cart.metadata,
        };
        
        const session_data = await sslCommerz.initiatePayment(context);
        return res.json({ session_data });
    } catch (error) {
        console.error('Error retrieving order:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post(`/store/carts/success/:tran_id`, async (req, res) => {
    res.status(200).json({data: req.body})
  })

  app.post(`/store/carts/failed/:tran_id`, async (req, res) => {
    return res.status(400).json({data: req.body})
  })

  app.post(`/store/carts/cancel/:tran_id`, async (req, res) => {
    return res.status(200).json({data: req.body})
  })

  app.get('/validate', async (req, res) => {
    console.log(req)
    const val_id = req.query;
    const data = {
        val_id: val_id.val_id,
    };
    const sslCommerz: SSLcommerzBase = req.scope.resolve("sslcommerzProviderService");

    
    const validate_data = await sslCommerz.validateNotification(data);
    return res.json({ validate_data });
});

  
  return app
}


