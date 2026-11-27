@SCRUM-41 @SCRUM-37 @save-suggestion
Feature: Save a suggested recipe
  As a SmartPantry user
  I want to save a recipe suggested for my pantry
  So that I can find it again in my saved recipes

  # A API de receitas (Spoonacular) é simulada (mock): não se faz nenhum pedido real.

  Background:
    Given I have completed the onboarding
    And the pantry has the following items:
      | name   | quantity | unit |
      | Ovos   | 6        | un   |
      | Arroz  | 1        | kg   |
      | Tomate | 3        | un   |

  @save
  Scenario: Save one of the suggested recipes
    Given the recipe API will return the mocked recipes
    When I open the recipe search from the header
    And I search for recipes
    And I save the suggested recipe "Tomato Rice"
    Then the suggested recipe "Tomato Rice" is marked as saved
    And the suggested recipe "Tomato Scrambled Eggs" is not saved

  @list
  Scenario: A saved suggestion appears in the saved recipes
    Given the recipe API will return the mocked recipes
    When I open the recipe search from the header
    And I search for recipes
    And I save the suggested recipe "Tomato Rice"
    And I open the saved recipes screen
    Then I see 1 saved recipe
    And I see the saved recipe "Tomato Rice"

  @persistence
  Scenario: The recipe stays marked as saved in a new search
    Given the recipe API will return the mocked recipes
    When I open the recipe search from the header
    And I search for recipes
    And I save the suggested recipe "Tomato Rice"
    And I open the saved recipes screen
    And the recipe API will return the mocked recipes
    And I open the recipe search from the header
    And I search for recipes
    Then the suggested recipe "Tomato Rice" is marked as saved
