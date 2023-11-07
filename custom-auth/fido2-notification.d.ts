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
import { Handler } from "aws-lambda";
declare let config: {
    /** The User Pool ID */
    userPoolId: string | undefined;
    /** The e-mail address that notifications will be sent from */
    sesFromAddress: string | undefined;
    /** The Amazon SES region, override e.g. to set a region where you are out of the SES sandbox */
    sesRegion: string | undefined;
    /** Function that will send the actual notification e-mails. Override this to e.g. use another e-mail provider instead of Amazon SES */
    emailSender: typeof sendEmail;
    /** Function to create the content of the notification e-mails, override to e.g. use a custom e-mail template */
    contentCreator: typeof createEmailContent;
};
export declare function configure(update?: Partial<typeof config>): {
    /** The User Pool ID */
    userPoolId: string | undefined;
    /** The e-mail address that notifications will be sent from */
    sesFromAddress: string | undefined;
    /** The Amazon SES region, override e.g. to set a region where you are out of the SES sandbox */
    sesRegion: string | undefined;
    /** Function that will send the actual notification e-mails. Override this to e.g. use another e-mail provider instead of Amazon SES */
    emailSender: typeof sendEmail;
    /** Function to create the content of the notification e-mails, override to e.g. use a custom e-mail template */
    contentCreator: typeof createEmailContent;
};
export interface NotificationPayload {
    cognitoUsername: string;
    friendlyName: string;
    eventType: "FIDO2_CREDENTIAL_CREATED" | "FIDO2_CREDENTIAL_DELETED";
}
export declare const handler: Handler<NotificationPayload>;
declare function createEmailContent({ friendlyName, eventType, }: {
    friendlyName: string;
    eventType: "FIDO2_CREDENTIAL_CREATED" | "FIDO2_CREDENTIAL_DELETED";
}): Promise<{
    html: {
        data: string;
        charSet: string;
    };
    text: {
        data: string;
        charSet: string;
    };
    subject: {
        data: string;
        charSet: string;
    };
}>;
declare function sendEmail({ emailAddress, content, }: {
    emailAddress: string;
    content: {
        html: {
            charSet: string;
            data: string;
        };
        text: {
            charSet: string;
            data: string;
        };
        subject: {
            charSet: string;
            data: string;
        };
    };
}): Promise<void>;
export {};
