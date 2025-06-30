import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')

# Assume a new table for user preferences
TABLE_NAME = os.environ.get('DYNAMODB_USERS_TABLE_NAME', 'SmartReceiptsUsers')

def lambda_handler(event, context):
    try:
        user_id = event.get('userId')
        notifications_enabled = event.get('notificationsEnabled')

        if not user_id or notifications_enabled is None:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId and notificationsEnabled are required.'})
            }

        table = dynamodb.Table(TABLE_NAME)

        table.put_item(
            Item={
                'userId': user_id,
                'notificationsEnabled': notifications_enabled
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'User preferences updated successfully.'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
