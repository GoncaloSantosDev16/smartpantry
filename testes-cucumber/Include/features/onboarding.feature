@SCRUM-69 @onboarding @core
Feature: Onboarding and default profile
  As a new SmartPantry user
  I want to create my profile on first launch
  So that the app knows my dietary restrictions from the start

  # ----------------------------------------------------------------------
  # SCRUM-29 — Default profile
  # ----------------------------------------------------------------------

  @SCRUM-29 @profile
  Scenario: Create the default profile
    Given the app has no saved data
    And I open the app
    When I set 2 people, the "vegetarian" diet and the "peanut" allergy
    And I confirm the onboarding
    Then I see the dashboard
    And the default profile is saved

  # ----------------------------------------------------------------------
  # SCRUM-67 — First launch detection
  # ----------------------------------------------------------------------

  @SCRUM-67 @first-launch
  Scenario: First launch leads to onboarding
    Given the app has no saved data
    When I open the app
    Then I see the onboarding screen

  @SCRUM-67 @first-launch
  Scenario: Later launches skip onboarding
    Given I have completed the onboarding
    When I open the app
    Then I see the dashboard

  @SCRUM-67 @navigation
  Scenario: Opening onboarding directly with an existing profile
    Given I have completed the onboarding
    When I open the onboarding screen directly
    Then I see the dashboard

  # ----------------------------------------------------------------------
  # SCRUM-65 — Validations and edge cases
  # ----------------------------------------------------------------------

  @SCRUM-65 @validation
  Scenario: Empty profile name blocks moving forward
    Given the app has no saved data
    And I open the app
    When I clear the profile name
    Then I cannot continue to the next step

  @SCRUM-65 @validation
  Scenario: Servings cannot go below one
    Given the app has no saved data
    And I open the app
    When I set 1 serving
    Then I cannot decrease the number of servings

  @SCRUM-65 @allergies
  Scenario: Duplicate allergy is not added twice
    Given the app has no saved data
    And I open the app
    And I go to the last step
    When I add the allergy "peanut"
    And I add the allergy "peanut"
    Then the allergy list has 1 entry

  @SCRUM-65 @allergies
  Scenario: Allergy typed in uppercase is normalised
    Given the app has no saved data
    And I open the app
    And I go to the last step
    When I add the allergy "Peanut"
    Then the allergy list contains "peanut"
