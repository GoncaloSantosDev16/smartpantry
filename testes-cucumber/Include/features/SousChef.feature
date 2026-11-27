@SCRUM-45 @sous-chef
Feature: Generate an original recipe from leftovers
  As a SmartPantry user
  I want to pick some leftovers and ask the Sous-Chef for a recipe
  So that I can use them before they go off

  # A API de IA (Gemini) é simulada (mock): não se faz nenhum pedido real.

  Background:
    Given I have completed the onboarding
    And the pantry has the following items:
      | name   | quantity | unit |
      | Ovos   | 6        | un   |
      | Arroz  | 1        | kg   |
      | Tomate | 3        | un   |

  @generate
  Scenario: Generate a recipe with the selected leftovers
    Given the AI will return the mocked recipe
    When I open the Sous-Chef from the header
    And I select the leftover "Ovos"
    And I select the leftover "Arroz"
    And I generate the recipe
    Then the AI was asked to use "Ovos" and "Arroz" but not "Tomate"
    And I see the details of the generated recipe "Arroz com ovos"

  @selection
  Scenario: The generate button needs at least one leftover
    When I open the Sous-Chef from the header
    Then the generate button is disabled
    When I select the leftover "Ovos"
    Then the generate button is enabled

  @error
  Scenario: The AI takes too long to answer
    Given the AI will fail with "timeout"
    When I open the Sous-Chef from the header
    And I select the leftover "Ovos"
    And I generate the recipe
    Then I see the Sous-Chef error "demorou demasiado"
    And I can try the generation again

  @empty
  Scenario: Empty pantry
    Given the pantry is empty
    When I open the Sous-Chef from the header
    Then I see the empty pantry message of the Sous-Chef
