export interface TokensFromSignIn {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expireAt: Date;
    username: string;
}
export interface TokensFromRefresh {
    accessToken: string;
    idToken: string;
    expireAt: Date;
    username: string;
}
export declare const busyState: readonly ["CHECKING_FOR_SIGNIN_LINK", "REQUESTING_SIGNIN_LINK", "SIGNING_IN_WITH_LINK", "STARTING_SIGN_IN_WITH_FIDO2", "COMPLETING_SIGN_IN_WITH_FIDO2", "SIGNING_IN_WITH_PASSWORD", "SIGNING_IN_WITH_OTP", "SIGNING_OUT"];
export type BusyState = (typeof busyState)[number];
declare const idleState: readonly ["NO_SIGNIN_LINK", "SIGNIN_LINK_REQUEST_FAILED", "SIGNIN_LINK_REQUESTED", "SIGNIN_LINK_EXPIRED", "INVALID_SIGNIN_LINK", "SIGNED_OUT", "SIGNED_IN_WITH_LINK", "SIGNED_IN_WITH_FIDO2", "SIGNED_IN_WITH_PASSWORD", "SIGNED_IN_WITH_OTP", "FIDO2_SIGNIN_FAILED", "SIGNIN_WITH_OTP_FAILED", "PASSWORD_SIGNIN_FAILED"];
export type IdleState = (typeof idleState)[number];
export {};
