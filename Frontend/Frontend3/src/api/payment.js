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

const cookieSave = localStorage.getItem("cookieSave")

export const getDataFromSessionId = async (id, retries = 3, delay = 500) => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const res = await apiRetry.get(`/conversion-payload/?session_id=${id}`);

            if (res.data?.ready) {
                console.log(res.data);
                const data = res.data
                return res // готово — возвращаем
            } else {
                console.log(`Попытка ${attempt + 1}: данные еще не готовы, ждем ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay)); // polling delay
            }
        } catch (error) {
            if (error.response) {
                // Сервер ответил, но с ошибкой (4xx, 5xx)
                console.error(`Ошибка сервера: ${error.response.status}`, error.response.data);
            } else if (error.request) {
                // Запрос был отправлен, но ответа не было
                console.error('Нет ответа от сервера', error.request);
            } else {
                // Ошибка при формировании запроса или что-то другое
                console.error('Ошибка при настройке запроса', error.message);
            }
        }

    }

    throw new Error("Данные не стали ready за отведенное количество попыток");
};
