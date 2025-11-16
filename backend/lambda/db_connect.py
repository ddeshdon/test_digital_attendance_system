import boto3
from datetime import datetime

# สร้าง resource ของ DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# เลือกตาราง AttendanceRecords
table = dynamodb.Table('AttendanceRecords')

# ฟังก์ชันบันทึกการเข้าเรียน
def save_attendance(student_id, session_id, status):
    item = {
        'student_id': student_id,
        'session_id': session_id,
        'timestamp': datetime.utcnow().isoformat(),
        'status': status
    }
    table.put_item(Item=item)
    print("✅ บันทึกการเช็คชื่อเรียบร้อย")

# ฟังก์ชันอ่านข้อมูลทั้งหมด
def read_attendance():
    response = table.scan()
    print("Items:", response['Items'])

# ทดลองใช้งาน
save_attendance("S001", "C001", "present")
read_attendance()
print("Items:", response['Items'])

