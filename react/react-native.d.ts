import { fido2ListCredentials, fido2UpdateCredential, fido2DeleteCredential } from "../fido2.js";
import { Config, ConfigWithDefaults } from "../config.js";
import { retrieveTokens } from "../storage.js";
export { fido2ListCredentials, fido2UpdateCredential, fido2DeleteCredential, retrieveTokens, };
export { initiateAuth, signUp, respondToAuthChallenge, updateUserAttributes, verifyUserAttribute, getUserAttributeVerificationCode, } from "../cognito-api.js";
export { authenticateWithPlaintextPassword } from "../plaintext.js";
import { PasswordlessContextProvider } from "./hooks.js";
export { PasswordlessContextProvider };
export declare function usePasswordless(): {
    authenticateWithFido2: typeof loginWithFido2;
    fido2CreateCredential: typeof fido2CreateCredential;
    tokens: import("../storage.js").TokensFromStorage | undefined;
    tokensParsed: {
        idToken: import("../jwt-model.js").CognitoIdTokenPayload;
        accessToken: import("../jwt-model.js").CognitoAccessTokenPayload;
        expireAt: Date;
    } | undefined;
    isRefreshingTokens: boolean | undefined;
    refreshTokens: (abort?: AbortSignal | undefined) => Promise<import("../model.js").TokensFromRefresh>;
    lastError: Error | undefined;
    signingInStatus: "CHECKING_FOR_SIGNIN_LINK" | "REQUESTING_SIGNIN_LINK" | "SIGNING_IN_WITH_LINK" | "STARTING_SIGN_IN_WITH_FIDO2" | "COMPLETING_SIGN_IN_WITH_FIDO2" | "SIGNING_IN_WITH_PASSWORD" | "SIGNING_IN_WITH_OTP" | "SIGNING_OUT" | "NO_SIGNIN_LINK" | "SIGNIN_LINK_REQUEST_FAILED" | "SIGNIN_LINK_REQUESTED" | "SIGNIN_LINK_EXPIRED" | "INVALID_SIGNIN_LINK" | "SIGNED_OUT" | "SIGNED_IN_WITH_LINK" | "SIGNED_IN_WITH_FIDO2" | "SIGNED_IN_WITH_PASSWORD" | "SIGNED_IN_WITH_OTP" | "FIDO2_SIGNIN_FAILED" | "SIGNIN_WITH_OTP_FAILED" | "PASSWORD_SIGNIN_FAILED";
    busy: boolean;
    signInStatus: "SIGNING_OUT" | "SIGNED_IN" | "REFRESHING_SIGN_IN" | "SIGNING_IN" | "CHECKING" | "NOT_SIGNED_IN";
    userVerifyingPlatformAuthenticatorAvailable: boolean | undefined;
    fido2Credentials: (import("../fido2.js").StoredCredential & {
        update: (update: {
            friendlyName: string;
        }) => Promise<void>;
        delete: () => Promise<void>;
        busy: boolean;
    })[] | undefined;
    creatingCredential: boolean;
    signOut: () => {
        signedOut: Promise<void>;
        abort: () => void;
    };
    requestSignInLink: ({ username, redirectUri, }: {
        username: string;
        redirectUri?: string | undefined;
    }) => {
        signInLinkRequested: Promise<string>;
        abort: () => void;
    };
    authenticateWithSRP: ({ username, password, smsMfaCode, clientMetadata, }: {
        username: string;
        password: string;
        smsMfaCode?: (() => Promise<string>) | undefined;
        clientMetadata?: Record<string, string> | undefined;
    }) => {
        signedIn: Promise<{
            idToken: string;
            accessToken: string;
            expireAt: Date;
            refreshToken: string;
            username: string;
        }>;
        abort: () => void;
    };
    authenticateWithPlaintextPassword: ({ username, password, smsMfaCode, clientMetadata, }: {
        username: string;
        password: string;
        smsMfaCode?: (() => Promise<string>) | undefined;
        clientMetadata?: Record<string, string> | undefined;
    }) => {
        signedIn: Promise<void>;
        abort: () => void;
    };
    stepUpAuthenticationWithSmsOtp: ({ username, smsMfaCode, clientMetadata, }: {
        username: string;
        smsMfaCode: (phoneNumber: string, attempt: number) => Promise<string>;
        clientMetadata?: Record<string, string> | undefined;
    }) => {
        signedIn: Promise<{
            accessToken: string;
            idToken: string;
            refreshToken: string;
            expireAt: Date;
            username: string;
        }>;
        abort: () => void;
    };
    showAuthenticatorManager: boolean;
    toggleShowAuthenticatorManager: () => void;
};
interface PasskeyConfig {
    fido2: {
        /**
         * React Native Passkey Domain. Used by iOS and Android to link your app's passkeys to your domain
         * That domain must serve the mandatory manifest json required by Apple and Google under the following paths:
         * - iOS: https://<your_passkey_domain>/.well-known/apple-app-site-association
         * - Android: https://<your_passkey_domain>/.well-known/assetlinks.json
         * More info:
         * - iOS: https://developer.apple.com/documentation/xcode/supporting-associated-domains
         * - Android: https://developer.android.com/training/sign-in/passkeys#add-support-dal
         */
        passkeyDomain: string;
        rp?: {
            id?: string;
            name?: string;
        };
    };
}
export type ReactNativeConfig = Config & Partial<PasskeyConfig>;
export type ReactNativeConfigWithDefaults = ConfigWithDefaults & {
    fido2: {
        passkeyDomain: string;
        rp: {
            id: string;
            name: string;
        };
    };
};
declare function configure(config?: ReactNativeConfig): ReactNativeConfigWithDefaults;
export declare const Passwordless: {
    configure: typeof configure;
};
export declare const toBase64String: (base64Url: string) => string;
export declare function fido2CreateCredential({ friendlyName, }: {
    friendlyName: string;
}): Promise<import("../fido2.js").StoredCredential>;
export declare function fido2GetCredential({ challenge, username, }: {
    challenge: string;
    /**
     * Display name for the user
     */
    username: string;
}): Promise<{
    credentialIdB64: string;
    authenticatorDataB64: string;
    clientDataJSON_B64: string;
    signatureB64: string;
    userHandleB64: null;
}>;
export declare function loginWithFido2({ username, }: {
    /**
     * Username, or alias (e-mail, phone number)
     */
    username: string;
}): Promise<{
    signedIn: Promise<{
        accessToken: string;
        idToken: string;
        refreshToken: string;
        expireAt: Date;
        username: string;
    }>;
    abort: () => void;
}>;
export declare function getAccountDetails(): Promise<{}>;
export declare const timeAgo: (now: number, date: Date) => string | undefined;
