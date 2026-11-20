@SCRUM-30 @SCRUM-105 @profiles
Feature: Switch the active profile from the header
  As a SmartPantry user with more than one profile
  I want to switch the active profile from the header
  So that the app uses the dietary restrictions of whoever I am cooking for

  # ----------------------------------------------------------------------
  # SCRUM-103 — Profile menu in the header
  # ----------------------------------------------------------------------

  @SCRUM-103
  Scenario: The header shows the active profile
    Given there is a default profile "Casa" and another profile "Ginásio"
    When I open the app
    Then the header shows "Casa" as the active profile

  @SCRUM-103
  Scenario: The profile menu lists every profile
    Given there is a default profile "Casa" and another profile "Ginásio"
    And I open the app
    When I open the profile menu
    Then the profile menu lists "Casa" and "Ginásio"

  # ----------------------------------------------------------------------
  # SCRUM-104 — Active profile in the app state
  # ----------------------------------------------------------------------

  @SCRUM-104
  Scenario: Choosing another profile makes it active
    Given there is a default profile "Casa" and another profile "Ginásio"
    And I open the app
    When I switch to the profile "Ginásio"
    Then the header shows "Ginásio" as the active profile

  @SCRUM-104
  Scenario: The chosen profile is kept after reopening the app
    Given there is a default profile "Casa" and another profile "Ginásio"
    And I open the app
    And I switch to the profile "Ginásio"
    When I open the app
    Then the header shows "Ginásio" as the active profile
