*** Settings ***
Documentation    Test Suite Runner - Execute all test suites with proper reporting
Library          Collections

*** Variables ***
${REPORT_DIR}    ${CURDIR}/../reports
${LOG_LEVEL}     INFO

*** Test Cases ***
Run_All_Test_Suites
    [Documentation]    Execute all test suites in the correct order
    [Tags]    suite-runner    all-tests
    Log    Starting comprehensive test execution    INFO
    
    # Create reports directory if it doesn't exist
    Create Directory    ${REPORT_DIR}
    
    # Log test execution summary
    Log    Test Suite Execution Order:    INFO
    Log    1. Login Tests (TC001-TC010)    INFO
    Log    2. Dashboard Tests (TC011-TC020)    INFO
    Log    3. Session Manager Tests (TC021-TC030)    INFO
    Log    4. Attendance History Tests (TC031-TC042)    INFO
    Log    5. Integration Tests (TC043-TC052)    INFO
    
    # This test case serves as documentation for manual test execution
    # To run all tests, use the command:
    # robot --outputdir reports tests/
    
    Pass Execution    All test suites are ready for execution

Generate_Test_Execution_Command
    [Documentation]    Generate the command to run all tests with proper reporting
    [Tags]    command-generation    utility
    
    ${command}=    Set Variable    robot --outputdir ${REPORT_DIR} --loglevel ${LOG_LEVEL} --include smoke tests/
    Log    Smoke Tests Command: ${command}    INFO
    
    ${command_all}=    Set Variable    robot --outputdir ${REPORT_DIR} --loglevel ${LOG_LEVEL} tests/
    Log    All Tests Command: ${command_all}    INFO
    
    ${command_by_tag}=    Set Variable    robot --outputdir ${REPORT_DIR} --include "ui OR functional" tests/
    Log    UI/Functional Tests Command: ${command_by_tag}    INFO
    
    Pass Execution    Test execution commands generated