export interface LinkedOAuth2AccountResponse {
    provider: string;
    displayName: string | null;
    accessTokenType: string | null;
    accessTokenScopes: string[];
}
