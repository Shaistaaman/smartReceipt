import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')

TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')

def lambda_handler(event, context):
    print(f"Received event: {event}") # Add this line for debugging
    try:
        user_id = event.get('userId')
        expense_id = event.get('expenseId')

        if not user_id or not expense_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId and expenseId are required.'})
            }

        table = dynamodb.Table(TABLE_NAME)
        
        table.delete_item(
            Key={
                'userId': user_id,
                'expenseId': expense_id
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Expense deleted successfully'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }