import type {Authority} from "../../../common";

export interface UserDetailsResponse {
    id: number;
    username: string;
    displayName: string;
    description: string | null;
    type: Authority;
    enabled: boolean;
}
