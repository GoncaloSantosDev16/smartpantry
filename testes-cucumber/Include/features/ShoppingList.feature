@SCRUM-52 @SCRUM-112 @shopping-list
Feature: Shopping list (header access)
  As a SmartPantry user
  I want to manage a shopping list from the header
  So that I know what I need to buy

  Background:
    Given I am on the dashboard with an empty shopping list

  Scenario: Add an item to the shopping list
    When I open the shopping list from the header
    And I add "Leite" with quantity 2 to the shopping list
    Then I see "Leite" in the shopping list
    And the header counter shows 1

  Scenario: Remove an item from the shopping list
    Given the shopping list has the item "Ovos"
    When I remove "Ovos" from the shopping list
    Then I do not see "Ovos" in the shopping list
    And the header counter is hidden
    And the shopping list is empty

  Scenario: Checking an item updates the counter
    Given the shopping list has the item "Pão"
    When I mark "Pão" as bought
    Then the item "Pão" is shown as bought
    And the header counter is hidden

  Scenario: An item without a name is not added
    When I open the shopping list from the header
    And I try to add an item without a name
    Then I see an error in the shopping list
    And the shopping list is empty

  Scenario: The shopping list persists after reloading the app
    Given the shopping list has the item "Arroz"
    When I reload the app
    And I open the shopping list from the header
    Then I see "Arroz" in the shopping list
    And the header counter shows 1
