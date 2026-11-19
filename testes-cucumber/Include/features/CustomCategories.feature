Feature: Custom Categories

  Scenario: Create category "A" and verify it becomes selectable
    Given the user has completed onboarding and is on the pantry dashboard
    And category "A" does not exist in the category list yet
    When the user opens the new category modal
    And creates the custom category "A"
    Then category "A" should be selected in the category field
    And category "A" should be available in the category dropdown list

  Scenario: Prevent creating duplicate category "A"
    Given the user has completed onboarding and is on the pantry dashboard
    When the user opens the new category modal
    And creates the custom category "A"
    And the user opens the new category modal
    And attempts to create duplicate category "A"
    Then the modal should prevent creating the duplicate category