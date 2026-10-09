"""Pós-processamento dos assets gerados pelo Google Gemini (CP4, seção 2.2).
O Gemini não gera canal alfa: removemos o fundo branco por thresholding de cor
(flood fill a partir das bordas, para não apagar o branco dos olhos/bola) e recortamos a área útil.

- mascote_original.png        -> public/assets/mascote.png
- estadio_original.png        -> public/assets/estadio.jpg (só comprime)
- caricaturas_original/<id>.png -> public/assets/caricaturas/<id>.png  (modo "Quem é esse jogador?")
"""
from pathlib import Path

from PIL import Image, ImageDraw

AQUI = Path(__file__).parent
SAIDA = AQUI.parent / "public" / "assets"
LIMIAR = 40  # tolerância de cor do flood fill a partir do branco da borda


def sem_fundo(origem: Path, destino: Path, lado: int):
    img = Image.open(origem).convert("RGBA")
    w, h = img.size
    for canto in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(img, canto, (0, 0, 0, 0), thresh=LIMIAR)
    img = img.crop(img.getbbox())
    img.thumbnail((lado, lado))
    img.save(destino, optimize=True)


sem_fundo(AQUI / "mascote_original.png", SAIDA / "mascote.png", 512)
Image.open(AQUI / "estadio_original.png").convert("RGB").save(SAIDA / "estadio.jpg", quality=82, optimize=True)

(SAIDA / "caricaturas").mkdir(exist_ok=True)
for arq in sorted((AQUI / "caricaturas_original").glob("*.[pjw]*[gp]")):  # png, jpg, jpeg, webp
    sem_fundo(arq, SAIDA / "caricaturas" / f"{arq.stem}.png", 600)
    print("caricatura:", arq.stem)
print("ok")
