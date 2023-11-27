import { configure } from "./config.js";
import { initiateAuth, handleAuthResponse } from "./cognito-api.js";
import { defaultTokensCb } from "./common.js";
export function authenticateWithPlaintextPassword({ username, password, smsMfaCode, newPassword, tokensCb, statusCb, clientMetadata, }) {
    const { userPoolId, debug } = configure();
    if (!userPoolId) {
        throw new Error("UserPoolId must be configured");
    }
    const abort = new AbortController();
    const signedIn = (async () => {
        try {
            statusCb?.("SIGNING_IN_WITH_PASSWORD");
            debug?.(`Invoking initiateAuth ...`);
            const authResponse = await initiateAuth({
                authflow: "USER_PASSWORD_AUTH",
                authParameters: { USERNAME: username, PASSWORD: password },
                clientMetadata,
            });
            debug?.(`Response from initiateAuth:`, authResponse);
            const tokens = await handleAuthResponse({
                authResponse,
                username,
                smsMfaCode,
                newPassword,
                clientMetadata,
                abort: abort.signal,
            });
            tokensCb
                ? await tokensCb(tokens)
                : await defaultTokensCb({ tokens, abort: abort.signal });
            statusCb?.("SIGNED_IN_WITH_PASSWORD");
        }
        catch (err) {
            statusCb?.("PASSWORD_SIGNIN_FAILED");
            throw err;
        }
    })();
    return {
        signedIn: signedIn,
        abort: () => abort.abort(),
    };
}
