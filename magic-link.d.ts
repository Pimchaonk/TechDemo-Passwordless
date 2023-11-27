import { IdleState, BusyState, TokensFromSignIn } from "./model.js";
import { Session } from "./cognito-api.js";
export declare const requestSignInLink: ({ username, redirectUri, currentStatus, statusCb, }: {
    /**
     * Username, or alias (e-mail, phone number)
     */
    username: string;
    redirectUri?: string | undefined;
    currentStatus?: "CHECKING_FOR_SIGNIN_LINK" | "REQUESTING_SIGNIN_LINK" | "SIGNING_IN_WITH_LINK" | "STARTING_SIGN_IN_WITH_FIDO2" | "COMPLETING_SIGN_IN_WITH_FIDO2" | "SIGNING_IN_WITH_PASSWORD" | "SIGNING_IN_WITH_OTP" | "SIGNING_OUT" | "NO_SIGNIN_LINK" | "SIGNIN_LINK_REQUEST_FAILED" | "SIGNIN_LINK_REQUESTED" | "SIGNIN_LINK_EXPIRED" | "INVALID_SIGNIN_LINK" | "SIGNED_OUT" | "SIGNED_IN_WITH_LINK" | "SIGNED_IN_WITH_FIDO2" | "SIGNED_IN_WITH_PASSWORD" | "SIGNED_IN_WITH_OTP" | "FIDO2_SIGNIN_FAILED" | "SIGNIN_WITH_OTP_FAILED" | "PASSWORD_SIGNIN_FAILED" | undefined;
    statusCb?: ((status: BusyState | IdleState) => void) | undefined;
}) => {
    signInLinkRequested: Promise<string>;
    abort: () => void;
};
export declare const signInWithLink: (props?: {
    session?: string | undefined;
    tokensCb?: ((tokens: TokensFromSignIn) => void | Promise<void>) | undefined;
    statusCb?: ((status: BusyState | IdleState) => void) | undefined;
} | undefined) => {
    signedIn: Promise<TokensFromSignIn | undefined>;
    abort: () => void;
};
