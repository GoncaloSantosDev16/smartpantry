@SCRUM-47 @recipes @cooking
Feature: Step-by-step cooking carousel with the ingredients of each step
  As a SmartPantry user
  I want to follow a saved recipe one step at a time
  So that I only see what I need for the step I am cooking

  # A receita usada é a receita de exemplo (/receitas/demo), guardada no início:
  #   1. Corta o frango e a cenoura em pedaços pequenos.  -> Frango cozido, Cenoura
  #   2. Refoga a cenoura no azeite.            (5 min)   -> Cenoura, Azeite
  #   3. Junta o arroz e a água e deixa cozer.  (15 min)  -> Arroz
  #   4. Mistura o frango, prova o sal e serve.           -> Frango cozido
  # Os ingredientes de cada passo são os ingredientes da receita cujo nome aparece
  # no texto do passo.

  Background:
    Given I have completed the onboarding
    And I open a generated recipe
    And I save the recipe
    And the recipe is marked as saved

  # ----------------------------------------------------------------------
  # Abrir o carrossel
  # ----------------------------------------------------------------------

  @SCRUM-143 @SCRUM-144 @SCRUM-145 @start
  Scenario: Start cooking opens the first step
    When I start cooking
    Then I see cooking step 1 of 4
    And the cooking step says "Corta o frango e a cenoura em pedaços pequenos."
    And the cooking step ingredients are "Frango cozido, Cenoura"
    And the cooking step has no timer
    And I cannot go back to a previous cooking step

  # ----------------------------------------------------------------------
  # SCRUM-144 — Ingredientes e temporizador de cada passo
  # ----------------------------------------------------------------------

  @SCRUM-143 @SCRUM-144 @SCRUM-145 @ingredients @timer
  Scenario: Each step shows only the ingredients it uses and its timer
    When I start cooking
    And I go to the next cooking step
    Then I see cooking step 2 of 4
    And the cooking step says "Refoga a cenoura no azeite."
    And the cooking step ingredients are "Cenoura, Azeite"
    And the cooking step timer shows "5 min"
    When I go to the next cooking step
    Then I see cooking step 3 of 4
    And the cooking step ingredients are "Arroz"
    And the cooking step timer shows "15 min"

  # ----------------------------------------------------------------------
  # SCRUM-145 — Navegação: botões e deslizar com o dedo
  # ----------------------------------------------------------------------

  @SCRUM-143 @SCRUM-145 @navigation
  Scenario: Go back to the previous step
    When I start cooking
    And I go to the next cooking step
    And I go to the next cooking step
    And I go back to the previous cooking step
    Then I see cooking step 2 of 4
    And the cooking step ingredients are "Cenoura, Azeite"

  @SCRUM-143 @SCRUM-145 @navigation @swipe
  Scenario: Swipe between steps
    When I start cooking
    And I swipe to the next cooking step
    Then I see cooking step 2 of 4
    When I swipe to the previous cooking step
    Then I see cooking step 1 of 4

  # ----------------------------------------------------------------------
  # SCRUM-145 — Último passo
  # ----------------------------------------------------------------------

  @SCRUM-143 @SCRUM-145 @finish
  Scenario: The last step finishes cooking and goes back to the recipe
    When I start cooking
    And I go to the next cooking step
    And I go to the next cooking step
    And I go to the next cooking step
    Then I see cooking step 4 of 4
    And the cooking step ingredients are "Frango cozido"
    And the next cooking step button says "Concluir"
    When I finish cooking
    Then the cooking carousel is closed
    And I see the recipe details