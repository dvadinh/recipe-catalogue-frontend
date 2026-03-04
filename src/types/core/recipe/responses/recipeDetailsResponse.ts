import type {UserSummaryResponse} from "../../../auth";
import type {MediaResponse, RecipeAccessLevel} from "../../../common";
import type {SectionResponse} from "../../section";

export interface RecipeDetailsResponse {
  id: number;
  name: string;
  accessLevel: RecipeAccessLevel;
  description: string;
  lastUpdatedAt: string | null;
  owner: UserSummaryResponse;
  media: MediaResponse | null;
  sections: SectionResponse[];
}