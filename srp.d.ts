import { IdleState, BusyState, TokensFromSignIn } from "./model.js";
export declare function authenticateWithSRP({ username, password, smsMfaCode, newPassword, customChallengeAnswer, authflow, tokensCb, statusCb, clientMetadata, }: {
    /**
     * Username, or alias (e-mail, phone number)
     */
    username: string;
    password: string;
    smsMfaCode?: () => Promise<string>;
    newPassword?: () => Promise<string>;
    customChallengeAnswer?: () => Promise<string>;
    authflow?: "USER_SRP_AUTH" | "CUSTOM_AUTH";
    tokensCb?: (tokens: TokensFromSignIn) => void | Promise<void>;
    statusCb?: (status: BusyState | IdleState) => void;
    currentStatus?: BusyState | IdleState;
    clientMetadata?: Record<string, string>;
}): {
    signedIn: Promise<{
        idToken: string;
        accessToken: string;
        expireAt: Date;
        refreshToken: string;
        username: string;
    }>;
    abort: () => void;
};
