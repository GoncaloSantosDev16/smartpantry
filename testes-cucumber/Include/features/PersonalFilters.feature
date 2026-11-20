@SCRUM-39 @SCRUM-123 @recipes
Feature: Filter recipes by the active profile's restrictions
  As a SmartPantry user with allergies or a diet
  I want recipe suggestions and searches to respect my profile's restrictions
  So that I never get a recipe I cannot eat

  Background:
    Given there is a default profile "Casa" allergic to "peanut" and another profile "Ginásio" allergic to "lactose"

  # ----------------------------------------------------------------------
  # SCRUM-122 — Personal filters toggle
  # ----------------------------------------------------------------------

  @SCRUM-122
  Scenario: The personal filters toggle is on by default
    When I open the recipes page
    Then the personal filters toggle is on

  @SCRUM-122
  Scenario: Turning the toggle off disables the restrictions
    Given I open the recipes page
    When I turn the personal filters toggle off
    Then the personal filters toggle is off
    And no personal restrictions are shown

  @SCRUM-122
  Scenario: The toggle state is kept after reopening the app
    Given I open the recipes page
    And I turn the personal filters toggle off
    When I open the recipes page
    Then the personal filters toggle is off

  # ----------------------------------------------------------------------
  # SCRUM-120 — Restrictions of the active profile
  # ----------------------------------------------------------------------

  @SCRUM-120
  Scenario: The active profile's restrictions are shown
    When I open the recipes page
    Then the restrictions shown include "peanut"

  @SCRUM-120
  Scenario: Switching profile updates the restrictions shown
    Given I open the app
    And I switch to the profile "Ginásio"
    When I open the recipes page
    Then the restrictions shown include "lactose"
    And the restrictions shown do not include "peanut"
