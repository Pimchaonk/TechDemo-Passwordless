import { revokeToken } from "./cognito-api.js";
import { configure } from "./config.js";
import { retrieveTokens, storeTokens } from "./storage.js";
import { busyState, } from "./model.js";
import { scheduleRefresh } from "./refresh.js";
/** The default tokens callback stores tokens in storage and reschedules token refresh */
export const defaultTokensCb = async ({ tokens, abort, }) => {
    const storeAndScheduleRefresh = async (tokens) => {
        await storeTokens(tokens);
        scheduleRefresh({
            abort,
            tokensCb: (newTokens) => newTokens && storeAndScheduleRefresh({ ...tokens, ...newTokens }),
        }).catch((err) => {
            const { debug } = configure();
            debug?.("Failed to store and refresh tokens:", err);
        });
    };
    await storeAndScheduleRefresh(tokens);
};
/**
 * Sign the user out. This means: clear tokens from storage,
 * and revoke the refresh token from Amazon Cognito
 */
export const signOut = (props) => {
    const { clientId, debug, storage } = configure();
    const { currentStatus, statusCb } = props ?? {};
    if (currentStatus && busyState.includes(currentStatus)) {
        debug?.(`Initiating sign-out despite being in a busy state: ${currentStatus}`);
    }
    statusCb?.("SIGNING_OUT");
    const abort = new AbortController();
    const signedOut = (async () => {
        try {
            const tokens = await retrieveTokens();
            if (abort.signal.aborted) {
                debug?.("Aborting sign-out");
                currentStatus && statusCb?.(currentStatus);
                return;
            }
            if (!tokens) {
                debug?.("No tokens in storage to delete");
                props?.tokensRemovedLocallyCb?.();
                statusCb?.("SIGNED_OUT");
                return;
            }
            const amplifyKeyPrefix = `CognitoIdentityServiceProvider.${clientId}`;
            const customKeyPrefix = `Passwordless.${clientId}`;
            await Promise.all([
                storage.removeItem(`${amplifyKeyPrefix}.${tokens.username}.idToken`),
                storage.removeItem(`${amplifyKeyPrefix}.${tokens.username}.accessToken`),
                storage.removeItem(`${amplifyKeyPrefix}.${tokens.username}.refreshToken`),
                storage.removeItem(`${amplifyKeyPrefix}.${tokens.username}.tokenScopesString`),
                storage.removeItem(`${amplifyKeyPrefix}.${tokens.username}.userData`),
                storage.removeItem(`${amplifyKeyPrefix}.LastAuthUser`),
                storage.removeItem(`${customKeyPrefix}.${tokens.username}.expireAt`),
                storage.removeItem(`Passwordless.${clientId}.${tokens.username}.refreshingTokens`),
            ]);
            props?.tokensRemovedLocallyCb?.();
            if (tokens.refreshToken) {
                await revokeToken({
                    abort: undefined,
                    refreshToken: tokens.refreshToken,
                });
            }
            statusCb?.("SIGNED_OUT");
        }
        catch (err) {
            if (abort.signal.aborted)
                return;
            currentStatus && statusCb?.(currentStatus);
            throw err;
        }
    })();
    return {
        signedOut,
        abort: () => abort.abort(),
    };
};
