import type {PatchRequestOperation, RecipeAccessLevel} from "../../../common";

export interface PatchRecipeAccessLevelRequest {
  accessLevel: RecipeAccessLevel;
  accessLevelOperation: PatchRequestOperation
}
