# language: pt
Funcionalidade: Onboarding e perfil default

  Cenário: Primeiro arranque leva ao onboarding
    Dado que a aplicação é aberta pela primeira vez
    Quando a página inicial é carregada
    Então vejo o ecrã de onboarding

  Cenário: Criar o perfil default
    Dado que estou no ecrã de onboarding
    Quando defino 2 pessoas, o estilo "vegetariano" e a alergia "amendoim"
    E confirmo o onboarding
    Então o perfil default fica guardado
    E sou redirecionado para o dashboard

  Cenário: Arranques seguintes saltam o onboarding
    Dado que já existe um perfil default
    Quando abro a aplicação
    Então vejo o dashboard sem passar pelo onboarding

      Cenário: Nome de perfil vazio impede avançar
    Dado que estou no primeiro passo do onboarding
    Quando apago o nome do perfil
    Então não consigo avançar para o passo seguinte

  Cenário: Acesso direto ao onboarding com perfil existente
    Dado que já existe um perfil default
    Quando tento abrir o ecrã de onboarding diretamente
    Então sou redirecionado para o dashboard

  //Rever com o PO:

  1. Se o armazenamento local falhar (navegação privada, armazenamento bloqueado), o que deve acontecer? 
  Deixar entrar sem perfil, ou mostrar um ecrã de erro?
  2. “Primeiro arranque” significa não existe perfil ou nunca completou o onboarding? Diferem se o utilizador apagar o perfil mais tarde.
  3. Há limite máximo de doses?