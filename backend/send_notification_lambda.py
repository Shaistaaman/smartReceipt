import json
import os
import boto3

ses = boto3.client('ses')
dynamodb = boto3.resource('dynamodb')

TABLE_NAME = os.environ.get('DYNAMODB_USERS_TABLE_NAME', 'SmartReceiptsUsers')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'test@whattocookbot.com')

def lambda_handler(event, context):
    try:
        table = dynamodb.Table(TABLE_NAME)
        
        response = table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr('notificationsEnabled').eq(True)
        )
        
        users_to_notify = response.get('Items', [])
        
        for user in users_to_notify:
            user_id = user['userId']
            print(f"Sending notification to user: {user_id}")
            
            ses.send_email(
                Source=SENDER_EMAIL,
                Destination={
                    'ToAddresses': [
                        user_id, # Assuming the userId is the user's email
                    ]
                },
                Message={
                    'Subject': {
                        'Data': 'Reminder: Add Your Receipts!'
                    },
                    'Body': {
                        'Text': {
                            'Data': 'This is a friendly reminder to add any new receipts to the Smart Receipts Tracker.'
                        }
                    }
                }
            )
            
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {len(users_to_notify)} users for notification.'
            })
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
