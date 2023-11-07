/**
 * Copyright Amazon.com, Inc. and its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You
 * may not use this file except in compliance with the License. A copy of
 * the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 */
import { IdleState, BusyState, TokensFromSignIn } from "./model.js";
export interface StoredCredential {
    credentialId: string;
    friendlyName: string;
    createdAt: Date;
    lastSignIn?: Date;
    signCount: number;
    transports?: AuthenticatorTransport[];
}
export declare function fido2CreateCredential({ friendlyName, }: {
    friendlyName: string | (() => string | Promise<string>);
}): Promise<StoredCredential>;
interface StartCreateCredentialResponse {
    challenge: string;
    attestation: "none";
    rp: {
        name: string;
        id?: string;
    };
    user: {
        id: string;
        name: string;
        displayName: string;
    };
    pubKeyCredParams: {
        type: "public-key";
        alg: -7 | -257;
    }[];
    authenticatorSelection: {
        userVerification: UserVerificationRequirement;
    };
    timeout: number;
    excludeCredentials: {
        id: string;
        type: "public-key";
    }[];
}
export interface ParsedCredential {
    clientDataJSON_B64: string;
    attestationObjectB64: string;
    transports?: string[];
}
export declare function fido2StartCreateCredential(): Promise<StartCreateCredentialResponse>;
export declare function fido2CompleteCreateCredential({ credential, friendlyName, }: {
    credential: PublicKeyCredential | ParsedCredential;
    friendlyName: string;
}): Promise<StoredCredential>;
export declare function fido2ListCredentials(): Promise<{
    authenticators: {
        createdAt: Date;
        lastSignIn: Date | undefined;
        friendlyName: string;
        credentialId: string;
        signCount: number;
    }[];
}>;
export declare function fido2DeleteCredential({ credentialId, }: {
    credentialId: string;
}): Promise<import("./config.js").MinimalResponse>;
export declare function fido2UpdateCredential({ credentialId, friendlyName, }: {
    credentialId: string;
    friendlyName: string;
}): Promise<import("./config.js").MinimalResponse>;
interface Fido2Options {
    challenge: string;
    timeout?: number;
    userVerification?: UserVerificationRequirement;
    relyingPartyId?: string;
    credentials?: {
        id: string;
        transports?: AuthenticatorTransport[];
    }[];
}
declare function fido2getCredential({ relyingPartyId, challenge, credentials, timeout, userVerification, }: Fido2Options): Promise<{
    credentialIdB64: string;
    authenticatorDataB64: string;
    clientDataJSON_B64: string;
    signatureB64: string;
    userHandleB64: string | null;
}>;
export declare function authenticateWithFido2({ username, credentials, tokensCb, statusCb, currentStatus, clientMetadata, credentialGetter, }: {
    /**
     * Username, or alias (e-mail, phone number)
     * If not specified, sign in with FIDO2 Passkey (discoverable credential) will be attempted
     */
    username?: string;
    /**
     * The FIDO2 credentials to use.
     * Must be specified for non-discoverable credentials to work, optional for Passkeys (discoverable credentials).
     * Ignored if username is not specified, to force the user agent to look for Passkeys (discoverable credentials).
     */
    credentials?: {
        id: string;
        transports?: AuthenticatorTransport[];
    }[];
    tokensCb?: (tokens: TokensFromSignIn) => void | Promise<void>;
    statusCb?: (status: BusyState | IdleState) => void;
    currentStatus?: BusyState | IdleState;
    clientMetadata?: Record<string, string>;
    credentialGetter?: typeof fido2getCredential;
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
export {};
