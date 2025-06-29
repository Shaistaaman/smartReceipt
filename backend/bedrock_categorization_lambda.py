import json
import os
import boto3
import base64

s3_client = boto3.client('s3')
bedrock_runtime = boto3.client('bedrock-runtime')

S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')

def get_image_from_s3(s3_key):
    try:
        response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
        image_bytes = response['Body'].read()
        return base64.b64encode(image_bytes).decode('utf-8')
    except Exception as e:
        print(f"Error getting image from S3: {e}")
        return None

def invoke_bedrock_model(image_base64):
    try:
        # Define the prompt for Bedrock to extract information
        prompt = "Extract the vendor name, amount, category (e.g., Food, Transport, Utilities, Entertainment, Groceries, Shopping, Health, Education, Travel, Other), description, and date from this receipt image. If any information is missing or unreadable, use 'Not Applicable'. Provide the output in a JSON format with keys: vendor, amount, category, description, date."

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg", # Assuming JPEG, adjust if other types are supported
                                "data": image_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        })

        response = bedrock_runtime.invoke_model(
            body=body,
            modelId="anthropic.claude-3-haiku-20240307-v1:0", # Using Haiku as per architecture.md
            accept='application/json',
            contentType='application/json'
        )

        response_body = json.loads(response.get('body').read())
        # Extract the text content from the response
        bedrock_output = response_body['content'][0]['text']

        # Attempt to parse the JSON output from Bedrock
        try:
            extracted_data = json.loads(bedrock_output)
        except json.JSONDecodeError:
            print(f"Bedrock output is not valid JSON: {bedrock_output}")
            extracted_data = {
                "vendor": "Not Applicable",
                "amount": "Not Applicable",
                "category": "Not Applicable",
                "description": "Not Applicable",
                "date": "Not Applicable"
            }

        return extracted_data

    except Exception as e:
        print(f"Error invoking Bedrock model: {e}")
        return {
            "vendor": "Not Applicable",
            "amount": "Not Applicable",
            "category": "Not Applicable",
            "description": "Not Applicable",
            "date": "Not Applicable"
        }

def lambda_handler(event, context):
    try:
        # When invoked directly, the payload is the event itself
        s3_key = event['s3_key']

        image_base64 = get_image_from_s3(s3_key)
        if not image_base64:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Could not retrieve image from S3.'})
            }

        extracted_data = invoke_bedrock_model(image_base64)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data extracted successfully',
                'extracted_data': extracted_data
            })
        }
    except KeyError as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': f'Missing key in request body: {e}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }