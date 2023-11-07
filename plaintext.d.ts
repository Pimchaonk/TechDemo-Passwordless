import { IdleState, BusyState, TokensFromSignIn } from "./model.js";
export declare function authenticateWithPlaintextPassword({ username, password, smsMfaCode, newPassword, tokensCb, statusCb, clientMetadata, }: {
    /**
     * Username, or alias (e-mail, phone number)
     */
    username: string;
    password: string;
    smsMfaCode?: () => Promise<string>;
    newPassword?: () => Promise<string>;
    tokensCb?: (tokens: TokensFromSignIn) => void | Promise<void>;
    statusCb?: (status: BusyState | IdleState) => void;
    currentStatus?: BusyState | IdleState;
    clientMetadata?: Record<string, string>;
}): {
    signedIn: Promise<void>;
    abort: () => void;
};
