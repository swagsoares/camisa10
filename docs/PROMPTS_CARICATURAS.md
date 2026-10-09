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

> Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: <traços>

## Prompts por jogador

### `pele` — Pelé

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: homem negro, cabelo curto crespo preto, camisa amarela retrô de 1970 com gola redonda verde e número 10, pulando com o punho direito erguido no ar comemorando gol, bola Telstar preta e branca, estilo anos 70
```

### `ronaldinho` — Ronaldinho

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo longo cacheado preto preso com faixa elástica na testa, sorriso enorme com dentes da frente proeminentes, camisa listrada azul e grená número 10, fazendo o gesto 'hang loose' com a mão (polegar e mindinho esticados)
```

### `ronaldo` — Ronaldo Fenômeno

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabeça raspada com um pequeno topete triangular só na frente (corte da Copa de 2002), sorriso com os dentes da frente separados, camisa amarela número 9, correndo de braços abertos comemorando
```

### `romario` — Romário

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: baixinho, cabelo curto preto, expressão marrenta e confiante, camisa amarela número 11 estilo 1994, apontando o dedo indicador para o céu
```

### `zico` — Zico

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo castanho volumoso estilo anos 80, magro, camisa rubro-negra listrada na horizontal número 10, batendo uma falta com a bola fazendo uma curva
```

### `garrincha` — Garrincha

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: pernas tortas e arqueadas, cabelo preto curto penteado para trás, camisa listrada preta e branca na vertical com uma estrela branca no peito, número 7, driblando, estilo anos 60
```

### `kaka` — Kaká

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo castanho curto bem arrumado, rosto de bom moço, camisa listrada vermelha e preta número 22, ajoelhado na grama apontando os dois indicadores para o céu
```

### `neymar` — Neymar

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo com topo descolorido em loiro, brinco brilhante, braços tatuados, camisa amarela número 10, fazendo uma dancinha de comemoração
```

### `marta` — Marta

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: jogadora com cabelo castanho preso em rabo de cavalo, batom escuro, camisa amarela número 10, comemorando com os braços abertos e um grito de gol
```

### `messi` — Lionel Messi

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: baixinho, barba castanha, camisa listrada na vertical azul-celeste e branca número 10, com uma capa preta transparente sobre os ombros, beijando uma taça dourada de Copa do Mundo
```

### `cristiano` — Cristiano Ronaldo

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo curto com gel, muito musculoso, camisa vermelha número 7, saltando de costas com os braços abertos para baixo na comemoração
```

### `maradona` — Diego Maradona

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: baixinho e forte, cabelo preto cacheado e volumoso, camisa listrada na vertical azul-celeste e branca número 10 estilo 1986, saltando com a mão esquerda erguida acima da cabeça para tocar na bola
```

### `zidane` — Zinedine Zidane

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: careca, nariz marcante, olhar sério e concentrado, camisa azul número 10, girando elegantemente sobre a bola (drible roleta)
```

### `mbappe` — Kylian Mbappé

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabeça raspada, sorriso largo, braços cruzados no peito com as mãos debaixo das axilas na comemoração, camisa azul número 10, linhas de velocidade atrás
```

### `cruyff` — Johan Cruyff

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo castanho comprido estilo anos 70, magro, camisa laranja número 14, fazendo um drible de giro puxando a bola por trás da perna
```

### `beckenbauer` — Franz Beckenbauer

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo castanho volumoso anos 70, postura elegante de imperador, camisa branca número 5 com faixa de capitão, conduzindo a bola de cabeça erguida
```

### `vinicius` — Vinícius Júnior

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabelo curto preto com desenho raspado na lateral, sorriso largo, dançando na comemoração do gol, camisa branca número 7
```

### `robertocarlos` — Roberto Carlos

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: careca, coxas enormes e musculosas, camisa amarela número 6, chutando uma bola de falta que faz uma curva gigantesca no ar
```

### `cafu` — Cafu

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: careca, sorriso largo, em cima de um pódio erguendo a taça dourada da Copa acima da cabeça, camisa amarela número 2 com faixa de capitão
```

### `henry` — Thierry Henry

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: cabeça raspada, alto e elegante, camisa vermelha com mangas brancas número 14, deslizando de joelhos na grama comemorando
```

### `iniesta` — Andrés Iniesta

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: pele clara, cabelo bem curto e entradas na testa, camisa vermelha número 6, chutando a bola de primeira em um gol decisivo
```

### `haaland` — Erling Haaland

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: muito alto, cabelo loiro comprido preso em coque, sentado de pernas cruzadas meditando de olhos fechados, camisa azul-celeste número 9
```

### `modric` — Luka Modrić

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: magro, cabelo loiro liso na altura do queixo com franja, camisa xadrez vermelha e branca número 10, segurando uma bola dourada
```

### `buffon` — Gianluigi Buffon

```
Caricatura cartoon de um jogador de futebol, estilo mascote 2D flat design igual a um sticker, cabeça grande e corpo pequeno, contorno preto grosso, cores vibrantes, corpo inteiro, retratando o momento mais icônico da carreira dele, com o uniforme e o estilo da época, fundo branco liso, sem texto, sem nome, sem logotipos. Traços: goleiro alto de luvas, cabelo castanho jogado para trás, camisa de goleiro número 1, voando para fazer uma defesa espetacular
```
