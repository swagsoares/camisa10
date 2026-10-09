"""Pós-processamento dos assets gerados pelo Google Gemini (CP4, seção 2.2).
O Gemini não gera canal alfa: removemos o fundo branco do mascote por thresholding
de cor (flood fill a partir das bordas, para não apagar o branco dos olhos/bola)
e recortamos a área útil. O estádio é só comprimido para web."""
from pathlib import Path
from PIL import Image, ImageDraw

AQUI = Path(__file__).parent
SAIDA = AQUI.parent / "public" / "assets"
LIMIAR = 40  # tolerância de cor do flood fill a partir do branco da borda

masc = Image.open(AQUI / "mascote_original.png").convert("RGBA")
w, h = masc.size
for canto in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
    ImageDraw.floodfill(masc, canto, (0, 0, 0, 0), thresh=LIMIAR)
masc = masc.crop(masc.getbbox())
masc.thumbnail((512, 512))
masc.save(SAIDA / "mascote.png", optimize=True)

Image.open(AQUI / "estadio_original.png").convert("RGB").save(SAIDA / "estadio.jpg", quality=82, optimize=True)
print("ok", list(SAIDA.iterdir()))
