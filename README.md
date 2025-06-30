# Smart Receipts Tracker

Smart Receipts Tracker is an AI-powered expense management application designed to simplify receipt tracking, categorization, and financial reporting. Users can upload receipt images, and the system automatically extracts and categorizes expense details using AWS Bedrock's AI capabilities. All expense data is securely stored in DynamoDB, and the application provides features for viewing, editing, deleting, and exporting expense records, along with weekly spending reports and a tax calendar.

## Features

- **User Authentication**: Secure sign-up, sign-in, and user management using AWS Cognito User Pools and Identity Pools.
- **AI-Powered Receipt Processing**: Upload receipt images, and AWS Bedrock (Claude 3 Haiku) automatically extracts vendor, amount, category, description, and date.
- **Expense Management**: Add, view, edit, and delete expense records.
- **Data Persistence**: All expense data is stored in Amazon DynamoDB.
- **Receipt Image Storage**: Uploaded receipt images are securely stored in Amazon S3.
- **Dynamic Data Display**: Dashboard, Expense Details, and Weekly Reports dynamically fetch and display data from DynamoDB.
- **Weekly Spending Reports**: Visualize weekly spending patterns, compare against a budget, and break down expenses by category.
- **Tax Calendar**: View expenses organized by date in a calendar format (week, month, year views).
- **Tax Data Export**: Export expense data for tax purposes as a CSV file.
- **Receipt Image Download**: Download original receipt images from S3 via pre-signed URLs.

## Technologies Used

### Frontend

- **React**: A JavaScript library for building user interfaces.
- **Vite**: A fast build tool for modern web projects.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
- **Lucide React**: A collection of beautiful open-source icons.
- **AWS SDK for JavaScript**: For interacting with AWS services from the frontend.

### Backend (AWS Lambda - Python)

- **Python 3.9**: Runtime for Lambda functions.
- **Boto3**: AWS SDK for Python.
- **Lambda Functions**:
  - `UploadImageLambda`: Handles uploading base64 encoded images to S3.
  - `BedrockCategorizationLambda`: Extracts expense details from images using AWS Bedrock.
  - `SaveExpenseLambda`: Saves new expense records to DynamoDB.
  - `GetExpensesLambda`: Fetches expense records from DynamoDB.
  - `UpdateExpenseLambda`: Updates existing expense records in DynamoDB.
  - `DeleteExpenseLambda`: Deletes expense records from DynamoDB.
  - `GetPresignedUrlLambda`: Generates pre-signed URLs for S3 objects.

### AWS Services

- **Amazon Cognito User Pools**: For user authentication (sign-up, sign-in).
- **Amazon Cognito Identity Pools**: For authorizing frontend access to AWS resources (Lambda, S3, DynamoDB).
- **Amazon S3**: For storing uploaded receipt images and hosting the frontend application.
- **Amazon DynamoDB**: A NoSQL database for storing structured expense data.
- **AWS Lambda**: Serverless compute service for backend logic.
- **Amazon Bedrock**: AI service for extracting data from receipt images (using Claude 3 Haiku).
- **AWS IAM**: For managing permissions and access control.
- **Amazon CloudWatch**: For monitoring and logging Lambda function invocations.
- **Amazon EventBridge**: For scheduling daily notification triggers.
- **Amazon SES**: For sending email notifications.

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/en/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Python 3.9+](https://www.python.org/downloads/)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials and a default region (e.g., `us-east-1`).
- Access to AWS Bedrock (specifically `anthropic.claude-3-haiku-20240307-v1:0`) enabled in your AWS account.

### 1. AWS Backend Setup

#### a. Create S3 Buckets

Create a bucket for storing receipt images (replace `smart-receipts-images-your-unique-id` with a globally unique name):

```bash
aws s3api create-bucket --bucket smart-receipts-images-your-unique-id --region us-east-1
```

Create a bucket for hosting the frontend application (replace `smart-receipts-frontend-bucket` with a globally unique name):

```bash
aws s3api create-bucket --bucket smart-receipts-frontend-bucket --region us-east-1
```

#### b. Configure Frontend Hosting S3 Bucket

Configure for static website hosting:

```bash
aws s3api put-bucket-website --bucket smart-receipts-frontend-bucket --website-configuration '{"ErrorDocument":{"Key":"index.html"},"IndexDocument":{"Suffix":"index.html"}}'
```

Disable Block Public Access settings (necessary for public website hosting):

```bash
aws s3api put-public-access-block --bucket smart-receipts-frontend-bucket --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

Set bucket policy to allow public read access:

```bash
aws s3api put-bucket-policy --bucket smart-receipts-frontend-bucket --policy '{"Version":"2012-10-17","Statement":[{"Sid":"PublicReadGetObject","Effect":"Allow","Principal":"*","Action":["s3:GetObject"],"Resource":["arn:aws:s3:::smart-receipts-frontend-bucket/*"]}]}'
```

#### c. Create DynamoDB Table

```bash
aws dynamodb create-table \
    --table-name SmartReceiptsExpenses \
    --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=expenseId,AttributeType=S \
    --key-schema AttributeName=userId,KeyType=HASH AttributeName=expenseId,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1
```

Wait for the table to become active:

```bash
aws dynamodb wait table-exists --table-name SmartReceiptsExpenses --region us-east-1
```

#### d. Create IAM Roles

**Lambda Execution Role (`SmartReceiptsLambdaRole`)**:

```bash
aws iam create-role \
    --role-name SmartReceiptsLambdaRole \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
    --description "IAM role for Smart Receipts Lambda functions with S3, Bedrock, and DynamoDB access."
```

Attach managed policies:

```bash
aws iam attach-role-policy --role-name SmartReceiptsLambdaRole --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
aws iam attach-role-policy --role-name SmartReceiptsLambdaRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

Attach inline policy for S3 and DynamoDB (replace bucket name and region):

```bash
aws iam put-role-policy \
    --role-name SmartReceiptsLambdaRole \
    --policy-name S3DynamoDBAccessPolicy \
    --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["s3:PutObject","s3:GetObject"],"Resource":"arn:aws:s3:::smart-receipts-images-your-unique-id/*"},{"Effect":"Allow","Action":["dynamodb:PutItem","dynamodb:GetItem","dynamodb:UpdateItem","dynamodb:Query","dynamodb:DeleteItem"],"Resource":"arn:aws:dynamodb:us-east-1:AWSAccount:table/SmartReceiptsExpenses"}]}'
```

**Cognito User Pool Role (`CognitoAuthRole`)**:

```bash
aws iam create-role \
    --role-name CognitoAuthRole \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Federated":"cognito-identity.amazonaws.com"},"Action":"sts:AssumeRoleWithWebIdentity","Condition":{"StringEquals":{"cognito-identity.amazonaws.com:aud":"us-east-1:unique_random"},"ForAnyValue:StringLike":{"cognito-identity.amazonaws.com:amr":["authenticated"]}}}]}' \
    --description "IAM role for authenticated Cognito Identity Pool users."
```

**Cognito Unauthenticated Role (`CognitoUnauthRole`)**:

```bash
aws iam create-role \
    --role-name CognitoUnauthRole \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Federated":"cognito-identity.amazonaws.com"},"Action":"sts:AssumeRoleWithWebIdentity","Condition":{"StringEquals":{"cognito-identity.amazonaws.com:aud":"us-east-1:unique_random"},"ForAnyValue:StringLike":{"cognito-identity.amazonaws.com:amr":["unauthenticated"]}}}]}' \
    --description "IAM role for unauthenticated Cognito Identity Pool users."
```

Set Identity Pool roles:

```bash
aws cognito-identity set-identity-pool-roles \
    --identity-pool-id us-east-1:unique_random \
    --roles authenticated=arn:aws:iam::AWSAccount:role/CognitoAuthRole,unauthenticated=arn:aws:iam::AWSAccount:role/CognitoUnauthRole
```

Attach Lambda Invoke Policy to `CognitoAuthRole`:

```bash
aws iam put-role-policy \
    --role-name CognitoAuthRole \
    --policy-name InvokeLambdaPolicy \
    --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["lambda:InvokeFunction"],"Resource":["arn:aws:lambda:us-east-1:AWSAccount:function:UploadImageLambda","arn:aws:lambda:us-east-1:AWSAccount:function:BedrockCategorizationLambda","arn:aws:lambda:us-east-1:AWSAccount:function:SaveExpenseLambda","arn:aws:lambda:us-east-1:AWSAccount:function:GetExpensesLambda","arn:aws:lambda:us-east-1:AWSAccount:function:UpdateExpenseLambda","arn:aws:lambda:us-east-1:AWSAccount:function:DeleteExpenseLambda","arn:aws:lambda:us-east-1:AWSAccount:function:GetPresignedUrlLambda"]}]}'
```

#### e. Deploy Lambda Functions

Navigate to the `backend` directory:

```bash
cd backend
```

Package and deploy each Lambda function:

**`UploadImageLambda`**:

```bash
zip upload_image_lambda.zip upload_image_lambda.py
aws lambda create-function --function-name UploadImageLambda --runtime python3.9 --handler upload_image_lambda.lambda_handler --role arn:aws:iam::AWSAccount:role/SmartReceiptsLambdaRole --zip-file fileb://upload_image_lambda.zip --environment Variables={S3_BUCKET_NAME=smart-receipts-images-your-unique-id} --timeout 30 --memory-size 128
# To update:
aws lambda update-function-code --function-name UploadImageLambda --zip-file fileb://upload_image_lambda.zip
```

**`BedrockCategorizationLambda`**:

```bash
zip bedrock_categorization_lambda.zip bedrock_categorization_lambda.py
aws lambda create-function --function-name BedrockCategorizationLambda --runtime python3.9 --handler bedrock_categorization_lambda.lambda_handler --role arn:aws:iam::AWSAccount:role/SmartReceiptsLambdaRole --zip-file fileb://bedrock_categorization_lambda.zip --environment Variables={S3_BUCKET_NAME=smart-receipts-images-your-unique-id} --timeout 60 --memory-size 512
# To update:
aws lambda update-function-code --function-name BedrockCategorizationLambda --zip-file fileb://bedrock_categorization_lambda.zip
```

**`SaveExpenseLambda`**:

```bash
zip save_expense_lambda.zip save_expense_lambda.py
aws lambda create-function --function-name SaveExpenseLambda --runtime python3.9 --handler save_expense_lambda.lambda_handler --role arn:aws:iam::AWSAccount:role/SmartReceiptsLambdaRole --zip-file fileb://save_expense_lambda.zip --environment Variables={DYNAMODB_TABLE_NAME=SmartReceiptsExpenses} --timeout 30 --memory-size 128
# To update:
aws lambda update-function-code --function-name SaveExpenseLambda --zip-file fileb://save_expense_lambda.zip
```

**`GetExpensesLambda`**:

```bash
zip get_expenses_lambda.zip get_expenses_lambda.py
aws lambda create-function --function-name GetExpensesLambda --runtime python3.9 --handler get_expenses_lambda.lambda_handler --role arn:aws:iam::AWSAccount:role/SmartReceiptsLambdaRole --zip-file fileb://get_expenses_lambda.zip --environment Variables={DYNAMODB_TABLE_NAME=SmartReceiptsExpenses} --timeout 30 --memory-size 128
# To update:
aws lambda update-function-code --function-name GetExpensesLambda --zip-file fileb://get_expenses_lambda.zip
```

**`UpdateExpenseLambda`**:

```bash
zip update_expense_lambda.zip update_expense_lambda.py
aws lambda create-function --function-name UpdateExpenseLambda --runtime python3.9 --handler update_expense_lambda.lambda_handler --role arn:aws:iam::AWSAccount:role/SmartReceiptsLambdaRole --zip-file fileb://update_expense_lambda.zip --environment Variables={DYNAMODB_TABLE_NAME=SmartReceiptsExpenses} --timeout 30 --memory-size 128
# To update:
aws lambda update-function-code --function-name UpdateExpenseLambda --zip-file fileb://update_expense_lambda.zip
```

**`DeleteExpenseLambda`**:

```bash
zip delete_expense_lambda.zip delete_expense_lambda.py
aws lambda create-function --function-name DeleteExpenseLambda --runtime python3.9 --handler delete_expense_lambda.lambda_handler --role arn:aws:iam::AWSAccount:role/SmartReceiptsLambdaRole --zip-file fileb://delete_expense_lambda.zip --environment Variables={DYNAMODB_TABLE_NAME=SmartReceiptsExpenses} --timeout 30 --memory-size 128
# To update:
aws lambda update-function-code --function-name DeleteExpenseLambda --zip-file fileb://delete_expense_lambda.zip
```

**`GetPresignedUrlLambda`**:

```bash
zip get_presigned_url_lambda.zip get_presigned_url_lambda.py
aws lambda create-function --function-name GetPresignedUrlLambda --runtime python3.9 --handler get_presigned_url_lambda.lambda_handler --role arn:aws:iam::AWSAccount:role/SmartReceiptsLambdaRole --zip-file fileb://get_presigned_url_lambda.zip --environment Variables={S3_BUCKET_NAME=smart-receipts-images-your-unique-id} --timeout 30 --memory-size 128
# To update:
aws lambda update-function-code --function-name GetPresignedUrlLambda --zip-file fileb://get_presigned_url_lambda.zip
```

#### f. Configure Cognito User Pool and Identity Pool

**User Pool Creation** (if you haven't already - note down `Id` and `ClientId`):

```bash
aws cognito-idp create-user-pool \
    --pool-name SmartReceiptsUserPool \
    --auto-verified-attributes email \
    --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false}" \
    --schema "Name=email,AttributeDataType=String,Mutable=true,Required=true" "Name=name,AttributeDataType=String,Mutable=true,Required=false"

aws cognito-idp create-user-pool-client \
    --user-pool-id YOUR_USER_POOL_ID \
    --client-name SmartReceiptsAppClient \
    --no-generate-secret \
    --explicit-auth-flows ADMIN_NO_SRP_AUTH USER_PASSWORD_AUTH
```

**Identity Pool Creation** (note down `IdentityPoolId`):

```bash
aws cognito-identity create-identity-pool --identity-pool-name SmartReceiptsIdentityPool --allow-unauthenticated-identities --allow-classic-flow
```

**Link User Pool to Identity Pool** (replace IDs and region):

```bash
aws cognito-identity update-identity-pool \
    --identity-pool-id YOUR_IDENTITY_POOL_ID \
    --identity-pool-name SmartReceiptsIdentityPool \
    --allow-unauthenticated-identities \
    --allow-classic-flow \
    --cognito-identity-providers ProviderName=cognito-idp.YOUR_AWS_REGION.amazonaws.com/YOUR_USER_POOL_ID,ClientId=YOUR_USER_POOL_CLIENT_ID,ServerSideTokenCheck=false
```

### 2. Frontend Setup

Navigate to the `frontend` directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `frontend` directory and populate it with your Cognito and AWS Region details:

```
VITE_APP_COGNITO_USER_POOL_ID="YOUR_USER_POOL_ID"
VITE_APP_COGNITO_CLIENT_ID="YOUR_USER_POOL_CLIENT_ID"
VITE_APP_AWS_REGION="YOUR_AWS_REGION"
VITE_APP_COGNITO_IDENTITY_POOL_ID="YOUR_IDENTITY_POOL_ID"
```

### 3. Running Locally

To run the frontend application locally:

```bash
cd frontend
npm run dev
```

This will start the Vite development server, usually accessible at `http://localhost:5173`.

## Deployment

To deploy the frontend application to your S3 hosting bucket:

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://smart-receipts-frontend-bucket --delete
```

Your application will be accessible via the S3 static website hosting endpoint (e.g., `http://smart-receipts-frontend-bucket.s3-website-us-east-1.amazonaws.com`).

## Usage

1.  **Sign Up/Sign In**: Register a new user or sign in with existing Cognito credentials.
2.  **Upload Receipts**: Use the upload card to snap or select receipt images. The AI will process them.
3.  **Review and Save Expenses**: Review the extracted data, make any necessary edits, and save the expense.
4.  **Manage Expenses**: View all expenses, filter, sort, edit, and delete individual records.
5.  **Weekly Reports**: Monitor your spending with weekly summaries and category breakdowns.
6.  **Tax Calendar**: View expenses by date and export tax data.

### 10. Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.
