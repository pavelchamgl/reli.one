import { BaseURL, mainInstance } from ".";
import axios from "axios"
import axiosRetry from "axios-retry"
import { trackPurchase } from "../analytics/analytics";

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

export const calculateDelivery = async (obj) => {
    try {
        const res = await mainInstance.post("/delivery/seller-shipping-options/", obj)
        console.log(res.data);

        return res.data

    } catch (error) {
        throw error

    }
}
// { "email": "user@example.com", "promocode": "SUMMER2024", "delivery_type": 1, "delivery_address": "123 Main St, City, Country", "phone": "+1234567890", "delivery_cost": 10.5, "courier_service_name": 1, "products": [ { "product_id": 1, "quantity": 2 },  { "product_id": 2, "quantity": 1 } ] }



// ? ретраи для получения id сессии



const apiRetry = axios.create({
    baseURL: BaseURL,
    headers: {
        'Content-Type': 'application/json',
    },
})

axiosRetry(apiRetry, {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 500,
    retryCondition: (error) => {
        // Повторяем только при сетевых ошибках или 5xx
        return axiosRetry.isNetworkError(error) || error.response?.status >= 500;
    },
})

export const getDataFromSessionId = async (id, retries = 3, delay = 500) => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const res = await apiRetry.get(`/conversion-payload/?session_id=${id}`);

            if (res.data?.ready) {
                console.log(res.data);
                const data = res.data
                trackPurchase(data.transaction_id, data.value, data.currency)
                return res.data; // готово — возвращаем
            } else {
                console.log(`Попытка ${attempt + 1}: данные еще не готовы, ждем ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay)); // polling delay
            }
        } catch (error) {
            console.log(error);
            // axiosRetry автоматически сработает при сетевых или 5xx ошибках
        }
    }

    throw new Error("Данные не стали ready за отведенное количество попыток");
};
