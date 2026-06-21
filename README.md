# d-IA-gram

Editor de fluxogramas web (estilo Mermaid/draw.io) com um diferencial: **exportar o
diagrama para um JSON auto-descritivo que uma LLM entende, modifica e devolve** — e o app
reimporta o resultado, organizando o layout automaticamente.

- **Frontend-only**: Angular 21 (standalone) + maxGraph (canvas) + dagre (layout) + Mermaid + TailwindCSS
- **Sem backend e sem banco de dados**: tudo roda no navegador. Import/export (JSON da LLM ou
  Mermaid) e exportação PNG são feitos no cliente; nada é salvo em servidor.

## Páginas

- **Modo Básico** — `/` (motor: maxGraph): monta-se o fluxograma na mão (arrasta nós, liga setas,
  edita no painel). Import/export do JSON `d-ia-gram-v1` e exportação PNG. Só fluxograma.
- **Modo Avançado** — `/mermaid` (motor: Mermaid; botão "Modo Avançado →" na barra): descreve-se
  o diagrama como texto (ou gera com IA) e ele desenha sozinho — preview ao vivo, zoom, arrastar-para-
  navegar, exportação PNG e exportação p/ LLM (instruções + código). Oferece os modelos **Fluxograma,
  Ishikawa, Kanban, Quadrant e Gantt** no header; o modelo escolhido vai no texto de export, então a
  LLM já sabe qual usar.

> **Básico** = montar clicando/arrastando (mais simples). **Avançado** = descrever/gerar em texto,
> com mais tipos de diagrama e melhores resultados, em troca de um pouco mais de complexidade.
> (maxGraph/Mermaid são apenas os motores internos.)

Em ambas as telas o **Importar** aceita o upload do arquivo (além de colar o texto), e há um
**modo escuro** (botão no header) — um dark suave em tons slate, com preferência persistida.

## Estrutura

```
frontend/  → app Angular (tela única: o editor de diagrama)
```

## Como rodar

```bash
cd frontend
NG_DISABLE_VERSION_CHECK=1 npx ng serve   # http://localhost:4200
```

> Node 25 não é suportado oficialmente pelo Angular; o env `NG_DISABLE_VERSION_CHECK=1`
> silencia o erro de versão.

## Testes

```bash
cd frontend && NG_DISABLE_VERSION_CHECK=1 npx ng test --watch=false
```

## Tipos de elementos

| Tipo node  | Forma            | Uso                         |
|------------|------------------|-----------------------------|
| `terminal` | retângulo arred. | início / fim                |
| `process`  | retângulo        | passo / ação                |
| `decision` | losango          | decisão (bifurcação)        |
| `io`       | paralelogramo    | entrada / saída de dados    |

Arestas: `solid` (fluxo padrão) ou `dashed` (opcional/exceção).

## Formato de exportação LLM (`d-ia-gram-v1`)

O JSON exportado contém `instructions_for_llm`, um bloco `capabilities` (tipos de nó/aresta,
operações suportadas, dicas de layout) e o array `diagrams`. A LLM modifica apenas `diagrams`
(preservando os `id`) e devolve o JSON completo, que é reimportado pela tela de Importar.
O **posicionamento é automático**: ao importar, o app re-organiza os nós e roteia as arestas
com o dagre, então a LLM foca na estrutura (nós, conexões, rótulos), não em coordenadas.

## Atalhos

- `Delete` / `Backspace`: remove o nó/conexão selecionado (exceto ao digitar em campos).
