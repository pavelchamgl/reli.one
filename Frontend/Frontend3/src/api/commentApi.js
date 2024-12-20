import mainInstance, { postApi, getApi } from ".";
import { formDataInstance } from ".";
import axios from "axios";




export const getComments = async (id, page) => {
    try {
        const res = await getApi(`https://reli.one/api/reviews/${id}/product/?page=${page}&product_id=${id}&page_size=5`)
        return res
    } catch (error) {
        throw error
    }
}

const tokenLocal = localStorage.getItem("token")
const tokenReal = JSON.parse(tokenLocal)
const token = tokenReal?.access || '';




export const postComment = async (formData) => {
    const token = JSON.parse(localStorage.getItem("token"))?.access;

    try {
        const res = await axios.post(
            "https://reli.one/api/reviews/create/",
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`, // Токен для авторизации
                },
            }
        );

        return res;
    } catch (error) {
        console.error("Error in postComment:", error);
        throw error;
    }
};

