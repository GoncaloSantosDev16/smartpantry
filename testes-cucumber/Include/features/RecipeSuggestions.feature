@SCRUM-37 @SCRUM-119 @recipe-search
Feature: Search recipes based on the pantry
  As a SmartPantry user
  I want to search catalog recipes with what I have in my pantry
  So that I can cook without buying more ingredients

  # A API de receitas (Spoonacular) é simulada (mock): não se faz nenhum pedido real.

  Background:
    Given I have completed the onboarding
    And the pantry has the following items:
      | name   | quantity | unit |
      | Ovos   | 6        | un   |
      | Arroz  | 1        | kg   |
      | Tomate | 3        | un   |

  Scenario: The recipes found are shown in a grid
    Given the recipe API will return the mocked recipes
    When I open the recipe search from the header
    And I search for recipes
    Then the recipe API was asked for "egg", "rice" and "tomato"
    And I see 2 recipe cards
    And the first recipe is "Tomato Scrambled Eggs"
    And the recipe "Tomato Rice" has 2 of 3 ingredients in the pantry

  Scenario: No recipes match the pantry
    Given the recipe API will return no recipes
    When I open the recipe search from the header
    And I search for recipes
    Then I am told no recipes were found
    And I see 0 recipe cards

  Scenario: The recipe API is unavailable
    Given the recipe API will fail with "server"
    When I open the recipe search from the header
    And I search for recipes
    Then I see the recipe search error
    And I see 0 recipe cards

  Scenario: An empty pantry cannot be searched
    Given the pantry is empty
    When I open the recipe search from the header
    Then I am told the pantry is empty
    And I cannot search for recipes
