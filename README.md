# d-IA-gram

Editor de fluxogramas web (estilo Mermaid/draw.io) com um diferencial: **exportar o
diagrama para um JSON auto-descritivo que uma LLM entende, modifica e devolve** — e o app
reimporta o resultado.

- **Backend**: .NET 8 Minimal API + EF Core (SQLite)
- **Frontend**: Angular 21 (standalone) + maxGraph (canvas) + TailwindCSS

## Estrutura

```
backend/   → DiAGram.Api (API) + DiAGram.Tests (xUnit)
frontend/  → app Angular
```

## Como rodar

### Backend
```bash
cd backend/DiAGram.Api
dotnet run            # Swagger em http://localhost:5294/swagger (porta do launchSettings)
```
A migration é aplicada no startup (cria `diagrams.db`).

### Frontend
```bash
cd frontend
NG_DISABLE_VERSION_CHECK=1 npx ng serve   # http://localhost:4200
```
`apiBaseUrl` aponta para `http://localhost:5294` (ver `src/environments/environment.ts`).
O CORS do backend libera `http://localhost:4200`.

> Node 25 não é suportado oficialmente pelo Angular; o env `NG_DISABLE_VERSION_CHECK=1`
> silencia o erro de versão.

## Testes

```bash
cd backend  && dotnet test                                   # 32 testes
cd frontend && NG_DISABLE_VERSION_CHECK=1 npx ng test --watch=false   # 48 testes
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
operações suportadas, sistema de coordenadas, tamanhos padrão) e o array `diagrams`. A LLM
modifica apenas `diagrams` (preservando os `id`) e devolve o JSON completo, que é reimportado
pela tela de Importar.

## Atalhos

- `Delete` / `Backspace`: remove o nó/conexão selecionado (exceto ao digitar em campos).
