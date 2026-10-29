# language: pt

Funcionalidade: Falhas de acesso à câmara no leitor de códigos de barras
  Enquanto utilizador do SmartPantry
  quero perceber porque é que a leitura não arrancou
  para saber o que fazer a seguir em vez de ficar sem reação da aplicação.

  Contexto:
    Dado que estou no ecrã do leitor de códigos de barras

  Cenário: Utilizador recusa o acesso à câmara
    Quando tento iniciar a câmara
    E o browser recusa o acesso por falta de permissão
    Então vejo a mensagem "Acesso à câmara recusado"
    E vejo como autorizar a câmara nas definições do browser
    E consigo tentar novamente sem recarregar a página

  Cenário: Dispositivo não tem câmara
    Quando tento iniciar a câmara
    E o dispositivo não tem nenhuma câmara disponível
    Então vejo a mensagem "Nenhuma câmara encontrada"
    E sou informado de que posso introduzir o código manualmente

  Cenário: Câmara ocupada por outra aplicação
    Quando tento iniciar a câmara
    E a câmara está a ser usada por outra aplicação
    Então vejo a mensagem "Câmara indisponível"
    E vejo a indicação de fechar a aplicação que está a usar a câmara
    E consigo tentar novamente sem recarregar a página

  Cenário: Página servida sem HTTPS
    Dado que a página não é servida por uma ligação segura
    Quando tento iniciar a câmara
    Então vejo a mensagem "Ligação não segura"
    E a aplicação não chega a pedir permissão de câmara

  Cenário: Browser sem suporte para acesso à câmara
    Dado que o browser não disponibiliza acesso à câmara
    Quando tento iniciar a câmara
    Então vejo a mensagem "Browser não suportado"
    E sou informado de que posso introduzir o código manualmente

  Cenário: Câmara traseira indisponível
    Quando tento iniciar a câmara
    E nenhuma câmara satisfaz as características pedidas
    Então vejo a mensagem "Câmara incompatível"
    E consigo tentar novamente sem recarregar a página

  Cenário: Leitor de códigos falha depois da câmara abrir
    Dado que a câmara iniciou com sucesso
    Quando o leitor de códigos falha repetidamente a analisar a imagem
    Então a câmara é desligada
    E vejo a mensagem "Leitor indisponível"
    E não fico com a câmara ligada sem qualquer reação

  Cenário: Recuperar depois de uma falha
    Dado que a tentativa anterior falhou por falta de permissão
    Quando autorizo a câmara e tento novamente
    Então a câmara inicia
    E a mensagem de erro deixa de ser apresentada

  Cenário: Câmara é libertada ao sair do leitor
    Dado que a câmara iniciou com sucesso
    Quando saio do ecrã do leitor
    Então a câmara é desligada
