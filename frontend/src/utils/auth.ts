import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  AuthFlowType,
  ConfirmSignUpCommand,
  GetUserCommand,
  GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity"; // Import CognitoIdentityClient
import { fromCognitoIdentityPool, CognitoIdentityCredentialProvider } from "@aws-sdk/credential-provider-cognito-identity";
import { User } from '../types/auth';

const USER_POOL_ID = import.meta.env.VITE_APP_COGNITO_USER_POOL_ID;
const CLIENT_ID = import.meta.env.VITE_APP_COGNITO_CLIENT_ID;
const REGION = import.meta.env.VITE_APP_AWS_REGION;
const IDENTITY_POOL_ID = "us-east-1:045a79c1-2266-432a-ae13-9902545461fb"; // Your Identity Pool ID

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

const ACCESS_TOKEN_STORAGE_KEY = "cognito_access_token";
const ID_TOKEN_STORAGE_KEY = "cognito_id_token";
const REFRESH_TOKEN_STORAGE_KEY = "cognito_refresh_token";

let credentialsProvider: CognitoIdentityCredentialProvider | undefined;

const getCredentialsProvider = (idToken?: string) => {
  if (!credentialsProvider || idToken) {
    credentialsProvider = fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: REGION }), // Corrected: Use CognitoIdentityClient
      identityPoolId: IDENTITY_POOL_ID,
      logins: idToken ? { [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: idToken } : undefined,
    });
  }
  return credentialsProvider;
};

export const getAwsCredentials = async () => {
  try {
    const idToken = localStorage.getItem(ID_TOKEN_STORAGE_KEY);
    if (!idToken) {
      return null;
    }
    const provider = getCredentialsProvider(idToken);
    return await provider();
  } catch (error) {
    console.error("Error getting AWS credentials:", error);
    return null;
  }
};

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);

    if (response.AuthenticationResult?.IdToken && response.AuthenticationResult?.AccessToken) {
      localStorage.setItem(ID_TOKEN_STORAGE_KEY, response.AuthenticationResult.IdToken);
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, response.AuthenticationResult.AccessToken);
      if (response.AuthenticationResult.RefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.AuthenticationResult.RefreshToken);
      }

      // Get AWS credentials after successful authentication
      await getCredentialsProvider(response.AuthenticationResult.IdToken)();

      return {
        id: email,
        email: email,
        name: email.split('@')[0],
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error authenticating user:", error);
    throw error;
  }
};

export const registerUser = async (email: string, password: string, name: string): Promise<User | null> => {
  try {
    const command = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "name",
          Value: name,
        },
      ],
    });

    await cognitoClient.send(command);

    console.log("User registered successfully. Please confirm your email.");

    return {
      id: email,
      email: email,
      name: name,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const confirmUserRegistration = async (email: string, confirmationCode: string): Promise<boolean> => {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
    });
    await cognitoClient.send(command);
    console.log("User confirmed successfully.");
    return true;
  } catch (error) {
    console.error("Error confirming user:", error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    const idToken = localStorage.getItem(ID_TOKEN_STORAGE_KEY);

    if (!accessToken || !idToken) {
      return null;
    }

    // Attempt to get credentials to refresh session if needed
    await getCredentialsProvider(idToken)();

    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    const response = await cognitoClient.send(command);

    const emailAttribute = response.UserAttributes?.find(attr => attr.Name === 'email');
    const nameAttribute = response.UserAttributes?.find(attr => attr.Name === 'name');

    if (emailAttribute?.Value) {
      return {
        id: emailAttribute.Value,
        email: emailAttribute.Value,
        name: nameAttribute?.Value || emailAttribute.Value.split('@')[0],
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    // Clear tokens if session is invalid
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    return null;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (accessToken) {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });
      await cognitoClient.send(command);
    }
  } catch (error) {
    console.error("Error signing out user:", error);
  } finally {
    // Always clear local storage regardless of server-side sign out success
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    credentialsProvider = undefined; // Clear credentials provider on sign out
  }
};