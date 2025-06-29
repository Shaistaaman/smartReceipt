import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')

TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')

def lambda_handler(event, context):
    try:
        user_id = event.get('userId')
        expense_id = event.get('expenseId')
        vendor = event.get('vendor', 'Not Applicable')
        amount = str(event.get('amount', 'Not Applicable')) # Store as string
        category = event.get('category', 'Not Applicable')
        description = event.get('description', 'Not Applicable')
        date = event.get('date', 'Not Applicable')
        s3_key = event.get('s3_key', None)
        is_recurring = event.get('isRecurring', False)

        if not user_id or not expense_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId and expenseId are required.'})
            }

        table = dynamodb.Table(TABLE_NAME)
        
        update_expression = "SET vendor = :v, amount = :a, category = :c, description = :d, #dt = :date_val, isRecurring = :ir"
        expression_attribute_values = {
            ':v': vendor,
            ':a': amount,
            ':c': category,
            ':d': description,
            ':date_val': date,
            ':ir': is_recurring,
        }
        expression_attribute_names = {
            '#dt': 'date' # 'date' is a reserved keyword in DynamoDB, so we use an expression attribute name
        }

        if s3_key:
            update_expression += ", s3_key = :s"
            expression_attribute_values[':s'] = s3_key

        response = table.update_item(
            Key={
                'userId': user_id,
                'expenseId': expense_id
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names,
            ReturnValues="UPDATED_NEW"
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Expense updated successfully',
                'updatedAttributes': response['Attributes']
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }