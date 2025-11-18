*** Settings ***
Documentation    Digital Attendance System - Test Configuration
Library          SeleniumLibrary
Library          Collections
Library          String
Library          DateTime

*** Variables ***
# Application URLs
${BASE_URL}              http://localhost:3000
${LOGIN_URL}             ${BASE_URL}
${DASHBOARD_URL}         ${BASE_URL}

# Test Credentials
${VALID_USERNAME}        apichon.w
${VALID_PASSWORD}        siit2025
${INVALID_USERNAME}      invalid.user
${INVALID_PASSWORD}      wrongpass

# Browser Configuration
${BROWSER}               Chrome
${BROWSER_OPTIONS}       add_argument("--no-sandbox");add_argument("--disable-dev-shm-usage")
${IMPLICIT_WAIT}         10
${PAGE_LOAD_TIMEOUT}     30

# Test Data
${VALID_UUID}           D001A2B6-AA1F-4860-9E43-FC83C418FC58
${INVALID_UUID}         invalid-uuid-format
${CLASS_CODE}           DES424
${ROOM_ID}              BKD 3507

# Element Locators
${LOGIN_USERNAME_FIELD}     css:input[placeholder*="username"]
${LOGIN_PASSWORD_FIELD}     css:input[type="password"]
${LOGIN_SUBMIT_BUTTON}      css:button[type="submit"]
${DEMO_CREDENTIALS_BUTTON}  xpath://button[contains(text(), "Use Demo Credentials")]
${LOGOUT_BUTTON}            xpath://button[contains(text(), "Logout")]

# Dashboard Elements
${YOUR_CLASSES_TITLE}       xpath://h1[contains(text(), "Your Classes")]
${VIEW_HISTORY_BUTTON}      xpath://button[contains(text(), "View Attendance History")]
${CLASS_CARD}              css:.ant-card
${BACK_TO_CLASSES_BUTTON}   xpath://button[contains(text(), "Back to Classes")]

# Session Manager Elements
${SESSION_TITLE}           xpath://h2[contains(text(), "Start Attendance Session")]
${CLASS_ID_FIELD}          xpath://input[@placeholder="e.g., DES424"]
${ROOM_ID_FIELD}           xpath://input[@placeholder="e.g., R602"]
${BEACON_UUID_FIELD}       xpath://textarea[@placeholder*="Paste UUID"]
${ATTENDANCE_WINDOW_FIELD}    xpath://input[@role="spinbutton"]
${START_SESSION_BUTTON}    xpath://button[contains(text(), "Start Attendance Session")]

# History Elements
${SEARCH_FIELD}            xpath://input[@placeholder="Search student name or ID"]
${DATE_PICKER}             xpath://input[@placeholder="Start Date"]
${EXPORT_CSV_BUTTON}       xpath://button[contains(text(), "CSV")]
${FILTERS_CARD}            xpath://div[contains(text(), "Filters & Search")]

*** Keywords ***
Setup Test Environment
    [Documentation]    Initialize browser and navigate to application
    Set Selenium Speed    0.5
    Set Selenium Implicit Wait    ${IMPLICIT_WAIT}
    Set Selenium Timeout    ${PAGE_LOAD_TIMEOUT}

Open Application
    [Documentation]    Open browser and navigate to login page
    Open Browser    ${LOGIN_URL}    ${BROWSER}
    Maximize Browser Window
    Set Selenium Implicit Wait    ${IMPLICIT_WAIT}
    Wait Until Page Contains    Instructor Login    timeout=10s

Close Application
    [Documentation]    Close browser and cleanup
    Close Browser

Login With Valid Credentials
    [Documentation]    Perform login with valid credentials
    Input Text    ${LOGIN_USERNAME_FIELD}    ${VALID_USERNAME}
    Input Text    ${LOGIN_PASSWORD_FIELD}    ${VALID_PASSWORD}
    Click Button    ${LOGIN_SUBMIT_BUTTON}
    Wait Until Page Contains    Your Classes    timeout=10s

Login With Demo Credentials
    [Documentation]    Use demo credentials button to login
    Click Button    ${DEMO_CREDENTIALS_BUTTON}
    Wait Until Element Is Visible    ${LOGIN_USERNAME_FIELD}
    Element Attribute Value Should Be    ${LOGIN_USERNAME_FIELD}    value    ${VALID_USERNAME}
    Click Button    ${LOGIN_SUBMIT_BUTTON}
    Wait Until Page Contains    Your Classes    timeout=10s

Navigate To Class Session
    [Arguments]    ${class_name}=Cloud-based Application Development
    [Documentation]    Click on a specific class card to start session
    Click Element    xpath://div[contains(text(), "${class_name}")]
    Wait Until Page Contains    Start Attendance Session    timeout=10s

Navigate To Attendance History
    [Documentation]    Navigate from dashboard to attendance history
    Click Button    View Attendance History
    Wait Until Page Contains    Attendance History    timeout=10s

Fill Session Form
    [Arguments]    ${class_id}=${CLASS_CODE}    ${room_id}=${ROOM_ID}    ${uuid}=${VALID_UUID}    ${window}=5
    [Documentation]    Fill out the session creation form
    Clear Element Text    ${CLASS_ID_FIELD}
    Input Text    ${CLASS_ID_FIELD}    ${class_id}
    Clear Element Text    ${ROOM_ID_FIELD}
    Input Text    ${ROOM_ID_FIELD}    ${room_id}
    Clear Element Text    ${BEACON_UUID_FIELD}
    Input Text    ${BEACON_UUID_FIELD}    ${uuid}
    Clear Element Text    ${ATTENDANCE_WINDOW_FIELD}
    Input Text    ${ATTENDANCE_WINDOW_FIELD}    ${window}

Verify Page Elements
    [Arguments]    @{elements}
    [Documentation]    Verify that multiple elements are visible on page
    FOR    ${element}    IN    @{elements}
        Wait Until Element Is Visible    ${element}    timeout=5s
    END

Verify Text Present
    [Arguments]    @{texts}
    [Documentation]    Verify that multiple texts are present on page
    FOR    ${text}    IN    @{texts}
        Wait Until Page Contains    ${text}    timeout=5s
    END

Take Screenshot On Failure
    [Documentation]    Take screenshot when test fails
    Capture Page Screenshot    failure-{index}.png