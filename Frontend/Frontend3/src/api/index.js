import axios from "axios"
import { ErrToast } from "../ui/Toastify";

const BaseURL = "" || "https://reli.one/api"


// Создание axios экземпляра
export const mainInstance = axios.create({
  baseURL: BaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавление интерцептора запроса
mainInstance.interceptors.request.use(config => {
  const token = localStorage.getItem("token") ? JSON.parse(localStorage.getItem("token")).access : '';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});


mainInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (axios.isAxiosError(err)) {
      const originalRequest = err.config;

      if (err.response && err.response.status === 401) {
        const tokenData = localStorage.getItem("token");

        if (tokenData) {
          try {
            const parsedToken = JSON.parse(tokenData);
            const { data } = await axios.post(
              "https://reli.one/api/accounts/token/refresh/",
              {
                refresh: parsedToken.refresh,
              }
            );

            const newToken = { ...parsedToken, access: data.access };
            localStorage.setItem("token", JSON.stringify(newToken));

            originalRequest.headers['Authorization'] = `Bearer ${newToken.access}`;

            // Повторный запрос с новым токеном
            return axios(originalRequest);
          } catch (error) {
            // Обработка ошибки обновления токена
            ErrToast("Network Error")
            console.log('Error refreshing token:', error);
            // Опционально: перенаправление пользователя на страницу входа
            // window.location.href = '/login';
          }
        }
      }

      if (err.code === 'ECONNABORTED' || err.message === 'Network Error') {
        // Обработка ошибок сети
        ErrToast("Network error - please check your internet connection")
        console.log('Network error - please check your internet connection.');
        // Здесь вы можете показать пользователю уведомление о проблемах с сетью
      }
    }

    return Promise.reject(err);
  }
);


// mainInstance.interceptors.response.use(
//   response => response,
//   async error => {
//     const originalRequest = error.config;

//     // Проверка, если ошибка 401 и это не попытка обновления токена
//     if (error.response && error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       try {
//         // Получение токена из localStorage
//         const tokenData = localStorage.getItem("token");
//         if (!tokenData) {
//           throw new Error('No token found in localStorage');
//         }

//         const parsedToken = JSON.parse(tokenData);
//         const refreshToken = parsedToken.refresh;

//         if (!refreshToken) {
//           throw new Error('No refresh token found');
//         }

//         // Обновление токена
//         const response = await axios.post('https://reli.one/api/accounts/token/refresh/', {
//           refresh: refreshToken
//         });

//         // Сохранение нового токена в localStorage
//         localStorage.setItem("token", JSON.stringify(response.data));

//         // Установка нового токена в заголовки и повторный запрос
//         mainInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
//         originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;

//         return mainInstance(originalRequest);
//       } catch (err) {
//         console.error('Ошибка обновления токена', err);
//         // Обработка ошибки обновления токена (например, разлогинить пользователя)
//         localStorage.removeItem("token");
//         // window.location.href = '/'; // перенаправление на страницу логина
//         return Promise.reject(err);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

export default mainInstance;



export const getApi = async (url) => {
  try {
    const res = await mainInstance.get(url)
    return res
  } catch (error) {
    throw error
  }
}

export const postApi = async (url, obj) => {
  try {
    const res = await mainInstance.post(url, obj)
    return res
  } catch (error) {
    throw error
  }
}

export const putApi = async (url, obj) => {
  try {
    const res = await mainInstance.put(url, obj)
    return res
  } catch (error) {
    throw error
  }
}

export const deleteApi = async (url) => {
  try {
    const res = await mainInstance.delete(url)
    return res
  } catch (error) {
    throw error
  }
}