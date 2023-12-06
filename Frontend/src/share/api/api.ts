import axios, { type AxiosInstance } from 'axios'
import Cookies from 'js-cookie'
import { TOKEN_COOKIES } from 'share/const/localstorage'

const BaseURL =  __API__ || "https://solopharma.shop/api"

export class API {
    constructor () {
        this.apiInstance = axios.create(({
            baseURL: BaseURL,
            headers: {
                Authorization: Cookies.get(TOKEN_COOKIES)?  `Token ${Cookies.get(TOKEN_COOKIES)}` : ''
            }
        }))
    }

    apiInstance: AxiosInstance
}
