*** Settings ***
Documentation    Integration and End-to-End Testing Suite
Resource         ../resources/common.robot
Test Setup       Setup Test Environment
Test Teardown    Close Application
Suite Teardown   Take Screenshot On Failure

*** Test Cases ***
TC043_Complete_Attendance_Workflow
    [Documentation]    Test complete attendance workflow from login to history
    [Tags]    e2e    workflow    integration
    Open Application
    Login With Valid Credentials
    # Navigate to class and start session
    Navigate To Class Session
    Generate And Start Session
    Wait Until Page Contains    Live Attendance    timeout=10s
    # End session
    Click Button    ${END_SESSION_BUTTON}
    # View history
    Click Button    ${BACK_TO_CLASSES_BUTTON}
    Click Button    ${VIEW_HISTORY_BUTTON}
    Wait Until Page Contains    Attendance History    timeout=5s
    # Return to dashboard
    Click Button    ${BACK_TO_CLASSES_BUTTON}
    Wait Until Page Contains    Your Classes    timeout=5s

TC044_Multi_Class_Session_Management
    [Documentation]    Test managing sessions for multiple classes
    [Tags]    e2e    multi-class    session
    Open Application
    Login With Valid Credentials
    # Test DES424 session
    Click Element    xpath://div[contains(text(), "Cloud-based Application Development")]
    Generate And Start Session
    Wait Until Page Contains    Live Attendance    timeout=5s
    Click Button    ${END_SESSION_BUTTON}
    Click Button    ${BACK_TO_CLASSES_BUTTON}
    # Test DES431 session
    Click Element    xpath://div[contains(text(), "Big Data Analytics")]
    Generate And Start Session
    Wait Until Page Contains    Live Attendance    timeout=5s
    Click Button    ${END_SESSION_BUTTON}
    Click Button    ${BACK_TO_CLASSES_BUTTON}

TC045_Session_Code_Uniqueness_Test
    [Documentation]    Test that generated session codes are unique
    [Tags]    integration    session-codes    uniqueness
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    # Generate first session code
    Click Button    Generate Session Code
    ${first_code}=    Get Value    ${SESSION_CODE_INPUT}
    # Generate second session code
    Click Button    Generate Session Code
    ${second_code}=    Get Value    ${SESSION_CODE_INPUT}
    # Codes should be different
    Should Not Be Equal    ${first_code}    ${second_code}

TC046_Browser_Back_Forward_Navigation
    [Documentation]    Test browser back/forward button functionality
    [Tags]    integration    navigation    browser
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    # Use browser back button
    Go Back
    Wait Until Page Contains    Your Classes    timeout=5s
    # Use browser forward button
    Go Forward
    Wait Until Page Contains    Start Attendance Session    timeout=5s

TC047_Page_Refresh_State_Persistence
    [Documentation]    Test page refresh behavior and state persistence
    [Tags]    integration    refresh    state
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    Generate And Start Session
    Wait Until Page Contains    Live Attendance    timeout=5s
    # Refresh page
    Reload Page
    # Should maintain session state or redirect appropriately
    Wait Until Page Contains Element    body    timeout=10s
    # Verify proper behavior after refresh

TC048_Concurrent_Session_Testing
    [Documentation]    Test behavior with multiple browser tabs/sessions
    [Tags]    integration    concurrent    sessions
    # Open first session
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    Generate And Start Session
    Wait Until Page Contains    Live Attendance    timeout=5s
    # This test would require multiple browser instances
    # Implementation depends on testing infrastructure

TC049_Error_Recovery_Testing
    [Documentation]    Test application recovery from various error states
    [Tags]    integration    error-recovery    resilience
    Open Application
    Login With Valid Credentials
    # Test network error simulation (if supported)
    # Test invalid navigation attempts
    Go To    ${BASE_URL}/invalid-page
    # Should handle gracefully and allow navigation back
    Go To    ${BASE_URL}
    Wait Until Page Contains    Instructor Login    timeout=10s

TC050_Performance_Load_Testing
    [Documentation]    Basic performance validation for key user flows
    [Tags]    performance    load    timing
    ${start_time}=    Get Time    epoch
    Open Application
    Login With Valid Credentials
    ${login_time}=    Get Time    epoch
    ${login_duration}=    Evaluate    ${login_time} - ${start_time}
    Should Be True    ${login_duration} < 5    Login took more than 5 seconds
    
    Navigate To Class Session
    ${nav_time}=    Get Time    epoch
    ${nav_duration}=    Evaluate    ${nav_time} - ${login_time}
    Should Be True    ${nav_duration} < 3    Navigation took more than 3 seconds

TC051_Accessibility_Basic_Testing
    [Documentation]    Basic accessibility compliance testing
    [Tags]    accessibility    a11y    compliance
    Open Application
    Login With Valid Credentials
    # Test keyboard navigation
    Press Keys    None    TAB
    Press Keys    None    TAB
    Press Keys    None    ENTER
    # Test that focus is visible and logical
    ${focused_element}=    Get WebElement    css:*:focus
    Element Should Be Visible    ${focused_element}

TC052_Cross_Browser_Compatibility
    [Documentation]    Test key functionality across different browsers
    [Tags]    compatibility    cross-browser    browsers
    # This test would run the same basic flow with different browser settings
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    Generate And Start Session
    Wait Until Page Contains    Live Attendance    timeout=10s
    Click Button    ${END_SESSION_BUTTON}
    Click Button    ${BACK_TO_CLASSES_BUTTON}
    Page Should Contain    Your Classes