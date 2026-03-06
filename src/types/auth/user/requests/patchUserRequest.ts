import type {Authority, PatchRequestOperation} from "../../../common";

export interface PatchUserRequest {
    displayName: string | null;
    displayNameOperation: PatchRequestOperation | null;
    description: string | null;
    descriptionOperation: PatchRequestOperation | null;
    type: Authority | null;
    typeOperation: PatchRequestOperation | null;
    enabled: boolean | null;
    enabledOperation: PatchRequestOperation | null;
}
