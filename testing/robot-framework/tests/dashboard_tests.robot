*** Settings ***
Documentation    Dashboard Testing Suite
Resource         ../resources/common.robot
Test Setup       Setup Test Environment
Test Teardown    Close Application
Suite Teardown   Take Screenshot On Failure

*** Test Cases ***
TC011_Dashboard_Elements_Display
    [Documentation]    Verify all dashboard elements are present after login
    [Tags]    dashboard    ui    smoke
    Open Application
    Login With Valid Credentials
    Verify Page Elements    ${YOUR_CLASSES_TITLE}    ${VIEW_HISTORY_BUTTON}    ${LOGOUT_BUTTON}
    Page Should Contain    Select a class to manage attendance or view attendance history

TC012_Class_Cards_Display
    [Documentation]    Verify all instructor classes are displayed as cards
    [Tags]    dashboard    ui    classes
    Open Application
    Login With Valid Credentials
    # Verify class cards are present
    Page Should Contain    DES424
    Page Should Contain    Cloud-based Application Development
    Page Should Contain    DES431
    Page Should Contain    Big Data Analytics
    Page Should Contain    ICT760
    Page Should Contain    Digital Signal Processing and Internet of Things
    # Verify time and room information
    Page Should Contain    9:00 - 12:00
    Page Should Contain    BKD 3507
    Page Should Contain    BKD 3506

TC013_Class_Card_Color_Coding
    [Documentation]    Verify class cards have proper color coding for days
    [Tags]    dashboard    ui    visual
    Open Application
    Login With Valid Credentials
    # Verify day tags are present with different colors
    Element Should Be Visible    xpath://span[contains(text(), "Wednesday")]
    Element Should Be Visible    xpath://span[contains(text(), "Tuesday")]
    Element Should Be Visible    xpath://span[contains(text(), "Monday")]

TC014_Navigate_To_Class_Session
    [Documentation]    Test navigation from dashboard to class session
    [Tags]    dashboard    navigation    functional
    Open Application
    Login With Valid Credentials
    # Click on first class card
    Click Element    xpath://div[contains(text(), "Cloud-based Application Development")]
    Wait Until Page Contains    Start Attendance Session    timeout=10s
    Page Should Contain    DES424
    Element Should Be Visible    ${BACK_TO_CLASSES_BUTTON}

TC015_View_Attendance_History_Navigation
    [Documentation]    Test navigation to attendance history page
    [Tags]    dashboard    navigation    history
    Open Application
    Login With Valid Credentials
    Click Button    ${VIEW_HISTORY_BUTTON}
    Wait Until Page Contains    Attendance History    timeout=10s
    Page Should Contain    Filters & Search
    Element Should Be Visible    ${BACK_TO_CLASSES_BUTTON}

TC016_Back_To_Classes_Navigation
    [Documentation]    Test back navigation from session and history pages
    [Tags]    dashboard    navigation    functional
    Open Application
    Login With Valid Credentials
    # Test back from history
    Click Button    ${VIEW_HISTORY_BUTTON}
    Wait Until Page Contains    Attendance History    timeout=5s
    Click Button    ${BACK_TO_CLASSES_BUTTON}
    Wait Until Page Contains    Your Classes    timeout=5s
    # Test back from session
    Navigate To Class Session
    Click Button    ${BACK_TO_CLASSES_BUTTON}
    Wait Until Page Contains    Your Classes    timeout=5s

TC017_Logout_Functionality
    [Documentation]    Test logout functionality from dashboard
    [Tags]    dashboard    authentication    functional
    Open Application
    Login With Valid Credentials
    Click Button    ${LOGOUT_BUTTON}
    Wait Until Page Contains    Instructor Login    timeout=10s
    Location Should Contain    ${BASE_URL}

TC018_Dashboard_Responsive_Design
    [Documentation]    Test dashboard responsiveness on different screen sizes
    [Tags]    dashboard    responsive    ui
    Open Application
    Login With Valid Credentials
    # Desktop view
    Set Window Size    1920    1080
    Element Should Be Visible    ${YOUR_CLASSES_TITLE}
    # Tablet view
    Set Window Size    768    1024
    Element Should Be Visible    ${YOUR_CLASSES_TITLE}
    # Mobile view
    Set Window Size    375    667
    Element Should Be Visible    ${YOUR_CLASSES_TITLE}

TC019_Header_Elements_Verification
    [Documentation]    Verify header contains proper branding and user info
    [Tags]    dashboard    ui    header
    Open Application
    Login With Valid Credentials
    Page Should Contain    Digital Attendance System
    Page Should Contain    Welcome, Dr. Apichon Witayangkurn
    Element Should Be Visible    xpath://img[@alt="SIIT Logo"]

TC020_Class_Information_Accuracy
    [Documentation]    Verify class information matches expected data
    [Tags]    dashboard    data    accuracy
    Open Application
    Login With Valid Credentials
    # Verify DES424 class information
    Element Should Contain    xpath://div[contains(text(), "DES424")]    DES424
    Page Should Contain    Cloud-based Application Development
    Page Should Contain    Wednesday
    Page Should Contain    9:00 - 12:00
    Page Should Contain    BKD 3507