import type {UserSummaryResponse} from "../../../auth";
import type {RecipeSummaryResponse} from "../../recipe";

export interface BeneficiaryResponse {
    recipe: RecipeSummaryResponse;
    user: UserSummaryResponse;
}
