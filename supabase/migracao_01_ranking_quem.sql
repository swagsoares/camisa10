-- Rode uma vez no SQL Editor se o banco foi criado antes do modo "Quem é esse jogador?".
alter table scores drop constraint if exists scores_modo_check;
alter table scores add constraint scores_modo_check check (modo in ('sobrevivencia','campanha','quem'));
