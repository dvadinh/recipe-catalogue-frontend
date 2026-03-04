import type {RecipeAccessLevel} from "../../../common";

export interface RecipeSummaryResponse {
    id: number;
    name: string;
    accessLevel: RecipeAccessLevel;
}
