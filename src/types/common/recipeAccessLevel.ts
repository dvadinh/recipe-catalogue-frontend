export const RecipeAccessLevel = {
    PUBLIC: "PUBLIC",
    PRIVATE: "PRIVATE"
} as const;

export type RecipeAccessLevel = typeof RecipeAccessLevel[keyof typeof RecipeAccessLevel];
