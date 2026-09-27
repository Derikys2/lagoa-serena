# Lagoa Serena

Jogo original de pescaria em HTML, CSS e JavaScript, sem bibliotecas, imagens externas ou instalação de pacotes.

[Jogar Lagoa Serena](https://derikys2.github.io/lagoa-serena/) · [Código no GitHub](https://github.com/Derikys2/lagoa-serena)

## Hospedagem estática e GitHub Pages

O jogo funciona como site estático, inclusive em endereços de projeto como `https://usuario.github.io/lagoa-serena/`. Scripts, estilos e navegação usam caminhos relativos. O arquivo `.nojekyll` permite servir os arquivos diretamente. Não é necessário executar Node.js no GitHub Pages: `server.cjs` apenas entrega arquivos durante os testes locais, sem lógica de jogo no servidor.

O clima é consultado diretamente pelo navegador, por HTTPS, na API pública Open-Meteo, sem chave ou credenciais, a cada 15 minutos. Falhas ou indisponibilidade da API preservam o último clima válido; sem cache, usa-se céu limpo claramente identificado como padrão. A partida já carregada continua jogável sem conexão. Não há instalação offline nem garantia de abrir/recarregar o site sem internet.

**Progresso e ranking são locais**, sem contas, servidor de ranking ou sincronização. O armazenamento pertence ao navegador e à origem do site: o salvamento de `http://127.0.0.1:8080` permanece nesse endereço e não é transferido automaticamente para o GitHub Pages. Limpar os dados do site remove o progresso salvo. Não publicamos salvamentos dos jogadores.

Para publicar manualmente: envie os arquivos a um repositório público e, em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`. Aguarde o deploy concluir. Para testar condições raras no endereço publicado, acrescente `?debug=1` à URL e ative a simulação no Laboratório; os dados de teste ficam separados do progresso normal.

## Como jogar

Abra `index.html` no navegador. Alternativamente, com Node.js instalado, execute `node server.cjs` nesta pasta e acesse http://127.0.0.1:8080. Pare o servidor com Ctrl+C.

1. Clique em **Começar a pescar** e depois em **Pescar**.
2. Espere a mordida (entre 1,3 e 2,5 segundos).
3. Segure **Espaço**, o botão **Segure para subir** ou a própria pista do minijogo para subir a barra. Solte para descer.
4. Mantenha o peixe inteiro dentro da barra verde. O medidor à direita indica o progresso.
5. Ao capturar ou perder, use **Pescar novamente**.

O movimento tem aceleração e amortecimento: solte um pouco antes de alcançar a altura desejada. Trocar de janela pausa o jogo. A primeira tentativa normal de cada sessão recebe barra maior e movimento suave, independentemente da espécie sorteada. No laboratório, os padrões completos são usados desde o início. Cada lançamento sorteia um peixe a partir das condições daquele instante; alterações posteriores de hora ou clima não trocam esse peixe. Os movimentos permanecem limitados e reproduzíveis.

## Espécies

| Peixe | Raridade | Preferências e peso no sorteio |
| --- | --- | --- |
| Lambari-sol | Comum | Sempre disponível. Peso 65 de dia com céu limpo; 40 nas outras situações. |
| Carpa-jade | Comum | Sempre disponível. Peso 45 com nuvens/chuva; 25 com céu limpo. |
| Lúcio-lunar | Raro | Somente à noite, peso 35 em qualquer clima. |
| Bagre-trovão | Raro | Somente à noite com chuva, peso 28. |
| Acará-dourado | Incomum | Somente de dia com céu limpo, peso 22. |

A probabilidade é o peso dividido pela soma dos pesos disponíveis. Exemplos: dia limpo = 65/25/0/0/22; noite chuvosa = 40/45/35/28/0. A interface apresenta percentuais arredondados (a soma pode diferir ligeiramente de 100%). As três contagens do protótipo são preservadas e as espécies novas começam em zero.

O progresso usa `localStorage`, separado por navegador e endereço. Abrir por arquivo e por servidor pode mostrar coleções diferentes. Se o armazenamento estiver bloqueado, o jogo funciona com coleção temporária e avisa na interface. Recarregar reinicia a pescaria, preservando as quantidades salvas.

## Estrutura

- `index.html`: tela inicial, controles acessíveis, área do jogo e coleção.
- `style.css`: tema, cartões e adaptação para telas menores.
- `world.js`: fuso, API, cache, classificação meteorológica e regras puras de sorteio.
- `world.test.cjs`: testes de tempo, clima, probabilidades e falhas.
- `game.js`: estados da pescaria, física com tempo delta, desenho dos Canvas e entradas de mouse/toque/teclado.
- `progression.js`: tabela de espécies, trajetórias, economia, XP, equipamentos, migração e regras de persistência.
- `economy-ui.js`: inventário, confirmação de vendas, loja, equipamentos, recompensas, XP e ranking.
- `panels.js`: janela única, troca de conteúdo, foco e eventos de pausa.
- `tackle.test.cjs`: desbloqueios, compras, consumo e migração dos novos itens.
- `progression.test.cjs`: validação da economia, migração, equipamentos e trajetórias.
- `server.cjs`: servidor local opcional usando apenas módulos nativos do Node.js.
- `test.cjs`: testes determinísticos da lógica com DOM e Canvas simulados; execute `node test.cjs`.

Os estados são início, pronto, aguardando mordida, pescando e resultado. A física usa coordenadas normalizadas e limita o tempo por quadro para evitar saltos. Todos os elementos gráficos foram desenhados com formas geométricas; não há recursos de outros jogos.

## Verificação

Execute `node test.cjs` para verificar captura das cinco espécies usando um controlador que antecipa a inércia, fuga sem controle, repetição, limites da barra, pausa, restauração da coleção e armazenamento bloqueado. Os testes executam a lógica real em um ambiente simulado; não substituem testes de toque em um aparelho físico. A interface também foi conferida no navegador em computador e com viewport de 390 × 844.

## Possíveis expansões

Sons originais com opção de silenciar, novas lagoas, mais espécies, conquistas e ajustes de acessibilidade/dificuldade. Esta versão não tem áudio nem sincronização da coleção entre aparelhos.

## Hora e clima reais

Local fixo: Rio de Janeiro, latitude -22.9068, longitude -43.1729. Não pede geolocalização.

Usamos a [Forecast API da Open-Meteo](https://open-meteo.com/en/docs), endpoint https://api.open-meteo.com/v1/forecast, com current=temperature_2m,weather_code, timezone=America/Sao_Paulo e timeformat=unixtime. A API pública não exige chave para este uso não comercial. Os dados atuais são estimativas de modelos meteorológicos, não uma medição instantânea no píer; podem divergir da chuva observada em um bairro específico. A atribuição aparece na interface.

O navegador consulta ao abrir se não há cache recente e a cada 15 minutos. Cada chamada tem limite de 8 segundos, sem chamadas concorrentes nem repetição imediata em caso de erro. Há no máximo uma tentativa a cada 15 minutos por instância aberta. Abas em segundo plano podem ter temporizadores adiados pelo navegador. A resposta é validada antes de substituir o cache. A interface distingue horário da última consulta bem-sucedida e horário dos dados, ambos no Rio.

O último resultado válido fica em localStorage (chave lagoa-serena-weather-v1) e também em memória. Após falha, continua sendo usado, com indicação de cache/dados antigos e a data original; não há prazo máximo de descarte para permitir jogar offline. Sem cache válido, o padrão é céu limpo, sem temperatura inventada, identificado na tela. Se o armazenamento estiver bloqueado, o cache funciona apenas na sessão. Falhas de HTTP, rede, tempo limite ou JSON inválido não bloqueiam a pescaria. Abrir os arquivos locais permite jogar sem internet; apenas a atualização meteorológica requer conexão. Prefira o servidor local caso seu navegador restrinja requisições em file://.

O relógio é atualizado a cada segundo com Date.now() e Intl.DateTimeFormat usando explicitamente America/Sao_Paulo. Não usamos getHours() nem o fuso local do computador, e o tempo não é acelerado. Os períodos artísticos são: dia das 06h às 16h59, entardecer das 17h às 18h59 e noite das 19h às 05h59. São faixas fixas, não cálculo astronômico sazonal de nascer/pôr do sol. Limitação: a data/hora absoluta ainda vem do relógio do sistema; se estiver errada, a exibição também estará. Não há sincronização NTP independente. Mudar apenas o fuso do computador não muda o horário do Rio.

Códigos WMO 0–1 representam tempo limpo; 2–3 e 45/48 representam nuvens/neblina; garoa, chuva, pancadas e trovoadas contam como chuva para as espécies. Códigos de neve são identificados separadamente na descrição e usam visual nublado. Códigos desconhecidos são rejeitados. Noite adiciona lua, estrelas (se limpo), escurecimento e uma lanterna; entardecer adiciona tons quentes; nuvens e chuva recebem efeitos próprios. Os efeitos não escurecem o Canvas de captura. A preferência de movimento reduzido deixa os efeitos estáticos.

## Laboratório de condições

Abra http://127.0.0.1:8080/?debug=1 (ou acrescente ?debug=1 ao arquivo local). O painel só existe visualmente nessa rota e começa **desativado**. Marque **Ativar simulação** e selecione horário e clima. O relógio simulado fica fixo em 12h, 18h ou 22h, com rótulo SIMULAÇÃO.

Experimente dia limpo (Acará disponível), dia chuvoso (Acará indisponível), noite limpa (Lúcio disponível) e noite chuvosa (Bagre e Lúcio disponíveis), além de entardecer e nublado. Veja as chances no painel e lance a linha. Mudar seletores durante a tentativa altera o cenário e as chances da próxima tentativa, mas mantém as condições registradas no lançamento atual. Capturas iniciadas sob simulação não alteram nem salvam a coleção real, mesmo que a simulação seja desativada antes do resultado. O cache meteorológico nunca recebe dados simulados.

Desmarcar a caixa retorna às condições reais/cache imediatamente; remover ?debug=1 esconde o laboratório. Sem ativação, o fluxo e as chances são os mesmos da experiência normal. Uma tentativa já iniciada conserva seu sorteio até terminar.

## Testes de clima

Execute node world.test.cjs e node test.cjs. O primeiro cobre as nove combinações (três períodos × três climas), amostragem determinística de 10.000 sorteios por combinação, limites dos períodos no fuso do Rio, WMO, cache, falhas, respostas inválidas, recuperação, armazenamento bloqueado e isolamento da simulação. O segundo verifica a física e captura de todas as espécies, fuga, repetição, pausa, migração da coleção e estabilidade do peixe durante mudanças de condições.

## Economia e atributos de cada espécie

Os atributos estão centralizados em progression.js, na tabela species: id, nome, raridade, rank, value (preço), xp, speed (ritmo), maxSpeed (limite de deslocamento por segundo), movement, difficulty, bar (altura base), gain e loss (progresso por segundo). A ordem das espécies é estável para preservar salvamentos e corresponder aos pesos em world.js.

| Espécie | Gold por unidade vendida | XP por captura | Movimento | Barra base / dificuldade |
| --- | ---: | ---: | --- | --- |
| Lambari-sol | 18 | 25 | Passeio suave, limite 0,20 da pista/s | 32% / fácil |
| Carpa-jade | 30 | 40 | Toques curtos e frequentes, limite 0,25/s | 29% / moderada |
| Lúcio-lunar | 85 | 95 | Subidas rápidas, descanso e descida, limite 0,34/s | 25% / difícil |
| Bagre-trovão | 110 | 120 | Mergulhos, pausas e inversões, limite 0,35/s | 25% / difícil |
| Acará-dourado | 50 | 65 | Arcos amplos regulares, limite 0,27/s | 28% / intermediária |

Mudanças bruscas acontecem no alvo, nunca como teletransporte do peixe. A velocidade efetiva é limitada. O peixe usa uma cor neutra durante a tentativa; a identidade e a raridade da captura são reveladas somente no sucesso. A coleção continua mostrando o catálogo e as dicas das espécies.

Capturar adiciona uma unidade ao inventário e concede XP. Não concede gold. A seção Inventário e vendas permite vender uma unidade imediatamente ou todas as unidades daquela espécie mediante confirmação com quantidade e valor. Cancelar ou apertar Esc não vende. Peixes vendidos continuam contados no histórico e nas descobertas. Não há perda de XP, gold ou itens em uma fuga.

## Equipamentos

Todos começam no nível 0 e vão até 3. Os preços são por compra, sem desconto do valor anterior.

| Equipamento | Preço para níveis 1 / 2 / 3 | Efeito por nível |
| --- | --- | --- |
| Vara | 80 / 220 / 480 gold | +0,5 de amortecimento (3,1 → 4,6): acelera resposta e reversão, preservando as velocidades terminais de subida e descida. |
| Anzol | 100 / 260 / 550 gold | −12% da perda de progresso fora da barra, acumulado linearmente até −36%. |
| Linha | 120 / 300 / 620 gold | +1,5 ponto percentual da pista na altura da barra, até +4,5 pontos. |

O equipamento é registrado no lançamento, junto com clima e espécie. Comprar durante uma tentativa só afeta a próxima. Mesmo no máximo, a perda de progresso continua positiva e a barra cobre menos de metade da pista; nada garante captura ou raridade. Compras sem saldo e acima do máximo são rejeitadas na interface e na lógica.

## XP, nível e ranking local

O nível 1 começa em 0 XP. Para ir do nível L ao seguinte são necessários 100 + 50 × (L − 1) XP: 100, depois 150, depois 200, e assim por diante. O XP total nunca é gasto. Os limiares acumulados são 0, 100, 250, 450, 700… Uma barra mostra o progresso dentro do nível; um aviso visual celebra a subida. O nível é salvo e também recalculado a partir do XP ao carregar, corrigindo inconsistências.

O ranking é o registro pessoal de **um perfil local**, sem contas, servidor, jogadores inventados ou comparação online. Mostra capturas históricas, espécies diferentes, espécie(s) da maior raridade já capturada(s), gold recebido em todas as vendas e nível. A pontuação é:

**10 × capturas + 75 × espécies descobertas + gold total obtido em vendas + 100 × (nível − 1)**.

Gastar gold ou vender os últimos exemplares não reduz capturas, descobertas, raridade histórica nem pontuação. O gold disponível é diferente do gold obtido ao longo do jogo. Havendo empate na maior raridade, ambas as espécies aparecem. Dados locais podem ser editados pelo dono do navegador; não há pretensão de ranking competitivo seguro.

## Salvamento e migração

O perfil real fica na chave lagoa-serena-progress-v2, com cópia de recuperação lagoa-serena-progress-v2-backup. São salvos inventário, contagens históricas por espécie, gold disponível, gold ganho/gasto, XP, nível e equipamentos após cada captura, venda ou compra. O cache meteorológico é independente.

Na primeira abertura desta versão, os arrays antigos da chave lagoa-serena-v1 são importados como inventário e histórico. O XP correspondente às capturas antigas é concedido retroativamente, mas o gold começa em zero, pois aqueles peixes ainda não foram vendidos. A chave antiga é preservada. Arrays curtos recebem zeros para espécies ausentes, campos ausentes recebem valores padrão, quantidades inválidas são saneadas e níveis de equipamento são limitados a 3. Uma cópia válida permite recuperar um JSON principal corrompido. Se o navegador negar o armazenamento, o jogo avisa e mantém o progresso em memória até fechar/recarregar. Limpar os dados do navegador apaga o progresso. Use uma aba de jogo por perfil: alterações simultâneas em várias abas não são mescladas.

## Laboratório de economia e movimentos

Em ?debug=1, marque Ativar simulação. Além do horário e clima, escolha **Peixe de teste** para garantir uma espécie elegível: Bagre-trovão só pode ser selecionado à noite com chuva; Acará-dourado só de dia limpo. Sorteio normal mantém os pesos habituais. A escolha forçada não existe no jogo normal.

O laboratório tem inventário, XP, gold, equipamentos e ranking separados, inicialmente vazios. Capturar, vender e comprar funcionam com as mesmas regras. Seu progresso de teste fica em sessionStorage, chave lagoa-serena-sandbox-v2, e sobrevive a recargas na mesma aba: após recarregar, reative a simulação para vê-lo. Fechar a aba normalmente encerra esse laboratório; ele não sobrescreve o perfil real. O botão **Adicionar kit de teste** adiciona cinco peixes de cada espécie e o XP correspondente somente ao laboratório, sem dar gold. Use-o para testar vendas e financiar todas as categorias de equipamentos.

Desativar a simulação restaura imediatamente o perfil real. Uma captura iniciada no laboratório continua sendo creditada ao laboratório mesmo se ele for desativado no meio da tentativa, e o inverso também vale. O clima simulado nunca entra no cache real.

Roteiro: ative noite + chuva, escolha Bagre e pesque; depois teste outro peixe. Confira inventário/XP sem gold. Adicione o kit, venda uma unidade, cancele uma venda de todas, confirme outra, compre vara/anzol/linha, recarregue e reative a simulação. Confira os mesmos saldos e equipamentos. Desative e confirme que o perfil real permanece igual.

## Executar todos os testes

Execute separadamente:

- node test.cjs — integração das capturas, XP, vendas/diálogo, compras, recarga, pausa, migração e laboratório, com DOM/Canvas simulados.
- node progression.test.cjs — fronteiras de XP, saldo, preços, níveis máximos, efeitos, histórico, migração/backup e trajetórias distintas com velocidade limitada.
- node world.test.cjs — nove combinações de clima/período, pesos, API/cache e recuperação.

Os testes de integração exercitam a lógica real. O layout e as ações de loja também são conferidos no navegador; isso não substitui testes de toque em um aparelho físico.

## Qualidade individual dos exemplares

Raridade pertence à espécie. Qualidade pertence a cada exemplar capturado e não muda ao vender outros peixes. Uma espécie comum pode render qualidade lendária; uma espécie rara pode render qualidade comum. XP e condições de aparecimento continuam definidos pela espécie, sem bônus de XP por qualidade.

A porcentagem de desempenho é tempo dentro da barra / tempo ativo de captura. A medição começa na mordida e termina no instante em que o progresso enche (o último passo é limitado ao tempo necessário). Espera, resultados e pausas não contam. A mesma regra de sobreposição que aumenta o progresso mede o tempo dentro da barra.

O requestAnimationFrame fornece tempo monotônico e alimenta passos de física de 1/120 s, independentemente da taxa de desenho. Intervalos normais de até 250 ms são processados integralmente; uma interrupção maior é tratada como suspensão técnica, descartada tanto da física quanto do desempenho. Trocar de aba/janela limpa o tempo pendente. Assim, FPS baixos não recebem o antigo limite de 40 ms por quadro, e uma aba pausada não aumenta a porcentagem. A precisão é de aproximadamente 8,3 ms; entradas durante um travamento não podem ser reconstruídas. O resultado abaixo de 100% é truncado em uma casa decimal, para nunca mostrar uma captura quase perfeita como perfeita.

As probabilidades abaixo são absolutas e somam 100% em cada faixa. O sorteio é independente da espécie e do equipamento; o equipamento ajuda a jogar, não muda diretamente a tabela.

| Tempo dentro da barra | Comum | Incomum | Raro | Épico | Lendário |
| --- | ---: | ---: | ---: | ---: | ---: |
| Menos de 60% | 90% | 10% | 0% | 0% | 0% |
| 60% a menos de 80% | 65% | 30% | 5% | 0% | 0% |
| 80% a menos de 95% | 40% | 40% | 18% | 2% | 0% |
| 95% a menos de 100% | 20% | 45% | 28% | 7% | 0% |
| Exatamente 100% | 10% | 35% | 35% | 18% | 2% |

Lendário exige nenhum tempo registrado fora da barra, mas uma captura perfeita ainda pode ser comum. As faixas menores servem também para testes; a própria mecânica de captura pode tornar algumas porcentagens difíceis de alcançar numa captura bem-sucedida.

| Qualidade | Cor | Bônus fixo | Multiplicador |
| --- | --- | ---: | ---: |
| Comum | Cinza | +0% | 1,00× |
| Incomum | Verde | +10% | 1,10× |
| Raro | Azul | +25% | 1,25× |
| Épico | Roxo | +45% | 1,45× |
| Lendário | Dourado | +75% | 1,75× |

Preço final = preço base × multiplicador, arredondado ao gold inteiro mais próximo **por exemplar** (meio gold arredonda para cima). Exemplo: Lambari base 18 vale 18 / 20 / 23 / 26 / 32 gold. Um Bagre lendário vale 193; dois valem 386, não 385. O gold só entra ao vender.

O inventário agrupa exemplares idênticos por espécie e qualidade, preservando quantos existem de cada uma. Cada captura adiciona uma unidade a um único grupo fixo; não há qualidade global da espécie nem novo sorteio ao vender. Os botões de cada grupo vendem um exemplar daquela qualidade. O botão rápido vende uma unidade da menor qualidade presente e informa qual. Vender todos soma os valores de todos os grupos e mostra quantidade, qualidades e total antes da confirmação. A confirmação é invalidada se o inventário mudar.

O salvamento usa a mesma chave lagoa-serena-progress-v2, com schema interno version:4 e os novos campos qualityInventory (espécie × qualidade) e qualityCatches (histórico). A representação agrupada é compacta e não necessita de IDs para exemplares economicamente idênticos. Os totais antigos são migrados para o grupo comum; gold, XP, equipamentos e histórico são preservados. Campos de qualidade ausentes são completados sem descartar exemplares válidos. A migração é idempotente. A cópia de segurança continua disponível. O laboratório recebe a mesma migração, mas permanece separado em sessionStorage.

O ranking mantém a fórmula anterior e a raridade da espécie separada. Uma conquista adicional informa quantas capturas de **qualidade Lendário** já ocorreram; vender esses exemplares não apaga a conquista. Não existe espécie de raridade lendária nesta versão. Épico e Lendário exibem um brilho de 1,2 s no resultado, sem bloquear controles; a preferência de movimento reduzido desativa a animação.

### Testar qualidade no laboratório

Abra ?debug=1, ative a simulação e escolha uma espécie elegível. Selecione desempenho (50%, 70%, 85%, 97%, 99,9% ou 100%) e use Gerar captura de teste. Esse botão simula explicitamente um resultado, sem fingir que foi uma partida jogada, e só credita o perfil do laboratório. Escolha Aleatório para usar as chances reais, Primeiro percentil para o resultado inferior ou Último percentil para o superior permitido: 50% gera Incomum; 85% gera Épico; 99,9% nunca gera Lendário; 100% com Último percentil gera Lendário. Na experiência normal, esses controles não existem e a medição vem exclusivamente da partida.

Para conferir vendas mistas, gere Lambaris a 50%, 85% e 100% com Último percentil: o total é 20 + 26 + 32 = 78 gold. Cancele uma venda, confirme outra, recarregue a página e reative a simulação para conferir o saldo. Depois desative para retornar ao seu progresso real.

Execute node quality.test.cjs (inclui a suíte de integração), node progression.test.cjs e node world.test.cjs. Os testes verificam limites/probabilidades por amostragem determinística, migração, mistura de qualidades, confirmação, venda, arredondamento, recarga, 10/30/60/144 FPS e pausas.

O kit rápido de cinco peixes por espécie cria exemplares de qualidade Comum. Para outras qualidades, use o teste de desempenho ou jogue o minijogo no laboratório.

## Interface compacta e janelas

A tela principal mantém cenário, minijogo, controles, hora/clima do Rio, nível, XP e gold. O resultado permanece na pescaria com espécie, raridade da espécie, qualidade, desempenho e XP, mesmo com o inventário fechado. Os botões Peixes, Inventário, Loja, Equipamentos, Ranking e Ajuda abrem conteúdos dentro de **uma única janela**. A confirmação de venda substitui o conteúdo dessa janela, sem criar outra por cima. Fechar ou Escape devolve o foco ao botão de origem; durante uma confirmação, Escape retorna ao inventário sem vender.

Conteúdo longo rola dentro da janela. Abrir uma janela pausa a tentativa e solta qualquer controle pressionado; fechar retoma, excluindo a pausa da porcentagem de desempenho. Em telas muito baixas (menos de 650–660 pixels de altura), há rolagem de segurança para não cortar os controles. O layout foi conferido em 390 × 844 e no desktop. O laboratório continua acessível apenas em ?debug=1, agora pelo botão Laboratório.

## Tipos de anzol e iscas

Os dados ficam na tabela tackle de progression.js: nome, categoria (slot), nível, preço, permanência, descrição e efeito. Os três níveis da **melhoria de anzol** da versão anterior são mantidos. Em Equipamentos, escolha separadamente um **tipo de anzol** permanente e uma **isca** consumível. O padrão é anzol simples e sem isca, sem bônus adicionais.

| Item | Desbloqueio | Preço | Tipo | Efeito |
| --- | ---: | ---: | --- | --- |
| Anzol equilibrado | Nível 2 | 140 gold | Permanente | +0,4 de amortecimento; resposta mais rápida, sem alterar velocidade terminal da barra. |
| Anzol de retenção | Nível 4 | 240 gold | Permanente | Reduz em 8% a perda restante de progresso. |
| Anzol largo | Nível 6 | 360 gold | Permanente | +1 ponto percentual da pista na altura da barra. |
| Minhoca | Nível 2 | 8 gold/un. | Consumível | Peso de Lambari +15% e Carpa +20% no sorteio. |
| Isca luminosa | Nível 3 | 12 gold/un. | Consumível | Peso de Lúcio e Bagre +25%, apenas se as condições permitirem essas espécies. |
| Isca seleta | Nível 5 | 18 gold/un. | Consumível | Move 3 pontos percentuais de Comum para a maior qualidade elegível até Épico; não aumenta Lendário. |
| Isca calmante | Nível 7 | 14 gold/un. | Consumível | Ritmo e limite de velocidade do peixe 7% menores. |

Pesos são normalizados no sorteio: +25% de peso não significa +25 pontos percentuais de probabilidade. Pesos zero continuam zero. Nenhuma isca libera espécies fora de seu horário/clima. A seleta não permite qualidades fora da faixa de desempenho; por exemplo, abaixo de 60% passa de 90/10 para 87/13 (Comum/Incomum). Em captura perfeita, passa de 10/35/35/18/2 para 7/35/35/21/2, mantendo Lendário em 2%.

Bônus não são duplicados. A melhoria de anzol reduz a perda em 12% por nível; retenção multiplica o restante por 0,92 uma única vez. Com melhoria nível 3: 0,64 × 0,92 = 0,5888 da perda original (redução total de 41,12%). Linha e anzol largo somam tamanho; vara e equilibrado somam resposta. A loja mostra os efeitos das melhorias de nível separadamente; Equipamentos mostra a combinação ativa.

Anzóis não são consumidos e não podem ser comprados de novo se já possuídos. Iscas consomem **uma unidade quando Pescar inicia o lançamento**, antes da espera pela mordida. Abrir o jogo, clicar em Começar a pescar, abrir janelas, comprar ou equipar não consome isca. Fuga e recarga depois do lançamento não devolvem a unidade. O consumo é salvo imediatamente. Cliques duplicados durante a tentativa são ignorados. Ao usar a última unidade, a seleção para a próxima tentativa volta a Sem isca; a tentativa em curso conserva seu bônus. Você pode pescar sem isca. Comprar reposição não equipa automaticamente.

Condições, espécie e todos os bônus são registrados no lançamento; alterações posteriores de seleção ou melhoria só afetam a próxima tentativa. A interface informa os efeitos ativos e as quantidades. A isca seleta também respeita o desempenho medido na tentativa original.

## Recompensas e migração dos itens

Ao atingir o nível exigido, cada item entrega **uma unidade gratuita**, inclusive os anzóis permanentes. As recompensas não custam gold e não são equipadas automaticamente. Um aviso persistente lista os novos itens e orienta abrir Equipamentos. O botão Entendi dispensa o aviso, não altera os itens.

Todos os desbloqueios elegíveis são verificados após ganho de XP, inclusive quando vários níveis são atravessados. O perfil salva items (quantidades), unlocks (entrega já realizada), equipped (seleções) e pendingUnlocks (avisos pendentes), no schema interno versão 4, mantendo a chave de armazenamento existente. A normalização de um salvamento antigo concede os itens compatíveis com seu nível apenas na primeira migração e preserva inventário/qualidades, gold, XP, melhorias e estatísticas. Salvar/recarregar não entrega novamente uma isca já consumida. O estado é validado: itens sem estoque, bloqueados ou de categoria errada não podem ser equipados.

O laboratório mantém todas essas regras no perfil de teste, separado do progresso real. Para testar rapidamente vários desbloqueios, abra Laboratório, ative simulação e use o kit de peixes; o XP leva o perfil por vários níveis. Feche, abra Inventário e venda para obter gold; abra Equipamentos para selecionar um anzol/isca; lance a linha, confira o estoque, compre reposição na Loja e recarregue. Reative a simulação para conferir o perfil de teste persistido na mesma aba.

Execute node tackle.test.cjs para testar migração de perfil nível 7, entregas únicas, consumo, reposição, bloqueios, bônus combinados, probabilidades e recarga. As suítes quality.test.cjs, progression.test.cjs e world.test.cjs continuam cobrindo qualidade, economia e clima. A interface foi verificada com uma só janela aberta, rolagem interna e resultado completo visível no celular.
