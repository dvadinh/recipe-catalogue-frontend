export const PatchRequestOperation = {
    UPDATE: "UPDATE",
    CLEAR: "CLEAR",
} as const;

export type PatchRequestOperation = typeof PatchRequestOperation[keyof typeof PatchRequestOperation];
