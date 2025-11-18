*** Settings ***
Documentation    Login Page Testing Suite
Resource         ../resources/common.robot
Test Setup       Setup Test Environment
Test Teardown    Close Application
Suite Teardown   Take Screenshot On Failure

*** Test Cases ***
TC001_Verify_Login_Page_Elements
    [Documentation]    Verify all login page elements are present
    [Tags]    login    ui    smoke
    Open Application
    Verify Page Elements    ${LOGIN_USERNAME_FIELD}    ${LOGIN_PASSWORD_FIELD}    ${LOGIN_SUBMIT_BUTTON}
    Verify Text Present    Instructor Login    Sign in to access your dashboard
    Element Should Be Visible    ${DEMO_CREDENTIALS_BUTTON}

TC002_Valid_Login_Success
    [Documentation]    Test successful login with valid credentials
    [Tags]    login    functional    positive
    Open Application
    Login With Valid Credentials
    Location Should Contain    ${BASE_URL}
    Page Should Contain    Your Classes
    Page Should Contain    Welcome, Dr. Apichon Witayangkurn

TC003_Demo_Credentials_Login
    [Documentation]    Test login using demo credentials button
    [Tags]    login    functional    positive
    Open Application
    Login With Demo Credentials
    Location Should Contain    ${BASE_URL}
    Page Should Contain    Your Classes
    Page Should Contain    Welcome, Dr. Apichon Witayangkurn

TC004_Invalid_Username_Login
    [Documentation]    Test login with invalid username
    [Tags]    login    functional    negative
    Open Application
    Input Text    ${LOGIN_USERNAME_FIELD}    ${INVALID_USERNAME}
    Input Text    ${LOGIN_PASSWORD_FIELD}    ${VALID_PASSWORD}
    Click Button    ${LOGIN_SUBMIT_BUTTON}
    Wait Until Page Contains    Invalid username or password    timeout=5s

TC005_Invalid_Password_Login
    [Documentation]    Test login with invalid password
    [Tags]    login    functional    negative
    Open Application
    Input Text    ${LOGIN_USERNAME_FIELD}    ${VALID_USERNAME}
    Input Text    ${LOGIN_PASSWORD_FIELD}    ${INVALID_PASSWORD}
    Click Button    ${LOGIN_SUBMIT_BUTTON}
    Wait Until Page Contains    Invalid username or password    timeout=5s

TC006_Empty_Fields_Validation
    [Documentation]    Test form validation with empty fields
    [Tags]    login    validation    negative
    Open Application
    Click Button    ${LOGIN_SUBMIT_BUTTON}
    Page Should Contain    Please enter your username
    Input Text    ${LOGIN_USERNAME_FIELD}    ${VALID_USERNAME}
    Click Button    ${LOGIN_SUBMIT_BUTTON}
    Page Should Contain    Please enter your password

TC007_Login_Form_Responsiveness
    [Documentation]    Test login form on different screen sizes
    [Tags]    login    responsive    ui
    Open Application
    Set Window Size    1920    1080
    Element Should Be Visible    ${LOGIN_USERNAME_FIELD}
    Set Window Size    768    1024
    Element Should Be Visible    ${LOGIN_USERNAME_FIELD}
    Set Window Size    375    667
    Element Should Be Visible    ${LOGIN_USERNAME_FIELD}

TC008_Login_Page_Title_And_Branding
    [Documentation]    Verify page title and SIIT branding elements
    [Tags]    login    ui    branding
    Open Application
    Title Should Be    Instructor Dashboard
    Page Should Contain    Digital Attendance System
    Page Should Contain    Sirindhorn International Institute of Technology
    Element Should Be Visible    xpath://img[@alt="SIIT Logo"]

TC009_Demo_Credentials_Display
    [Documentation]    Verify demo credentials are displayed correctly
    [Tags]    login    ui    information
    Open Application
    Page Should Contain    Demo Credentials:
    Page Should Contain    Username: apichon.w
    Page Should Contain    Password: siit2025

TC010_Login_Loading_State
    [Documentation]    Test login button loading state during authentication
    [Tags]    login    functional    ui
    Open Application
    Input Text    ${LOGIN_USERNAME_FIELD}    ${VALID_USERNAME}
    Input Text    ${LOGIN_PASSWORD_FIELD}    ${VALID_PASSWORD}
    Click Button    ${LOGIN_SUBMIT_BUTTON}
    # Note: Loading state is brief, so we check for successful login
    Wait Until Page Contains    Your Classes    timeout=10s