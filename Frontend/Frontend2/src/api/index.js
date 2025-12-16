import axios from "axios"

export const BaseURL = "" || "https://reli.one/api"


// Создание axios экземпляра
export const mainInstance = axios.create({
    baseURL: BaseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});


export const createContactMessage = async (obj) => {
    try {
        const res = await mainInstance.post("/contact/message/", obj)
        console.log(res);
    } catch (error) {
        throw error
    }
}