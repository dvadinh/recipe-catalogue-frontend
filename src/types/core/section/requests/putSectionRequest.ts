import type {PutStepRequest} from "../../step";

export interface PutSectionRequest {
  id: number | null;
  title: string;
  description: string;
  steps: PutStepRequest[];
}
