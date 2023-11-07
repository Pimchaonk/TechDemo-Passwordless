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
import { CreateAuthChallengeTriggerEvent, VerifyAuthChallengeResponseTriggerEvent } from "aws-lambda";
declare let config: {
    /** Should SMS OTP step-up sign-in be enabled? If set to false, clients cannot sign-in with SMS OTP step-up (an error is shown instead when they request a OTP sms) */
    smsOtpStepUpEnabled: boolean;
    /** The length of the OTP */
    secretCodeLength: number;
    /** Amazon SNS origination number to use for sending SMS messages */
    originationNumber: string | undefined;
    /** Amazon SNS sender ID to use for sending SMS messages */
    senderId: string | undefined;
    /** The Amazon SNS region, override e.g. to set a region where you are out of the SES sandbox */
    snsRegion: string | undefined;
    /** Function to mask the phone nr that will be visible in the public challenge parameters */
    phoneNrMasker: typeof maskPhoneNumber;
    /** Function to create the content of the OTP sms-es, override to e.g. use a custom sms template */
    contentCreator: typeof createSmsContent;
    /** The function to verify JWTs with, override to e.g. verify custom claims */
    jwtVerifier: typeof verifyJwt;
};
export declare function configure(update?: Partial<typeof config>): {
    /** Should SMS OTP step-up sign-in be enabled? If set to false, clients cannot sign-in with SMS OTP step-up (an error is shown instead when they request a OTP sms) */
    smsOtpStepUpEnabled: boolean;
    /** The length of the OTP */
    secretCodeLength: number;
    /** Amazon SNS origination number to use for sending SMS messages */
    originationNumber: string | undefined;
    /** Amazon SNS sender ID to use for sending SMS messages */
    senderId: string | undefined;
    /** The Amazon SNS region, override e.g. to set a region where you are out of the SES sandbox */
    snsRegion: string | undefined;
    /** Function to mask the phone nr that will be visible in the public challenge parameters */
    phoneNrMasker: typeof maskPhoneNumber;
    /** Function to create the content of the OTP sms-es, override to e.g. use a custom sms template */
    contentCreator: typeof createSmsContent;
    /** The function to verify JWTs with, override to e.g. verify custom claims */
    jwtVerifier: typeof verifyJwt;
};
export declare function addChallengeToEvent(event: CreateAuthChallengeTriggerEvent): Promise<void>;
declare function createSmsContent({ secretCode, }: {
    secretCode: string;
    event: CreateAuthChallengeTriggerEvent;
}): Promise<string>;
export declare function addChallengeVerificationResultToEvent(event: VerifyAuthChallengeResponseTriggerEvent): Promise<void>;
declare function verifyJwt({ userPoolId, clientId, jwt, sub, }: {
    userPoolId: string;
    clientId: string;
    jwt: string;
    sub: string;
}): Promise<boolean>;
declare function maskPhoneNumber(phoneNumber: string): string;
export {};
