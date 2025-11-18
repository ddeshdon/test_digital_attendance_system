# Step 2: Verify and Configure API Gateway
Write-Host "Step 2: API Gateway Configuration" -ForegroundColor Green
Write-Host "=" * 40

$API_ID = "kfmseegxyi"
$REGION = "us-east-1"
$API_URL = "https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

Write-Host "Checking API Gateway configuration..." -ForegroundColor Yellow

# Test API Gateway endpoint
Write-Host "Testing API endpoint: $API_URL/sessions" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$API_URL/sessions" -Method GET -TimeoutSec 10
    Write-Host "API Gateway is responding" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor White
} catch {
    Write-Host "API Gateway test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This might be due to CORS or authentication requirements" -ForegroundColor White
}

Write-Host ""
Write-Host "CORS Configuration Check..." -ForegroundColor Yellow
Write-Host "Please verify in AWS Console that API Gateway has:" -ForegroundColor White
Write-Host "- CORS enabled for all methods" -ForegroundColor White
Write-Host "- Access-Control-Allow-Origin: *" -ForegroundColor White
Write-Host "- Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token" -ForegroundColor White
Write-Host "- Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS" -ForegroundColor White

Write-Host ""
Write-Host "Lambda Function Check..." -ForegroundColor Yellow
$LAMBDA_FUNCTION = "digital-attendance-prod-backend-1763482478"

# Test Lambda function directly
Write-Host "Testing Lambda function: $LAMBDA_FUNCTION" -ForegroundColor Cyan
$testPayload = @{
    httpMethod = "GET"
    path = "/sessions"
    headers = @{
        "Content-Type" = "application/json"
    }
    body = ""
} | ConvertTo-Json -Depth 3

$testPayload | Out-File -FilePath "test-payload.json" -Encoding UTF8

try {
    aws lambda invoke --function-name $LAMBDA_FUNCTION --payload file://test-payload.json --region $REGION response.json
    
    if (Test-Path "response.json") {
        $lambdaResponse = Get-Content "response.json" | ConvertFrom-Json
        Write-Host "Lambda function is responding" -ForegroundColor Green
        Write-Host "Status Code: $($lambdaResponse.statusCode)" -ForegroundColor White
        Remove-Item "response.json"
    }
} catch {
    Write-Host "Lambda function test failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Remove-Item "test-payload.json" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "DynamoDB Tables Check..." -ForegroundColor Yellow
$tables = @("Users", "Sessions", "AttendanceRecords")

foreach ($table in $tables) {
    try {
        $tableInfo = aws dynamodb describe-table --table-name $table --region $REGION | ConvertFrom-Json
        Write-Host "Table '$table' exists - Status: $($tableInfo.Table.TableStatus)" -ForegroundColor Green
    } catch {
        Write-Host "Table '$table' not found or inaccessible" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Step 2 Complete!" -ForegroundColor Green
Write-Host "Manual verification needed:" -ForegroundColor Cyan
Write-Host "- Check AWS API Gateway Console for CORS settings" -ForegroundColor White
Write-Host "- Verify Lambda function permissions for DynamoDB" -ForegroundColor White
Write-Host "- Test endpoints from Amplify-hosted frontend" -ForegroundColor White