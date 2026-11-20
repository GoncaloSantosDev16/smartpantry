@US-03 @US-04 @pantry-management
Feature: Pantry management
  As a SmartPantry user
  I want to add, list, edit and remove my products
  So that my food stock stays up to date

  Background:
    Given I have completed the onboarding

  Scenario: Add a product successfully
    When I fill in the product name with "Arroz Agulha"
    And I choose the category "Outro"
    And I set the product quantity to "2"
    And I submit the product form
    Then the pantry lists the product "Arroz Agulha"

  Scenario: The product name is required
    When I submit the product form without a name
    Then I see an error saying the product name is required

  Scenario: Edit an existing product
    Given the pantry has the product "Arroz Agulha"
    When I edit the product "Arroz Agulha"
    And I fill in the product name with "Arroz Basmati"
    And I set the product quantity to "3"
    And I submit the product form
    Then the product form is back in create mode
    And the pantry lists the product "Arroz Basmati" with quantity "3"
    And the pantry no longer lists the product "Arroz Agulha"

  Scenario: Cancel editing a product
    Given the pantry has the product "Arroz Agulha"
    When I edit the product "Arroz Agulha"
    And I cancel the edit
    Then the product form is cleared and back in create mode
    And the pantry lists the product "Arroz Agulha"

  Scenario: Remove a product
    Given the pantry has the product "Arroz Agulha"
    When I remove the product "Arroz Agulha" from the pantry
    Then the pantry no longer lists the product "Arroz Agulha"
