import type {MediaResponse} from "../../../common";

export interface StepResponse {
  id: number;
  title: string;
  number: number;
  description: string;
  media: MediaResponse | null;
}
