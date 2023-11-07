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
import { APIGatewayProxyHandler } from "aws-lambda";
export declare class UserFacingError extends Error {
    constructor(msg: string);
}
export declare function handleConditionalCheckFailedException(msg: string): (err: unknown) => never;
export declare enum LogLevel {
    "none" = 0,
    "error" = 10,
    "info" = 20,
    "debug" = 30
}
export declare class Logger {
    private logLevel;
    constructor(logLevel: LogLevel);
    error(...args: unknown[]): void;
    info(...args: unknown[]): void;
    debug(...args: unknown[]): void;
}
export declare const logLevel: LogLevel;
export declare let logger: Logger;
/**
 * Returns a suitable userHandle given the username and the sub
 * If possible we'll use the username (so that usernameless sign-in can be supported),
 * but this requires the username to be opaque.
 */
export declare function determineUserHandle({ sub, cognitoUsername, }: {
    sub?: string;
    cognitoUsername: string;
}): string;
export declare function withCommonHeaders<T extends APIGatewayProxyHandler>(handler: T): T;
