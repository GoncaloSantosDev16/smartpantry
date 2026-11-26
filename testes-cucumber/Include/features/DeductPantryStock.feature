@SCRUM-50 @US-22 @meal-completion
Feature: Deduct the used ingredients from the pantry (or skip it)
  As a SmartPantry user
  I want the ingredients I used to be taken off my pantry when I finish a recipe,
  or to skip that step when I do not want to change my stock
  So that my pantry always matches what I really have

  # The generated sample recipe "Arroz de frango com legumes" uses:
  #   200 g Arroz · 300 g Frango cozido · 2 un Cenoura · 20 ml Azeite
  # The summary of the ingredients used comes from US-21 (ConsumedIngredientsSummary.feature).

  Background:
    Given I have completed the onboarding

  # ----------------------------------------------------------------------
  # SCRUM-135 — Decrement and removal logic
  # ----------------------------------------------------------------------

  @SCRUM-135
  Scenario: The quantities used are taken off the pantry, converting the units
    Given the pantry contains:
      | name    | quantity | unit | expires |
      | Arroz   | 1        | kg   |         |
      | Cenoura | 5        | un   |         |
      | Azeite  | 1        | L    |         |
    And I open a generated recipe
    When I finish cooking the recipe
    And I confirm the summary
    And I go back to the pantry
    Then the pantry lists the product "Arroz" with quantity "0.8"
    And the pantry lists the product "Cenoura" with quantity "3"
    And the pantry lists the product "Azeite" with quantity "0.98"

  @SCRUM-135
  Scenario: A product that runs out is removed from the pantry
    Given the pantry contains:
      | name    | quantity | unit | expires |
      | Arroz   | 1        | kg   |         |
      | Cenoura | 2        | un   |         |
    And I open a generated recipe
    When I finish cooking the recipe
    And I confirm the summary
    And I go back to the pantry
    Then the pantry no longer lists the product "Cenoura"
    And the pantry lists the product "Arroz" with quantity "0.8"

  @SCRUM-135
  Scenario: The batch that expires first is used first
    Given the pantry contains:
      | name    | quantity | unit | expires |
      | Arroz   | 0.1      | kg   | 1       |
      | Arroz   | 1        | kg   | 10      |
    And I open a generated recipe
    When I finish cooking the recipe
    And I confirm the summary
    And I go back to the pantry
    Then the pantry lists the product "Arroz" with quantity "0.9"

  @SCRUM-135
  Scenario: Expired products are not used
    Given the pantry contains:
      | name    | quantity | unit | expires |
      | Arroz   | 1        | kg   |         |
      | Azeite  | 1        | L    | -1      |
    And I open a generated recipe
    When I finish cooking the recipe
    Then the summary shows "Azeite" as not in the pantry
    When I confirm the summary
    And I go back to the pantry
    Then the pantry lists the product "Azeite" with quantity "1"

  @SCRUM-135 @persistence
  Scenario: The new stock is kept after reloading the app
    Given the pantry contains:
      | name    | quantity | unit | expires |
      | Cenoura | 5        | un   |         |
    And I open a generated recipe
    When I finish cooking the recipe
    And I confirm the summary
    And I go back to the pantry
    And I reload the app
    Then the pantry lists the product "Cenoura" with quantity "3"

  # ----------------------------------------------------------------------
  # SCRUM-136 — "Skip" option
  # ----------------------------------------------------------------------

  @SCRUM-136
  Scenario: Skipping leaves the pantry untouched
    Given the pantry contains:
      | name    | quantity | unit | expires |
      | Arroz   | 1        | kg   |         |
      | Cenoura | 5        | un   |         |
    And I open a generated recipe
    When I finish cooking the recipe
    And I skip updating the pantry
    Then I am told the pantry was not changed
    When I go back to the pantry
    Then the pantry lists the product "Arroz" with quantity "1"
    And the pantry lists the product "Cenoura" with quantity "5"

  @SCRUM-136
  Scenario: Skipping is possible even with invalid quantities in the summary
    Given the pantry contains:
      | name    | quantity | unit | expires |
      | Cenoura | 5        | un   |         |
    And I open a generated recipe
    When I finish cooking the recipe
    And I change the quantity used of "Cenoura" to "9"
    Then I cannot confirm the summary
    When I skip updating the pantry
    Then I am told the pantry was not changed

  @SCRUM-136
  Scenario: Skipping is offered when no ingredient is in the pantry
    Given the pantry is empty
    And I open a generated recipe
    When I finish cooking the recipe
    Then I am told none of the ingredients are in the pantry
    When I skip updating the pantry
    Then I am told the pantry was not changed
