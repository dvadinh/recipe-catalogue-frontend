export interface LinkedOAuth2AccountResponse {
    provider: string;
    accessTokenType: string | null;
    accessTokenScopes: string[];
}
