@SCRUM-40 @missing-ingredients
Feature: Send a recipe's missing ingredients to the shopping list
  As a SmartPantry user
  I want to send the ingredients I am missing for a recipe to the shopping list
  So that I know what I have to buy to cook it

  # A API de receitas (Spoonacular) é simulada (mock): não se faz nenhum pedido real.
  # Na despensa há arroz e ovos, por isso numa receita com "rice, onion, garlic"
  # faltam a cebola e o alho.

  Background:
    Given I have completed the onboarding
    And the pantry has the following items:
      | name  | quantity | unit |
      | Arroz | 1        | kg   |
      | Ovos  | 6        | un   |
    And I start with an empty shopping list

  # ----------------------------------------------------------------------
  # SCRUM-127 — Botão "Adicionar à lista de compras" e contador do cabeçalho
  # ----------------------------------------------------------------------

  @SCRUM-127 @SCRUM-124 @SCRUM-125 @SCRUM-126
  Scenario: Sending the missing ingredients raises the shopping list counter
    When I open the recipe search from the header
    And the recipe API returns the recipe "Garlic Onion Rice" with the ingredients "rice, onion, garlic"
    And I search for recipes
    Then the header counter is hidden
    And the recipe "Garlic Onion Rice" offers to add 2 ingredients to the shopping list
    When I add the missing ingredients of "Garlic Onion Rice" to the shopping list
    Then the header counter shows 2
    And the recipe "Garlic Onion Rice" shows its missing ingredients are on the shopping list

  @SCRUM-127 @SCRUM-124
  Scenario: The missing ingredients are added with Portuguese names
    When I open the recipe search from the header
    And the recipe API returns the recipe "Garlic Onion Rice" with the ingredients "rice, onion, garlic"
    And I search for recipes
    And I add the missing ingredients of "Garlic Onion Rice" to the shopping list
    And I open the shopping list from the header
    Then I see "Cebola" in the shopping list
    And I see "Alho" in the shopping list
    And I do not see "Arroz" in the shopping list

  @SCRUM-127 @SCRUM-126
  Scenario: Ingredients already on the shopping list are not added again
    Given the shopping list has the item "Cebola"
    When I open the recipe search from the header
    And the recipe API returns the recipe "Garlic Onion Rice" with the ingredients "rice, onion, garlic"
    And I search for recipes
    Then the header counter shows 1
    And the recipe "Garlic Onion Rice" offers to add 1 ingredient to the shopping list
    When I add the missing ingredients of "Garlic Onion Rice" to the shopping list
    Then the header counter shows 2

  @SCRUM-127 @SCRUM-125
  Scenario: A recipe with every ingredient in the pantry has nothing to add
    When I open the recipe search from the header
    And the recipe API returns the recipe "Egg Fried Rice" with the ingredients "rice, eggs"
    And I search for recipes
    Then the recipe "Egg Fried Rice" does not offer to add ingredients to the shopping list
    And the header counter is hidden

  # ----------------------------------------------------------------------
  # SCRUM-128 — O "+" de um ingrediente em falta manda-o para a despensa
  # ----------------------------------------------------------------------

  @SCRUM-128
  Scenario: The "+" of a missing ingredient adds it to the pantry
    When I open the recipe search from the header
    And the recipe API returns the recipe "Garlic Onion Rice" with the ingredients "rice, onion, garlic"
    And I search for recipes
    And I add the ingredient "onion" of "Garlic Onion Rice" to the pantry
    Then the ingredient "onion" of "Garlic Onion Rice" is shown as in the pantry
    And the recipe "Garlic Onion Rice" has 2 of 3 ingredients in the pantry
    And the pantry on the recipes page includes "Cebola"
    And the recipe "Garlic Onion Rice" offers to add 1 ingredient to the shopping list
    And the header counter is hidden