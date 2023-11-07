import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { logger, withCommonHeaders } from "./common.js";
import { randomBytes } from "crypto";
const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: {
        removeUndefinedValues: true,
    },
});
const signInTimeout = Number(process.env.SIGN_IN_TIMEOUT ?? "120000");
const headers = {
    "Strict-Transport-Security": "max-age=31536000; includeSubdomains; preload",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
};
const _handler = async (event) => {
    logger.debug(JSON.stringify(event, null, 2));
    logger.info("FIDO2 challenge API invocation:", event.path);
    try {
        if (event.path === "/sign-in-challenge") {
            const challenge = randomBytes(64).toString("base64url");
            await ddbDocClient.send(new PutCommand({
                TableName: process.env.DYNAMODB_AUTHENTICATORS_TABLE,
                Item: {
                    pk: `CHALLENGE#${challenge}`,
                    sk: `USERNAMELESS_SIGN_IN`,
                    exp: Math.floor((Date.now() + signInTimeout) / 1000),
                },
            }));
            return {
                statusCode: 200,
                headers,
                /** Remember, only return things we want unauthenticated users to see */
                body: JSON.stringify({
                    challenge,
                    timeout: signInTimeout,
                    userVerification: process.env.USER_VERIFICATION,
                }),
            };
        }
        return {
            statusCode: 404,
            body: JSON.stringify({ message: "Not found" }),
            headers,
        };
    }
    catch (err) {
        logger.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
            headers,
        };
    }
};
export const handler = withCommonHeaders(_handler);
