*** Settings ***
Documentation    Working Login Test
Library          SeleniumLibrary

*** Variables ***
${BASE_URL}             http://localhost:3000
${VALID_USERNAME}       apichon.w
${VALID_PASSWORD}       siit2025

*** Test Cases ***
Test_Login_Page_Elements
    [Documentation]    Test actual login page elements
    Open Browser    ${BASE_URL}    Chrome
    Set Window Size    1920    1080
    
    # Wait for page to load
    Wait Until Page Contains    Instructor Login    timeout=10s
    
    # Check for main elements using more robust locators
    Element Should Be Visible    css:input[placeholder*="username"]
    Element Should Be Visible    css:input[type="password"]
    Element Should Be Visible    css:button[type="submit"]
    
    # Try logging in
    Input Text    css:input[placeholder*="username"]    ${VALID_USERNAME}
    Input Text    css:input[type="password"]    ${VALID_PASSWORD}
    Click Button    css:button[type="submit"]
    
    # Wait for dashboard
    Wait Until Page Contains    Your Classes    timeout=10s
    Page Should Contain    Dr. Apichon Witayangkurn
    
    Close Browser