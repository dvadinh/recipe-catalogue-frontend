import type {ApiErrorResponse} from "./apiErrorResponse";

export type ApiResult<T> =
    | { ok: true; status: number, data: T }
    | { ok: false; status: number, error: ApiErrorResponse };
