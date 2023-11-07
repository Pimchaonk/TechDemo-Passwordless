/// <reference types="node" />
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
import { VerifyAuthChallengeResponseTriggerEvent, CreateAuthChallengeTriggerEvent } from "aws-lambda";
import { JsonWebKey } from "crypto";
interface StoredCredential {
    id: string;
    transports?: string[];
    jwk: JsonWebKey;
    signCount: number;
    flagBackupEligibility: 0 | 1;
}
declare let config: {
    /** Should FIDO2 sign-in be enabled? If set to false, clients cannot sign-in with FIDO2 (a FIDO2 challenge to sign is not sent to them) */
    fido2enabled: boolean;
    /** The DynamoDB table with FIDO2 credentials */
    dynamoDbAuthenticatorsTableName: string | undefined;
    /** The set of allowed origins thay may initiate FIDO2 sign-in */
    allowedOrigins: string[] | undefined;
    /** The set of Relying Party IDs thay may initiate FIDO2 sign-in */
    allowedRelyingPartyIds: string[] | undefined;
    /** The Relying Party ID to use (optional, if not set user agents will use the current domain) */
    relyingPartyId: string | undefined;
    /** The WebAuthn user verification requirement to enforce ("discouraged" | "preferred" | "required") */
    userVerification: UserVerificationRequirement;
    /** Expose credential IDs to users signing in? If you want users to use non-discoverable credentials you should set this to true */
    exposeUserCredentialIds: boolean;
    /** Function to generate FIDO2 challenges that user's authenticators must sign. Override to e.g. implement transaction signing */
    challengeGenerator: () => Promise<string> | string;
    /** Timeout for the sign-in attempt (per WebAuthn standard) */
    timeout: number;
    /** Should users having a registered FIDO2 credential be forced to use that for signing in? If true, other custom auth flows, such as Magic Link sign-in, will be denied for users having FIDO2 credentials––to protect them from phishing */
    enforceFido2IfAvailable: boolean;
    /** Salt to use for storing hashed FIDO2 credential data */
    salt: string | undefined;
};
export declare function configure(update?: Partial<typeof config>): {
    /** Should FIDO2 sign-in be enabled? If set to false, clients cannot sign-in with FIDO2 (a FIDO2 challenge to sign is not sent to them) */
    fido2enabled: boolean;
    /** The DynamoDB table with FIDO2 credentials */
    dynamoDbAuthenticatorsTableName: string | undefined;
    /** The set of allowed origins thay may initiate FIDO2 sign-in */
    allowedOrigins: string[] | undefined;
    /** The set of Relying Party IDs thay may initiate FIDO2 sign-in */
    allowedRelyingPartyIds: string[] | undefined;
    /** The Relying Party ID to use (optional, if not set user agents will use the current domain) */
    relyingPartyId: string | undefined;
    /** The WebAuthn user verification requirement to enforce ("discouraged" | "preferred" | "required") */
    userVerification: UserVerificationRequirement;
    /** Expose credential IDs to users signing in? If you want users to use non-discoverable credentials you should set this to true */
    exposeUserCredentialIds: boolean;
    /** Function to generate FIDO2 challenges that user's authenticators must sign. Override to e.g. implement transaction signing */
    challengeGenerator: () => string | Promise<string>;
    /** Timeout for the sign-in attempt (per WebAuthn standard) */
    timeout: number;
    /** Should users having a registered FIDO2 credential be forced to use that for signing in? If true, other custom auth flows, such as Magic Link sign-in, will be denied for users having FIDO2 credentials––to protect them from phishing */
    enforceFido2IfAvailable: boolean;
    /** Salt to use for storing hashed FIDO2 credential data */
    salt: string | undefined;
};
export declare function addChallengeToEvent(event: CreateAuthChallengeTriggerEvent): Promise<void>;
export declare function createChallenge({ userId, relyingPartyId, exposeUserCredentialIds, challengeGenerator, userVerification, credentialGetter, timeout, userNotFound, }: {
    userId?: string;
    relyingPartyId?: string;
    exposeUserCredentialIds?: boolean;
    challengeGenerator?: () => Promise<string> | string;
    userVerification?: UserVerificationRequirement;
    credentialGetter?: typeof getCredentialsForUser;
    timeout?: number;
    userNotFound?: boolean;
}): Promise<{
    relyingPartyId: string | undefined;
    challenge: string;
    credentials: Omit<StoredCredential, "jwk" | "signCount" | "flagBackupEligibility">[] | undefined;
    timeout: number;
    userVerification: UserVerificationRequirement;
}>;
export declare function addChallengeVerificationResultToEvent(event: VerifyAuthChallengeResponseTriggerEvent): Promise<void>;
interface SerializedAuthenticatorAssertion {
    credentialIdB64: string;
    authenticatorDataB64: string;
    clientDataJSON_B64: string;
    signatureB64: string;
    userHandleB64?: string;
}
export declare function verifyChallenge({ userId, fido2options, authenticatorAssertion: { credentialIdB64, authenticatorDataB64, clientDataJSON_B64, signatureB64, userHandleB64, }, credentialGetter, credentialUpdater, }: {
    userId: string;
    fido2options: {
        challenge: string;
        credentials?: StoredCredential[];
        userVerification: UserVerificationRequirement;
    };
    authenticatorAssertion: SerializedAuthenticatorAssertion;
    credentialGetter?: typeof getCredentialForUser;
    credentialUpdater?: typeof updateCredential;
}): Promise<void>;
declare function getCredentialsForUser({ userId, limit, }: {
    userId: string;
    limit?: number;
}): Promise<Omit<StoredCredential, "jwk" | "signCount" | "flagBackupEligibility">[]>;
declare function getCredentialForUser({ userId, credentialId, }: {
    userId: string;
    credentialId: string;
}): Promise<StoredCredential | undefined>;
declare function updateCredential({ userId, credentialId, signCount, flagBackupState, }: {
    userId: string;
    credentialId: string;
    signCount: number;
    flagBackupState: 0 | 1;
}): Promise<void>;
export declare function assertFido2SignInOptional(event: VerifyAuthChallengeResponseTriggerEvent): Promise<void>;
export {};
