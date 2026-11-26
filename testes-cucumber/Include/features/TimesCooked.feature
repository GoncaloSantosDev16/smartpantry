@SCRUM-43 @US-15 @recipes @times-cooked
Feature: Counter of how many times a recipe was cooked
  As a SmartPantry user
  I want to see how many times I have cooked each saved recipe
  So that I know which recipes I make the most

  # A receita usada é a receita de exemplo "Arroz de frango com legumes"
  # (/receitas/demo), guardada no início de cada cenário.
  # O contador sobe quando se confirma o resumo dos ingredientes usados (US-21).

  Background:
    Given I have completed the onboarding
    And the pantry contains:
      | name    | quantity | unit | expires |
      | Arroz   | 1        | kg   |         |
      | Cenoura | 5        | un   |         |
      | Azeite  | 1        | L    |         |
    And I open a generated recipe
    And I save the recipe
    And the recipe is marked as saved

  # ----------------------------------------------------------------------
  # Contador no detalhe da receita
  # ----------------------------------------------------------------------

  @detail
  Scenario: A recipe that was just saved was never cooked
    Then the recipe shows it was never cooked

  @detail
  Scenario: Finishing the recipe and confirming the summary counts one more time
    When I finish cooking the recipe
    And I confirm the summary
    And I open the saved recipes screen
    And I open the saved recipe "Arroz de frango com legumes"
    Then the recipe shows it was cooked 1 time

  @detail @cooking
  Scenario: Cooking the recipe twice, the second time with the step-by-step carousel
    When I finish cooking the recipe
    And I confirm the summary
    And I open the saved recipes screen
    And I open the saved recipe "Arroz de frango com legumes"
    And I start cooking
    And I go to the next cooking step
    And I go to the next cooking step
    And I go to the next cooking step
    And I finish cooking the recipe
    And I confirm the summary
    And I open the saved recipes screen
    And I open the saved recipe "Arroz de frango com legumes"
    Then the recipe shows it was cooked 2 times

  @detail
  Scenario: Leaving the summary without confirming does not count
    When I finish cooking the recipe
    And I leave the summary without confirming
    Then the recipe shows it was never cooked

  # ----------------------------------------------------------------------
  # Contador na lista de receitas guardadas
  # ----------------------------------------------------------------------

  @list
  Scenario: The saved recipes list shows how many times each recipe was cooked
    When I open the saved recipes screen
    Then the saved recipe "Arroz de frango com legumes" shows it was never cooked
    When I open the saved recipe "Arroz de frango com legumes"
    And I finish cooking the recipe
    And I confirm the summary
    And I open the saved recipes screen
    Then the saved recipe "Arroz de frango com legumes" shows it was cooked 1 time
