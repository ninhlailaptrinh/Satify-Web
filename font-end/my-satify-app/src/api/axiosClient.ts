import axios from 'axios';
import type { AxiosRequestConfig ,  AxiosError } from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
    withCredentials: true
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v?: any) => void; reject: (e: any) => void; }> = [];

const processQueue = (err: any, token: string | null = null) => {
    failedQueue.forEach(p => (err ? p.reject(err) : p.resolve(token)));
    failedQueue = [];
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('satify_token');
    if (token && config.headers) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    res => res,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    if (originalRequest.headers) originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshRes = await api.post('/auth/refresh');
                const newToken = refreshRes.data.accessToken;
                localStorage.setItem('satify_token', newToken);
                processQueue(null, newToken);
                if (originalRequest.headers) originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                localStorage.removeItem('satify_token');
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
