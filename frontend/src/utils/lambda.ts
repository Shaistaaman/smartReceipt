import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { getAwsCredentials } from "./auth";

const REGION = import.meta.env.VITE_APP_AWS_REGION;

// Initialize LambdaClient with a dynamic credentials provider
const lambdaClient = new LambdaClient({
  region: REGION,
  credentials: () => getAwsCredentials(), // This will now dynamically fetch credentials
});

export const invokeLambda = async (functionName: string, payload: any): Promise<any> => {
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
    });

    const { Payload } = await lambdaClient.send(command);
    const result = JSON.parse(new TextDecoder("utf-8").decode(Payload));

    if (result.statusCode && result.statusCode !== 200) {
      throw new Error(result.body ? JSON.parse(result.body).error : "Lambda invocation failed");
    }

    return result.body ? JSON.parse(result.body) : result;
  } catch (error) {
    console.error(`Error invoking Lambda function ${functionName}:`, error);
    throw error;
  }
};