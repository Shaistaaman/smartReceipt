# Smart Receipts Tracker - Cloud Architecture

@startuml
!theme amiga

title Smart Receipts Tracker Architecture

skinparam {
  shadowing false
  Padding 5
  ArrowColor #238636
  BorderColor #238636
  FontColor #238636
  BackgroundColor #F6F8FA
  ArrowThickness 2
  RectangleBorderThickness 2
}

rectangle "User Interface (Frontend)" as UI #lightblue {
  rectangle "React App" as ReactApp
}

cloud "AWS Cloud" as AWS #lightgray {
  rectangle "Amazon Cognito" as Cognito #orange {
    component "User Pool" as UserPool
    component "Identity Pool" as IdentityPool
  }

  rectangle "AWS Lambda" as Lambda #red {
    component "UploadImageLambda" as UploadImage
    component "BedrockCategorizationLambda" as BedrockLambda
    component "SaveExpenseLambda" as SaveExpense
    component "GetExpensesLambda" as GetExpenses
    component "UpdateExpenseLambda" as UpdateExpense
    component "DeleteExpenseLambda" as DeleteExpense
    component "GetPresignedUrlLambda" as GetPresignedUrl
  }

  rectangle "Amazon S3" as S3 #yellow {
    component "Receipt Images Bucket" as S3Bucket
    component "Frontend Hosting Bucket" as FrontendBucket
  }

  rectangle "Amazon DynamoDB" as DynamoDB #green {
    component "SmartReceiptsExpenses Table" as DynamoDBTable
  }

  rectangle "Amazon Bedrock" as Bedrock #purple {
    component "Claude 3 Model" as Claude3
  }
}

UI --> Cognito : Authenticates (User Pool)
UI --> IdentityPool : Gets AWS Credentials (Identity Pool)
IdentityPool --> Lambda : Invokes Lambdas with Credentials

UploadImage --> S3Bucket : Stores Image
BedrockLambda --> S3Bucket : Retrieves Image
BedrockLambda --> Bedrock : Invokes Model
Bedrock --> BedrockLambda : Returns Categorized Data
SaveExpense --> DynamoDBTable : Saves Expense Data
GetExpenses --> DynamoDBTable : Fetches Expense Data
UpdateExpense --> DynamoDBTable : Updates Expense Data
DeleteExpense --> DynamoDBTable : Deletes Expense Data
GetPresignedUrl --> S3Bucket : Generates Presigned URL

@enduml

This document outlines the cloud architecture and deployment steps for the Smart Receipts Tracker application, designed for easy replication and scalability. You can visualize this diagram in diagrams.net (formerly draw.io) by following these steps:

1.  Go to app.diagrams.net.
2.  From the menu, select Arrange > Insert > Advanced > PlantUML.
3.  Paste the PlantUML code (everything between @startuml and @enduml) into the dialog box.
4.  Click Insert.

## I. Core Services Setup

### 1. AWS Account and Prerequisites

*   **AWS Account**: Ensure you have an active AWS account.
*   **AWS CLI**: Configure AWS CLI with appropriate credentials and a default region.
*   **Bedrock Model Access**: Verify that `anthropic.claude-3-haiku-20240307-v1:0` (or another suitable Claude 3 model) is enabled for your AWS account in the Bedrock console.

### 2. Amazon Cognito User Pool (Authentication & Authorization)

This will handle user sign-up, sign-in, and access control.

*   **Create User Pool**:
    *   **Sign-in options**: Select "Email" and "Password".
    *   **Password policy**: Configure as per security requirements.
    *   **User confirmation**: Use "Default email" for user confirmation.
    *   **App Client**: Create an App Client for your frontend application to interact with the User Pool. Note down the User Pool ID and App Client ID.
*   **IAM Role for Cognito**: Ensure Cognito has permissions to send emails for verification.

### 3. Amazon Cognito Identity Pool (Federated Identities)

This pool allows authenticated users from the User Pool to obtain temporary AWS credentials for accessing other AWS services.

*   **Create Identity Pool**: Link to your User Pool as an authentication provider.
*   **IAM Roles for Identity Pool**: Create authenticated and unauthenticated roles. The authenticated role will have permissions to invoke specific Lambda functions.

### 4. Amazon S3 Buckets

*   **Receipt Images Bucket**: This bucket will store the uploaded receipt images (e.g., `smart-receipts-images-<your-account-id>`).
    *   **Bucket Policy**: Configure a bucket policy that allows your Lambda functions to put and get objects.
*   **Frontend Hosting Bucket**: This bucket will host your React application (e.g., `smart-receipts-frontend-bucket`).
    *   **Static Website Hosting**: Configure the bucket for static website hosting with `index.html` as the index and error document.
    *   **Bucket Policy**: Set a bucket policy to allow public read access to the objects.
    *   **Block Public Access Settings**: Disable these settings for the bucket to allow public access.

### 5. Amazon DynamoDB Table (Expense Data Storage)

This table will store the categorized expense data.

*   **Create DynamoDB Table**: Create a new DynamoDB table (e.g., `SmartReceiptsExpenses`).
*   **Primary Key**: Define a suitable primary key (e.g., `userId` as partition key, `expenseId` as sort key).
*   **Indexes**: Consider creating secondary indexes if specific query patterns are anticipated (e.g., querying by date or category).

### 6. IAM Roles and Policies

Create specific IAM roles with least-privilege policies for each service to interact securely.

*   **Lambda Execution Role (`SmartReceiptsLambdaRole`)**:
    *   `AWSLambdaBasicExecutionRole` (for CloudWatch logs).
    *   Permissions for `s3:PutObject`, `s3:GetObject` on your Receipt Images S3 bucket.
    *   Permissions for `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:UpdateItem`, `dynamodb:Query`, `dynamodb:DeleteItem` on your DynamoDB table.
    *   Permissions for `bedrock:InvokeModel` for the Bedrock Lambda.
    *   Permissions for `s3:GetObject` and `s3:PutObject` for generating pre-signed URLs.
*   **Cognito Authenticated Role (`CognitoAuthRole`)**:
    *   Assumed by authenticated users from the Identity Pool.
    *   Permissions for `lambda:InvokeFunction` on all relevant Lambda functions (`UploadImageLambda`, `BedrockCategorizationLambda`, `SaveExpenseLambda`, `GetExpensesLambda`, `UpdateExpenseLambda`, `DeleteExpenseLambda`, `GetPresignedUrlLambda`).

## II. Backend Logic Deployment

### 1. AWS Lambda Functions

These functions will contain the core business logic.

*   **`UploadImageLambda`**:
    *   **Trigger**: Invoked directly from the UI.
    *   **Functionality**: Receives base64 encoded image data and metadata. Uploads the image to the designated S3 bucket. Returns the S3 object key.
    *   **Runtime**: Python.
*   **`BedrockCategorizationLambda`**:
    *   **Trigger**: Invoked directly from the UI.
    *   **Functionality**: Receives the S3 image key. Retrieves the image from S3. Calls the AWS Bedrock API (`anthropic.claude-3-haiku-20240307-v1:0`) with the image and the predefined categories. Parses the Bedrock response to extract vendor, amount, category, description, and date. Missing values are set to "Not Applicable".
    *   **Runtime**: Python.
*   **`SaveExpenseLambda`**:
    *   **Trigger**: Invoked directly from the UI.
    *   **Functionality**: Receives structured expense data (vendor, amount, category, date, description, userId, s3_key). Saves this data as a new item in the DynamoDB `SmartReceiptsExpenses` table. Amount is stored as a string.
    *   **Runtime**: Python.
*   **`GetExpensesLambda`**:
    *   **Trigger**: Invoked directly from the UI.
    *   **Functionality**: Receives `userId`. Queries the DynamoDB `SmartReceiptsExpenses` table to retrieve all expenses for that user. Returns a list of expense items.
    *   **Runtime**: Python.
*   **`UpdateExpenseLambda`**:
    *   **Trigger**: Invoked directly from the UI.
    *   **Functionality**: Receives updated expense data (including `userId` and `expenseId`). Updates the corresponding item in the DynamoDB `SmartReceiptsExpenses` table.
    *   **Runtime**: Python.
*   **`DeleteExpenseLambda`**:
    *   **Trigger**: Invoked directly from the UI.
    *   **Functionality**: Receives `userId` and `expenseId`. Deletes the specified item from the DynamoDB `SmartReceiptsExpenses` table.
    *   **Runtime**: Python.
*   **`GetPresignedUrlLambda`**:
    *   **Trigger**: Invoked directly from the UI.
    *   **Functionality**: Receives an S3 object key. Generates and returns a pre-signed URL for temporary access to the S3 object.
    *   **Runtime**: Python.

## III. Frontend Integration

### 1. Configure Frontend Application

*   **AWS SDK**: Use the AWS SDK for JavaScript in your React application.
*   **Configuration**: Update your frontend's configuration with:
    *   Cognito User Pool ID
    *   Cognito App Client ID
    *   Cognito Identity Pool ID
    *   AWS Region

### 2. Implement Authentication Flow

*   **Sign-up/Sign-in**: Integrate Cognito SDK for user registration, login, and session management.
*   **Dashboard Access**: Upon successful authentication, redirect the user to the Dashboard component.

### 3. Data Service Layer (`dataService.ts`)

*   Replaces `localStorage` interactions.
*   Provides functions (`getExpenses`, `saveExpense`, `updateExpense`, `deleteExpense`) that invoke corresponding Lambda functions to interact with DynamoDB.
*   Handles data mapping between frontend `Expense` objects and DynamoDB item structure (e.g., `expenseId` to `id`, `s3_key` to `receiptUrl`).

### 4. Implement Receipt Upload Flow

*   **User Interface**: Provide an interface (e.g., using `UploadCard.tsx`, `UploadFlow.tsx`) for users to select and upload receipt images.
*   **Process**: When an image is selected, it's converted to base64.
    1.  `UploadImageLambda` is invoked to store the image in S3.
    2.  `BedrockCategorizationLambda` is invoked with the S3 key to extract expense details.
*   **Display Manual Card**: Upon receiving the response from the Lambdas (containing S3 URL and Bedrock-categorized data), populate the "Manual Expense Modal" or a similar component with the extracted details. Allow users to review and edit the data.

### 5. Implement Manual Expense Management (Add, Edit, Delete)

*   **Add Manual Expense**: Users can manually input expense details via `ManualExpenseModal.tsx`, which then invokes `SaveExpenseLambda`.
*   **Edit Expense**: Users can edit existing expense details via `ManualExpenseModal.tsx`, which then invokes `UpdateExpenseLambda`.
*   **Delete Expense**: Users can delete expenses via `ExpenseCard.tsx`, which invokes `DeleteExpenseLambda`.
*   **Data Refresh**: After any add, edit, or delete operation, the frontend re-fetches the expenses using `GetExpensesLambda` to ensure the UI is up-to-date.

### 6. Tax Calendar Feature

*   **Functionality**: Displays expenses in a calendar view (week, month, year). Allows navigation through dates.
*   **Data Source**: Fetches expenses using `GetExpensesLambda`.
*   **Export Tax Data**: Provides an option to export filtered tax data as a CSV file using `exportTaxData` from `taxExport.ts`.

### 7. Receipt Image Download

*   **Functionality**: A "Download Receipt" button on `ExpenseCard.tsx` allows users to download the original receipt image.
*   **Process**: When clicked, `GetPresignedUrlLambda` is invoked with the S3 key to generate a temporary, secure URL for the image, which is then used to initiate the download.

### 8. Weekly Report Feature

*   **Functionality**: Provides a summary of weekly spending, including total spent, budget comparison, and spending breakdown by category.
*   **Data Source**: Fetches expenses using `GetExpensesLambda`.
*   **Report Download**: Allows downloading the weekly report as a PNG image.
*   **Report Sharing**: Provides an option to share the report via email.

## IV. Deployment and Monitoring

### 1. Frontend Deployment

*   **Hosting**: Deploy your React application to an Amazon S3 bucket configured for static website hosting (e.g., `smart-receipts-frontend-bucket`).
*   **Content Delivery**: Optionally use Amazon CloudFront for global content delivery and caching.

### 2. Monitoring and Logging

*   **Amazon CloudWatch**: Monitor Lambda function invocations, errors, and performance. Set up alarms for critical metrics.

This architecture provides a robust, scalable, and serverless solution for your Smart Receipts Tracker application.