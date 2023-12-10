const getTotalAmount =(order:any)=> {
    return order.payments.reduce((total:any, payment:any) => total + payment.amount, 0);
}

export const generateTransactionId = () => {
    const prefix = "TX";
    const randomSuffix = Math.floor(Math.random() * 1000000); 
    const timestamp = Date.now();
    return `${prefix}${timestamp}${randomSuffix}`;
};


const extractOrderData =(orderPayload: any)=> {
    const order = orderPayload;
  
    const data = {
      total_amount: getTotalAmount(order),
      currency: order.currency_code,
      tran_id: generateTransactionId(),
      success_url: `http://localhost:9000/${generateTransactionId()}success`,
      fail_url: `http://localhost:9000/${generateTransactionId()}fail`,
      cancel_url: `http://localhost:9000/${generateTransactionId()}cancel`,
      ipn_url: 'http://localhost:9000/ipn',
      shipping_method: null,
      product_name: null,
      product_category: null,
      product_profile: null,
      cus_name: null,
      cus_email: null,
      cus_add1: null,
      cus_add2: null,
      cus_city: null,
      cus_state: null,
      cus_postcode: null,
      cus_country: null,
      cus_phone: null,
      cus_fax: null,
      ship_name: null,
      ship_add1: null,
      ship_add2: null,
      ship_city: null,
      ship_state: null,
      ship_postcode: null,
      ship_country: null,
    };
  
    return data;
  }


