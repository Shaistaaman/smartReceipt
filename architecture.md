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
}

rectangle "AWS Lambda" as Lambda #red {
component "UploadImageLambda" as UploadImage
component "BedrockCategorizationLambda" as BedrockLambda
component "SaveExpenseLambda" as SaveExpense
}

rectangle "Amazon S3" as S3 #yellow {
component "Receipt Images Bucket" as S3Bucket
}

rectangle "Amazon DynamoDB" as DynamoDB #green {
component "SmartReceiptsExpenses Table" as DynamoDBTable
}

rectangle "Amazon Bedrock" as Bedrock #purple {
component "Claude 3 Model" as Claude3
}
}

UI --> Cognito : Authenticates
UI --> UploadImage : Invoke (Image Upload)
UI --> BedrockLambda : Invoke (Categorization)
UI --> SaveExpense : Invoke (Save Expense)

UploadImage --> S3Bucket : Stores Image
BedrockLambda --> S3Bucket : Retrieves Image
BedrockLambda --> Bedrock : Invokes Model
Bedrock --> BedrockLambda : Returns Categorized Data
SaveExpense --> DynamoDBTable : Saves Expense Data

@enduml

This document outlines the cloud architecture and deployment steps for the Smart Receipts Tracker application, designed for easy replication and scalability. You can visualize this diagram in diagrams.net (formerly draw.io) by following these steps:

1.  Go to app.diagrams.net.
2.  From the menu, select Arrange > Insert > Advanced > PlantUML.
3.  Paste the PlantUML code (everything between @startuml and @enduml) into the dialog box.
4.  Click Insert.

## I. Core Services Setup

### 1. AWS Account and Prerequisites

- **AWS Account**: Ensure you have an active AWS account.
- **AWS CLI**: Configure AWS CLI with appropriate credentials and a default region.
- **Bedrock Model Access**: Verify that `anthropic.claude-3-haiku-20240307-v1:0` (or another suitable Claude 3 model) is enabled for your AWS account in the Bedrock console.

### 2. Amazon Cognito User Pool (Authentication & Authorization)

This will handle user sign-up, sign-in, and access control.

- **Create User Pool**:
  - **Sign-in options**: Select "Email" and "Password".
  - **Password policy**: Configure as per security requirements.
  - **User confirmation**: Use "Default email" for user confirmation.
  - **App Client**: Create an App Client for your frontend application to interact with the User Pool. Note down the User Pool ID and App Client ID.
- **IAM Role for Cognito**: Ensure Cognito has permissions to send emails for verification.

### 3. Amazon S3 Bucket (Image Storage)

This bucket will store the uploaded receipt images.

- **Create S3 Bucket**: Create a new S3 bucket (e.g., `smart-receipts-images-<your-account-id>`).
- **Bucket Policy**: Configure a bucket policy that allows your Lambda functions to put and get objects.

### 4. Amazon DynamoDB Table (Expense Data Storage)

This table will store the categorized expense data.

- **Create DynamoDB Table**: Create a new DynamoDB table (e.g., `SmartReceiptsExpenses`).
- **Primary Key**: Define a suitable primary key (e.g., `userId` as partition key, `expenseId` as sort key).
- **Indexes**: Consider creating secondary indexes if specific query patterns are anticipated (e.g., querying by date or category).

### 5. IAM Roles and Policies

Create specific IAM roles with least-privilege policies for each service to interact securely.

- **Lambda Execution Role**:
  - `AWSLambdaBasicExecutionRole` (for CloudWatch logs).
  - Permissions for `s3:PutObject`, `s3:GetObject` on your S3 bucket.
  - Permissions for `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:UpdateItem` on your DynamoDB table.
  - Permissions for `bedrock:InvokeModel` for the Bedrock Lambda.

## II. Backend Logic Deployment

### 1. AWS Lambda Functions

These functions will contain the core business logic.

- **`UploadImageLambda`**:
  - **Trigger**: Invoked directly from the UI.
  - **Functionality**: Receives image data (e.g., base64 encoded) and metadata. Uploads the image to the designated S3 bucket. Returns the S3 object URL or key.
  - **Runtime**: Python (or Node.js, etc.).
- **`BedrockCategorizationLambda`**:
  - **Trigger**: Invoked directly from the UI.
  - **Functionality**: Receives the S3 image URL/key. Retrieves the image from S3. Calls the AWS Bedrock API (`anthropic.claude-3-haiku-20240307-v1:0`) with the image and the predefined categories. Parses the Bedrock response to extract the category and other relevant text (vendor, amount, date, description).
  - **Data Handling**: If any data (vendor, amount, date, description) is missing from the Bedrock response, hardcode it as "Not Applicable".
  - **Runtime**: Python (as already started).
- **`SaveExpenseLambda`**:
  - **Trigger**: Invoked directly from the UI.
  - **Functionality**: Receives structured expense data (vendor, amount, category, date, description, userId). Saves this data as a new item in the DynamoDB `SmartReceiptsExpenses` table.
  - **Runtime**: Python (or Node.js, etc.).

## III. Frontend Integration

### 1. Configure Frontend Application

- **AWS Amplify/SDK**: Use AWS Amplify or the AWS SDK for JavaScript in your React application.
- **Configuration**: Update your frontend's configuration with:
  - Cognito User Pool ID
  - Cognito App Client ID
  - Lambda function ARNs for direct invocation.

### 2. Implement Authentication Flow

- **Sign-up/Sign-in**: Integrate Cognito SDK for user registration, login, and session management.
- **Dashboard Access**: Upon successful authentication, redirect the user to the Dashboard component.

### 3. Implement Receipt Upload Flow

- **User Interface**: Provide an interface (e.g., using `UploadCard.tsx`, `UploadFlow.tsx`) for users to select and upload receipt images.
- **API Call**: When an image is selected, invoke `UploadImageLambda` and `BedrockCategorizationLambda` directly.
- **Display Manual Card**: Upon receiving the response from the Lambdas (which contains the S3 URL and Bedrock-categorized data), populate the "Manual Expense Modal" or a similar component with the extracted details. Allow users to review and edit the data.

### 4. Implement Manual Card / Save Flow

- **Display Data**: Show the extracted vendor name, amount, category, date, and description. Remember to display "Not Applicable" for any missing fields.
- **User Input**: Allow users to manually correct or fill in any details.
- **Save Action**: When the user clicks "Save", collect the complete expense data and invoke `SaveExpenseLambda` directly.

## IV. Deployment and Monitoring

### 1. Frontend Deployment

- **Hosting**: Deploy your React application to a static website hosting service like Amazon S3 with Amazon CloudFront for global content delivery and caching.

### 2. Monitoring and Logging

- **Amazon CloudWatch**: Monitor Lambda function invocations, errors, and performance. Set up alarms for critical metrics.

This architecture provides a robust, scalable, and serverless solution for your Smart Receipts Tracker application.
