import json
import os
import boto3
import uuid

dynamodb = boto3.resource('dynamodb')

TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')

def lambda_handler(event, context):
    try:
        # When invoked directly, the payload is the event itself
        user_id = event.get('userId')
        vendor = event.get('vendor', 'Not Applicable')
        amount = str(event.get('amount', 'Not Applicable'))
        category = event.get('category', 'Not Applicable')
        description = event.get('description', 'Not Applicable')
        date = event.get('date', 'Not Applicable')
        s3_key = event.get('s3_key', None)

        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId is required.'})
            }

        table = dynamodb.Table(TABLE_NAME)
        
        expense_id = str(uuid.uuid4())
        
        item = {
            'userId': user_id,
            'expenseId': expense_id,
            'vendor': vendor,
            'amount': amount,
            'category': category,
            'description': description,
            'date': date,
            'createdAt': json.dumps(context.get_remaining_time_in_millis()), # Placeholder for actual timestamp
        }
        
        if s3_key:
            item['s3_key'] = s3_key

        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Expense saved successfully',
                'expenseId': expense_id
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