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
interface Headers {
    [key: string]: string;
}
export interface Config {
    /**
     * The Amazon Cognito IDP endpoint.
     * Either provide just the region, e.g. "eu-west-1",
     * or provide a full URL (e.g. if you are using a proxy API)
     */
    cognitoIdpEndpoint: string;
    /** The Amazon Cognito Client ID */
    clientId: string;
    /** The Amazon Cognito Client Secret (optional: don't use this in Web clients, use when running server side) */
    clientSecret?: string;
    /** The Amazon Cognito User Pool ID */
    userPoolId?: string;
    /** FIDO2 (WebAuthn) configuration */
    fido2?: {
        /** The base URL (i.e. the URL with path "/") of your FIDO2 API */
        baseUrl: string;
        /**
         * FIDO2 authenticator selection criteria:
         *
         * - authenticatorAttachment: platform, or cross-platform
         * - residentKey (aka Passkey, discoverable credential): discouraged, preferred, or required
         * - userVerification: discouraged, preferred, or required
         */
        authenticatorSelection?: AuthenticatorSelectionCriteria;
        /** Configuration of the Relying Party */
        rp?: {
            name?: string;
            id?: string;
        };
        /** FIDO2 Attestation Conveyance Preference you want to use */
        attestation?: AttestationConveyancePreference;
        /** FIDO2 extensions you want to use */
        extensions?: AuthenticationExtensionsClientInputs;
        /**
         * FIDO2 timeout. This sets the timeout for native FIDO dialogs,
         * i.e. when creating a new credential and when signing in
         */
        timeout?: number;
    };
    /**
     * Function that will be called with debug information,
     * e.g. you can use `console.debug` here.
     */
    debug?: (...args: unknown[]) => unknown;
    /** The storage object to use. E.g. `localStorage` */
    storage?: CustomStorage;
    /**
     * If you use a custom proxy in front of Amazon Cognito,
     * you may want to pass additional HTTP headers.
     */
    proxyApiHeaders?: Headers;
    /**
     * Overriding fetch implementation. Default: globalThis.fetch
     */
    fetch?: MinimalFetch;
    /**
     * Overriding crypto implementation. Default: globalThis.crypto
     */
    crypto?: MinimalCrypto;
    /**
     * Overriding location implementation. Default: globalThis.location
     */
    location?: MinimalLocation;
    /**
     * Overriding history implementation. Default: globalThis.history
     */
    history?: MinimalHistory;
}
export type ConfigWithDefaults = Config & Required<Pick<Config, "storage" | "crypto" | "fetch" | "location" | "history">>;
export declare function configure(config?: Config): ConfigWithDefaults;
type Maybe<T> = T | undefined | null;
export interface CustomStorage {
    getItem: (key: string) => Maybe<string> | Promise<Maybe<string>>;
    setItem: (key: string, value: string) => void | Promise<void>;
    removeItem: (key: string) => void | Promise<void>;
}
export declare function configureFromAmplify(amplifyConfig: AmplifyAuthConfig | AmplifyConfig): {
    with: (config: Omit<Config, "cognitoIdpEndpoint" | "userPoolId" | "clientId">) => ConfigWithDefaults;
};
interface AmplifyAuthConfig {
    region?: unknown;
    userPoolId?: unknown;
    userPoolWebClientId?: unknown;
}
interface AmplifyConfig {
    Auth: AmplifyAuthConfig;
}
export declare class UndefinedGlobalVariableError extends Error {
}
export interface MinimalResponse {
    ok: boolean;
    json: () => Promise<unknown>;
}
export interface MinimalLocation {
    href: string;
    hostname: string;
}
export type MinimalFetch = (input: string | URL, init?: {
    signal?: AbortSignal;
    headers?: Record<string, string>;
    method?: string;
    body?: string;
} | undefined) => Promise<MinimalResponse>;
export interface MinimalHistory {
    pushState(data: unknown, unused: string, url?: string | URL | null): void;
}
export interface MinimalCrypto {
    getRandomValues: Crypto["getRandomValues"];
    subtle: {
        digest: Crypto["subtle"]["digest"];
        importKey: Crypto["subtle"]["importKey"];
        sign: Crypto["subtle"]["sign"];
    };
}
export {};
