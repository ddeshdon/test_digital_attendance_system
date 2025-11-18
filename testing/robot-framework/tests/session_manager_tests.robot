*** Settings ***
Documentation    Session Manager Testing Suite
Resource         ../resources/common.robot
Test Setup       Setup Test Environment
Test Teardown    Close Application
Suite Teardown   Take Screenshot On Failure

*** Test Cases ***
TC021_Session_Manager_Elements
    [Documentation]    Verify all session manager elements are displayed
    [Tags]    session    ui    smoke
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    Verify Page Elements    ${START_SESSION_BUTTON}    ${SESSION_CODE_INPUT}    ${BACK_TO_CLASSES_BUTTON}
    Page Should Contain    Start Attendance Session
    Page Should Contain    Session Settings

TC022_Generate_Session_Code
    [Documentation]    Test session code generation functionality
    [Tags]    session    functional    code-generation
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    Click Button    Generate Session Code
    Wait Until Element Is Visible    ${SESSION_CODE_INPUT}    timeout=5s
    ${session_code}=    Get Value    ${SESSION_CODE_INPUT}
    Should Not Be Empty    ${session_code}
    Length Should Be    ${session_code}    6

TC023_Manual_Session_Code_Input
    [Documentation]    Test manual session code input functionality
    [Tags]    session    functional    manual-input
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    Clear Element Text    ${SESSION_CODE_INPUT}
    Input Text    ${SESSION_CODE_INPUT}    ABC123
    ${input_value}=    Get Value    ${SESSION_CODE_INPUT}
    Should Be Equal    ${input_value}    ABC123

TC024_Start_Attendance_Session
    [Documentation]    Test starting an attendance session
    [Tags]    session    functional    start-session
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    Generate And Start Session
    Wait Until Page Contains    Live Attendance    timeout=10s
    Element Should Be Visible    ${END_SESSION_BUTTON}
    Page Should Contain    Current Session Code

TC025_Session_Code_Validation
    [Documentation]    Test session code validation rules
    [Tags]    session    validation    input
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    # Test empty session code
    Clear Element Text    ${SESSION_CODE_INPUT}
    Click Button    ${START_SESSION_BUTTON}
    Page Should Contain    Please generate or enter a session code
    # Test valid session code
    Input Text    ${SESSION_CODE_INPUT}    TEST01
    Click Button    ${START_SESSION_BUTTON}
    Wait Until Page Contains    Live Attendance    timeout=5s

TC026_Session_Code_Format_Validation
    [Documentation]    Test session code format restrictions
    [Tags]    session    validation    format
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    # Test special characters (should be filtered/rejected)
    Input Text    ${SESSION_CODE_INPUT}    @#$%^&
    ${filtered_value}=    Get Value    ${SESSION_CODE_INPUT}
    Should Not Contain    ${filtered_value}    @
    Should Not Contain    ${filtered_value}    #
    # Test alphanumeric input (should be accepted)
    Clear Element Text    ${SESSION_CODE_INPUT}
    Input Text    ${SESSION_CODE_INPUT}    ABC123
    ${valid_value}=    Get Value    ${SESSION_CODE_INPUT}
    Should Be Equal    ${valid_value}    ABC123

TC027_Active_Session_Display
    [Documentation]    Verify active session information display
    [Tags]    session    ui    active-session
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    Generate And Start Session
    Wait Until Page Contains    Live Attendance    timeout=5s
    # Verify session information is displayed
    Page Should Contain    DES424
    Page Should Contain    Current Session Code
    Element Should Be Visible    ${END_SESSION_BUTTON}
    Page Should Contain    0 students checked in

TC028_End_Session_Functionality
    [Documentation]    Test ending an active session
    [Tags]    session    functional    end-session
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    Generate And Start Session
    Wait Until Page Contains    Live Attendance    timeout=5s
    Click Button    ${END_SESSION_BUTTON}
    # Should return to session setup
    Wait Until Page Contains    Start Attendance Session    timeout=5s
    Element Should Be Visible    ${START_SESSION_BUTTON}

TC029_Session_Navigation_Flow
    [Documentation]    Test complete session navigation flow
    [Tags]    session    navigation    flow
    Open Application
    Login With Valid Credentials
    # From dashboard to session
    Navigate To Class Session
    Page Should Contain    Start Attendance Session
    # Start session
    Generate And Start Session
    Wait Until Page Contains    Live Attendance    timeout=5s
    # End session
    Click Button    ${END_SESSION_BUTTON}
    Wait Until Page Contains    Start Attendance Session    timeout=5s
    # Back to dashboard
    Click Button    ${BACK_TO_CLASSES_BUTTON}
    Wait Until Page Contains    Your Classes    timeout=5s

TC030_Session_Settings_Validation
    [Documentation]    Test session settings and configuration options
    [Tags]    session    settings    configuration
    Open Application
    Login With Valid Credentials
    Navigate To Class Session
    # Verify session settings section
    Page Should Contain    Session Settings
    Page Should Contain    Generate a session code or enter one manually
    Element Should Be Visible    xpath://button[contains(text(), "Generate Session Code")]
    Element Should Be Visible    ${SESSION_CODE_INPUT}
    Element Should Be Visible    ${START_SESSION_BUTTON}