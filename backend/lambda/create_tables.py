"""
DynamoDB Table Creation Script
Creates local DynamoDB tables for testing Lambda functions
"""

import boto3
from botocore.exceptions import ClientError

def create_dynamodb_tables(endpoint_url='http://localhost:8000'):
    # Create DynamoDB tables for local testing
    
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url=endpoint_url,
        region_name='us-east-1',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    tables_created = []
    tables_failed = []
    
    # 1. Create Users Table
    print("\n- Creating Users table...")
    try:
        users_table = dynamodb.create_table(
            TableName='Users',
            KeySchema=[
                {'AttributeName': 'student_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'student_id', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Users table created successfully")
        tables_created.append('Users')
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("Users table already exists")
        else:
            print(f"Failed to create Users table: {e}")
            tables_failed.append('Users')
    
    # 2. Create Sessions Table
    print("\n- Creating Sessions table...")
    try:
        sessions_table = dynamodb.create_table(
            TableName='Sessions',
            KeySchema=[
                {'AttributeName': 'session_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'session_id', 'AttributeType': 'S'},
                {'AttributeName': 'beacon_uuid', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'beacon_uuid-index',
                    'KeySchema': [
                        {'AttributeName': 'beacon_uuid', 'KeyType': 'HASH'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("Sessions table created successfully")
        tables_created.append('Sessions')
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("Sessions table already exists")
        else:
            print(f"Failed to create Sessions table: {e}")
            tables_failed.append('Sessions')
    
    # 3. Create AttendanceRecords Table
    print("\n- Creating AttendanceRecords table...")
    try:
        attendance_table = dynamodb.create_table(
            TableName='AttendanceRecords',
            KeySchema=[
                {'AttributeName': 'student_id', 'KeyType': 'HASH'},
                {'AttributeName': 'session_id', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'student_id', 'AttributeType': 'S'},
                {'AttributeName': 'session_id', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'session_id-index',
                    'KeySchema': [
                        {'AttributeName': 'session_id', 'KeyType': 'HASH'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print("AttendanceRecords table created successfully")
        tables_created.append('AttendanceRecords')
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("AttendanceRecords table already exists")
        else:
            print(f"Failed to create AttendanceRecords table: {e}")
            tables_failed.append('AttendanceRecords')
    
    # Summary
    print("\n" + "="*50)
    print("- Table Creation Summary:")
    print(f"  Created: {len(tables_created)} tables - {tables_created}")
    print(f"  Failed: {len(tables_failed)} tables - {tables_failed}")
    print("="*50)
    
    # List all tables
    print("\n  Listing all tables:")
    try:
        tables = list(dynamodb.tables.all())
        for table in tables:
            print(f"  - {table.name}")
    except Exception as e:
        print(f"Error listing tables: {e}")
    
    return tables_created, tables_failed

def verify_tables(endpoint_url='http://localhost:8000'):
    # Verify that all tables exist and are accessible
    
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url=endpoint_url,
        region_name='us-east-1',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    required_tables = ['Users', 'Sessions', 'AttendanceRecords']
    print("\n  Verifying tables...")
    
    all_exist = True
    for table_name in required_tables:
        try:
            table = dynamodb.Table(table_name)
            table.load()
            item_count = table.item_count
            print(f"  {table_name}: {item_count} items")
        except ClientError:
            print(f"  {table_name}: NOT FOUND")
            all_exist = False
    
    if all_exist:
        print("\n  All tables verified successfully!")
    else:
        print("\n   Some tables are missing. Please create them first.")
    
    return all_exist

if __name__ == '__main__':
    import sys
    
    print("="*50)
    print("   DynamoDB Table Creation Script")
    print("="*50)
    
    # Check if DynamoDB Local is running
    try:
        dynamodb = boto3.client(
            'dynamodb',
            endpoint_url='http://localhost:8000',
            region_name='us-east-1',
            aws_access_key_id='dummy',
            aws_secret_access_key='dummy'
        )
        dynamodb.list_tables()
        print("  Connected to DynamoDB Local at http://localhost:8000")
    except Exception as e:
        print("  Cannot connect to DynamoDB Local!")
        print("   Make sure DynamoDB Local is running:")
        print("   java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb")
        sys.exit(1)
    
    # Create tables
    tables_created, tables_failed = create_dynamodb_tables()
    
    # Verify tables
    verify_tables()
    
    print("\n-  You can now test Lambda functions locally")