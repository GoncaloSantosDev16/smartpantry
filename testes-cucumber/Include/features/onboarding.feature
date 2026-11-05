@onboarding @core
Feature: Onboarding and default profile

  Scenario: First launch leads to onboarding
    Given the application is opened for the first time
    When the home page is loaded
    Then I see the onboarding screen

  Scenario: Create the default profile
    Given I am on the onboarding screen
    When I set 2 people, the "vegetarian" diet and the "peanut" allergy
    And I confirm the onboarding
    Then the default profile is saved
    And I am redirected to the dashboard

  Scenario: Subsequent launches skip onboarding
    Given a default profile already exists
    When I open the application
    Then I see the dashboard without passing through onboarding

  Scenario: Empty profile name prevents continuing
    Given I am on the first step of onboarding
    When I clear the profile name
    Then I cannot advance to the next step

  Scenario: Direct access to onboarding with existing profile
    Given a default profile already exists
    When I try to open the onboarding screen directly
    Then I am redirected to the dashboard