import type {Authority} from "../../../common";

export interface PostUserRequest {
    username: string;
    password: string;
    displayName: string;
    description: string | null;
    type: Authority;
    enabled: boolean;
}
