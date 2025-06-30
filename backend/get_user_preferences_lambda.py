import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')

TABLE_NAME = os.environ.get('DYNAMODB_USERS_TABLE_NAME', 'SmartReceiptsUsers')

def lambda_handler(event, context):
    try:
        user_id = event.get('userId')

        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId is required.'})
            }

        table = dynamodb.Table(TABLE_NAME)
        
        response = table.get_item(
            Key={
                'userId': user_id
            }
        )
        
        item = response.get('Item')

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'User preferences fetched successfully',
                'preferences': item
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
