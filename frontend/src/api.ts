import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { toast } from 'react-toastify';

import { Token } from './utils';

const BACKEND_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:4000/api';
const REQUEST_TIMEOUT = 5000;

export const createAPI = (): AxiosInstance => {
  const api = axios.create({
    baseURL: BACKEND_URL,
    timeout: REQUEST_TIMEOUT,
  });

  api.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      const token = Token.get();

      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    }
  );

  api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      toast.dismiss();
      const data = error.response?.data as {message?: string; error?: string} | undefined;
      toast.warn(data?.message ?? data?.error ?? error.message);

      return Promise.reject(error);
    }
  );

  return api;
};
