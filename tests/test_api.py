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
