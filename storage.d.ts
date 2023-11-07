export interface TokensToStore {
    accessToken: string;
    idToken: string;
    refreshToken?: string;
    expireAt: Date;
}
export interface TokensFromStorage {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    expireAt?: Date;
    username: string;
}
export declare function storeTokens(tokens: TokensToStore): Promise<void>;
export declare function retrieveTokens(): Promise<TokensFromStorage | undefined>;
