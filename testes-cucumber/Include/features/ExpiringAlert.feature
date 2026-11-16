@SCRUM-34 @SCRUM-108 @expiring-alert
Feature: Alert for pantry items expiring within 48 hours
  As a SmartPantry user
  I want to be warned about products that are about to expire
  So that I use them before they go to waste

  Background:
    Given I have completed the onboarding

  Scenario: A product that expires in 1 day shows the alert
    When I add the product "Leite" expiring in 1 day
    Then I see the expiring items alert
    And the expiring items alert lists "Leite"
    And the product "Leite" is highlighted in the pantry

  Scenario: A product that expires later does not show the alert
    When I add the product "Arroz" expiring in 10 days
    Then I do not see the expiring items alert
    And the product "Arroz" is not highlighted in the pantry

  Scenario: The alert is still shown after reopening the app
    When I add the product "Iogurte" expiring in 1 day
    And I reload the app
    Then the expiring items alert lists "Iogurte"

  Scenario: Removing the expiring product hides the alert
    When I add the product "Fiambre" expiring in 1 day
    And I remove the product "Fiambre" from the pantry
    Then I do not see the expiring items alert
