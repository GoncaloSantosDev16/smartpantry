Feature: Adicionar Itens à Despensa (US-03)
  Como utilizador da SmartPantry
  Quero adicionar novos produtos à minha despensa
  Para manter o stock de alimentos atualizado

  Scenario: Adicionar um produto com sucesso
    Given que acedo à página principal da aplicação
    When preencho o campo "Produto" com "Arroz Agulha"
    And seleciono a categoria "Outro"
    And insiro a quantidade "2"
    And clico no botão "Adicionar Item"
    Then o produto "Arroz Agulha" deve aparecer listado na despensa

  Scenario: Validação de campo obrigatório (Nome vazio)
    Given que acedo à página principal da aplicação
    When tento submeter o formulário com o campo "Produto" vazio
    And clico no botão "Adicionar Item"
    Then o sistema deve apresentar uma mensagem de erro indicando que o nome é obrigatório