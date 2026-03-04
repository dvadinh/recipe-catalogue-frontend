import type {PutSectionRequest} from "../../section";

export interface PutRecipeRequest {
  name: string;
  description: string;
  sections: PutSectionRequest[];
}