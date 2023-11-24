# BPT Passwordless Authentication

_**By using Passwordless with Zero Trust concept to enhance Cloud-Native Security**_

This research paper relates to passwordless authentication that based on **FIDO2** by examining the transition from traditional password-based security measures to a system where access tokens become the primary credential. By testing on **AWS Cloud Environment** in comparison with three different methods of authentication: password-based, passwordless, and passwordless per session. This work will also focus on securing the token for passwordless authentication which is normally not that secure.


## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [References](#references)


## Installation

Firstly, our project will be deploy on **AWS**. So using **Cloud9 IDE** is highly recomended.

You'll  set up the backend using **AWS CDK** to create a **CloudFormation** stack to deploy an **Amazon Cognito User Pool**, and add Passwordless authentication to it.

Then, you'll create a web application that works against that backend, to demonstrate Passwordless sign-in. Assuming the environment we are setting up is using **Windows**.

- [Environment Setup](#environment-setup)
- [Deploying back-end API](#deploy-back-end-api)
- [Deploying front-end](#deploy-front-end)
- [Deploying the web application](#deploying-the-web-application)

### Environment Setup

These are components required in order to run the **BPT Passwordless Authentication Tech Demo**:

- [Node.js](#nodejs)
- [AWS CDK](#aws-cdk)
- [Environment Variables](#environment-variables)

#### Node.js

To install **Node.js** visit the [node.js website](https://nodejs.org/en).

If you have an old version of **Node.js** installed on your system, it may be required to run the ``.msi`` installation as Administrator.
If you already have **Node.js** installed, verify that you have a compatible version:

```
node --version
```
Output should be >= 20.x:

```
v20.10.0
```
#### AWS CDK

Next, you’ll install the **AWS CDK Toolkit**. The toolkit is a command-line utility which allows you to work with **CDK** apps.

Open a terminal session and run the following command as an Administrator:
```
npm install -g aws-cdk --force
```
This will install **AWS CDK**, or update it to the latest version if it was already installed:

You can check the toolkit version:

```
cdk --version
```
Output should be something like:
```
2.80.0 (build bbdb16a)
```

#### Environment Variables

In this workshop you'll be building a front end, amongst other things. To be able to open the front end in developer mode, you need to know the preview URL.

Execute the following commands in the terminal:

```
export WS_REGION=$(aws configure get default.region)
export WS_PREVIEW_HOST="$C9_PID.vfs.cloud9.$WS_REGION.amazonaws.com"
export WS_PREVIEW_URL="https://${WS_PREVIEW_HOST}"
```
Specify an e-mail address for the test user you will create and use in this workshop. Use an e-mail address you have easy access to since we do not have registration system. So we must include the user within database for authentication system manually:

```
export WS_EMAIL=<replace with your email>
```

Let's double check your environment variables are set properly:

```
env | grep WS_
```

That should show environment variables with sensible values: `WS_REGION`, `WS_PREVIEW_HOST`, `WS_PREVIEW_URL`, and `WS_EMAIL`.

### Deploying back-end API

You will create a **CDK** app to deploy the backend with the Passwordless additions to enable **FIDO2** in order to use the **BPT Passwordless Authentication Tech Demo**. 

Start a new **CDK** project, let's use **TypeScript**:
```
mkdir -p cdk
cd cdk
npx cdk init app --language typescript
```
Then, install **BPT Passwordless Authentication Tech Demo**. We've wrapped the code in a **NPM** package for convenient installation and use:

```shell
npm install bpt-passwordless-pack
```

Edit the file `lib/cdk-stack.ts` (in the `cdk` folder) as follow:
Noted that you can  customize `userPool`, `KMS`, `Lambda API`, `Firewall`, etc as the way you want.

```typescript
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Passwordless } from "bpt-passwordless-pack/cdk";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /** Create User Pool */
    const userPool = new cdk.aws_cognito.UserPool(this, "UserPool", {
      signInAliases: {
        username: false,
        email: true,
      },
    });

    /** Bucket for Web App assets */
    const bucket = new cdk.aws_s3.Bucket(this, "Bucket", {
      enforceSSL: true,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /** OAI for secure bucket access by CloudFront */
    const originAccessIdentity = new cdk.aws_cloudfront.OriginAccessIdentity(
      this,
      "OAI"
    );

    /** CloudFront distribution to serve Web app from S3 bucket */
    const distribution = new cdk.aws_cloudfront.Distribution(
      this,
      "Distribution",
      {
        defaultBehavior: {
          origin: new cdk.aws_cloudfront_origins.S3Origin(bucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy:
            cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          responseHeadersPolicy:
            cdk.aws_cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        },
        defaultRootObject: "index.html",
        errorResponses: [{ httpStatus: 403, responsePagePath: "/index.html" }],
      }
    );

    /** Add Passwordless authentication to the User Pool */
    const passwordless = new Passwordless(this, "Passwordless", {
      userPool,
      allowedOrigins: [
        process.env.WS_PREVIEW_URL!,
        `https://${distribution.distributionDomainName}`,
      ],
      fido2: {
        allowedRelyingPartyIds: [
          process.env.WS_PREVIEW_HOST!,
          distribution.distributionDomainName,
        ],
      },
      magicLink: {
        sesFromAddress: process.env.WS_EMAIL!,
      },
    });

    /** Add test user to User Pool */
    const user = new cdk.aws_cognito.CfnUserPoolUser(this, "TestUser", {
      userPoolId: passwordless.userPool.userPoolId,
      username: process.env.WS_EMAIL!,
      messageAction: "SUPPRESS",
      userAttributes: [
        {
          name: "email",
          value: process.env.WS_EMAIL!,
        },
        {
          name: "email_verified",
          value: "true",
        },
      ],
    });
    user.node.addDependency(userPool.node.findChild("PreSignUpCognito"));

    /** Verify email address of test user */
    new cdk.aws_ses.EmailIdentity(this, "SesVerification", {
      identity: cdk.aws_ses.Identity.email(process.env.WS_EMAIL!),
    });

    /** Let's grab the ClientId that the Passwordless solution created for us */
    new cdk.CfnOutput(this, "ClientId", {
      value: passwordless.userPoolClients!.at(0)!.userPoolClientId,
    });

    /** Let's grab the FIDO2 API base URL. This is the API with which (signed-in) users can manage FIDO2 credentials */
    new cdk.CfnOutput(this, "Fido2Url", {
      value: passwordless.fido2Api!.url!,
    });

    /** Let's grab the bucket name where we'll need to upload the front end to */
    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
    });

    /** Let's grab the CloudFront distribution URL, we'll need it for accessing the front end */
    new cdk.CfnOutput(this, "WebAppUrl", {
      value: `https://${distribution.distributionDomainName}`,
    });
  }
}
```

You should now be ready to deploy, but let's first double check your environment variables are set properly:

```shell
env | grep WS_
```
That should show environment variables with sensible values: `WS_REGION`, `WS_PREVIEW_HOST`, `WS_PREVIEW_URL`, and `WS_EMAIL`. Otherwise, follow the instructions to set up the environment variables here: Populate environment variables

Before being able to cdk deploy into a region in an **AWS** account you must bootstrap **CDK**. You only need to do this once for an **AWS** account and region:

```shell
cdk bootstrap
```

When bootstrapping is done, you're ready to deploy the **CDK** stack. Let's do it!:

```shell
cdk deploy --method direct
```

Noted that the **CDK** deployment may take several minutes. While that's running we recommend you already proceed to the next step. Once you see the deployment is running (you'll see `CREATE_IN_PROGRESS`), you can press `ctrl+c` to stop monitoring the **CDK** deployment: it will continue in the background.

### Deploying front-end

In this section, you'll create **BPT Passwordless Authentication Tech Demo** as a React web application. You'll configure the web application to work with the back end that you deployed in the previous steps.


You'll build our front end with React  and you'll use Vite  to bootstrap your project.

1. Bootstrap our React Project with Vite
Within the cdk directory, enter the following command:

```shell
cd ..
npm create vite@latest webapp
```
The installer will ask you a few questions, select the following:

- Framework: React
- Variant: TypeScript + SWC

2. Modify App Configuration File
Further in the workshop you'll run the web app locally before deploying it for hosting. For better support of **Cloud9** you want the app to run locally over port 8080. To accomplish this, open the `webapp/vite.config.ts` file and replace the entire contents with the following:

```TypeScript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080
  },
  preview: {
    port: 8080
  }
})
```

3. Install Dependencies
Back in the CLI, you're going to move into the `/webapp` directory and install the dependencies with the following:

```shell
cd webapp
npm install
```

The basic sample React web app is ready, but you're going to make some changes first. In the next steps, you're going to add passwordless authentication to the app and configure it to use the back end you deployed earlier.

Then, install **BPT Passwordless Authentication Tech Demo** again in this directory:

```shell
npm install bpt-passwordless-pack
```

To check wheather the package is install, you can check by using the following:

```shell
npm list
```

4. Import Passwordless Authentication Package
Import the package installed on the previous section into the react web application we created earlier.

Open the `webapp/src/main.tsx` file and add the below code after the existing imports. This will import the passwordless dependencies you just installed into the web app.

Ensure to keep all existing imports in place.

```TypeScript
import { Passwordless } from "bpt-passwordless-pack";
import {
  PasswordlessContextProvider,
  Fido2Toast,
  Passwordless as PasswordlessComponent,
} from "bpt-passwordless-pack";
import "bpt-passwordless-pack/passwordless.css";
```

Open the webapp/src/index.css file and add the below CSS styling at the top of the file and save your changes. Keep all existing styling in place. This will ensure the front end renders correctly in the browser

```TypeScript
#root .passwordless-main-container {
  min-height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
}
```

Next, open the `webapp/src/App.tsx` file and add the passwordless construct and the ability to manage registered authenticators.

Replace the entire contents of the `webapp/src/App.tsx` file with the below code and save the file:

```TypeScript
import "./App.css";
import { usePasswordless } from "bpt-passwordless-pack/react";

function App() {
  const {
    signOut,
    showAuthenticatorManager,
    toggleShowAuthenticatorManager,
    tokensParsed,
  } = usePasswordless();

  return (
    <div className="app">
      <h1>Passwordless Demo App</h1>
      <h2>Hello {tokensParsed?.idToken.email}!</h2>
      <button onClick={signOut}>Sign out</button>
      <button
        onClick={() => toggleShowAuthenticatorManager()}
        disabled={showAuthenticatorManager}
      >
        Manage authenticators
      </button>
    </div>
  );
}

export default App;
```

### Deploying the web application

In this section you're going to build and deploy the front end React app to the **Amazon S3** bucket you deployed earlier. The front end web app will use a **CloudFront** distribution to serve up the **React** app.

1. Build front end
From the command line and within the webapp/ directory let's build our app and create a distribution directory by running the following:

```shell
npm run build
```

2. Deploy to Amazon S3
After building our web app, a new `webapp/dist` directory is created and the contents of this directory is what will be uploaded to the **Amazon S3** bucket and ultimately served from the **CloudFront** distribution. Within the `webapp/` directory you're going to upload the front end to the Amazon S3 bucket by running the below command:

```shell
npx s3-spa-upload dist <REPLACE-WITH-YOUR-S3-BUCKET-NAME>
```


## Features

This library includes:

- A **CDK** construct that deploys an **Amazon Cognito User Pool** with Custom Authorization configured to support the passwordless authentication flows (includes other AWS Services needed, notably **DynamoDB** and **HTTP API**).
- **Web** functions to use in your Web Apps, to help implement the corresponding front-end.
- **React** and **React Native** **hooks**, to make it even easier to use passwordless authentication in React and React Native.
- **React** prebuilt **components** that you can drop into your webapp to get started with something that works quickly, as a basis for further development.

Other noteworthy features:

- This library is built from the ground up in **plain TypeScript** and has **very few dependencies** besides `aws-sdk` and `aws-cdk-lib`. Most batteries are included:
  - The **FIDO2** back-end implementation only depends on `cbor`
  - The (plain) **Web client** implementation has no dependencies
  - The **React** Web client implementation only has a peer dependency on `react` itself
- The **JWT Token** will use **Memory Storage** for storing the credential instead of traditional storage. This will resulting in more secure and phising-proof token.

## References

The reference for **BPT Passwordless Authentication Tech Demo** is from the following video:

[![Solution Intro on YouTube](https://img.youtube.com/vi/hY54Zy-l6hc/0.jpg)](https://www.youtube.com/watch?v=hY54Zy-l6hc)
