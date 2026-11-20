Feature: GestaoCompletaDaDespensa
  Como utilizador da SmartPantry
  Quero adicionar, listar, editar e remover os meus produtos
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
 
  Scenario: Editar um ingrediente existente com sucesso
    Given que acedo à página principal da aplicação
    And a despensa tem pelo menos o item "Arroz Agulha" adicionado
    When o utilizador clica no botão de editar do item "Arroz Agulha"
    And altera o nome do produto para "Arroz Basmati"
    And altera a quantidade para "3"
    And clico no botão "Guardar"
    Then o formulário deve voltar ao modo de criação "Novo Ingrediente"
    And o item "Arroz Basmati" deve aparecer na lista da despensa com a quantidade "3"
    And o item "Arroz Agulha" já não deve estar na lista

  Scenario: Cancelar a edição de um ingrediente
    Given que acedo à página principal da aplicação
    And a despensa tem pelo menos o item "Arroz Agulha" adicionado
    When o utilizador clica no botão de editar do item "Arroz Agulha"
    And clico no botão "Cancelar"
    Then o formulário deve ser limpo e voltar ao modo "Novo Ingrediente"
    And o item "Arroz Agulha" deve permanecer inalterado na lista

  Scenario: Remover um ingrediente com sucesso
    Given que acedo à página principal da aplicação
    And a despensa tem pelo menos o item "Arroz Agulha" adicionado
    When o utilizador clica no botão de remover do item "Arroz Agulha"
    Then o item "Arroz Agulha" deve desaparecer da lista da despensa