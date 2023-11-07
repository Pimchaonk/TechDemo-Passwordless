import { TokensFromRefresh, TokensFromSignIn, BusyState, IdleState } from "./model.js";
/** The default tokens callback stores tokens in storage and reschedules token refresh */
export declare const defaultTokensCb: ({ tokens, abort, }: {
    tokens: TokensFromSignIn | TokensFromRefresh;
    abort?: AbortSignal | undefined;
}) => Promise<void>;
/**
 * Sign the user out. This means: clear tokens from storage,
 * and revoke the refresh token from Amazon Cognito
 */
export declare const signOut: (props?: {
    currentStatus?: "CHECKING_FOR_SIGNIN_LINK" | "REQUESTING_SIGNIN_LINK" | "SIGNING_IN_WITH_LINK" | "STARTING_SIGN_IN_WITH_FIDO2" | "COMPLETING_SIGN_IN_WITH_FIDO2" | "SIGNING_IN_WITH_PASSWORD" | "SIGNING_IN_WITH_OTP" | "SIGNING_OUT" | "NO_SIGNIN_LINK" | "SIGNIN_LINK_REQUEST_FAILED" | "SIGNIN_LINK_REQUESTED" | "SIGNIN_LINK_EXPIRED" | "INVALID_SIGNIN_LINK" | "SIGNED_OUT" | "SIGNED_IN_WITH_LINK" | "SIGNED_IN_WITH_FIDO2" | "SIGNED_IN_WITH_PASSWORD" | "SIGNED_IN_WITH_OTP" | "FIDO2_SIGNIN_FAILED" | "SIGNIN_WITH_OTP_FAILED" | "PASSWORD_SIGNIN_FAILED" | undefined;
    tokensRemovedLocallyCb?: (() => void) | undefined;
    statusCb?: ((status: BusyState | IdleState) => void) | undefined;
} | undefined) => {
    signedOut: Promise<void>;
    abort: () => void;
};
