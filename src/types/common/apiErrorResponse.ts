export interface ApiErrorResponse {
    status: number;
    errorId: string;
    details: string | Map<string, string>;
}

export const ApiErrorId = {
    JWT_ACCESS_TOKEN_NOT_FOUND_001: "JWT_ACCESS_TOKEN_NOT_FOUND_001",
    INVALID_JWT_ACCESS_TOKEN_002: "INVALID_JWT_ACCESS_TOKEN_002",
    INVALID_JWT_ACCESS_TOKEN_003: "INVALID_JWT_ACCESS_TOKEN_003",
    USER_NOT_ENABLED_001: "USER_NOT_ENABLED_001"
} as const;

export type ApiErrorId = typeof ApiErrorId[keyof typeof ApiErrorId];

