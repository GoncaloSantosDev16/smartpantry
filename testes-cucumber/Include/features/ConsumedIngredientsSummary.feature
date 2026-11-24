@SCRUM-49 @US-21 @meal-completion
Feature: Summary of the ingredients used in a recipe
  As a SmartPantry user
  I want to confirm or adjust the ingredients I used when I finish a recipe
  So that my pantry stock stays correct

  # The generated sample recipe "Arroz de frango com legumes" uses:
  #   200 g Arroz · 300 g Frango cozido · 2 un Cenoura · 20 ml Azeite

  Background:
    Given I have completed the onboarding
    And the pantry contains:
      | name    | quantity | unit | expires |
      | Arroz   | 1        | kg   |         |
      | Cenoura | 5        | un   |         |
      | Azeite  | 1        | L    |         |
    And I open a generated recipe

  # ----------------------------------------------------------------------
  # SCRUM-130 — Link from the end of the recipe (Cook Mode) to the summary
  # SCRUM-129 — Editable summary screen
  # ----------------------------------------------------------------------

  @SCRUM-130 @SCRUM-129
  Scenario: Finishing a recipe opens the summary with the quantities used
    When I finish cooking the recipe
    Then I see the summary of the ingredients used
    And the summary proposes using "0.2" "kg" of "Arroz"
    And the summary proposes using "2" "un" of "Cenoura"
    And the summary proposes using "0.02" "L" of "Azeite"
    And the summary shows "Frango cozido" as not in the pantry

  @SCRUM-129
  Scenario: Confirming the summary updates the pantry
    When I finish cooking the recipe
    And I confirm the summary
    Then I am told the pantry was updated
    When I go back to the pantry
    Then the pantry lists the product "Arroz" with quantity "0.8"
    And the pantry lists the product "Cenoura" with quantity "3"
    And the pantry lists the product "Azeite" with quantity "0.98"

  @SCRUM-129
  Scenario: Adjusting a quantity before confirming
    When I finish cooking the recipe
    And I change the quantity used of "Cenoura" to "3"
    And I confirm the summary
    And I go back to the pantry
    Then the pantry lists the product "Cenoura" with quantity "2"

  @SCRUM-129
  Scenario: An ingredient that was not used is left untouched
    When I finish cooking the recipe
    And I mark "Azeite" as not used
    And I confirm the summary
    And I go back to the pantry
    Then the pantry lists the product "Azeite" with quantity "1"
    And the pantry lists the product "Arroz" with quantity "0.8"

  @SCRUM-129
  Scenario: Using all the stock removes the product from the pantry
    When I finish cooking the recipe
    And I change the quantity used of "Cenoura" to "5"
    And I confirm the summary
    And I go back to the pantry
    Then the pantry no longer lists the product "Cenoura"

  @SCRUM-129 @validation
  Scenario: Cannot use more than what is in the pantry
    When I finish cooking the recipe
    And I change the quantity used of "Arroz" to "2"
    Then I see an error on "Arroz" in the summary
    And I cannot confirm the summary

  @SCRUM-129 @validation
  Scenario: Units only accept whole numbers
    When I finish cooking the recipe
    And I change the quantity used of "Cenoura" to "1.5"
    Then I see an error on "Cenoura" in the summary
    And I cannot confirm the summary
