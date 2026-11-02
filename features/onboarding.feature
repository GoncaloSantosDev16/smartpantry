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