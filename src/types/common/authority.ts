export const Authority = {
    ADMIN: "ADMIN",
    USER: "USER"
} as const;

export type Authority = typeof Authority[keyof typeof Authority];
