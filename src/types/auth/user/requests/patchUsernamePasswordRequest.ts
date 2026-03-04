import type {PatchRequestOperation} from "../../../common";

export interface PatchUsernamePasswordRequest {
    id: number;
    username: string | null ;
    usernameOperation: PatchRequestOperation | null;
    password: string | null;
    passwordOperation: PatchRequestOperation | null;
}
