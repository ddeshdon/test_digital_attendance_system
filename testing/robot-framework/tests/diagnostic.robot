*** Settings ***
Documentation    Diagnostic Test to Check Page Elements
Resource         ../resources/common.robot
Test Setup       Open Browser    ${BASE_URL}    ${BROWSER}
Test Teardown    Close Browser

*** Test Cases ***
Diagnostic_Check_Page_Source
    [Documentation]    Check what elements are actually on the page
    [Tags]    diagnostic
    Go To    ${BASE_URL}
    Wait Until Page Contains Element    body    timeout=10s
    ${page_source}=    Get Source
    Log    ${page_source}    INFO
    # Check for various possible button texts
    ${signin_present}=    Run Keyword And Return Status    Page Should Contain    Sign In
    ${login_present}=    Run Keyword And Return Status    Page Should Contain    Login
    ${submit_present}=    Run Keyword And Return Status    Page Should Contain    Submit
    Log    Sign In present: ${signin_present}    INFO
    Log    Login present: ${login_present}    INFO
    Log    Submit present: ${submit_present}    INFO
    # Try to find the button by different methods
    ${button_by_type}=    Run Keyword And Return Status    Element Should Be Visible    css:button[type="submit"]
    ${button_by_class}=    Run Keyword And Return Status    Element Should Be Visible    css:.ant-btn-primary
    Log    Button by type: ${button_by_type}    INFO
    Log    Button by class: ${button_by_class}    INFO