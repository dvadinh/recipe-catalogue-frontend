import type {MediaResponse} from "../../../common";
import type {StepResponse} from "../../step";

export interface SectionResponse {
  id: number;
  title: string;
  number: number;
  description: string;
  media: MediaResponse | null;
  steps: StepResponse[];
}