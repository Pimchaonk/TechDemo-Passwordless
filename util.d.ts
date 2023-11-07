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
import { CognitoAccessTokenPayload, CognitoIdTokenPayload } from "./jwt-model.js";
import { MinimalResponse } from "./config.js";
export declare function throwIfNot2xx(res: MinimalResponse): Promise<MinimalResponse>;
export declare function parseJwtPayload<T extends CognitoAccessTokenPayload | CognitoIdTokenPayload>(jwt: string): T;
/**
 * Schedule a callback once, like setTimeout, but count
 * time spent sleeping also as time spent. This way, if the browser tab
 * where this is happening is activated again after sleeping,
 * the callback is run immediately (more precise: within 1 second)
 */
export declare function setTimeoutWallClock<T>(cb: () => T, ms: number): () => void;
export declare function currentBrowserLocationWithoutFragmentIdentifier(): string;
export declare function removeFragmentIdentifierFromBrowserLocation(): void;
export declare function timeAgo(now: Date, historicDate?: Date): string | undefined;
export declare const bufferFromBase64: (base64: string) => Uint8Array;
export declare const bufferFromBase64Url: (base64: string) => Uint8Array;
export declare const bufferToBase64: (base64: ArrayBuffer) => string;
export declare const bufferToBase64Url: (base64: ArrayBuffer) => string;
