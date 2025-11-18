# Robot Framework Test Execution Guide

## Overview
This directory contains a comprehensive Robot Framework test suite for the Digital Attendance System frontend. The test suite covers all major functionality of the instructor dashboard application.

## Test Structure

### Test Suites (52 Test Cases Total)

1. **login_tests.robot** (TC001-TC010)
   - Login page element verification
   - Valid/invalid credential testing
   - Form validation and error handling
   - Responsive design testing

2. **dashboard_tests.robot** (TC011-TC020)
   - Dashboard element display verification
   - Class card rendering and information
   - Navigation between pages
   - Header and branding verification

3. **session_manager_tests.robot** (TC021-TC030)
   - Session code generation and validation
   - Session start/end functionality
   - Form input validation
   - Active session state management

4. **attendance_history_tests.robot** (TC031-TC042)
   - History page element verification
   - Filtering and search functionality
   - CSV export testing
   - Pagination and data display

5. **integration_tests.robot** (TC043-TC052)
   - End-to-end workflow testing
   - Cross-browser compatibility
   - Performance validation
   - Error recovery testing

## Prerequisites

1. **Install Dependencies**
   ```powershell
   cd testing/robot-framework
   pip install -r requirements.txt
   ```

2. **Start Application**
   ```powershell
   cd frontend/instructor-dashboard
   npm start
   ```
   - Application should be running on http://localhost:3000

3. **WebDriver Setup**
   - Chrome browser installed
   - ChromeDriver will be automatically managed by SeleniumLibrary

## Test Execution

### Run All Tests
```powershell
# From testing/robot-framework directory
robot --outputdir reports tests/
```

### Run Specific Test Suite
```powershell
# Login tests only
robot --outputdir reports tests/login_tests.robot

# Dashboard tests only
robot --outputdir reports tests/dashboard_tests.robot

# Session manager tests only
robot --outputdir reports tests/session_manager_tests.robot

# Attendance history tests only
robot --outputdir reports tests/attendance_history_tests.robot

# Integration tests only
robot --outputdir reports tests/integration_tests.robot
```

### Run Tests by Tags
```powershell
# Smoke tests only (critical functionality)
robot --outputdir reports --include smoke tests/

# UI tests only
robot --outputdir reports --include ui tests/

# Functional tests only
robot --outputdir reports --include functional tests/

# Authentication related tests
robot --outputdir reports --include authentication tests/

# Navigation tests
robot --outputdir reports --include navigation tests/

# Responsive design tests
robot --outputdir reports --include responsive tests/
```

### Run Tests with Different Browsers
```powershell
# Chrome (default)
robot --outputdir reports --variable BROWSER:chrome tests/

# Firefox
robot --outputdir reports --variable BROWSER:firefox tests/

# Edge
robot --outputdir reports --variable BROWSER:edge tests/
```

## Test Configuration

### Key Variables (defined in resources/common.robot)
- `BASE_URL`: http://localhost:3000
- `BROWSER`: chrome (default)
- `IMPLICIT_WAIT`: 10 seconds
- `VALID_USERNAME`: apichon.w
- `VALID_PASSWORD`: siit2025

### Test Data
- Mock instructor credentials for Dr. Apichon Witayangkurn
- Sample class data (DES424, DES431, ICT760)
- Predefined test scenarios for various user interactions

## Reports and Logs

After test execution, reports are generated in the `reports/` directory:

- **report.html**: Detailed test execution report with pass/fail status
- **log.html**: Comprehensive execution log with screenshots
- **output.xml**: Machine-readable test results

## Test Coverage

### Functional Coverage
- ✅ User authentication and login
- ✅ Dashboard navigation and class display
- ✅ Session creation and management
- ✅ Attendance history viewing and filtering
- ✅ CSV export functionality
- ✅ Form validations and error handling

### UI/UX Coverage
- ✅ Responsive design across screen sizes
- ✅ Element visibility and layout
- ✅ Color coding and visual indicators
- ✅ Navigation flow and user experience
- ✅ Error states and empty data handling

### Integration Coverage
- ✅ End-to-end user workflows
- ✅ Browser navigation (back/forward)
- ✅ Page refresh behavior
- ✅ Multi-session management
- ✅ Performance validation

## Troubleshooting

### Common Issues

1. **WebDriver Issues**
   ```
   Solution: Update ChromeDriver or install webdriver-manager
   pip install webdriver-manager
   ```

2. **Application Not Running**
   ```
   Error: Connection refused to localhost:3000
   Solution: Ensure React app is running with 'npm start'
   ```

3. **Element Not Found**
   ```
   Check if UI elements have changed
   Update locators in resources/common.robot if needed
   ```

4. **Timeout Errors**
   ```
   Increase wait times in test cases if needed
   Check network connectivity and application performance
   ```

## Continuous Integration

### GitHub Actions Integration (Future)
```yaml
# Example workflow for CI/CD
- name: Run Robot Framework Tests
  run: |
    cd testing/robot-framework
    pip install -r requirements.txt
    robot --outputdir ci-reports tests/
```

### Test Metrics Tracking
- Track test execution time trends
- Monitor pass/fail rates by test suite
- Identify flaky tests for stabilization

## Contributing

### Adding New Tests
1. Follow naming convention: TC###_Test_Description
2. Use appropriate tags for categorization
3. Update this README with new test coverage
4. Ensure tests are independent and can run in any order

### Test Maintenance
- Regularly update element locators if UI changes
- Review and update test data as needed
- Maintain test documentation and comments
- Monitor test execution times and optimize slow tests

## Contact
For questions about the test suite or issues with test execution, refer to the main project documentation or contact the development team.