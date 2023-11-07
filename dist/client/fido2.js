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
import { busyState } from "./model.js";
import { defaultTokensCb } from "./common.js";
import { assertIsChallengeResponse, assertIsAuthenticatedResponse, initiateAuth, respondToAuthChallenge, } from "./cognito-api.js";
import { parseJwtPayload, throwIfNot2xx, bufferFromBase64Url, bufferToBase64Url, } from "./util.js";
import { configure } from "./config.js";
import { retrieveTokens } from "./storage.js";
export async function fido2CreateCredential({ friendlyName, }) {
    const { debug, fido2 } = configure();
    const publicKeyOptions = await fido2StartCreateCredential();
    const publicKey = {
        ...publicKeyOptions,
        rp: {
            name: fido2?.rp?.name ?? publicKeyOptions.rp.name,
            id: fido2?.rp?.id ?? publicKeyOptions.rp.id,
        },
        attestation: fido2?.attestation,
        authenticatorSelection: publicKeyOptions.authenticatorSelection ?? fido2?.authenticatorSelection,
        extensions: fido2?.extensions,
        timeout: publicKeyOptions.timeout ?? fido2?.timeout,
        challenge: bufferFromBase64Url(publicKeyOptions.challenge),
        user: {
            ...publicKeyOptions.user,
            id: Uint8Array.from(publicKeyOptions.user.id, (c) => c.charCodeAt(0)),
        },
        excludeCredentials: publicKeyOptions.excludeCredentials.map((credential) => ({
            ...credential,
            id: bufferFromBase64Url(credential.id),
        })),
    };
    debug?.("Assembled public key options:", publicKey);
    const credential = await navigator.credentials.create({
        publicKey,
    });
    if (!credential) {
        throw new Error("empty credential");
    }
    if (!(credential instanceof PublicKeyCredential) ||
        !(credential.response instanceof AuthenticatorAttestationResponse)) {
        throw new Error("credential.response is not an instance of AuthenticatorAttestationResponse");
    }
    const response = credential.response;
    debug?.("Created credential:", {
        credential,
        getTransports: response.getTransports?.(),
        getAuthenticatorData: response.getAuthenticatorData?.(),
        getPublicKey: response.getPublicKey?.(),
        getPublicKeyAlgorithm: response.getPublicKeyAlgorithm?.(),
    });
    const resolvedFriendlyName = typeof friendlyName === "string" ? friendlyName : await friendlyName();
    return fido2CompleteCreateCredential({
        credential: credential,
        friendlyName: resolvedFriendlyName,
    });
}
function getFullFido2Url(path) {
    const { fido2 } = configure();
    if (!fido2) {
        throw new Error("Missing Fido2 config");
    }
    return `${fido2.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
export async function fido2StartCreateCredential() {
    const { fido2, fetch, location } = configure();
    if (!fido2) {
        throw new Error("Missing Fido2 config");
    }
    const { idToken } = (await retrieveTokens()) ?? {};
    if (!idToken) {
        throw new Error("No JWT to invoke Fido2 API with");
    }
    return fetch(getFullFido2Url(`register-authenticator/start?rpId=${fido2.rp?.id ?? location.hostname}`), {
        method: "POST",
        headers: {
            accept: "application/json, text/javascript",
            "content-type": "application/json; charset=UTF-8",
            authorization: `Bearer ${idToken}`,
        },
    })
        .then(throwIfNot2xx)
        .then((res) => res.json());
}
export async function fido2CompleteCreateCredential({ credential, friendlyName, }) {
    const { fetch } = configure();
    const { idToken } = (await retrieveTokens()) ?? {};
    if (!idToken) {
        throw new Error("No JWT to invoke Fido2 API with");
    }
    const parsedCredential = "response" in credential
        ? await parseAuthenticatorAttestationResponse(credential.response)
        : credential;
    return fetch(getFullFido2Url("register-authenticator/complete"), {
        body: JSON.stringify({
            ...parsedCredential,
            friendlyName,
        }),
        method: "POST",
        headers: {
            accept: "application/json, text/javascript",
            "content-type": "application/json; charset=UTF-8",
            authorization: `Bearer ${idToken}`,
        },
    })
        .then(throwIfNot2xx)
        .then((res) => res.json())
        .then((res) => ({
        ...res,
        createdAt: new Date(res.createdAt),
    }));
}
export async function fido2ListCredentials() {
    const { fido2, fetch, location } = configure();
    if (!fido2) {
        throw new Error("Missing Fido2 config");
    }
    const tokens = await retrieveTokens();
    if (!tokens?.idToken) {
        throw new Error("No JWT to invoke Fido2 API with");
    }
    return fetch(getFullFido2Url(`authenticators/list?rpId=${fido2.rp?.id ?? location.hostname}`), {
        method: "POST",
        headers: {
            accept: "application/json, text/javascript",
            "content-type": "application/json; charset=UTF-8",
            authorization: `Bearer ${tokens.idToken}`,
        },
    })
        .then(throwIfNot2xx)
        .then((res) => res.json())
        .then(({ authenticators }) => ({
        authenticators: authenticators.map((authenticator) => ({
            ...authenticator,
            createdAt: new Date(authenticator.createdAt),
            lastSignIn: authenticator.lastSignIn !== undefined
                ? new Date(authenticator.lastSignIn)
                : authenticator.lastSignIn,
        })),
    }));
}
export async function fido2DeleteCredential({ credentialId, }) {
    const { fido2, fetch } = configure();
    if (!fido2) {
        throw new Error("Missing Fido2 config");
    }
    const tokens = await retrieveTokens();
    if (!tokens?.idToken) {
        throw new Error("No JWT to invoke Fido2 API with");
    }
    return fetch(getFullFido2Url("authenticators/delete"), {
        method: "POST",
        body: JSON.stringify({ credentialId }),
        headers: {
            accept: "application/json, text/javascript",
            "content-type": "application/json; charset=UTF-8",
            authorization: `Bearer ${tokens.idToken}`,
        },
    }).then(throwIfNot2xx);
}
export async function fido2UpdateCredential({ credentialId, friendlyName, }) {
    const { fido2, fetch } = configure();
    if (!fido2) {
        throw new Error("Missing Fido2 config");
    }
    const tokens = await retrieveTokens();
    if (!tokens?.idToken) {
        throw new Error("No JWT to invoke Fido2 API with");
    }
    return fetch(getFullFido2Url("authenticators/update"), {
        method: "POST",
        body: JSON.stringify({ credentialId, friendlyName }),
        headers: {
            accept: "application/json, text/javascript",
            "content-type": "application/json; charset=UTF-8",
            authorization: `Bearer ${tokens.idToken}`,
        },
    }).then(throwIfNot2xx);
}
function assertIsFido2Options(o) {
    if (!o ||
        typeof o !== "object" ||
        ("relyingPartyId" in o && typeof o.relyingPartyId !== "string") ||
        !("challenge" in o) ||
        typeof o.challenge !== "string" ||
        ("timeout" in o && typeof o.timeout !== "number") ||
        ("userVerification" in o && typeof o.userVerification !== "string") ||
        ("credentials" in o &&
            !Array.isArray(o.credentials) &&
            o.credentials.every((c) => !!c &&
                typeof c === "object" &&
                "id" in c &&
                typeof c.id === "string" &&
                (!("transports" in c) ||
                    (Array.isArray(c.transports) &&
                        c.transports.every((t) => typeof t === "string")))))) {
        const { debug } = configure();
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        debug?.(`Invalid Fido2 options: ${JSON.stringify(o)}`);
        throw new Error("Invalid Fido2 options");
    }
}
async function fido2getCredential({ relyingPartyId, challenge, credentials, timeout, userVerification, }) {
    const { debug, fido2: { extensions } = {} } = configure();
    const publicKey = {
        challenge: bufferFromBase64Url(challenge),
        allowCredentials: credentials?.map((credential) => ({
            id: bufferFromBase64Url(credential.id),
            transports: credential.transports,
            type: "public-key",
        })),
        timeout,
        userVerification,
        rpId: relyingPartyId,
        extensions,
    };
    debug?.("Assembled public key options:", publicKey);
    const credential = await navigator.credentials.get({
        publicKey,
    });
    if (!credential) {
        throw new Error(`Failed to get credential`);
    }
    if (!(credential instanceof PublicKeyCredential) ||
        !(credential.response instanceof AuthenticatorAssertionResponse)) {
        throw new Error("credential.response is not an instance of AuthenticatorAssertionResponse");
    }
    debug?.("Credential:", credential);
    return parseAuthenticatorAssertionResponse(credential.rawId, credential.response);
}
const parseAuthenticatorAttestationResponse = async (response) => {
    const [attestationObjectB64, clientDataJSON_B64] = await Promise.all([
        bufferToBase64Url(response.attestationObject),
        bufferToBase64Url(response.clientDataJSON),
    ]);
    const transports = (response.getTransports?.() || []).filter((transport) => ["ble", "hybrid", "internal", "nfc", "usb"].includes(transport));
    return {
        attestationObjectB64,
        clientDataJSON_B64,
        transports: transports.length ? transports : undefined,
    };
};
const parseAuthenticatorAssertionResponse = async (rawId, response) => {
    const [credentialIdB64, authenticatorDataB64, clientDataJSON_B64, signatureB64, userHandleB64,] = await Promise.all([
        bufferToBase64Url(rawId),
        bufferToBase64Url(response.authenticatorData),
        bufferToBase64Url(response.clientDataJSON),
        bufferToBase64Url(response.signature),
        response.userHandle && response.userHandle.byteLength > 0
            ? bufferToBase64Url(response.userHandle)
            : null,
    ]);
    return {
        credentialIdB64,
        authenticatorDataB64,
        clientDataJSON_B64,
        signatureB64,
        userHandleB64,
    };
};
async function requestUsernamelessSignInChallenge() {
    const { fido2, fetch } = configure();
    if (!fido2) {
        throw new Error("Missing Fido2 config");
    }
    return fetch(getFullFido2Url("sign-in-challenge"), {
        method: "POST",
        headers: {
            accept: "application/json, text/javascript",
        },
    })
        .then(throwIfNot2xx)
        .then((res) => res.json());
}
export function authenticateWithFido2({ username, credentials, tokensCb, statusCb, currentStatus, clientMetadata, credentialGetter = fido2getCredential, }) {
    if (currentStatus && busyState.includes(currentStatus)) {
        throw new Error(`Can't sign in while in status ${currentStatus}`);
    }
    const abort = new AbortController();
    const signedIn = (async () => {
        const { debug, fido2 } = configure();
        if (!fido2) {
            throw new Error("Missing Fido2 config");
        }
        statusCb?.("STARTING_SIGN_IN_WITH_FIDO2");
        let fido2credential, session;
        try {
            if (username) {
                debug?.(`Invoking initiateAuth ...`);
                const initAuthResponse = await initiateAuth({
                    authflow: "CUSTOM_AUTH",
                    authParameters: {
                        USERNAME: username,
                    },
                    abort: abort.signal,
                });
                debug?.(`Response from initiateAuth:`, initAuthResponse);
                assertIsChallengeResponse(initAuthResponse);
                if (!initAuthResponse.ChallengeParameters.fido2options) {
                    throw new Error("Server did not send a FIDO2 challenge");
                }
                const fido2options = JSON.parse(initAuthResponse.ChallengeParameters.fido2options);
                assertIsFido2Options(fido2options);
                debug?.("FIDO2 options from Cognito challenge:", fido2options);
                fido2credential = await credentialGetter({
                    ...fido2options,
                    relyingPartyId: fido2.rp?.id ?? fido2options.relyingPartyId,
                    timeout: fido2.timeout ?? fido2options.timeout,
                    userVerification: fido2.authenticatorSelection?.userVerification ??
                        fido2options.userVerification,
                    credentials: (fido2options.credentials ?? []).concat(credentials?.filter((cred) => !fido2options.credentials?.find((optionsCred) => cred.id === optionsCred.id)) ?? []),
                });
                session = initAuthResponse.Session;
            }
            else {
                debug?.("Starting usernameless authentication");
                const fido2options = await requestUsernamelessSignInChallenge();
                assertIsFido2Options(fido2options);
                debug?.("FIDO2 options from usernameless challenge:", fido2options);
                fido2credential = await credentialGetter({
                    ...fido2options,
                    relyingPartyId: fido2.rp?.id ?? fido2options.relyingPartyId,
                    timeout: fido2.timeout ?? fido2options.timeout,
                    userVerification: fido2.authenticatorSelection?.userVerification ??
                        fido2options.userVerification,
                });
                if (!fido2credential.userHandleB64) {
                    throw new Error("No discoverable credentials available");
                }
                username = new TextDecoder().decode(bufferFromBase64Url(fido2credential.userHandleB64));
                // The userHandle must map to a username, not a sub
                if (username.startsWith("s|")) {
                    debug?.("Credential userHandle isn't a username. In order to use the username as userHandle, so users can sign in without typing their username, usernames must be opaque");
                    throw new Error("Username is required for initiating sign-in");
                }
                // remove (potential) prefix to recover username
                username = username.replace(/^u\|/, "");
                debug?.(`Proceeding with discovered credential for username: ${username} (b64: ${fido2credential.userHandleB64})`);
                debug?.(`Invoking initiateAuth ...`);
                const initAuthResponse = await initiateAuth({
                    authflow: "CUSTOM_AUTH",
                    authParameters: {
                        USERNAME: username,
                    },
                    abort: abort.signal,
                });
                debug?.(`Response from initiateAuth:`, initAuthResponse);
                assertIsChallengeResponse(initAuthResponse);
                session = initAuthResponse.Session;
            }
            statusCb?.("COMPLETING_SIGN_IN_WITH_FIDO2");
            debug?.(`Invoking respondToAuthChallenge ...`);
            const authResult = await respondToAuthChallenge({
                challengeName: "CUSTOM_CHALLENGE",
                challengeResponses: {
                    ANSWER: JSON.stringify(fido2credential),
                    USERNAME: username,
                },
                clientMetadata: {
                    ...clientMetadata,
                    signInMethod: "FIDO2",
                },
                session: session,
                abort: abort.signal,
            });
            assertIsAuthenticatedResponse(authResult);
            debug?.(`Response from respondToAuthChallenge:`, authResult);
            const tokens = {
                accessToken: authResult.AuthenticationResult.AccessToken,
                idToken: authResult.AuthenticationResult.IdToken,
                refreshToken: authResult.AuthenticationResult.RefreshToken,
                expireAt: new Date(Date.now() + authResult.AuthenticationResult.ExpiresIn * 1000),
                username: parseJwtPayload(authResult.AuthenticationResult.IdToken)["cognito:username"],
            };
            tokensCb
                ? await tokensCb(tokens)
                : await defaultTokensCb({ tokens, abort: abort.signal });
            statusCb?.("SIGNED_IN_WITH_FIDO2");
            return tokens;
        }
        catch (err) {
            statusCb?.("FIDO2_SIGNIN_FAILED");
            throw err;
        }
    })();
    return {
        signedIn,
        abort: () => abort.abort(),
    };
}
