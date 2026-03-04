import type {Authority, PatchRequestOperation} from "../../../common";

export interface PatchUserRequest {
    displayName: string | null;
    displayNameOperation: PatchRequestOperation | null;
    firstName: string | null;
    firstNameOperation: PatchRequestOperation | null;
    lastName: string | null;
    lastNameOperation: PatchRequestOperation | null;
    emailAddress: string | null;
    emailAddressOperation: PatchRequestOperation | null;
    description: string | null;
    descriptionOperation: PatchRequestOperation | null;
    type: Authority | null;
    typeOperation: PatchRequestOperation | null;
    enabled: boolean | null;
    enabledOperation: PatchRequestOperation | null;
}
