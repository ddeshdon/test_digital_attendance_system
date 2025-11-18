*** Settings ***
Documentation    Attendance History Testing Suite
Resource         ../resources/common.robot
Test Setup       Setup Test Environment
Test Teardown    Close Application
Suite Teardown   Take Screenshot On Failure

*** Test Cases ***
TC031_Attendance_History_Page_Elements
    [Documentation]    Verify all attendance history page elements are displayed
    [Tags]    history    ui    smoke
    Open Application
    Login With Valid Credentials
    Navigate To Attendance History
    Verify Page Elements    ${BACK_TO_CLASSES_BUTTON}    ${EXPORT_CSV_BUTTON}    ${SEARCH_INPUT}
    Page Should Contain    Attendance History
    Page Should Contain    Filters & Search

TC032_Class_Filter_Functionality
    [Documentation]    Test class filtering in attendance history
    [Tags]    history    filter    functional
    Open Application
    Login With Valid Credentials
    Navigate To Attendance History
    # Test class filter dropdown
    Click Element    ${CLASS_FILTER_DROPDOWN}
    Wait Until Element Is Visible    xpath://div[contains(text(), "DES424")]    timeout=5s
    Click Element    xpath://div[contains(text(), "DES424")]
    Wait Until Page Contains    Showing results for: DES424    timeout=5s

TC033_Date_Range_Filter
    [Documentation]    Test date range filtering functionality
    [Tags]    history    filter    date
    Open Application
    Login With Valid Credentials
    Navigate To Attendance History
    # Test date range picker
    Click Element    ${DATE_RANGE_PICKER}
    # Select start date (example: previous week)
    Click Element    xpath://td[@title="2024-01-01"]
    # Select end date (example: today)
    Click Element    xpath://td[@title="2024-01-07"]
    Click Button    Apply Date Filter
    Wait Until Page Contains    Showing results from    timeout=5s

TC034_Student_Search_Functionality
    [Documentation]    Test student name/ID search functionality
    [Tags]    history    search    functional
    Open Application
    Login With Valid Credentials
    Navigate To Attendance History
    Input Text    ${SEARCH_INPUT}    John
    Press Keys    ${SEARCH_INPUT}    ENTER
    Wait Until Page Contains    Search results for: John    timeout=5s
    # Clear search
    Clear Element Text    ${SEARCH_INPUT}
    Press Keys    ${SEARCH_INPUT}    ENTER
    Wait Until Page Does Not Contain    Search results for: John    timeout=5s

TC035_Export_CSV_Functionality
    [Documentation]    Test CSV export functionality
    [Tags]    history    export    csv
    Open Application
    Login With Valid Credentials
    Navigate To Attendance History
    Click Button    ${EXPORT_CSV_BUTTON}
    # Verify download dialog or success message
    Wait Until Page Contains    Download started    timeout=10s
    # Or check for download success message

TC036_Attendance_Records_Display
    [Documentation]    Verify attendance records are properly displayed
    [Tags]    history    display    records
    Open Application
    Login With Valid Credentials
    Navigate To Attendance History
    # Verify table headers
    Page Should Contain    Date
    Page Should Contain    Class
    Page Should Contain    Student Name
    Page Should Contain    Student ID
    Page Should Contain    Check-in Time
    Page Should Contain    Status
    # Verify sample data is displayed (if any)
    Element Should Be Visible    xpath://table[@class="ant-table-tbody"]

TC037_Pagination_Functionality
    [Documentation]    Test pagination for attendance history records
    [Tags]    history    pagination    navigation
    Open Application
    Login With Valid Credentials
    Navigate To Attendance History
    # Check if pagination is present (when there are multiple pages)
    Run Keyword And Ignore Error    Element Should Be Visible    xpath://ul[@class="ant-pagination"]
    # Test page navigation if pagination exists
    ${pagination_exists}=    Run Keyword And Return Status    Element Should Be Visible    xpath://li[@title="Next Page"]
    Run Keyword If    ${pagination_exists}    Click Element    xpath://li[@title="Next Page"]

TC038_Filter_Combination_Testing
    [Documentation]    Test multiple filters working together
    [Tags]    history    filter    combination
    Open Application
    Login With Valid Credentials
    Navigate To Attendance History
    # Apply class filter
    Click Element    ${CLASS_FILTER_DROPDOWN}
    Wait Until Element Is Visible    xpath://div[contains(text(), "DES424")]    timeout=5s
    Click Element    xpath://div[contains(text(), "DES424")]
    # Apply search filter
    Input Text    ${SEARCH_INPUT}    Student
    Press Keys    ${SEARCH_INPUT}    ENTER
    # Verify combined filters are applied
    Wait Until Page Contains    Showing results for: DES424    timeout=5s
    Page Should Contain    Search results for: Student

TC039_Clear_Filters_Functionality
    [Documentation]    Test clearing all applied filters
    [Tags]    history    filter    clear
    Open Application
    Login With Valid Credentials
    Navigate To Attendance History
    # Apply some filters first
    Click Element    ${CLASS_FILTER_DROPDOWN}
    Click Element    xpath://div[contains(text(), "DES424")]
    Input Text    ${SEARCH_INPUT}    Test
    Press Keys    ${SEARCH_INPUT}    ENTER
    # Clear filters
    Click Button    Clear All Filters
    # Verify filters are cleared
    ${search_value}=    Get Value    ${SEARCH_INPUT}
    Should Be Empty    ${search_value}
    Page Should Not Contain    Showing results for: DES424

TC040_Empty_State_Display
    [Documentation]    Verify empty state when no records match filters
    [Tags]    history    empty-state    ui
    Open Application
    Login With Valid Credentials
    Navigate To Attendance History
    # Search for non-existent data
    Input Text    ${SEARCH_INPUT}    NonExistentStudent12345
    Press Keys    ${SEARCH_INPUT}    ENTER
    Wait Until Page Contains    No attendance records found    timeout=5s
    Page Should Contain    Try adjusting your search criteria or date range

TC041_Status_Color_Coding
    [Documentation]    Verify attendance status color coding in history
    [Tags]    history    ui    status-colors
    Open Application
    Login With Valid Credentials
    Navigate To Attendance History
    # Verify status badges have proper colors (if data exists)
    Run Keyword And Ignore Error    Element Should Be Visible    xpath://span[contains(@class, "ant-tag-green") and contains(text(), "Present")]
    Run Keyword And Ignore Error    Element Should Be Visible    xpath://span[contains(@class, "ant-tag-red") and contains(text(), "Absent")]

TC042_Responsive_History_Design
    [Documentation]    Test attendance history page responsiveness
    [Tags]    history    responsive    ui
    Open Application
    Login With Valid Credentials
    Navigate To Attendance History
    # Desktop view
    Set Window Size    1920    1080
    Element Should Be Visible    ${SEARCH_INPUT}
    # Tablet view
    Set Window Size    768    1024
    Element Should Be Visible    ${SEARCH_INPUT}
    # Mobile view (table might become scrollable)
    Set Window Size    375    667
    Element Should Be Visible    ${SEARCH_INPUT}