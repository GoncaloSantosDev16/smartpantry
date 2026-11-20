@SCRUM-44 @recipes @offline @core
Feature: Offline access to saved recipes
  As a SmartPantry user
  I want to open my saved recipes even without internet
  So that I can cook anywhere

  # ----------------------------------------------------------------------
  # SCRUM-100 / SCRUM-102 — Saved recipes screen reads from the database
  # ----------------------------------------------------------------------

  @SCRUM-100 @SCRUM-102 @list
  Scenario: Saved recipes are rendered from the database
    Given I have completed the onboarding
    And a saved recipe "Arroz de frango com legumes" exists
    And a saved recipe "Omelete de queijo" exists
    When I open the saved recipes screen
    Then I see 2 saved recipes
    And I see the saved recipe "Omelete de queijo"
    And I see the saved recipe "Arroz de frango com legumes"

  @SCRUM-100 @empty
  Scenario: No saved recipes yet
    Given I have completed the onboarding
    When I open the saved recipes screen
    Then I see the empty recipes message

  @SCRUM-100 @SCRUM-102 @details
  Scenario: Open a saved recipe from the list
    Given I have completed the onboarding
    And a saved recipe "Omelete de queijo" exists
    And I open the saved recipes screen
    When I open the saved recipe "Omelete de queijo"
    Then I see the details of the saved recipe "Omelete de queijo"

  # ----------------------------------------------------------------------
  # SCRUM-101 — Offline mode indicator
  # ----------------------------------------------------------------------

  @SCRUM-101 @offline-mode
  Scenario: The offline indicator appears and the recipes stay available
    Given I have completed the onboarding
    And a saved recipe "Omelete de queijo" exists
    And I open the saved recipes screen
    When the device goes offline
    Then I see the offline banner
    And I see 1 saved recipe
    When the device goes back online
    Then I do not see the offline banner
