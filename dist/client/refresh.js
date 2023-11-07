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
import { configure } from "./config.js";
import { retrieveTokens } from "./storage.js";
import { initiateAuth } from "./cognito-api.js";
import { setTimeoutWallClock } from "./util.js";
let schedulingRefresh = undefined;
export async function scheduleRefresh(...args) {
    if (!schedulingRefresh) {
        schedulingRefresh = _scheduleRefresh(...args).finally(() => (schedulingRefresh = undefined));
    }
    return schedulingRefresh;
}
let clearScheduledRefresh = undefined;
async function _scheduleRefresh({ abort, tokensCb, isRefreshingCb, }) {
    const { debug } = configure();
    clearScheduledRefresh?.();
    const tokens = await retrieveTokens();
    if (abort?.aborted)
        return;
    // Refresh 30 seconds before expiry
    // Add some jitter, to spread scheduled refreshes might they be
    // requested multiple times (e.g. in multiple components)
    const refreshIn = Math.max(0, (tokens?.expireAt ?? new Date()).valueOf() -
        Date.now() -
        30 * 1000 -
        (Math.random() - 0.5) * 30 * 1000);
    if (refreshIn >= 1000) {
        debug?.(`Scheduling refresh of tokens in ${(refreshIn / 1000).toFixed(1)} seconds`);
        clearScheduledRefresh = setTimeoutWallClock(() => refreshTokens({ abort, tokensCb, isRefreshingCb, tokens }).catch((err) => debug?.("Failed to refresh tokens:", err)), refreshIn);
        abort?.addEventListener("abort", clearScheduledRefresh);
    }
    else {
        refreshTokens({ abort, tokensCb, isRefreshingCb, tokens }).catch((err) => debug?.("Failed to refresh tokens:", err));
    }
    return clearScheduledRefresh;
}
let refreshingTokens = undefined;
export async function refreshTokens(...args) {
    if (!refreshingTokens) {
        refreshingTokens = _refreshTokens(...args).finally(() => (refreshingTokens = undefined));
    }
    return refreshingTokens;
}
const invalidRefreshTokens = new Set();
async function _refreshTokens({ abort, tokensCb, isRefreshingCb, tokens, }) {
    isRefreshingCb?.(true);
    try {
        const { debug } = configure();
        if (!tokens) {
            tokens = await retrieveTokens();
        }
        const { refreshToken, username } = tokens ?? {};
        if (!refreshToken || !username) {
            throw new Error("Cannot refresh without refresh token and username");
        }
        if (invalidRefreshTokens.has(refreshToken)) {
            throw new Error(`Will not attempt refresh using token that failed previously: ${refreshToken}`);
        }
        debug?.("Refreshing tokens using refresh token ...");
        const authResult = await initiateAuth({
            authflow: "REFRESH_TOKEN_AUTH",
            authParameters: {
                REFRESH_TOKEN: refreshToken,
            },
            abort,
        }).catch((err) => {
            invalidRefreshTokens.add(refreshToken);
            throw err;
        });
        const tokensFromRefresh = {
            accessToken: authResult.AuthenticationResult.AccessToken,
            idToken: authResult.AuthenticationResult.IdToken,
            expireAt: new Date(Date.now() + authResult.AuthenticationResult.ExpiresIn * 1000),
            username,
        };
        await tokensCb?.(tokensFromRefresh);
        return tokensFromRefresh;
    }
    finally {
        isRefreshingCb?.(false);
    }
}
