import { CreateAuthChallengeTriggerEvent, VerifyAuthChallengeResponseTriggerEvent } from "aws-lambda";
declare let config: {
    /** Should Magic Link sign-in be enabled? If set to false, clients cannot sign-in with magic links (an error is shown instead when they request a magic link) */
    magicLinkEnabled: boolean;
    /** Number of seconds a Magic Link should be valid */
    secondsUntilExpiry: number;
    /** Number of seconds that must lapse between unused Magic Links (to prevent misuse) */
    minimumSecondsBetween: number;
    /** The origins that are allowed to be used in the Magic Links */
    allowedOrigins: string[] | undefined;
    /** The e-mail address that Magic Links will be sent from */
    sesFromAddress: string | undefined;
    /** The Amazon SES region, override e.g. to set a region where you are out of the SES sandbox */
    sesRegion: string | undefined;
    /** KMS Key ID to use for generating Magic Links (signatures) */
    kmsKeyId: string | undefined;
    /** The name of the DynamoDB table where (hashes of) Magic Links will be stored */
    dynamodbSecretsTableName: string | undefined;
    /** Function to mask the e-mail address that will be visible in the public challenge parameters */
    emailMasker: typeof maskEmail;
    /** Function that will send the actual Magic Link e-mails. Override this to e.g. use another e-mail provider instead of Amazon SES */
    emailSender: typeof sendEmailWithLink;
    /** A salt to use for storing hashes of magic links in the DynamoDB table */
    salt: string | undefined;
    /** Function to create the content of the Magic Link e-mails, override to e.g. use a custom e-mail template */
    contentCreator: typeof createEmailContent;
    /** Error message that will be shown to the client, if the client requests a Magic Link but isn't allowed to yet */
    notNowMsg: string;
};
export declare function configure(update?: Partial<typeof config>): {
    /** Should Magic Link sign-in be enabled? If set to false, clients cannot sign-in with magic links (an error is shown instead when they request a magic link) */
    magicLinkEnabled: boolean;
    /** Number of seconds a Magic Link should be valid */
    secondsUntilExpiry: number;
    /** Number of seconds that must lapse between unused Magic Links (to prevent misuse) */
    minimumSecondsBetween: number;
    /** The origins that are allowed to be used in the Magic Links */
    allowedOrigins: string[] | undefined;
    /** The e-mail address that Magic Links will be sent from */
    sesFromAddress: string | undefined;
    /** The Amazon SES region, override e.g. to set a region where you are out of the SES sandbox */
    sesRegion: string | undefined;
    /** KMS Key ID to use for generating Magic Links (signatures) */
    kmsKeyId: string | undefined;
    /** The name of the DynamoDB table where (hashes of) Magic Links will be stored */
    dynamodbSecretsTableName: string | undefined;
    /** Function to mask the e-mail address that will be visible in the public challenge parameters */
    emailMasker: typeof maskEmail;
    /** Function that will send the actual Magic Link e-mails. Override this to e.g. use another e-mail provider instead of Amazon SES */
    emailSender: typeof sendEmailWithLink;
    /** A salt to use for storing hashes of magic links in the DynamoDB table */
    salt: string | undefined;
    /** Function to create the content of the Magic Link e-mails, override to e.g. use a custom e-mail template */
    contentCreator: typeof createEmailContent;
    /** Error message that will be shown to the client, if the client requests a Magic Link but isn't allowed to yet */
    notNowMsg: string;
};
export declare function addChallengeToEvent(event: CreateAuthChallengeTriggerEvent): Promise<void>;
declare function createEmailContent({ secretLoginLink, }: {
    secretLoginLink: string;
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
declare function sendEmailWithLink({ emailAddress, content, }: {
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
export declare function addChallengeVerificationResultToEvent(event: VerifyAuthChallengeResponseTriggerEvent): Promise<void>;
/**
 * Mask an e-mail address
 *
 * Example:
 *   input: johndoe@sub.example.co.uk
 *   output: j****e@***.e*****e.**.**
 *
 * @param emailAddress
 * @returns maskedEmailAdress
 */
declare function maskEmail(emailAddress: string): string;
export {};
