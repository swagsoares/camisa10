# Prompts das caricaturas (Google Gemini) — modo "Quem é esse jogador?"

Mesma abordagem da CP4 (seção 2.2): um **prompt-base fixo** + traços icônicos de cada jogador, para manter o estilo consistente entre os assets.
As caricaturas mostram só traços marcantes (cabelo, camisa, número, comemoração), sem tentar reproduzir o rosto real, e entram como **primeira dica visual** do desafio.

## Como gerar e colocar no jogo
1. Cole cada prompt no Gemini (gemini.google.com) e baixe a imagem.
2. Salve em `scripts/caricaturas_original/<id>.png` (ex.: `ronaldinho.png`). Tanto faz PNG ou JPG.
3. Rode `python scripts/prepara_assets.py`: o script remove o fundo branco e grava em `public/assets/caricaturas/`.
4. Pronto: o jogo mostra a caricatura automaticamente. Se faltar a de algum jogador, o jogo usa só a foto borrada.
5. Se o Gemini recusar ou desenhar algo errado, gere de novo; registrem no Diário de Vibe Coding.

**Prompt-base:**

> Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: <traços>

## Prompts por jogador

### `pele` — Pelé

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo curto preto, camisa amarela de seleção número 10, sorriso confiante, braço erguido comemorando
```

### `ronaldinho` — Ronaldinho

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo longo cacheado preso com faixa na testa, sorriso enorme mostrando os dentes, camisa azul e grená número 10
```

### `ronaldo` — Ronaldo Fenômeno

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabeça raspada com um pequeno topete triangular na frente, dentes da frente separados, camisa amarela número 9
```

### `romario` — Romário

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: baixinho, cabelo curto, expressão marrenta, camisa amarela número 11, apontando para o céu
```

### `zico` — Zico

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo castanho volumoso dos anos 80, camisa rubro-negra listrada número 10
```

### `garrincha` — Garrincha

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo curto preto penteado para trás, pernas tortas, camisa preta e branca com estrela, driblando
```

### `kaka` — Kaká

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo curto castanho bem arrumado, rosto de bom moço, camisa rubro-negra listrada número 22, apontando para o céu
```

### `neymar` — Neymar

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo descolorido estiloso, brinco brilhante, camisa amarela número 10, fazendo pose de dança
```

### `marta` — Marta

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: jogadora com cabelo preso em rabo de cavalo, camisa amarela número 10, comemorando
```

### `messi` — Lionel Messi

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: baixinho, barba castanha, camisa listrada azul-celeste e branca número 10, segurando uma taça dourada
```

### `cristiano` — Cristiano Ronaldo

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo curto com gel, músculos definidos, camisa vermelha número 7, pulando na comemoração
```

### `maradona` — Diego Maradona

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: baixinho e forte, cabelo preto cacheado volumoso, camisa listrada azul-celeste e branca número 10
```

### `zidane` — Zinedine Zidane

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: careca, olhar sério, camisa azul número 10, elegante dominando a bola
```

### `mbappe` — Kylian Mbappé

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabeça raspada, sorriso largo, braços cruzados comemorando, camisa azul número 10, correndo muito rápido
```

### `cruyff` — Johan Cruyff

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo castanho comprido dos anos 70, magro, camisa laranja número 14
```

### `beckenbauer` — Franz Beckenbauer

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo castanho dos anos 70, postura elegante de imperador, camisa branca número 5
```

### `vinicius` — Vinícius Júnior

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo curto com desenho na lateral, sorriso, dançando na comemoração, camisa branca número 7
```

### `robertocarlos` — Roberto Carlos

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: careca, coxas enormes, chutando a bola com força, camisa amarela número 6
```

### `cafu` — Cafu

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: careca, sorriso largo, erguendo uma taça dourada acima da cabeça, camisa amarela número 2
```

### `henry` — Thierry Henry

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabeça raspada, alto e elegante, camisa vermelha com mangas brancas número 14
```

### `iniesta` — Andrés Iniesta

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: pálido, cabelo bem curto e ralo, camisa vermelha número 6, dando um passe preciso
```

### `haaland` — Erling Haaland

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: muito alto, cabelo loiro comprido preso em coque, sentado de pernas cruzadas meditando, camisa azul-celeste número 9
```

### `modric` — Luka Modrić

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: magro, cabelo loiro liso na altura do queixo, camisa xadrez vermelha e branca número 10
```

### `buffon` — Gianluigi Buffon

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, traço simples e amigável, cores vibrantes, corpo inteiro, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: goleiro alto de luvas, cabelo castanho jogado para trás, camisa de goleiro número 1, fazendo uma defesa
```
