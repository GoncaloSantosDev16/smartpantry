Feature: Manual Entry Fallback (US-08)
  As a user,
  I want to be able to add a product by filling in the details manually,
  In case the camera or image upload fails.

  Scenario: Successfully add a product through the Manual tab
    Given the user is on the main Pantry page
    And selects the "Manual" tab
    When they fill the name with "Virgin Olive Oil"
    And select the category "Other"
    And set the quantity to "1" and the unit to "L"
    And click the "Add Item" button
    Then the product "Virgin Olive Oil" should appear in the pantry list