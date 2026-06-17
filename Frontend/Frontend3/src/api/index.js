import axios from "axios"
import { ErrToast } from "../ui/Toastify";
import { getInjectedStore } from "../redux/storeInjector";
import { setToken, clearToken } from "../redux/authSlice";

export const BaseURL = import.meta.env.VITE_API_URL || "https://reli.one/api"


// Создание axios экземпляра
export const mainInstance = axios.create({
  baseURL: BaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];
let networkToastShown = false;

/**
 * Сбрасывает module-level флаг networkToastShown.
 * Использовать только в тестах (beforeEach/afterEach).
 * @see docs/frontend/frontend3-audit.md FE-P1-005
 */
export function resetNetworkToastShown() {
  networkToastShown = false;
}

const readTokenFromLocalStorage = () => {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access ? parsed : null;
  } catch {
    return null;
  }
};

const readTokenFromStore = () => {
  const token = getInjectedStore()?.getState()?.auth?.token;
  return token?.access ? token : null;
};

/** JWT из localStorage `token` или redux-persist `auth` (fallback). */
export const resolveAuthToken = () => readTokenFromLocalStorage() || readTokenFromStore();

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};



// Добавление интерцептора запроса
mainInstance.interceptors.request.use(config => {
  const token = resolveAuthToken()?.access;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});



export const formDataInstance = axios.create({
  baseURL: BaseURL,
  headers: {
  },
});

formDataInstance.interceptors.request.use(config => {
  const token = resolveAuthToken()?.access;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});


export default mainInstance

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


const responseInterceptor = async (err) => {
  if (!axios.isAxiosError(err)) {
    return Promise.reject(err);
  }

  const originalRequest = err.config;

  // 🔁 401
  if (err.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    const parsedToken = resolveAuthToken();
    if (!parsedToken?.refresh) {
      return Promise.reject(err);
    }

    // ⏳ если refresh уже идёт — ждём
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${BaseURL}/accounts/token/refresh/`,
        { refresh: parsedToken.refresh }
      );

      const newToken = { ...parsedToken, access: data.access };
      localStorage.setItem("token", JSON.stringify(newToken));
      getInjectedStore()?.dispatch(setToken(newToken));

      processQueue(null, data.access);

      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return axios(originalRequest);

    } catch (refreshError) {
      processQueue(refreshError);

      // ❗️ТОСТ ТОЛЬКО ЗДЕСЬ И ОДИН
      ErrToast("Сессия истекла. Пожалуйста, войдите заново");

      localStorage.removeItem("token");
      getInjectedStore()?.dispatch(clearToken());
      // window.location.href = "/login";

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }

  // 🌐 Network error — НЕ для refresh
  if (
    (err.code === "ECONNABORTED" || err.message === "Network Error") &&
    !originalRequest?.url?.includes("token/refresh")
  ) {
    if (!networkToastShown) {
      networkToastShown = true;
      ErrToast("Network error. Check your internet connection");
    }
  }
  return Promise.reject(err);
};

const successInterceptor = (res) => {
  networkToastShown = false;
  return res;
};

mainInstance.interceptors.response.use(successInterceptor, responseInterceptor);
formDataInstance.interceptors.response.use(successInterceptor, responseInterceptor);

