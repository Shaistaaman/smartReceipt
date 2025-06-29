import json
import os
import boto3

s3_client = boto3.client('s3')

S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')

def lambda_handler(event, context):
    try:
        s3_key = event.get('s3_key')

        if not s3_key:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 's3_key is required.'})
            }

        # Generate a pre-signed URL for the S3 object
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET_NAME, 'Key': s3_key},
            ExpiresIn=300 # URL valid for 5 minutes
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Presigned URL generated successfully',
                'presigned_url': presigned_url
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }