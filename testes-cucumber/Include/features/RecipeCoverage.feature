@SCRUM-38 @SCRUM-113 @SCRUM-114 @SCRUM-115 @recipe-coverage
Feature: Percentage of recipe ingredients in the pantry
  As a SmartPantry user
  I want to see how many of each recipe's ingredients I already have
  So that I can choose recipes that need fewer purchases

  # A API de receitas (Spoonacular) é simulada (mock).
  # Validade em dias a partir de hoje: vazio = sem validade, negativo = já expirou.

  Background:
    Given I have completed the onboarding
    And the pantry contains:
      | name   | quantity | unit | expires |
      | Ovos   | 6        | un   |         |
      | Arroz  | 1        | kg   |         |
      | Tomate | 3        | un   |         |
      | Leite  | 1        | L    | -1      |

  # SCRUM-113 — cruzar os ingredientes da receita com a despensa
  Scenario: Each ingredient is marked as in the pantry or missing
    Given the recipe catalogue contains:
      | title       | ingredients        |
      | Tomato Rice | rice, tomato, onion |
    When I look for recipes with my pantry
    Then the recipe "Tomato Rice" marks "rice" as in the pantry
    And the recipe "Tomato Rice" marks "tomato" as in the pantry
    And the recipe "Tomato Rice" marks "onion" as missing

  Scenario: Plural and longer ingredient names still match the pantry
    Given the recipe catalogue contains:
      | title           | ingredients                 |
      | Cherry Omelette | large eggs, cherry tomatoes |
    When I look for recipes with my pantry
    Then the recipe "Cherry Omelette" marks "large eggs" as in the pantry
    And the recipe "Cherry Omelette" marks "cherry tomatoes" as in the pantry

  Scenario: Expired products do not count as in the pantry
    Given the recipe catalogue contains:
      | title         | ingredients |
      | Rice Pudding  | rice, milk  |
    When I look for recipes with my pantry
    Then the recipe "Rice Pudding" marks "milk" as missing
    And the recipe "Rice Pudding" shows "Tem 50% dos ingredientes"

  # SCRUM-114 — calcular e formatar a percentagem
  Scenario Outline: The percentage is calculated and formatted
    Given the recipe catalogue contains:
      | title   | ingredients   |
      | <title> | <ingredients> |
    When I look for recipes with my pantry
    Then the recipe "<title>" shows "<text>"

    Examples:
      | title          | ingredients                      | text                      |
      | Full Match     | eggs, tomato                     | Tem 100% dos ingredientes |
      | Two Of Three   | rice, tomato, onion              | Tem 67% dos ingredientes  |
      | One Of Five    | eggs, flour, sugar, butter, milk | Tem 20% dos ingredientes  |
      | Nothing In Stock | flour, sugar                   | Tem 0% dos ingredientes   |

  # SCRUM-115 — indicador visual no cartão
  Scenario: The card shows a progress indicator with the percentage
    Given the recipe catalogue contains:
      | title       | ingredients               |
      | Tomato Rice | rice, tomato, onion       |
      | Pancakes    | eggs, flour, sugar, butter |
    When I look for recipes with my pantry
    Then the progress indicator of "Tomato Rice" is at 67%
    And the progress indicator of "Pancakes" is at 25%

  Scenario: Recipes with a higher percentage come first
    Given the recipe catalogue contains:
      | title        | ingredients                 |
      | Pancakes     | eggs, flour, sugar, butter  |
      | Scrambled    | eggs, tomato                |
      | Tomato Rice  | rice, tomato, onion         |
    When I look for recipes with my pantry
    Then the recipes are shown in the order "Scrambled", "Tomato Rice", "Pancakes"
