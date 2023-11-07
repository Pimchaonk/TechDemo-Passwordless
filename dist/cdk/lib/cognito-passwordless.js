"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Passwordless = void 0;
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
const cdk = __importStar(require("aws-cdk-lib"));
const constructs_1 = require("constructs");
const path_1 = require("path");
class Passwordless extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        if (props.magicLink) {
            if (props.magicLink.kmsKey) {
                this.kmsKey = props.magicLink.kmsKey;
            }
            else {
                const key = new cdk.aws_kms.Key(this, `KmsKeyRsa${id}`, {
                    ...props.magicLink.kmsKeyProps,
                    keySpec: cdk.aws_kms.KeySpec.RSA_2048,
                    keyUsage: cdk.aws_kms.KeyUsage.SIGN_VERIFY,
                    policy: new cdk.aws_iam.PolicyDocument({
                        statements: [
                            new cdk.aws_iam.PolicyStatement({
                                effect: cdk.aws_iam.Effect.ALLOW,
                                notActions: ["kms:Sign"],
                                resources: ["*"],
                                principals: [new cdk.aws_iam.AccountRootPrincipal()],
                            }),
                        ],
                    }),
                });
                this.kmsKey = key.addAlias(`${id}-${cdk.Stack.of(scope).stackName}`);
            }
            this.secretsTable = new cdk.aws_dynamodb.Table(scope, `SecretsTable${id}`, {
                billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
                ...props.magicLink.secretsTableProps,
                partitionKey: {
                    name: "userNameHash",
                    type: cdk.aws_dynamodb.AttributeType.BINARY,
                },
                timeToLiveAttribute: "exp",
            });
            const autoConfirmUsers = props.magicLink.autoConfirmUsers ?? true;
            if (autoConfirmUsers) {
                this.preSignUpFn = new cdk.aws_lambda_nodejs.NodejsFunction(this, `PreSignup${id}`, {
                    entry: (0, path_1.join)(__dirname, "..", "custom-auth", "pre-signup.js"),
                    runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
                    architecture: cdk.aws_lambda.Architecture.ARM_64,
                    bundling: {
                        format: cdk.aws_lambda_nodejs.OutputFormat.ESM,
                    },
                    ...props.functionProps?.preSignUp,
                    environment: {
                        LOG_LEVEL: props.logLevel ?? "INFO",
                        ...props.functionProps?.preSignUp?.environment,
                    },
                });
            }
        }
        if (props.fido2) {
            this.authenticatorsTable = new cdk.aws_dynamodb.Table(scope, `Fido2AuthenticatorsTable${id}`, {
                billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
                pointInTimeRecovery: true,
                ...props.fido2.authenticatorsTableProps,
                partitionKey: {
                    name: "pk",
                    type: cdk.aws_dynamodb.AttributeType.STRING,
                },
                sortKey: {
                    name: "sk",
                    type: cdk.aws_dynamodb.AttributeType.STRING,
                },
                timeToLiveAttribute: "exp",
            });
            this.authenticatorsTable.addGlobalSecondaryIndex({
                indexName: "credentialId",
                partitionKey: {
                    name: "credentialId",
                    type: cdk.aws_dynamodb.AttributeType.BINARY,
                },
                projectionType: cdk.aws_dynamodb.ProjectionType.KEYS_ONLY,
            });
        }
        const createAuthChallengeEnvironment = {
            ALLOWED_ORIGINS: props.allowedOrigins?.join(",") ?? "",
            LOG_LEVEL: props.logLevel ?? "INFO",
        };
        if (props.magicLink) {
            Object.assign(createAuthChallengeEnvironment, {
                MAGIC_LINK_ENABLED: "TRUE",
                SES_FROM_ADDRESS: props.magicLink.sesFromAddress,
                SES_REGION: props.magicLink.sesRegion ?? "",
                KMS_KEY_ID: this.kmsKey instanceof cdk.aws_kms.Alias
                    ? this.kmsKey.aliasName
                    : this.kmsKey.keyId,
                DYNAMODB_SECRETS_TABLE: this.secretsTable.tableName,
                SECONDS_UNTIL_EXPIRY: props.magicLink.secondsUntilExpiry?.toSeconds().toString() ?? "900",
                MIN_SECONDS_BETWEEN: props.magicLink.minimumSecondsBetween?.toSeconds().toString() ?? "60",
                STACK_ID: cdk.Stack.of(scope).stackId,
            });
        }
        if (props.fido2) {
            Object.assign(createAuthChallengeEnvironment, {
                FIDO2_ENABLED: "TRUE",
                DYNAMODB_AUTHENTICATORS_TABLE: this.authenticatorsTable?.tableName ?? "",
                USER_VERIFICATION: props.fido2.userVerification ?? "required",
                EXPOSE_USER_CREDENTIAL_IDS: props.fido2.exposeUserCredentialIDs === false ? "" : "TRUE",
                STACK_ID: cdk.Stack.of(scope).stackId,
                SIGN_IN_TIMEOUT: props.fido2.timeouts?.signIn?.toString() ?? "120000",
            });
        }
        if (props.smsOtpStepUp) {
            Object.assign(createAuthChallengeEnvironment, {
                SMS_OTP_STEP_UP_ENABLED: "TRUE",
                OTP_LENGTH: props.smsOtpStepUp.otpLength
                    ? props.smsOtpStepUp.otpLength.toString()
                    : "",
                ORIGINATION_NUMBER: props.smsOtpStepUp.originationNumber ?? "",
                SENDER_ID: props.smsOtpStepUp.senderId ?? "",
                SNS_REGION: props.smsOtpStepUp.snsRegion ?? "",
            });
        }
        this.createAuthChallengeFn = new cdk.aws_lambda_nodejs.NodejsFunction(this, `CreateAuthChallenge${id}`, {
            entry: (0, path_1.join)(__dirname, "..", "custom-auth", "create-auth-challenge.js"),
            runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
            architecture: cdk.aws_lambda.Architecture.ARM_64,
            bundling: {
                format: cdk.aws_lambda_nodejs.OutputFormat.ESM,
            },
            timeout: cdk.Duration.seconds(5),
            ...props.functionProps?.createAuthChallenge,
            environment: {
                ...createAuthChallengeEnvironment,
                ...props.functionProps?.createAuthChallenge?.environment,
            },
        });
        this.secretsTable?.grantReadWriteData(this.createAuthChallengeFn);
        this.authenticatorsTable?.grantReadData(this.createAuthChallengeFn);
        if (props.magicLink) {
            this.createAuthChallengeFn.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
                effect: cdk.aws_iam.Effect.ALLOW,
                resources: [
                    `arn:${cdk.Aws.PARTITION}:ses:${props.magicLink.sesRegion ?? cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:identity/*`,
                ],
                actions: ["ses:SendEmail"],
            }));
        }
        this.createAuthChallengeFn.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: ["SNS:Publish"],
            notResources: ["arn:aws:sns:*:*:*"], // Only allow SMS sending, not publishing to topics
        }));
        [this.kmsKey, props.magicLink?.rotatedKmsKey].forEach((key) => {
            if (!key)
                return;
            if (key.aliasName) {
                const permissions = {
                    effect: cdk.aws_iam.Effect.ALLOW,
                    resources: [
                        `arn:${cdk.Aws.PARTITION}:kms:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:key/*`,
                    ],
                    actions: ["kms:Sign"],
                    conditions: {
                        StringLike: {
                            "kms:RequestAlias": key.node.defaultChild.aliasName, // have to get the raw string like this to prevent a circulair dependency
                        },
                    },
                };
                key.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
                    ...permissions,
                    principals: [this.createAuthChallengeFn.role.grantPrincipal],
                }));
                this.createAuthChallengeFn.addToRolePolicy(new cdk.aws_iam.PolicyStatement(permissions));
            }
            else {
                const permissions = {
                    effect: cdk.aws_iam.Effect.ALLOW,
                    resources: [key.keyArn],
                    actions: ["kms:Sign"],
                };
                key.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
                    ...permissions,
                    principals: [this.createAuthChallengeFn.role.grantPrincipal],
                }));
                this.createAuthChallengeFn.addToRolePolicy(new cdk.aws_iam.PolicyStatement(permissions));
            }
        });
        const verifyAuthChallengeResponseEnvironment = {
            ALLOWED_ORIGINS: props.allowedOrigins?.join(",") ?? "",
            LOG_LEVEL: props.logLevel ?? "INFO",
        };
        if (props.magicLink) {
            Object.assign(verifyAuthChallengeResponseEnvironment, {
                MAGIC_LINK_ENABLED: "TRUE",
                DYNAMODB_SECRETS_TABLE: this.secretsTable.tableName,
                STACK_ID: cdk.Stack.of(scope).stackId,
            });
        }
        if (props.fido2) {
            Object.assign(verifyAuthChallengeResponseEnvironment, {
                FIDO2_ENABLED: "TRUE",
                DYNAMODB_AUTHENTICATORS_TABLE: this.authenticatorsTable.tableName,
                ALLOWED_RELYING_PARTY_IDS: props.fido2.allowedRelyingPartyIds.join(",") ?? "",
                ENFORCE_FIDO2_IF_AVAILABLE: props.fido2?.enforceFido2IfAvailable
                    ? "TRUE"
                    : "",
                USER_VERIFICATION: props.fido2.userVerification ?? "required",
                STACK_ID: cdk.Stack.of(scope).stackId,
            });
        }
        if (props.smsOtpStepUp) {
            Object.assign(verifyAuthChallengeResponseEnvironment, {
                SMS_OTP_STEP_UP_ENABLED: "TRUE",
            });
        }
        this.verifyAuthChallengeResponseFn =
            new cdk.aws_lambda_nodejs.NodejsFunction(this, `VerifyAuthChallengeResponse${id}`, {
                entry: (0, path_1.join)(__dirname, "..", "custom-auth", "verify-auth-challenge-response.js"),
                runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
                architecture: cdk.aws_lambda.Architecture.ARM_64,
                bundling: {
                    format: cdk.aws_lambda_nodejs.OutputFormat.ESM,
                },
                timeout: cdk.Duration.seconds(5),
                ...props.functionProps?.verifyAuthChallengeResponse,
                environment: {
                    ...verifyAuthChallengeResponseEnvironment,
                    ...props.functionProps?.verifyAuthChallengeResponse?.environment,
                },
            });
        this.secretsTable?.grantReadWriteData(this.verifyAuthChallengeResponseFn);
        this.authenticatorsTable?.grantReadWriteData(this.verifyAuthChallengeResponseFn);
        [this.kmsKey, props.magicLink?.rotatedKmsKey]
            .filter(Boolean)
            .forEach((key) => {
            if (!key)
                return;
            if (key.aliasName) {
                this.verifyAuthChallengeResponseFn.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
                    effect: cdk.aws_iam.Effect.ALLOW,
                    resources: [
                        `arn:${cdk.Aws.PARTITION}:kms:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:key/*`,
                    ],
                    actions: ["kms:GetPublicKey"],
                    conditions: {
                        StringLike: {
                            "kms:RequestAlias": key.aliasName,
                        },
                    },
                }));
            }
            else {
                this.verifyAuthChallengeResponseFn.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
                    effect: cdk.aws_iam.Effect.ALLOW,
                    resources: [key.keyArn],
                    actions: ["kms:GetPublicKey"],
                }));
            }
        });
        this.defineAuthChallengeResponseFn =
            new cdk.aws_lambda_nodejs.NodejsFunction(this, `DefineAuthChallenge${id}`, {
                entry: (0, path_1.join)(__dirname, "..", "custom-auth", "define-auth-challenge.js"),
                runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
                architecture: cdk.aws_lambda.Architecture.ARM_64,
                bundling: {
                    format: cdk.aws_lambda_nodejs.OutputFormat.ESM,
                },
                timeout: cdk.Duration.seconds(5),
                ...props.functionProps?.defineAuthChallenge,
                environment: {
                    LOG_LEVEL: props.logLevel ?? "INFO",
                    ...props.functionProps?.defineAuthChallenge?.environment,
                },
            });
        if (props.clientMetadataTokenKeys) {
            this.preTokenGenerationFn = new cdk.aws_lambda_nodejs.NodejsFunction(this, `PreToken${id}`, {
                entry: (0, path_1.join)(__dirname, "..", "custom-auth", "pre-token.js"),
                runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
                architecture: cdk.aws_lambda.Architecture.ARM_64,
                bundling: {
                    format: cdk.aws_lambda_nodejs.OutputFormat.ESM,
                },
                ...props.functionProps?.preTokenGeneration,
                environment: {
                    LOG_LEVEL: props.logLevel ?? "INFO",
                    CLIENT_METADATA_PERSISTED_KEYS: [
                        "signInMethod",
                        ...(props.clientMetadataTokenKeys ?? []),
                    ].join(","),
                    ...props.functionProps?.preTokenGeneration?.environment,
                },
            });
        }
        if (!props.userPool) {
            const mergedProps = {
                passwordPolicy: {
                    minLength: 8,
                    requireDigits: true,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireSymbols: true,
                },
                signInAliases: {
                    username: false,
                    phone: false,
                    preferredUsername: false,
                    email: true,
                },
                ...props.userPoolProps,
                lambdaTriggers: {
                    ...props.userPoolProps?.lambdaTriggers,
                    defineAuthChallenge: this.defineAuthChallengeResponseFn,
                    createAuthChallenge: this.createAuthChallengeFn,
                    verifyAuthChallengeResponse: this.verifyAuthChallengeResponseFn,
                    preSignUp: this.preSignUpFn,
                    preTokenGeneration: this.preTokenGenerationFn,
                },
            };
            this.userPool = new cdk.aws_cognito.UserPool(scope, `UserPool${id}`, mergedProps);
        }
        else {
            props.userPool.addTrigger(cdk.aws_cognito.UserPoolOperation.CREATE_AUTH_CHALLENGE, this.createAuthChallengeFn);
            props.userPool.addTrigger(cdk.aws_cognito.UserPoolOperation.DEFINE_AUTH_CHALLENGE, this.defineAuthChallengeResponseFn);
            props.userPool.addTrigger(cdk.aws_cognito.UserPoolOperation.VERIFY_AUTH_CHALLENGE_RESPONSE, this.verifyAuthChallengeResponseFn);
            if (this.preSignUpFn) {
                props.userPool.addTrigger(cdk.aws_cognito.UserPoolOperation.PRE_SIGN_UP, this.preSignUpFn);
            }
            if (this.preTokenGenerationFn) {
                props.userPool.addTrigger(cdk.aws_cognito.UserPoolOperation.PRE_TOKEN_GENERATION, this.preTokenGenerationFn);
            }
            this.userPool = props.userPool;
        }
        if (props.fido2) {
            const defaultCorsOptionsWithoutAuth = {
                allowHeaders: ["Content-Type"],
                allowMethods: ["POST"],
                allowOrigins: props.allowedOrigins ?? [],
                maxAge: cdk.Duration.days(1),
            };
            const defaultCorsOptionsWithAuth = {
                ...defaultCorsOptionsWithoutAuth,
                allowHeaders: defaultCorsOptionsWithoutAuth.allowHeaders.concat([
                    "Authorization",
                ]),
            };
            if (props.fido2.updatedCredentialsNotification) {
                this.fido2NotificationFn = new cdk.aws_lambda_nodejs.NodejsFunction(this, `Fido2Notification${id}`, {
                    entry: (0, path_1.join)(__dirname, "..", "custom-auth", "fido2-notification.js"),
                    runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
                    architecture: cdk.aws_lambda.Architecture.ARM_64,
                    bundling: {
                        format: cdk.aws_lambda_nodejs.OutputFormat.ESM,
                    },
                    timeout: cdk.Duration.seconds(30),
                    ...props.functionProps?.fido2notification,
                    environment: {
                        LOG_LEVEL: props.logLevel ?? "INFO",
                        SES_FROM_ADDRESS: props.fido2.updatedCredentialsNotification.sesFromAddress,
                        SES_REGION: props.fido2.updatedCredentialsNotification.sesRegion ?? "",
                        USER_POOL_ID: this.userPool.userPoolId,
                        ...props.functionProps?.fido2notification?.environment,
                    },
                });
                this.fido2NotificationFn.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
                    effect: cdk.aws_iam.Effect.ALLOW,
                    resources: [
                        `arn:${cdk.Aws.PARTITION}:ses:${props.fido2.updatedCredentialsNotification.sesRegion ??
                            cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:identity/*`,
                    ],
                    actions: ["ses:SendEmail"],
                }));
                this.userPool.grant(this.fido2NotificationFn, "cognito-idp:AdminGetUser");
            }
            this.fido2Fn = new cdk.aws_lambda_nodejs.NodejsFunction(this, `Fido2${id}`, {
                entry: (0, path_1.join)(__dirname, "..", "custom-auth", "fido2-credentials-api.js"),
                runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
                architecture: cdk.aws_lambda.Architecture.ARM_64,
                bundling: {
                    format: cdk.aws_lambda_nodejs.OutputFormat.ESM,
                    banner: "import{createRequire}from 'module';const require=createRequire(import.meta.url);", // needed for cbor dependency, https://github.com/evanw/esbuild/issues/1921
                },
                timeout: cdk.Duration.seconds(30),
                ...props.functionProps?.fido2,
                environment: {
                    LOG_LEVEL: props.logLevel ?? "INFO",
                    DYNAMODB_AUTHENTICATORS_TABLE: this.authenticatorsTable.tableName,
                    COGNITO_USER_POOL_ID: this.userPool.userPoolId,
                    RELYING_PARTY_NAME: props.fido2.relyingPartyName ?? "",
                    ALLOWED_RELYING_PARTY_IDS: props.fido2.allowedRelyingPartyIds.join(",") ?? "",
                    ALLOWED_ORIGINS: props.allowedOrigins?.join(",") ?? "",
                    ATTESTATION: props.fido2.attestation ?? "none",
                    USER_VERIFICATION: props.fido2.userVerification ?? "required",
                    AUTHENTICATOR_ATTACHMENT: props.fido2.authenticatorAttachment ?? "",
                    REQUIRE_RESIDENT_KEY: props.fido2.residentKey ?? "",
                    AUTHENTICATOR_REGISTRATION_TIMEOUT: props.fido2.timeouts?.credentialRegistration?.toString() ??
                        "300000",
                    CORS_ALLOWED_ORIGINS: defaultCorsOptionsWithAuth.allowOrigins.join(","),
                    CORS_ALLOWED_HEADERS: defaultCorsOptionsWithAuth.allowHeaders.join(","),
                    CORS_ALLOWED_METHODS: defaultCorsOptionsWithAuth.allowMethods.join(","),
                    CORS_MAX_AGE: defaultCorsOptionsWithAuth.maxAge
                        .toSeconds()
                        .toString(),
                    FIDO2_NOTIFICATION_LAMBDA_ARN: this.fido2NotificationFn?.latestVersion.functionArn ?? "",
                    ...props.functionProps?.fido2?.environment,
                },
            });
            this.fido2NotificationFn?.latestVersion.grantInvoke(this.fido2Fn);
            this.authenticatorsTable.grantReadWriteData(this.fido2Fn);
            this.fido2challengeFn = new cdk.aws_lambda_nodejs.NodejsFunction(this, `Fido2Challenge${id}`, {
                entry: (0, path_1.join)(__dirname, "..", "custom-auth", "fido2-challenge-api.js"),
                runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
                architecture: cdk.aws_lambda.Architecture.ARM_64,
                bundling: {
                    format: cdk.aws_lambda_nodejs.OutputFormat.ESM,
                },
                timeout: cdk.Duration.seconds(30),
                ...props.functionProps?.fido2challenge,
                environment: {
                    LOG_LEVEL: props.logLevel ?? "INFO",
                    DYNAMODB_AUTHENTICATORS_TABLE: this.authenticatorsTable.tableName,
                    SIGN_IN_TIMEOUT: props.fido2.timeouts?.signIn?.toString() ?? "120000",
                    USER_VERIFICATION: props.fido2.userVerification ?? "required",
                    CORS_ALLOWED_ORIGINS: defaultCorsOptionsWithoutAuth.allowOrigins.join(","),
                    CORS_ALLOWED_HEADERS: defaultCorsOptionsWithoutAuth.allowHeaders.join(","),
                    CORS_ALLOWED_METHODS: defaultCorsOptionsWithoutAuth.allowMethods.join(","),
                    CORS_MAX_AGE: defaultCorsOptionsWithoutAuth.maxAge
                        .toSeconds()
                        .toString(),
                    ...props.functionProps?.fido2challenge?.environment,
                },
            });
            this.fido2challengeFn.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
                effect: cdk.aws_iam.Effect.ALLOW,
                actions: ["dynamodb:PutItem"],
                resources: [this.authenticatorsTable.tableArn],
                conditions: {
                    "ForAllValues:StringEquals": {
                        "dynamodb:Attributes": ["pk", "sk", "exp"],
                    },
                },
            }));
            const accessLogs = new cdk.aws_logs.LogGroup(this, `ApigwAccessLogs${id}`, {
                retention: cdk.aws_logs.RetentionDays.INFINITE,
            });
            const authorizer = new cdk.aws_apigateway.CognitoUserPoolsAuthorizer(scope, `CognitoAuthorizer${id}`, {
                cognitoUserPools: [this.userPool],
                resultsCacheTtl: cdk.Duration.minutes(1),
            });
            this.fido2Api = new cdk.aws_apigateway.LambdaRestApi(this, `RestApi${id}`, {
                proxy: false,
                handler: this.fido2Fn,
                ...props.fido2.api?.restApiProps,
                deployOptions: {
                    loggingLevel: cdk.aws_apigateway.MethodLoggingLevel.ERROR,
                    metricsEnabled: true,
                    stageName: "v1",
                    throttlingBurstLimit: props.fido2.api?.throttlingBurstLimit ?? 1000,
                    throttlingRateLimit: props.fido2.api?.throttlingRateLimit ?? 2000,
                    accessLogDestination: new cdk.aws_apigateway.LogGroupLogDestination(accessLogs),
                    accessLogFormat: cdk.aws_apigateway.AccessLogFormat.custom(JSON.stringify({
                        requestId: cdk.aws_apigateway.AccessLogField.contextRequestId(),
                        jwtSub: cdk.aws_apigateway.AccessLogField.contextAuthorizerClaims("sub"),
                        jwtIat: cdk.aws_apigateway.AccessLogField.contextAuthorizerClaims("iat"),
                        jwtEventId: cdk.aws_apigateway.AccessLogField.contextAuthorizerClaims("event_id"),
                        jwtJti: cdk.aws_apigateway.AccessLogField.contextAuthorizerClaims("jti"),
                        jwtOriginJti: cdk.aws_apigateway.AccessLogField.contextAuthorizerClaims("origin_jti"),
                        jwtSignInMethod: cdk.aws_apigateway.AccessLogField.contextAuthorizerClaims("sign_in_method"),
                        userAgent: cdk.aws_apigateway.AccessLogField.contextIdentityUserAgent(),
                        sourceIp: cdk.aws_apigateway.AccessLogField.contextIdentitySourceIp(),
                        requestTime: cdk.aws_apigateway.AccessLogField.contextRequestTime(),
                        requestTimeEpoch: cdk.aws_apigateway.AccessLogField.contextRequestTimeEpoch(),
                        httpMethod: cdk.aws_apigateway.AccessLogField.contextHttpMethod(),
                        path: cdk.aws_apigateway.AccessLogField.contextPath(),
                        status: cdk.aws_apigateway.AccessLogField.contextStatus(),
                        authorizerError: cdk.aws_apigateway.AccessLogField.contextAuthorizerError(),
                        apiError: cdk.aws_apigateway.AccessLogField.contextErrorMessage(),
                        protocol: cdk.aws_apigateway.AccessLogField.contextProtocol(),
                        responseLength: cdk.aws_apigateway.AccessLogField.contextResponseLength(),
                        responseLatency: cdk.aws_apigateway.AccessLogField.contextResponseLatency(),
                        domainName: cdk.aws_apigateway.AccessLogField.contextDomainName(),
                    })),
                    ...props.fido2.api?.restApiProps?.deployOptions,
                },
            });
            if (props.fido2.api?.addCloudWatchLogsRoleAndAccountSetting !== false) {
                const logRole = new cdk.aws_iam.Role(scope, "ApiGatewayCloudWatchLogsRole", {
                    assumedBy: new cdk.aws_iam.ServicePrincipal("apigateway.amazonaws.com"),
                    managedPolicies: [
                        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonAPIGatewayPushToCloudWatchLogs"),
                    ],
                });
                const accountSetting = new cdk.aws_apigateway.CfnAccount(scope, "ApiGatewayAccountSetting", {
                    cloudWatchRoleArn: logRole.roleArn,
                });
                this.fido2Api.node.addDependency(accountSetting);
            }
            if (!props.userPoolClients) {
                this.userPoolClients = [
                    this.userPool.addClient(`UserPoolClient${id}`, {
                        generateSecret: false,
                        authFlows: {
                            adminUserPassword: false,
                            userPassword: false,
                            userSrp: false,
                            custom: true,
                        },
                        preventUserExistenceErrors: true,
                        ...props.userPoolClientProps,
                    }),
                ];
            }
            else {
                this.userPoolClients = props.userPoolClients;
            }
            // Create resource structure
            const registerAuthenticatorResource = this.fido2Api.root.addResource("register-authenticator");
            const startResource = registerAuthenticatorResource.addResource("start");
            const completeResource = registerAuthenticatorResource.addResource("complete");
            const authenticatorsResource = this.fido2Api.root.addResource("authenticators");
            const listResource = authenticatorsResource.addResource("list");
            const deleteResource = authenticatorsResource.addResource("delete");
            const updateResource = authenticatorsResource.addResource("update");
            const requestValidator = new cdk.aws_apigateway.RequestValidator(scope, "ReqValidator", {
                restApi: this.fido2Api,
                requestValidatorName: "req-validator",
                validateRequestBody: true,
                validateRequestParameters: true,
            });
            // register-authenticator/start
            startResource.addCorsPreflight(defaultCorsOptionsWithAuth);
            startResource.addMethod("POST", undefined, {
                authorizer: authorizer,
                requestParameters: {
                    "method.request.querystring.rpId": true,
                },
                requestValidator,
            });
            // register-authenticator/complete
            const completeRegistrationModel = new cdk.aws_apigateway.Model(scope, `CompleteRegistrationModel${id}`, {
                restApi: this.fido2Api,
                contentType: "application/json",
                description: "Create FIDO2 credential request body",
                modelName: "registerAuthenticatorComplete",
                schema: {
                    type: cdk.aws_apigateway.JsonSchemaType.OBJECT,
                    required: [
                        "clientDataJSON_B64",
                        "attestationObjectB64",
                        "friendlyName",
                    ],
                    properties: {
                        clientDataJSON_B64: {
                            type: cdk.aws_apigateway.JsonSchemaType.STRING,
                            minLength: 1,
                        },
                        attestationObjectB64: {
                            type: cdk.aws_apigateway.JsonSchemaType.STRING,
                            minLength: 1,
                        },
                        friendlyName: {
                            type: cdk.aws_apigateway.JsonSchemaType.STRING,
                            minLength: 1,
                            maxLength: 256,
                        },
                        transports: {
                            type: cdk.aws_apigateway.JsonSchemaType.ARRAY,
                            items: {
                                type: cdk.aws_apigateway.JsonSchemaType.STRING,
                                enum: ["usb", "nfc", "ble", "internal", "hybrid"],
                            },
                        },
                    },
                },
            });
            completeResource.addCorsPreflight(defaultCorsOptionsWithAuth);
            completeResource.addMethod("POST", undefined, {
                authorizer: authorizer,
                requestValidator,
                requestModels: {
                    "application/json": completeRegistrationModel,
                },
            });
            // authenticators/list
            listResource.addCorsPreflight(defaultCorsOptionsWithAuth);
            listResource.addMethod("POST", undefined, {
                authorizer: authorizer,
                requestParameters: {
                    "method.request.querystring.rpId": true,
                },
                requestValidator,
            });
            // authenticators/delete
            const deleteCredentialsModel = new cdk.aws_apigateway.Model(scope, `DeleteCredentialModel${id}`, {
                restApi: this.fido2Api,
                contentType: "application/json",
                description: "Delete FIDO2 credential request body",
                modelName: "credentialDelete",
                schema: {
                    type: cdk.aws_apigateway.JsonSchemaType.OBJECT,
                    required: ["credentialId"],
                    properties: {
                        credentialId: {
                            type: cdk.aws_apigateway.JsonSchemaType.STRING,
                            minLength: 1,
                        },
                    },
                },
            });
            deleteResource.addCorsPreflight(defaultCorsOptionsWithAuth);
            deleteResource.addMethod("POST", undefined, {
                authorizer: authorizer,
                requestValidator,
                requestModels: {
                    "application/json": deleteCredentialsModel,
                },
            });
            // register-authenticator/update
            const updateCredentialsModel = new cdk.aws_apigateway.Model(scope, `UpdateCredentialModel${id}`, {
                restApi: this.fido2Api,
                contentType: "application/json",
                description: "Update FIDO2 credential request body",
                modelName: "credentialUpdate",
                schema: {
                    type: cdk.aws_apigateway.JsonSchemaType.OBJECT,
                    required: ["credentialId", "friendlyName"],
                    properties: {
                        credentialId: {
                            type: cdk.aws_apigateway.JsonSchemaType.STRING,
                            minLength: 1,
                        },
                        friendlyName: {
                            type: cdk.aws_apigateway.JsonSchemaType.STRING,
                            minLength: 1,
                            maxLength: 256,
                        },
                    },
                },
            });
            updateResource.addCorsPreflight(defaultCorsOptionsWithAuth);
            updateResource.addMethod("POST", undefined, {
                authorizer: authorizer,
                requestValidator,
                requestModels: {
                    "application/json": updateCredentialsModel,
                },
            });
            // sign-in-challenge
            const signInChallenge = this.fido2Api.root.addResource("sign-in-challenge");
            signInChallenge.addCorsPreflight(defaultCorsOptionsWithoutAuth);
            signInChallenge.addMethod("POST", new cdk.aws_apigateway.LambdaIntegration(this.fido2challengeFn), {
                authorizer: undefined, // public API
            });
            if (props.fido2.api?.addWaf !== false) {
                this.fido2ApiWebACL = new cdk.aws_wafv2.CfnWebACL(scope, `Fido2ApiWebACL${id}`, {
                    defaultAction: {
                        allow: {},
                    },
                    scope: "REGIONAL",
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: `Fido2ApiWebACL${id}`,
                        sampledRequestsEnabled: true,
                    },
                    rules: [
                        {
                            name: "RateLimitPerIP",
                            priority: 1,
                            action: {
                                block: {},
                            },
                            visibilityConfig: {
                                sampledRequestsEnabled: true,
                                cloudWatchMetricsEnabled: true,
                                metricName: "RateLimitPerIP",
                            },
                            statement: {
                                rateBasedStatement: {
                                    limit: props.fido2.api?.wafRateLimitPerIp ?? 100,
                                    aggregateKeyType: "FORWARDED_IP",
                                    forwardedIpConfig: {
                                        headerName: "X-Forwarded-For",
                                        fallbackBehavior: "MATCH",
                                    },
                                },
                            },
                        },
                    ],
                });
                new cdk.aws_wafv2.CfnWebACLAssociation(scope, `WafAssociation${id}`, {
                    resourceArn: this.fido2Api.deploymentStage.stageArn,
                    webAclArn: this.fido2ApiWebACL.attrArn,
                });
            }
        }
    }
}
exports.Passwordless = Passwordless;
