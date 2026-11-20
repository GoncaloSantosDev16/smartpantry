@SCRUM-41 @recipes @core
Feature: Save recipes and view their details
  As a SmartPantry user
  I want to open a recipe, see its details and save it
  So that I can cook it again later

  # ----------------------------------------------------------------------
  # SCRUM-97 — Recipe details
  # ----------------------------------------------------------------------

  @SCRUM-97 @details
  Scenario: View the details of a generated recipe
    Given I have completed the onboarding
    When I open a generated recipe
    Then I see the recipe details
    And the recipe is not saved yet

  # ----------------------------------------------------------------------
  # SCRUM-98 / SCRUM-99 — Save the recipe and check persistence
  # ----------------------------------------------------------------------

  @SCRUM-98 @SCRUM-99 @persistence
  Scenario: Save a generated recipe
    Given I have completed the onboarding
    And I open a generated recipe
    When I save the recipe
    Then the recipe is marked as saved

  @SCRUM-98 @SCRUM-99 @persistence
  Scenario: A saved recipe is still there after reloading the app
    Given I have completed the onboarding
    And I open a generated recipe
    And I save the recipe
    When I reload the recipe page
    Then the recipe "Arroz de frango com legumes" is still saved
