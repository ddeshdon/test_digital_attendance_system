*** Settings ***
Documentation    Simple Browser Test
Library          SeleniumLibrary

*** Test Cases ***
Simple_Browser_Test
    [Documentation]    Just open browser and take screenshot
    Open Browser    http://localhost:3000    Chrome
    Set Window Size    1920    1080
    Sleep    3s
    Capture Page Screenshot    debug-screenshot.png
    ${title}=    Get Title
    Log    Page title: ${title}
    ${url}=    Get Location
    Log    Current URL: ${url}
    Close Browser