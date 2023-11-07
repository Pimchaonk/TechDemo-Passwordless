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
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
type TableProps = Omit<cdk.aws_dynamodb.TableProps, "partitionKey" | "sortKey">;
export declare class Passwordless extends Construct {
    userPool: cdk.aws_cognito.UserPool;
    userPoolClients?: cdk.aws_cognito.UserPoolClient[];
    secretsTable?: cdk.aws_dynamodb.Table;
    authenticatorsTable?: cdk.aws_dynamodb.Table;
    kmsKey?: cdk.aws_kms.IKey;
    createAuthChallengeFn: cdk.aws_lambda.IFunction;
    verifyAuthChallengeResponseFn: cdk.aws_lambda.IFunction;
    defineAuthChallengeResponseFn: cdk.aws_lambda.IFunction;
    preSignUpFn?: cdk.aws_lambda.IFunction;
    preTokenGenerationFn?: cdk.aws_lambda.IFunction;
    fido2Fn?: cdk.aws_lambda.IFunction;
    fido2challengeFn?: cdk.aws_lambda.IFunction;
    fido2Api?: cdk.aws_apigateway.RestApi;
    fido2ApiWebACL?: cdk.aws_wafv2.CfnWebACL;
    fido2NotificationFn?: cdk.aws_lambda.IFunction;
    constructor(scope: Construct, id: string, props: {
        /** Your existing User Pool, if you have one already. This User Pool will then be equipped for Passwordless: Lambda triggers will be added. If you don't provide an existing User Pool, one will be created for you */
        userPool?: cdk.aws_cognito.UserPool;
        /** Your existing User Pool Clients, if you have them already. If you don't provide an existing User Pool Client, one will be created for you */
        userPoolClients?: cdk.aws_cognito.UserPoolClient[];
        /** If you don't provide an existing User Pool, one will be created for you. Pass any properties you want for it, these will be merged with properties from this solution */
        userPoolProps?: Partial<cdk.aws_cognito.UserPoolProps>;
        /** If you don't provide an existing User Pool Client, one will be created for you. Pass any properties you want for it, these will be merged with properties from this solution */
        userPoolClientProps?: Partial<cdk.aws_cognito.UserPoolClientOptions>;
        /**
         * The origins where you will be hosting your Web app on: scheme, hostname, and optionally port.
         * Do not include path as it will be ignored. The wildcard (*) is not supported.
         *
         * Example value: https://subdomain.example.org
         *
         * This property is required when using FIDO2 or Magic Links:
         * - For FIDO2 it is validated that the clientData.origin matches one of the allowedOrigins. Also, allowedOrigins is used as CORS origin setting on the FIDO2 credentials API.
         * - For Magic Links it is validated that the redirectUri (without path) in each Magic Link matches one of the allowedOrigins.
         */
        allowedOrigins?: string[];
        /**
         * Enable sign-in with FIDO2 by providing this config object.
         */
        fido2?: {
            relyingPartyName?: string;
            allowedRelyingPartyIds: string[];
            attestation?: "direct" | "enterprise" | "indirect" | "none";
            userVerification?: "discouraged" | "preferred" | "required";
            authenticatorAttachment?: "cross-platform" | "platform";
            residentKey?: "discouraged" | "preferred" | "required";
            /** Timeouts (in milliseconds) */
            timeouts?: {
                credentialRegistration?: number;
                signIn?: number;
            };
            authenticatorsTableProps?: TableProps;
            exposeUserCredentialIDs?: boolean;
            /**
             * Should users who previously registered FIDO2 credentials be forced to sign in with FIDO2?
             * FIDO2 is a phishing resistant signInMethod. As long as other signInMethods are still available,
             * there is a risk of phishing to the user, e.g. an attacker might trick the user into revealing the magic link.
             * Set to `true` to disallow other custom signInMethods if the user has one or more FIDO2 credentials.
             * @default false
             */
            enforceFido2IfAvailable?: boolean;
            api?: {
                /**
                 * The throttling burst limit for the deployment stage: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html
                 *
                 * @default 1000
                 */
                throttlingBurstLimit?: number;
                /**
                 * The throttling rate limit for the deployment stage: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html
                 *
                 * @default 2000
                 */
                throttlingRateLimit?: number;
                /**
                 * Create a log role for API Gateway and add this to API Gateway account settings?
                 * Set to false if you have already set this up in your account and region,
                 * otherwise that config will be overwritten.
                 *
                 * @default true
                 */
                addCloudWatchLogsRoleAndAccountSetting?: boolean;
                /**
                 * Add a WAF Web ACL with rate limit rule to the API deployment stage? The included Web ACL will have 1 rule:
                 * rate limit incoming requests to max 100 per 5 minutes per IP address (based on X-Forwarded-For header).
                 * If you want to customize the Web ACL, set addWaf to false and add your own Web ACL instead.
                 *
                 * @default true
                 */
                addWaf?: boolean;
                /**
                 * The rate limit per unique IP (using X-Forwarded-For header) that AWS WAF will apply: https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based-high-level-settings.html
                 *
                 * @default 100
                 */
                wafRateLimitPerIp?: number;
                /**
                 * Pass any properties you want for the AWS Lambda Rest Api created, these will be merged with properties from this solution
                 */
                restApiProps?: Partial<cdk.aws_apigateway.RestApiProps>;
            };
            /**
             * Send an informational notification to users when a FIDO2 credential was created or deleted for them?
             */
            updatedCredentialsNotification?: {
                /** The e-mail address you want to use as the FROM address of the notification e-mails */
                sesFromAddress: string;
                /** The AWS region you want to use Amazon SES from. Use this to specify a different region where you're no longer in the SES sandbox */
                sesRegion?: string;
            };
        };
        /**
         * Enable sign-in with Magic Links by providing this config object
         * Make sure you've moved out of the SES sandbox, otherwise you can only send few e-mails,
         * and only from and to verified e-mail addresses: https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html
         */
        magicLink?: {
            /** The e-mail address you want to use as the FROM address of the magic link e-mails */
            sesFromAddress: string;
            /** The AWS region you want to use Amazon SES from. Use this to specify a different region where you're no longer in the SES sandbox */
            sesRegion?: string;
            kmsKey?: cdk.aws_kms.IKey;
            kmsKeyProps?: cdk.aws_kms.KeyProps;
            rotatedKmsKey?: cdk.aws_kms.IKey;
            secretsTableProps?: TableProps;
            secondsUntilExpiry?: cdk.Duration;
            minimumSecondsBetween?: cdk.Duration;
            autoConfirmUsers?: boolean;
        };
        /**
         * Enable SMS OTP Step Up authentication by providing this config object.
         * Make sure you've moved out of the SNS sandbox, otherwise you can only send few SMS messages,
         * and only to verified phone numbers: https://docs.aws.amazon.com/sns/latest/dg/sns-sms-sandbox.html
         */
        smsOtpStepUp?: {
            /** The nr of digits in the OTP. Default: 6 */
            otpLength?: number;
            originationNumber?: string;
            senderId?: string;
            snsRegion?: string;
        };
        /** Pass any properties you want for the AWS Lambda functions created, these will be merged with properties from this solution */
        functionProps?: {
            createAuthChallenge?: Partial<cdk.aws_lambda_nodejs.NodejsFunctionProps>;
            defineAuthChallenge?: Partial<cdk.aws_lambda_nodejs.NodejsFunctionProps>;
            verifyAuthChallengeResponse?: Partial<cdk.aws_lambda_nodejs.NodejsFunctionProps>;
            preSignUp?: Partial<cdk.aws_lambda_nodejs.NodejsFunctionProps>;
            preTokenGeneration?: Partial<cdk.aws_lambda_nodejs.NodejsFunctionProps>;
            fido2?: Partial<cdk.aws_lambda_nodejs.NodejsFunctionProps>;
            fido2challenge?: Partial<cdk.aws_lambda_nodejs.NodejsFunctionProps>;
            fido2notification?: Partial<cdk.aws_lambda_nodejs.NodejsFunctionProps>;
        };
        /** Any keys in the clientMetadata that you specify here, will be persisted as claims in the ID-token, via the Amazon Cognito PreToken-generation trigger */
        clientMetadataTokenKeys?: string[];
        /**
         * Specify to enable logging in all lambda functions.
         * Note that log level DEBUG will log sensitive data, only use while developing!
         *
         * @default "INFO"
         */
        logLevel?: "DEBUG" | "INFO" | "ERROR";
    });
}
export {};
