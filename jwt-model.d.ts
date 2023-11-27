type Json = null | string | number | boolean | Json[] | JsonObject;
/** JSON Object type */
type JsonObject = {
    [name: string]: Json;
};
interface CognitoJwtFields {
    token_use: "access" | "id";
    "cognito:groups"?: string[];
    sub: string;
    iss: string;
    exp: number;
    iat: number;
    auth_time: number;
    jti: string;
    origin_jti: string;
}
interface CognitoIdTokenFields extends CognitoJwtFields {
    token_use: "id";
    aud: string;
    at_hash: string;
    "cognito:username": string;
    email?: string;
    email_verified?: boolean;
    phone_number?: string;
    phone_number_verified?: boolean;
    identities?: {
        userId: string;
        providerName: string;
        providerType: string;
        issuer: null;
        primary: string;
        dateCreated: string;
    }[];
    "cognito:roles"?: string[];
    "cognito:preferred_role"?: string;
}
export type CognitoIdTokenPayload = CognitoIdTokenFields & JsonObject;
interface CognitoAccessTokenFields extends CognitoJwtFields {
    token_use: "access";
    client_id: string;
    version: number;
    username: string;
    scope: string;
}
export type CognitoAccessTokenPayload = CognitoAccessTokenFields & JsonObject;
export {};
