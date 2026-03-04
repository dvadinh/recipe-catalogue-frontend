import axios, {AxiosError, type AxiosRequestConfig, type AxiosResponse} from "axios";
import type {ApiErrorResponse, ApiResult} from "../types";

const BACKEND_REST_API_BASE_URL = import.meta.env.VITE_BACKEND_REST_API_BASE_URL;
const IS_DEVELOPMENT_ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT === "dev";

const apiClient = axios.create({
    baseURL: BACKEND_REST_API_BASE_URL,
    withCredentials: true,
    timeout: 10000 // 10 second timeout
});

let onUnauthorized: ((errorId: string) => void | Promise<void>) | null = null;

export function registerUnauthorizedHandler(unauthorizedCallback: (errorId: string) => void | Promise<void>) {
    onUnauthorized = unauthorizedCallback;
}

export function clearUnauthorizedHandler() {
    onUnauthorized = null;
}

// Intercept responses: on 401, invoke the registered handler and then rethrow
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const requestUrl = error.config?.url || '';

            // Skip session expired dialog for auth endpoints (sign-in/sign-up)
            // These 401s are expected authentication failures, not session expiration
            const isAuthEndpoint = requestUrl.includes('/auth/basic/sign-in') ||
                                   requestUrl.includes('/auth/basic/sign-up') ||
                                   requestUrl.includes('/auth/oauth2/sign-in') ||
                                   requestUrl.includes('/auth/oauth2/sign-up');

            if (status === 401 && onUnauthorized && !isAuthEndpoint) {
                const errorId = error.response?.data?.errorId as string;
                try {
                    await onUnauthorized(errorId);
                } catch {
                    /* ignore */
                }
            }
        }

        return Promise.reject(error);
    }
);

export function extractApiError(error: unknown): ApiErrorResponse {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const data = axiosError.response?.data as {
            status?: number;
            errorId?: string;
            details?: unknown;
        } | undefined;

        let extractedDetails: string | Map<string, string>;
        if (data?.details && typeof data?.details === "object" && !Array.isArray(data?.details)) {
            extractedDetails = new Map(Object.entries(data?.details as Record<string, string>));
        } else if (typeof data?.details === "string") {
            extractedDetails = data?.details;
        } else {
            extractedDetails = "Error response unparsable";
        }

        return {
            status: data?.status ?? axiosError.response?.status ?? 0,
            errorId: data?.errorId ?? "ERROR_RESPONSE_UNPARSABLE",
            details: extractedDetails ?? axiosError.response?.data
        };
    }

    return {
        status: 0,
        errorId: "ERROR_RESPONSE_UNPARSABLE",
        details: "Error response unparsable",
    };
}

function successResult<T>(response: AxiosResponse<T>): ApiResult<T> {
    return {ok: true, status: response.status, data: response.data};
}

function errorResult<T>(error: unknown): ApiResult<T> {
    const apiErrorResponse: ApiErrorResponse = extractApiError(error);
    return {ok: false, status: apiErrorResponse.status, error: apiErrorResponse};
}

export async function axiosGet<T>(
    url: string,
    config?: AxiosRequestConfig
): Promise<ApiResult<T>> {
    try {
        const response = await apiClient.get<T>(url, config);
        return successResult(response);
    } catch (error) {
        return errorResult<T>(error);
    }
}

export async function axiosPost<TRequest, TResponse>(
    url: string,
    body: TRequest,
    config?: AxiosRequestConfig<TRequest>
): Promise<ApiResult<TResponse>> {
    try {
        if (IS_DEVELOPMENT_ENVIRONMENT) {
            console.log(`[POST] ${url}`, body);
        }
        const response = await apiClient.post<TResponse>(url, body, config);
        return successResult(response);
    } catch (error) {
        return errorResult<TResponse>(error);
    }
}

export async function axiosPatch<TRequest, TResponse>(
    url: string,
    body: TRequest,
    config?: AxiosRequestConfig<TRequest>
): Promise<ApiResult<TResponse>> {
    try {
        if (IS_DEVELOPMENT_ENVIRONMENT) {
            console.log(`[PATCH] ${url}`, body);
        }
        const response = await apiClient.patch<TResponse>(url, body, config);
        return successResult(response);
    } catch (error) {
        return errorResult<TResponse>(error);
    }
}

export async function axiosPut<TRequest, TResponse>(
    url: string,
    body: TRequest,
    config?: AxiosRequestConfig<TRequest>
): Promise<ApiResult<TResponse>> {
    try {
        if (IS_DEVELOPMENT_ENVIRONMENT) {
            console.log(`[PUT] ${url}`, body);
        }
        const response = await apiClient.put<TResponse>(url, body, config);
        return successResult(response);
    } catch (error) {
        return errorResult<TResponse>(error);
    }
}

export async function axiosDelete<TRequest, TResponse>(
    url: string,
    body: TRequest,
    config?: AxiosRequestConfig<TRequest>
): Promise<ApiResult<TResponse>> {
    try {
        if (IS_DEVELOPMENT_ENVIRONMENT) {
            console.log(`[DELETE] ${url}`, body);
        }
        const response = await apiClient.delete<TResponse>(url, {
            ...config,
            data: body,
        });
        return successResult(response);
    } catch (error) {
        return errorResult<TResponse>(error);
    }
}

export async function axiosPutMultipartFile<TResponse>(
    url: string,
    file: File,
    fieldName: string = 'media'
): Promise<ApiResult<TResponse>> {
    try {
        const formData = new FormData();
        formData.append(fieldName, file);

        if (IS_DEVELOPMENT_ENVIRONMENT) {
            console.log(`[PUT MULTIPART] ${url}`, { fieldName, fileName: file.name });
        }

        const response = await apiClient.put<TResponse>(url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return successResult(response);
    } catch (error) {
        return errorResult<TResponse>(error);
    }
}

export function constructBasicAuthorizationHeader(
    username: string,
    password: string
): string {
    const bytes = new TextEncoder().encode(`${username}:${password}`);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    return `Basic ${base64}`;
}
