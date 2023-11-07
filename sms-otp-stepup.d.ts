import { IdleState, BusyState, TokensFromSignIn } from "./model.js";
export declare function stepUpAuthenticationWithSmsOtp({ username, smsMfaCode, tokensCb, statusCb, currentStatus, clientMetadata, }: {
    /**
     * Username, or alias (e-mail, phone number)
     */
    username: string;
    smsMfaCode: (phoneNumber: string, attempt: number) => Promise<string>;
    tokensCb?: (tokens: TokensFromSignIn) => void | Promise<void>;
    statusCb?: (status: BusyState | IdleState) => void;
    currentStatus?: BusyState | IdleState;
    clientMetadata?: Record<string, string>;
}): {
    signedIn: Promise<{
        accessToken: string;
        idToken: string;
        refreshToken: string;
        expireAt: Date;
        username: string;
    }>;
    abort: () => void;
};
