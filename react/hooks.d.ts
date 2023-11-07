import { StoredCredential } from "../fido2.js";
import { TokensFromStorage } from "../storage.js";
import { CognitoAccessTokenPayload, CognitoIdTokenPayload } from "../jwt-model.js";
import React from "react";
/** React hook that provides convenient access to the Passwordless lib's features */
export declare function usePasswordless(): {
    /** The (raw) tokens: ID token, Access token and Refresh Token */
    tokens: TokensFromStorage | undefined;
    /** The JSON parsed ID and Access token */
    tokensParsed: {
        idToken: CognitoIdTokenPayload;
        accessToken: CognitoAccessTokenPayload;
        expireAt: Date;
    } | undefined;
    /** Is the UI currently refreshing tokens? */
    isRefreshingTokens: boolean | undefined;
    /** Execute (and reschedule) token refresh */
    refreshTokens: (abort?: AbortSignal | undefined) => Promise<import("../model.js").TokensFromRefresh>;
    /** Last error that occured */
    lastError: Error | undefined;
    /** The status of the most recent sign-in attempt */
    signingInStatus: "CHECKING_FOR_SIGNIN_LINK" | "REQUESTING_SIGNIN_LINK" | "SIGNING_IN_WITH_LINK" | "STARTING_SIGN_IN_WITH_FIDO2" | "COMPLETING_SIGN_IN_WITH_FIDO2" | "SIGNING_IN_WITH_PASSWORD" | "SIGNING_IN_WITH_OTP" | "SIGNING_OUT" | "NO_SIGNIN_LINK" | "SIGNIN_LINK_REQUEST_FAILED" | "SIGNIN_LINK_REQUESTED" | "SIGNIN_LINK_EXPIRED" | "INVALID_SIGNIN_LINK" | "SIGNED_OUT" | "SIGNED_IN_WITH_LINK" | "SIGNED_IN_WITH_FIDO2" | "SIGNED_IN_WITH_PASSWORD" | "SIGNED_IN_WITH_OTP" | "FIDO2_SIGNIN_FAILED" | "SIGNIN_WITH_OTP_FAILED" | "PASSWORD_SIGNIN_FAILED";
    /** Are we currently busy signing in or out? */
    busy: boolean;
    /**
     * The overall auth status, e.g. is the user signed in or not?
     * Use this field to show the relevant UI, e.g. render a sign-in page,
     * if the status equals "NOT_SIGNED_IN"
     */
    signInStatus: "SIGNING_OUT" | "SIGNED_IN" | "REFRESHING_SIGN_IN" | "SIGNING_IN" | "CHECKING" | "NOT_SIGNED_IN";
    /** Is a user verifying platform authenticator available? E.g. Face ID or Touch */
    userVerifyingPlatformAuthenticatorAvailable: boolean | undefined;
    /** The user's registered FIDO2 credentials. Each credential provides `update` and `delete` methods */
    fido2Credentials: Fido2Credential[] | undefined;
    /** Are we currently creating a FIDO2 credential? */
    creatingCredential: boolean;
    /** Register a FIDO2 credential with the Relying Party */
    fido2CreateCredential: (args_0: {
        friendlyName: string | (() => string | Promise<string>);
    }) => Promise<StoredCredential>;
    /** Sign out */
    signOut: () => {
        signedOut: Promise<void>;
        abort: () => void;
    };
    /** Request a sign-in link ("magic link") to be sent to the user's e-mail address */
    requestSignInLink: ({ username, redirectUri, }: {
        username: string;
        redirectUri?: string | undefined;
    }) => {
        signInLinkRequested: Promise<string>;
        abort: () => void;
    };
    /** Sign in with FIDO2 (e.g. Face ID or Touch) */
    authenticateWithFido2: ({ username, credentials, clientMetadata, }?: {
        /**
         * Username, or alias (e-mail, phone number)
         */
        username?: string | undefined;
        credentials?: {
            id: string;
            transports?: AuthenticatorTransport[] | undefined;
        }[] | undefined;
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
    /** Sign in with username and password (using SRP: Secure Remote Password, where the password isn't sent over the wire) */
    authenticateWithSRP: ({ username, password, smsMfaCode, clientMetadata, }: {
        /**
         * Username, or alias (e-mail, phone number)
         */
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
    /** Sign in with username and password (the password is sent in plaintext over the wire) */
    authenticateWithPlaintextPassword: ({ username, password, smsMfaCode, clientMetadata, }: {
        /**
         * Username, or alias (e-mail, phone number)
         */
        username: string;
        password: string;
        smsMfaCode?: (() => Promise<string>) | undefined;
        clientMetadata?: Record<string, string> | undefined;
    }) => {
        signedIn: Promise<void>;
        abort: () => void;
    };
    /** Sign-in again, using the user's current tokens (JWTs) and an OTP (One Time Password) that is sent to the user via SMS */
    stepUpAuthenticationWithSmsOtp: ({ username, smsMfaCode, clientMetadata, }: {
        /**
         * Username, or alias (e-mail, phone number)
         */
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
    /** Should the FIDO2 credential manager UI component be shown? */
    showAuthenticatorManager: boolean;
    /** Toggle showing the FIDO2 credential manager UI component */
    toggleShowAuthenticatorManager: () => void;
};
/** React hook that stores and gives access to the last 10 signed in users (from your configured storage) */
export declare function useLocalUserCache(): {
    /** The current signed-in user */
    currentUser: StoredUser | undefined;
    /** Update the current user's FIDO2 preference */
    updateFidoPreference: ({ useFido }: {
        useFido: "YES" | "NO";
    }) => void;
    /** The list of the 10 last signed-in users in your configured storage (e.g. localStorage) */
    lastSignedInUsers: StoredUser[] | undefined;
    /** Clear the last signed in users from your configured storage (e.g. localStorage) */
    clearLastSignedInUsers: () => void;
};
export declare const PasswordlessContextProvider: (props: {
    children: React.ReactNode;
    enableLocalUserCache?: boolean;
}) => JSX.Element;
/** A FIDO2 credential (e.g. Face ID or Touch), with convenient methods for updating and deleting */
type Fido2Credential = StoredCredential & {
    /** Update the friendly name of the credential */
    update: (update: {
        friendlyName: string;
    }) => Promise<void>;
    /** Delete the credential */
    delete: () => Promise<void>;
    /** The credential is currently being updated or deleted */
    busy: boolean;
};
/** User Details stored in your configured storage (e.g. localStorage) */
type StoredUser = {
    username: string;
    email?: string;
    useFido?: "YES" | "NO" | "ASK";
    credentials?: {
        id: string;
        transports?: AuthenticatorTransport[];
    }[];
};
/** React hook to turn state (or any variable) into a promise that can be awaited */
export declare function useAwaitableState<T>(state: T): {
    /** Call to get the current awaitable (promise) */
    awaitable: () => Promise<T>;
    /** Resolve the current awaitable (promise) with the current value of state */
    resolve: () => void;
    /** Reject the current awaitable (promise) */
    reject: (reason: Error) => void;
    /** That value of awaitable (promise) once it resolves. This is undefined if (1) awaitable is not yet resolved or (2) the state has changed since awaitable was resolved */
    awaited: {
        value: T;
    } | undefined;
};
export {};
