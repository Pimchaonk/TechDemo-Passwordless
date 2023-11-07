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
let config_ = undefined;
export function configure(config) {
    if (config) {
        config_ = {
            ...config,
            crypto: config.crypto ?? Defaults.crypto,
            storage: config.storage ?? Defaults.storage,
            fetch: config.fetch ?? Defaults.fetch,
            location: config.location ?? Defaults.location,
            history: config.history ?? Defaults.history,
        };
        config_.debug?.("Configuration loaded:", config);
    }
    else {
        if (!config_) {
            throw new Error("Call configure(config) first");
        }
    }
    return config_;
}
export function configureFromAmplify(amplifyConfig) {
    const { region, userPoolId, userPoolWebClientId } = isAmplifyConfig(amplifyConfig)
        ? amplifyConfig.Auth
        : amplifyConfig;
    if (typeof region !== "string") {
        throw new Error("Invalid Amplify configuration provided: invalid or missing region");
    }
    if (typeof userPoolId !== "string") {
        throw new Error("Invalid Amplify configuration provided: invalid or missing userPoolId");
    }
    if (typeof userPoolWebClientId !== "string") {
        throw new Error("Invalid Amplify configuration provided: invalid or missing userPoolWebClientId");
    }
    configure({
        cognitoIdpEndpoint: region,
        userPoolId,
        clientId: userPoolWebClientId,
    });
    return {
        with: (config) => {
            return configure({
                cognitoIdpEndpoint: region,
                userPoolId,
                clientId: userPoolWebClientId,
                ...config,
            });
        },
    };
}
function isAmplifyConfig(c) {
    return !!c && typeof c === "object" && "Auth" in c;
}
class MemoryStorage {
    constructor() {
        this.memory = new Map();
    }
    getItem(key) {
        return this.memory.get(key);
    }
    setItem(key, value) {
        this.memory.set(key, value);
    }
    removeItem(key) {
        this.memory.delete(key);
    }
}
export class UndefinedGlobalVariableError extends Error {
}
class Defaults {
    static getFailingProxy(expected) {
        const message = `"${expected}" is not available as a global variable in your JavaScript runtime, so you must configure it explicitly with Passwordless.configure()`;
        return new Proxy((() => undefined), {
            apply() {
                throw new UndefinedGlobalVariableError(message);
            },
            get() {
                throw new UndefinedGlobalVariableError(message);
            },
        });
    }
    static get storage() {
        return typeof globalThis.localStorage !== "undefined"
            ? globalThis.localStorage
            : new MemoryStorage();
    }
    static get crypto() {
        if (typeof globalThis.crypto !== "undefined")
            return globalThis.crypto;
        return Defaults.getFailingProxy("crypto");
    }
    static get fetch() {
        if (typeof globalThis.fetch !== "undefined")
            return globalThis.fetch;
        return Defaults.getFailingProxy("fetch");
    }
    static get location() {
        if (typeof globalThis.location !== "undefined")
            return globalThis.location;
        return Defaults.getFailingProxy("location");
    }
    static get history() {
        if (typeof globalThis.history !== "undefined")
            return globalThis.history;
        return Defaults.getFailingProxy("history");
    }
}
