Feature: Export all data to JSON
  As a SmartPantry user
  I want to export all my local data to a JSON file
  So that I can keep a backup of my pantry, profiles, and preferences

  Scenario: Export backup from Settings
    Given the application has a saved profile and ingredient
    And the user navigates to the Settings view
    When the user requests to export the data to JSON
    Then the application confirms that the JSON file was generated successfully