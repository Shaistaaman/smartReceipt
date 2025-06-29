import json
import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')

TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')

def lambda_handler(event, context):
    try:
        user_id = event.get('userId')

        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId is required.'})
            }

        table = dynamodb.Table(TABLE_NAME)
        
        response = table.query(
            KeyConditionExpression=Key('userId').eq(user_id)
        )
        items = response['Items']

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Expenses fetched successfully',
                'expenses': items
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }