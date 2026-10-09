"""Gera api/jogadores.json: base curada do modo "Quem é esse jogador?" e do álbum de figurinhas.
As pistas vão da mais difícil para a mais fácil e NUNCA citam o nome (o backend também verifica).
Fotos: Wikimedia Commons (licença livre), obtidas pela API pageimages da Wikipedia com pilicense=free.
Uso: python scripts/gera_jogadores.py  (precisa de internet)
"""
import json
import re
from pathlib import Path

import httpx

RAIZ = Path(__file__).parent.parent

# id: (nome, apelidos aceitos, título na Wikipedia EN, país, bandeira, posição, traços p/ caricatura, 5 pistas)
J = {
    "pele": ("Pelé", ["pele", "edson arantes do nascimento", "rei pele"], "Pelé", "Brasil", "🇧🇷", "Atacante",
             "homem negro, cabelo curto crespo preto, camisa amarela retrô de 1970 com gola redonda verde e número 10, pulando com o punho direito erguido no ar comemorando gol, bola Telstar preta e branca, estilo anos 70",
             ["Estreou na seleção principal com apenas 16 anos, em 1957.",
              "No fim da carreira, jogou no New York Cosmos, dos Estados Unidos.",
              "Defendeu o Santos por quase toda a carreira.",
              "É o único jogador campeão de três Copas do Mundo.",
              "É chamado de \"Rei do Futebol\"."]),
    "ronaldinho": ("Ronaldinho", ["ronaldinho gaucho", "ronaldo de assis moreira", "r10"], "Ronaldinho", "Brasil", "🇧🇷", "Meia-atacante",
                   "cabelo longo cacheado preto preso com faixa elástica na testa, sorriso enorme com dentes da frente proeminentes, camisa listrada azul e grená número 10, fazendo o gesto 'hang loose' com a mão (polegar e mindinho esticados)",
                   ["Começou a carreira profissional no Grêmio.",
                    "Jogou no Paris Saint-Germain, no Milan e no Flamengo.",
                    "Foi campeão da Copa do Mundo de 2002.",
                    "Ganhou a Bola de Ouro de 2005 jogando pelo Barcelona.",
                    "Famoso pelo sorriso e pelos dribles, tem o apelido de \"Bruxo\"."]),
    "ronaldo": ("Ronaldo Fenômeno", ["ronaldo", "ronaldo nazario", "fenomeno", "r9"], "Ronaldo (Brazilian footballer)", "Brasil", "🇧🇷", "Centroavante",
                "cabeça raspada com um pequeno topete triangular só na frente (corte da Copa de 2002), sorriso com os dentes da frente separados, camisa amarela número 9, correndo de braços abertos comemorando",
                ["Saiu do Cruzeiro para o PSV, da Holanda, aos 17 anos.",
                 "Jogou no Barcelona, na Inter de Milão, no Real Madrid e no Milan.",
                 "Foi eleito melhor do mundo pela FIFA em 1996, 1997 e 2002.",
                 "Fez os dois gols da final da Copa de 2002.",
                 "Camisa 9 do penta, usou em 2002 um famoso corte com topete triangular."]),
    "romario": ("Romário", ["romario", "romario de souza faria", "baixinho"], "Romário", "Brasil", "🇧🇷", "Atacante",
                "baixinho, cabelo curto preto, expressão marrenta e confiante, camisa amarela número 11 estilo 1994, apontando o dedo indicador para o céu",
                ["Foi revelado pelo Vasco da Gama.",
                 "Brilhou no PSV e no Barcelona nos anos 1990.",
                 "Foi eleito o melhor jogador da Copa de 1994.",
                 "Formou dupla de ataque com Bebeto no tetracampeonato.",
                 "Diz ter marcado mais de 1.000 gols e depois virou senador."]),
    "zico": ("Zico", ["arthur antunes coimbra", "galinho"], "Zico (footballer)", "Brasil", "🇧🇷", "Meia",
             "cabelo castanho volumoso estilo anos 80, magro, camisa rubro-negra listrada na horizontal número 10, batendo uma falta com a bola fazendo uma curva",
             ["Jogou na Udinese, da Itália, e no Kashima Antlers, do Japão.",
              "Disputou as Copas de 1978, 1982 e 1986.",
              "Foi campeão da Libertadores e do Mundial de Clubes em 1981.",
              "É o maior ídolo da história do Flamengo.",
              "Seu apelido é \"Galinho de Quintino\"."]),
    "garrincha": ("Garrincha", ["mane garrincha", "manuel francisco dos santos", "mane"], "Garrincha", "Brasil", "🇧🇷", "Ponta-direita",
                  "pernas tortas e arqueadas, cabelo preto curto penteado para trás, camisa listrada preta e branca na vertical com uma estrela branca no peito, número 7, driblando, estilo anos 60",
                  ["Nasceu em Pau Grande, no estado do Rio de Janeiro.",
                   "Jogou a maior parte da carreira no Botafogo.",
                   "Tinha as pernas tortas, o que não o impedia de driblar todo mundo.",
                   "Foi bicampeão mundial em 1958 e 1962.",
                   "Era conhecido como \"Anjo das Pernas Tortas\"."]),
    "kaka": ("Kaká", ["kaka", "ricardo izecson"], "Kaká", "Brasil", "🇧🇷", "Meia",
             "cabelo castanho curto bem arrumado, rosto de bom moço, camisa listrada vermelha e preta número 22, ajoelhado na grama apontando os dois indicadores para o céu",
             ["Começou a carreira no São Paulo.",
              "Também jogou no Real Madrid e no Orlando City.",
              "Ganhou a Liga dos Campeões de 2007.",
              "Ganhou a Bola de Ouro de 2007.",
              "Brilhou com a camisa 22 do Milan."]),
    "neymar": ("Neymar", ["neymar jr", "neymar junior", "ney"], "Neymar", "Brasil", "🇧🇷", "Atacante",
               "cabelo com topo descolorido em loiro, brinco brilhante, braços tatuados, camisa amarela número 10, fazendo uma dancinha de comemoração",
               ["Também jogou no Al-Hilal, da Arábia Saudita.",
                "Foi a contratação mais cara da história ao trocar o Barcelona pelo PSG, em 2017.",
                "Foi campeão da Libertadores de 2011 com o Santos.",
                "Bateu o pênalti do ouro olímpico do Brasil em 2016.",
                "Superou Pelé como maior artilheiro da seleção brasileira."]),
    "marta": ("Marta", ["marta vieira da silva", "rainha marta"], "Marta (footballer)", "Brasil", "🇧🇷", "Atacante",
              "jogadora com cabelo castanho preso em rabo de cavalo, batom escuro, camisa amarela número 10, comemorando com os braços abertos e um grito de gol",
              ["Nasceu em Dois Riachos, Alagoas.",
               "Jogou no Umeå, da Suécia, e no Orlando Pride, dos Estados Unidos.",
               "É a maior artilheira da história das Copas do Mundo, entre homens e mulheres, com 17 gols.",
               "Foi eleita melhor jogadora do mundo pela FIFA seis vezes.",
               "É chamada de \"Rainha do Futebol\"."]),
    "messi": ("Lionel Messi", ["messi", "leo messi", "la pulga"], "Lionel Messi", "Argentina", "🇦🇷", "Atacante",
              "baixinho, barba castanha, camisa listrada na vertical azul-celeste e branca número 10, com uma capa preta transparente sobre os ombros, beijando uma taça dourada de Copa do Mundo",
              ["Saiu de Rosário para o Barcelona ainda adolescente.",
               "Também jogou no PSG e no Inter Miami.",
               "Tem 8 Bolas de Ouro, o recorde.",
               "Foi campeão da Copa de 2022 como capitão.",
               "Seu apelido é \"La Pulga\"."]),
    "cristiano": ("Cristiano Ronaldo", ["cristiano", "cr7"], "Cristiano Ronaldo", "Portugal", "🇵🇹", "Atacante",
                  "cabelo curto com gel, muito musculoso, camisa vermelha número 7, saltando de costas com os braços abertos para baixo na comemoração",
                  ["Começou a carreira no Sporting, de Lisboa.",
                   "Jogou na Juventus e no Al-Nassr, da Arábia Saudita.",
                   "É o maior artilheiro da história da Liga dos Campeões.",
                   "Foi campeão da Eurocopa de 2016 com Portugal.",
                   "É conhecido pelas iniciais \"CR7\"."]),
    "maradona": ("Diego Maradona", ["maradona", "el pibe"], "Diego Maradona", "Argentina", "🇦🇷", "Meia-atacante",
                 "baixinho e forte, cabelo preto cacheado e volumoso, camisa listrada na vertical azul-celeste e branca número 10 estilo 1986, saltando com a mão esquerda erguida acima da cabeça para tocar na bola",
                 ["Começou no Argentinos Juniors e é ídolo do Boca Juniors.",
                  "Levou o Napoli a dois títulos italianos.",
                  "Marcou contra a Inglaterra, em 1986, o chamado \"Gol do Século\".",
                  "Foi campeão do mundo com a Argentina em 1986, como capitão.",
                  "Fez o gol da \"Mão de Deus\"."]),
    "zidane": ("Zinedine Zidane", ["zidane", "zizou"], "Zinedine Zidane", "França", "🇫🇷", "Meia",
               "careca, nariz marcante, olhar sério e concentrado, camisa azul número 10, girando elegantemente sobre a bola (drible roleta)",
               ["Nasceu em Marselha, filho de imigrantes argelinos.",
                "Jogou na Juventus antes de ir para o Real Madrid.",
                "Foi expulso na final da Copa de 2006 por uma cabeçada em Materazzi.",
                "Fez dois gols de cabeça na final da Copa de 1998.",
                "Como técnico, ganhou três Ligas dos Campeões seguidas pelo Real Madrid."]),
    "mbappe": ("Kylian Mbappé", ["mbappe"], "Kylian Mbappé", "França", "🇫🇷", "Atacante",
               "cabeça raspada, sorriso largo, braços cruzados no peito com as mãos debaixo das axilas na comemoração, camisa azul número 10, linhas de velocidade atrás",
               ["Foi revelado pelo Monaco.",
                "Foi campeão do mundo em 2018, com apenas 19 anos.",
                "Fez três gols na final da Copa de 2022.",
                "É o maior artilheiro da história do PSG.",
                "Foi para o Real Madrid em 2024."]),
    "cruyff": ("Johan Cruyff", ["cruyff", "cruijff", "johan cruijff"], "Johan Cruyff", "Holanda", "🇳🇱", "Atacante",
               "cabelo castanho comprido estilo anos 70, magro, camisa laranja número 14, fazendo um drible de giro puxando a bola por trás da perna",
               ["Revelado pelo Ajax, ganhou três Copas dos Campeões seguidas pelo clube.",
                "Foi jogador e depois técnico do Barcelona.",
                "Ganhou a Bola de Ouro três vezes.",
                "Liderou a Holanda do \"Futebol Total\", vice-campeã em 1974.",
                "Um drible de giro famoso leva o seu sobrenome."]),
    "beckenbauer": ("Franz Beckenbauer", ["beckenbauer", "kaiser"], "Franz Beckenbauer", "Alemanha", "🇩🇪", "Zagueiro (líbero)",
                    "cabelo castanho volumoso anos 70, postura elegante de imperador, camisa branca número 5 com faixa de capitão, conduzindo a bola de cabeça erguida",
                    ["Jogou no Bayern de Munique e no New York Cosmos.",
                     "Ganhou a Bola de Ouro em 1972 e 1976.",
                     "Era um zagueiro líbero conhecido pela elegância.",
                     "Foi campeão do mundo como jogador (1974) e como técnico (1990).",
                     "Seu apelido era \"Kaiser\"."]),
    "vinicius": ("Vinícius Júnior", ["vinicius", "vini", "vini jr", "vinicius jr"], "Vinícius Júnior", "Brasil", "🇧🇷", "Ponta-esquerda",
                 "cabelo curto preto com desenho raspado na lateral, sorriso largo, dançando na comemoração do gol, camisa branca número 7",
                 ["Foi revelado pelo Flamengo.",
                  "Foi para o Real Madrid em 2018.",
                  "Fez o gol do título da Liga dos Campeões de 2022, contra o Liverpool.",
                  "Foi eleito o melhor jogador do mundo no prêmio The Best da FIFA de 2024.",
                  "Atacante brasileiro que comemora os gols dançando."]),
    "robertocarlos": ("Roberto Carlos", ["roberto carlos da silva"], "Roberto Carlos", "Brasil", "🇧🇷", "Lateral-esquerdo",
                      "careca, coxas enormes e musculosas, camisa amarela número 6, chutando uma bola de falta que faz uma curva gigantesca no ar",
                      ["Jogou no Palmeiras antes de ir para a Inter de Milão.",
                       "Defendeu o Real Madrid por 11 temporadas.",
                       "Era um lateral-esquerdo com chute fortíssimo.",
                       "Foi campeão da Copa do Mundo de 2002.",
                       "Fez um famoso gol de falta \"impossível\", com efeito, contra a França em 1997."]),
    "cafu": ("Cafu", ["marcos evangelista de morais"], "Cafu", "Brasil", "🇧🇷", "Lateral-direito",
             "careca, sorriso largo, em cima de um pódio erguendo a taça dourada da Copa acima da cabeça, camisa amarela número 2 com faixa de capitão",
             ["Começou a carreira no São Paulo.",
              "Jogou na Roma e no Milan.",
              "Era um lateral-direito incansável.",
              "É o único jogador a disputar três finais de Copa seguidas: 1994, 1998 e 2002.",
              "Foi o capitão que levantou a taça do penta em 2002."]),
    "henry": ("Thierry Henry", ["henry"], "Thierry Henry", "França", "🇫🇷", "Atacante",
              "cabeça raspada, alto e elegante, camisa vermelha com mangas brancas número 14, deslizando de joelhos na grama comemorando",
              ["Foi revelado pelo Monaco.",
               "Também jogou no Barcelona e no New York Red Bulls.",
               "Fez parte do time \"Invencível\" do Arsenal em 2003/04.",
               "Foi campeão do mundo com a França em 1998.",
               "É o maior artilheiro da história do Arsenal, onde ganhou uma estátua."]),
    "iniesta": ("Andrés Iniesta", ["iniesta"], "Andrés Iniesta", "Espanha", "🇪🇸", "Meia",
                "pele clara, cabelo bem curto e entradas na testa, camisa vermelha número 6, chutando a bola de primeira em um gol decisivo",
                ["Encerrou a carreira no Japão e nos Emirados Árabes.",
                 "Passou 16 temporadas no time principal do Barcelona.",
                 "Ganhou 4 Ligas dos Campeões pelo Barcelona.",
                 "Formou um meio-campo histórico com Xavi.",
                 "Fez o gol do título da Espanha na final da Copa de 2010."]),
    "haaland": ("Erling Haaland", ["haaland"], "Erling Haaland", "Noruega", "🇳🇴", "Centroavante",
                "muito alto, cabelo loiro comprido preso em coque, sentado de pernas cruzadas meditando de olhos fechados, camisa azul-celeste número 9",
                ["Nasceu em Leeds, na Inglaterra, mas joga pela Noruega.",
                 "Jogou no Red Bull Salzburg e no Borussia Dortmund.",
                 "Fez 36 gols na primeira temporada de Premier League, um recorde.",
                 "Ganhou a tríplice coroa com o Manchester City em 2023.",
                 "Centroavante norueguês loiro que comemora gols meditando."]),
    "modric": ("Luka Modrić", ["modric"], "Luka Modrić", "Croácia", "🇭🇷", "Meia",
               "magro, cabelo loiro liso na altura do queixo com franja, camisa xadrez vermelha e branca número 10, segurando uma bola dourada",
               ["Começou no Dinamo Zagreb e jogou no Tottenham.",
                "Chegou ao Real Madrid em 2012.",
                "Ganhou a Bola de Ouro de 2018, quebrando a sequência de Messi e Cristiano.",
                "Foi eleito o melhor jogador da Copa de 2018.",
                "É o capitão croata vice-campeão do mundo em 2018."]),
    "buffon": ("Gianluigi Buffon", ["buffon", "gigi buffon"], "Gianluigi Buffon", "Itália", "🇮🇹", "Goleiro",
               "goleiro alto de luvas, cabelo castanho jogado para trás, camisa de goleiro número 1, voando para fazer uma defesa espetacular",
               ["Estreou profissionalmente pelo Parma.",
                "Virou o goleiro mais caro da história ao ir para a Juventus, em 2001.",
                "Disputou cinco Copas do Mundo.",
                "Foi campeão do mundo com a Itália em 2006.",
                "Goleiro italiano lendário, ídolo da Juventus."]),
}


def fotos(titulos):
    """Foto principal (licença livre) de cada página da Wikipedia EN, via API pageimages."""
    c = httpx.Client(headers={"User-Agent": "Camisa10-CP5/1.0 (https://github.com/swagsoares/camisa10)"}, timeout=20)
    r = c.get("https://en.wikipedia.org/w/api.php", params={
        "action": "query", "prop": "pageimages", "piprop": "thumbnail|name", "pithumbsize": "500",
        "pilicense": "free", "redirects": "1", "format": "json", "titles": "|".join(titulos)}).json()["query"]
    alias = {x["from"]: x["to"] for x in r.get("normalized", []) + r.get("redirects", [])}
    paginas = {p["title"]: p for p in r["pages"].values()}
    out = {}
    for t in titulos:
        final = t
        while final in alias:
            final = alias[final]
        p = paginas[final]
        out[t] = (re.sub(r"\?.*$", "", p["thumbnail"]["source"]), "https://commons.wikimedia.org/wiki/File:" + p["pageimage"])
    return out


if __name__ == "__main__":
    f = fotos([v[2] for v in J.values()])
    saida = []
    for k, (nome, apelidos, wiki, pais, bandeira, pos, tracos, pistas) in J.items():
        assert len(pistas) == 5, k
        foto, credito = f[wiki]
        saida.append({"id": k, "nome": nome, "apelidos": apelidos, "pais": pais, "bandeira": bandeira, "posicao": pos,
                      "tracos": tracos, "pistas": pistas, "foto": foto, "credito": credito})
    (RAIZ / "api" / "jogadores.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf8")
    print(len(saida), "jogadores")
