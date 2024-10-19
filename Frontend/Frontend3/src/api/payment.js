import { mainInstance } from ".";

export const createStripeSession = async (obj) => {
    try {
        const res = await mainInstance.post("/create-stripe-payment/", obj)
        return res
    } catch (error) {
        throw error
    }
}

export const createPayPalSession = async (obj) => {
    try {
        const res = await mainInstance.post("/create-paypal-payment/", obj)
        return res
    } catch (error) {
        throw error
    }
}
// { "email": "user@example.com", "promocode": "SUMMER2024", "delivery_type": 1, "delivery_address": "123 Main St, City, Country", "phone": "+1234567890", "delivery_cost": 10.5, "courier_service_name": 1, "products": [ { "product_id": 1, "quantity": 2 },  { "product_id": 2, "quantity": 1 } ] }