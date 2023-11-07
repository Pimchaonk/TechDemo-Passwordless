import { TokensFromRefresh } from "./model.js";
import { TokensFromStorage } from "./storage.js";
export declare function scheduleRefresh(...args: Parameters<typeof _scheduleRefresh>): Promise<(() => void) | undefined>;
type TokensForRefresh = Partial<Pick<TokensFromStorage, "refreshToken" | "expireAt" | "username">>;
declare function _scheduleRefresh({ abort, tokensCb, isRefreshingCb, }: {
    abort?: AbortSignal;
    tokensCb?: (res: TokensFromRefresh) => void | Promise<void>;
    isRefreshingCb?: (isRefreshing: boolean) => unknown;
}): Promise<(() => void) | undefined>;
export declare function refreshTokens(...args: Parameters<typeof _refreshTokens>): Promise<TokensFromRefresh>;
declare function _refreshTokens({ abort, tokensCb, isRefreshingCb, tokens, }: {
    abort?: AbortSignal;
    tokensCb?: (res: TokensFromRefresh) => void | Promise<void>;
    isRefreshingCb?: (isRefreshing: boolean) => unknown;
    tokens?: TokensForRefresh;
}): Promise<TokensFromRefresh>;
export {};
