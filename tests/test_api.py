"""Testes do motor de perguntas: validação da saída do LLM e fallback para o cache."""
import httpx
import pytest
from fastapi.testclient import TestClient

import api.index as m

FATOS = [{"id": i, "categoria": "historia", "dificuldade": 1, "fato": f"fato {i}"} for i in range(1, 6)]
BOA = {"pergunta": "Quem venceu a Copa de 1930?", "alternativas": ["Uruguai", "Brasil", "Itália", "Argentina"],
       "resposta_correta": "Uruguai", "explicacao": "O Uruguai venceu em casa."}


def test_multipla_escolha_valida_embaralha_mas_mantem_resposta():
    p = m.normalizar(dict(BOA), "multipla_escolha")
    assert sorted(p.alternativas) == sorted(BOA["alternativas"])
    assert p.resposta_correta == "Uruguai"


def test_verdadeiro_falso_sem_alternativas_e_corrigido():
    p = m.normalizar({"pergunta": "O Uruguai venceu a Copa de 1930?", "resposta_correta": "verdadeiro",
                      "explicacao": "x"}, "verdadeiro_falso")
    assert p.alternativas == ["Verdadeiro", "Falso"] and p.resposta_correta == "Verdadeiro"


@pytest.mark.parametrize("ruim", [
    {**BOA, "resposta_correta": "Alemanha"},                   # resposta fora das alternativas
    {**BOA, "alternativas": ["Uruguai", "Brasil", "Itália"]},  # 3 alternativas
    {**BOA, "alternativas": ["Uruguai", "uruguai", "Itália", "Brasil"]},  # repetidas
])
def test_saida_invalida_do_llm_e_rejeitada(ruim):
    with pytest.raises(ValueError):
        m.normalizar(ruim, "multipla_escolha")


def falso_sb(cache):
    async def sb(metodo, caminho, **kw):
        if caminho.startswith("facts"):
            return FATOS
        if metodo == "GET" and caminho.startswith("questions"):
            return cache
        return None
    return sb


@pytest.fixture
def cliente(monkeypatch):
    monkeypatch.setattr(m.random, "random", lambda: 0.99)  # força múltipla escolha
    return TestClient(m.app)


def test_gera_pela_ia(cliente, monkeypatch):
    async def llm(*a):
        return dict(BOA, alternativas=list(BOA["alternativas"]))
    monkeypatch.setattr(m, "chamar_llm", llm)
    monkeypatch.setattr(m, "sb", falso_sb([]))
    r = cliente.post("/api/perguntas", json={"categoria": "historia", "dificuldade": 1, "quantidade": 3})
    assert r.status_code == 200
    assert len(r.json()) == 3 and all(q["fonte"] == "ia" for q in r.json())


def test_fallback_para_cache_quando_llm_cai(cliente, monkeypatch):
    async def llm(*a):
        raise httpx.ConnectError("sem rede")
    monkeypatch.setattr(m, "chamar_llm", llm)
    cache = [{"fact_id": i, "payload": dict(BOA, alternativas=list(BOA["alternativas"]))} for i in (1, 2)]
    monkeypatch.setattr(m, "sb", falso_sb(cache))
    r = cliente.post("/api/perguntas", json={"categoria": "historia", "dificuldade": 1, "quantidade": 2})
    assert r.status_code == 200
    assert [q["fonte"] for q in r.json()] == ["cache", "cache"]


def test_llm_fora_e_cache_vazio_retorna_503(cliente, monkeypatch):
    async def llm(*a):
        return {"lixo": True}  # JSON fora do formato, as 2 tentativas falham
    monkeypatch.setattr(m, "chamar_llm", llm)
    monkeypatch.setattr(m, "sb", falso_sb([]))
    assert cliente.post("/api/perguntas", json={"dificuldade": 1}).status_code == 503


def test_categoria_invalida_retorna_422(cliente):
    assert cliente.post("/api/perguntas", json={"categoria": "basquete"}).status_code == 422


# ---------- "Quem é esse jogador?" ----------
MARADONA = {"id": "maradona", "nome": "Diego Maradona", "apelidos": ["maradona"],
            "pistas": ["Começou no Argentinos Juniors.", "Levou o Napoli a dois títulos italianos.",
                       "Fez o Gol do Século em 1986.", "Campeão do mundo em 1986.", "Fez o gol da Mão de Deus."]}


def test_dica_que_revela_o_nome_e_barrada():
    assert m.revela_nome("O craque Maradona brilhou no Napoli", MARADONA)
    assert m.revela_nome("diego encantou o mundo", MARADONA)
    assert not m.revela_nome("O camisa 10 argentino brilhou no Napoli", MARADONA)


def test_dica_com_numero_inventado_e_barrada():
    ok = ["Brilhou no Argentinos.", "Dois títulos italianos.", "O gol do século, em 1986.", "Campeão em 1986.", "A Mão de Deus."]
    assert m.dicas_validas(ok, MARADONA)
    alucinada = list(ok)
    alucinada[3] = "Tricampeão do mundo em 1986 e 1990."  # 1990 não está na pista
    assert not m.dicas_validas(alucinada, MARADONA)
    assert not m.dicas_validas(ok[:4], MARADONA)  # precisa de 5 dicas


def test_dicas_caem_para_as_curadas_quando_ia_falha(monkeypatch):
    async def llm(*a):
        raise httpx.ConnectError("sem rede")
    monkeypatch.setattr(m, "chamar_llm_dicas", llm)
    jogador = next(iter(m.JOGADORES.values()))
    r = TestClient(m.app).post("/api/dicas", json={"jogador": jogador["id"]})
    assert r.status_code == 200 and r.json() == {"dicas": jogador["pistas"], "fonte": "curadas"}
    assert TestClient(m.app).post("/api/dicas", json={"jogador": "nao-existe"}).status_code == 404


def test_pistas_curadas_nao_revelam_o_nome():
    for j in m.JOGADORES.values():
        assert len(j["pistas"]) == 5, j["id"]
        assert not any(m.revela_nome(p, j) for p in j["pistas"]), j["id"]
