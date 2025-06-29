import json
import base64
import os
import uuid
import boto3

s3_client = boto3.client('s3')

S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')

def lambda_handler(event, context):
    try:
        # When invoked directly, the payload is the event itself
        image_data_base64 = event['image_data']
        file_name = event.get('file_name', str(uuid.uuid4()) + '.jpg')

        # Decode the base64 image data
        image_bytes = base64.b64decode(image_data_base64)

        # Generate a unique key for S3
        s3_key = f"receipts/{file_name}"

        # Upload image to S3
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=image_bytes,
            ContentType='image/jpeg' # Assuming JPEG, adjust if other types are supported
        )

        s3_url = f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{s3_key}"

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Image uploaded successfully',
                's3_key': s3_key,
                's3_url': s3_url
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