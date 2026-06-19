# d-IA-gram — Handoff de Progresso

> Documento vivo para retomar o trabalho em qualquer sessão. Atualizado ao fim de cada fase/marco.
> Plano completo: `C:\Users\yolodeuz\.claude\plans\vamos-construir-um-web-inherited-ullman.md`

## Estado atual

**Última atualização:** MVP funcional + melhorias de canvas/layout LLM ✅
**Fase atual:** — (concluído; só falta verificação VISUAL no browser)

## Ambiente detectado

- Node: v25.9.0 (não suportado oficialmente pelo Angular, mas funcional — usar env `NG_DISABLE_VERSION_CHECK=1`)
- npm: 11.12.1
- Angular CLI: 21.2.8 (**testes via Vitest**, não Karma/Jasmine; usa `describe/it` mas roda em jsdom)
- .NET SDK: 9.0.308 (targetando `net8.0`; runtime 8.0.22 presente). `dotnet-ef` 8.0.28 instalado como tool local.
- maxGraph: instalado. Tailwind v4 via `@tailwindcss/postcss` + `.postcssrc.json`.

### Convenção de nomes Angular 21
Arquivos gerados SEM sufixo `.component`: `app.ts` (classe `App`), `app.config.ts`, `app.routes.ts`, `app.html`, `app.css`. Seguir essa convenção nos novos arquivos (ex.: `project-list.ts`, não `project-list.component.ts`).

## Decisões tomadas

- Backend targeta `net8.0` (pedido explícito do usuário), buildado com SDK 9.
- Nodes/edges persistidos como JSON blob em `DiagramEntity` (sem tabelas separadas).
- maxGraph 100% encapsulado em `MaxGraphAdapterService`.
- Export LLM disponível em frontend (offline) e backend (canônico).

## Checklist de fases

- [x] **Fase 1 — Scaffolding**: ng new, dotnet new, packages ✅ (frontend + backend buildam)
- [x] **Fase 2 — Data layer**: EF entities, DTOs, Services, migration, testes ✅ (12 testes)
- [x] **Fase 3 — API endpoints**: CRUD + CORS + testes integração ✅ (20 testes; Swagger 200; CRUD via curl OK)
- [x] **Fase 4 — Frontend core**: models, API services, ProjectListComponent ✅ (7 testes; build prod OK)
- [x] **Fase 5 — Canvas**: NodeStyleFactory, MaxGraphAdapter, CanvasComponent ✅ (22 testes; round-trip provado)
- [x] **Fase 6 — Editor shell**: layout, DiagramList, PropertiesPanel, auto-save ✅ (26 testes)
- [x] **Fase 7 — LLM Export/Import**: services, endpoints, dialogs ✅ (62 testes totais)
- [x] **Fase 8 — Polish**: validação backend import (`LlmImportValidator`, 400 em schema/arestas órfãs/ids dup), atalho Delete/Backspace no Canvas, build prod OK ✅
  - **Bug corrigido**: enums serializavam PascalCase ("Terminal") → agora camelCase ("terminal") via `Serialization/CamelCaseEnumConverter.cs` (atributo `[JsonConverter]` nas enums). Teste de regressão em ExportEndpointTests.
  - **E2E HTTP do diferencial PROVADO**: export → modificação simulada de LLM (add nó decision + aresta dashed) → import → persistência confirmada; import inválido → 400.

## Pós-MVP (melhorias)

### layout_hints no export (reduz verticalidade gerada por LLMs)
LLMs tendiam a empilhar tudo numa coluna vertical (não é bug; o app não tem auto-layout e renderiza as coords literais). Adicionado bloco `capabilities.layout_hints` ao formato de export, orientando: fluxo top-to-bottom em coluna central, ramos de `decision` espalhados lateralmente (±340px), 3-5 colunas, espaçamento vertical 160px, margem mínima 40px e validação explícita para não sobrepor nós nem atravessar caixas com arestas. Frontend: `llm-format.types.ts` (interface `LayoutHints`) + `llm-capabilities.ts`. Backend: `LayoutHintsDto`/`LayoutSpacingDto` em `LlmExportDto.cs` + `LlmExportBuilder`. Ambos espelhados.

### Export PNG de alta resolução
`MaxGraphAdapterService.exportPng(scale=3, padding=16)`: pega o `<svg>` do `graph.container`, usa `graph.getGraphBounds()` p/ recortar no conteúdo, clona o SVG ajustando width/height/viewBox (× scale), serializa e rasteriza num canvas branco → `Blob` PNG (função livre `rasterizeSvg`). SVG é vetorial → nitidez independente do zoom de tela. Util `shared/file-download.ts` (`downloadBlob`). Botão "Exportar PNG" no Toolbar (output `exportPngRequested`) → `Editor.onExportPng` baixa `{nome}.png`.
**Não testado em jsdom** (canvas.toBlob/Image-SVG não suportados) — verificar visualmente no browser.

### Auto-layout hierárquico no import LLM
Corrigido problema de diagramas importados com caixas sobrepostas / setas muito cruzadas. Durante `onImported`, o Editor agora chama `MaxGraphAdapterService.renderHierarchicalDiagram`, que renderiza o JSON importado, executa `HierarchicalLayout` top-to-bottom do maxGraph e salva o snapshot reorganizado. `LlmImportService` também aumenta `size` de nós com labels longos/multilinha para evitar texto espremido. `buildEdgeStyle` usa `EdgeStyle.SegmentConnector` + `orthogonal: true`, e `edge-router.ts` calcula waypoints quando a linha direta atravessaria uma caixa, desviando por fora da fileira/coluna. Regressões: `llm-import.service.spec.ts`, `maxgraph-adapter.spec.ts`, `node-style.factory.spec.ts`, `edge-router.spec.ts`.

### Controles de canvas
Toolbar tem ferramenta `Selecionar`, ferramenta `Mover tela`, `Limpar tela`, zoom out, reset 100% e zoom in. `MaxGraphAdapterService` inicializa maxGraph com `RubberBandHandler`; no modo seleção a área de seleção fica ativa, e no modo pan o `PanningHandler` usa botão esquerdo, desliga seleção/movimento/conexão e aplica cursor `grab`. Regressões em `maxgraph-adapter.spec.ts`.

## ✅ STATUS FINAL: MVP COMPLETO + melhorias

- **Testes**: 32 backend + 48 frontend = 80 testes, todos verdes.
- **Builds**: backend `dotnet build` OK; frontend `ng build --configuration production` OK.
- **E2E**: round-trip export/import validado via HTTP real (Python urllib). CRUD validado via curl. Swagger 200. `ng serve` serve SPA (HTTP 200).
- **README.md** criado; CLAUDE.md atualizado com comandos de teste.

### ⚠️ Única pendência: verificação VISUAL no browser
Não há ferramenta de browser neste ambiente. Falta um humano abrir `http://localhost:4200`,
criar projeto/diagrama, adicionar nós e confirmar que o maxGraph renderiza as 4 formas, conecta
arestas, faz pan/zoom, e que export/import funcionam pela UI. Tudo abaixo da camada visual está
provado por testes. Rodar: backend `dotnet run` (porta 5294) + `ng serve`.

### Possíveis próximos passos (não no MVP)
- Toasts de erro user-facing no editor (hoje erros de save são silenciosos; ProjectList já mostra erro de load).
- Import de múltiplos diagramas (hoje `onImported` aplica só o 1º ao diagrama atual).
- Editar tipo de nó / estilo de aresta no PropertiesPanel (hoje só rótulo).
- Renomear/excluir diagramas e projetos pela UI.

## Comandos de verificação

```bash
# Frontend
cd frontend && NG_DISABLE_VERSION_CHECK=1 npx ng test --watch=false
ng serve

# Backend
cd backend && dotnet test
dotnet run --project DiAGram.Api
```

## Próximos passos imediatos

1. `ng new frontend` (standalone, routing)
2. Instalar maxGraph, Tailwind v4, uuid
3. `dotnet new sln` + webapi + xunit
4. Instalar NuGet (EF Core SQLite, Design, Swagger)
5. Verificar que `ng serve` e `dotnet run` sobem

## Estrutura criada (backend)

- `Models/`: ProjectEntity, DiagramEntity (nodes/edges = JSON blob)
- `Dtos/`: NodeDto (enum NodeType), EdgeDto (enum EdgeLineStyle), DiagramDto + Create/Save requests, ProjectDto + SaveProjectRequest
- `Serialization/DiagramJson.cs`: opções JSON compartilhadas (Web/camelCase) + serialize/deserialize de nodes/edges
- `Services/`: DiagramMapper (entity↔dto), ProjectService, DiagramService
- `Data/AppDbContext.cs` + migration `InitialCreate`
- `Program.cs`: registra DbContext (SQLite `diagrams.db`), services, CORS `frontend` (localhost:4200), Swagger. **Endpoints ainda não mapeados** (Fase 3). Tem `public partial class Program;` para testes de integração.
- Tests: `Support/InMemoryDb.cs` (SQLite :memory: por teste), ProjectServiceTests, DiagramServiceTests

## Endpoints disponíveis (Fase 3)

- `Endpoints/ProjectEndpoints.cs` → `/api/projects` (GET, POST, GET/{id}, PUT/{id}, DELETE/{id})
- `Endpoints/DiagramEndpoints.cs` → `/api/projects/{projectId}/diagrams` (GET, POST, GET/{id}, PUT/{id}, DELETE/{id})
- Validação: nome em branco → 400 ValidationProblem; recurso ausente → 404
- Migration aplicada no startup exceto em `ASPNETCORE_ENVIRONMENT=Testing`
- Testes integração via `Support/ApiFactory.cs` (WebApplicationFactory + SQLite :memory:)

### Como rodar a API localmente
`launchSettings.json` força porta 5294. Para porta fixa: `ASPNETCORE_URLS=http://localhost:5180 dotnet run --no-launch-profile`. Matar processo no Windows: `Get-Process -Name DiAGram.Api | Stop-Process -Force`.

## Estrutura criada (frontend)

- `shared/models/`: node.model.ts, edge.model.ts, diagram.model.ts, project.model.ts (espelham DTOs do backend, camelCase)
- `core/api/`: project-api.ts (`ProjectApiService`), diagram-api.ts (`DiagramApiService`) — wrappers de HttpClient
- `environments/`: environment.ts (`apiBaseUrl: http://localhost:5294` = porta default do `dotnet run` com launchSettings) + environment.prod.ts
- `features/projects/`: project-list.ts (`ProjectList`) + html + css — lista e cria projetos
- `features/editor/`: editor.ts (`Editor`) — **STUB** (só header + voltar), expandir nas Fases 5-6
- `app.config.ts`: + provideHttpClient(withFetch()) + withComponentInputBinding()
- `app.routes.ts`: `''`→ProjectList (lazy), `project/:projectId`→Editor (lazy), `**`→redirect
- Testes: project-api.spec.ts (HttpTestingController), project-list.spec.ts (FakeProjectApiService nomeado)

### Como rodar o frontend
`cd frontend && NG_DISABLE_VERSION_CHECK=1 npx ng serve`. Testes: `NG_DISABLE_VERSION_CHECK=1 npx ng test --watch=false`.

## Canvas / maxGraph (Fase 5)

- **API maxGraph 0.23 usada**: `new Graph(container, undefined, [...getDefaultPlugins(), RubberBandHandler])`; `setPanning`, `setConnectable`, `setCellsSelectable`, `setCellsMovable`; `insertVertex({parent,id,value,position:[x,y],size:[w,h],style})`, `insertEdge({...,source,target})`; `batchUpdate(fn)`; `getChildVertices/getChildEdges(parent)`; `removeCells`; `getSelectionCell(s)`; `zoomIn/zoomOut/zoomActual`; eventos via `getDataModel().addListener(InternalEvent.CHANGE)` e `getSelectionModel().addListener(InternalEvent.CHANGE)`; `getStylesheet().putDefaultEdgeStyle(...)`.
- **Estilos são OBJETOS `CellStyle`** (não strings como no mxGraph antigo).
- **`parallelogram` NÃO é built-in** → `core/graph/parallelogram-shape.ts` registra shape custom (extends `Shape`, override `paintVertexShape`) via `ShapeRegistry.add`. io→parallelogram, process→rectangle, decision→rhombus, terminal→rectangle+rounded.
- **Tipo do nó inferido do `style.shape`** (não há mapa paralelo) — ver `graph-cell-mapper.ts`.
- `core/graph/`: parallelogram-shape.ts, node-style.factory.ts, graph-events.ts (DiagramSnapshot, SelectedCellInfo, DEFAULT_NODE_SIZE), graph-cell-mapper.ts, maxgraph-adapter.ts (`MaxGraphAdapterService`).
- `MaxGraphAdapterService`: providenão-root, fornecido em `Editor` (`providers: [MaxGraphAdapterService]`). Expõe `changes$` (snapshot a cada edição) e `selection$`. `renderDiagram` usa flag `isRendering` p/ não emitir change (evita loop de auto-save).
- `features/editor/canvas/`: canvas.ts (`Canvas`) — inputs `nodes`/`edges` (estado INICIAL; canvas é dono do estado durante edição → parent só reatribui em load/import), outputs `snapshotChanged`/`selectionChanged`.
- `Editor` atual tem diagrama SAMPLE hard-coded (`SAMPLE_NODES`/`SAMPLE_EDGES`) — **substituir por load real do backend na Fase 6**.

### ⚠️ Verificação visual pendente
Round-trip provado no nível de modelo (teste jsdom). Renderização visual real no browser ainda NÃO foi confirmada — fazer na verificação E2E da Fase 8 (rodar backend + `ng serve`, abrir editor).

## Editor shell (Fase 6)

- `features/editor/`:
  - `editor.ts` (`Editor`) — orquestra tudo. Provê `MaxGraphAdapterService`. Carrega projeto+diagramas no `ngOnInit`, seleciona o 1º. Auto-save via `Subject<DiagramSnapshot>` + `debounceTime(600)` + `switchMap(persist)`. `onAddNode/onDeleteSelected/onLabelChanged` delegam ao adapter.
  - `toolbar/` (`Toolbar`) — apresentacional; outputs addNode, deleteSelected, clearDiagram, toolSelected, zoomInRequested, zoomOutRequested, resetZoomRequested, exportRequested, importRequested.
  - `diagram-list/` (`DiagramList`) — sidebar esq; outputs selectDiagram, createDiagram.
  - `properties-panel/` (`PropertiesPanel`) — sidebar dir; edita rótulo da célula selecionada; output labelChanged.
- **Contrato de estado**: `nodes`/`edges` signals só são reatribuídos em `openDiagram` (load/troca de diagrama) — NUNCA no auto-save, evitando loop de re-render.
- `onExport`/`onImport` no Editor agora abrem os diálogos (Fase 7).

## LLM Export/Import (Fase 7 — O DIFERENCIAL)

- **Schema**: `$schema: "d-ia-gram-v1"`, `format_version: "1.0.0"`. Chaves snake_case (`instructions_for_llm`, `capabilities`, `node_types`, etc.); diagrams/nodes/edges em camelCase (igual wire format).
- Frontend `core/export/`:
  - `llm-format.types.ts` — tipos do schema (SCHEMA_ID, FORMAT_VERSION).
  - `llm-capabilities.ts` — `CAPABILITIES` + `LLM_INSTRUCTIONS` (**fonte da verdade frontend; espelhar com backend `LlmExportBuilder.BuildCapabilities`**).
  - `llm-export.service.ts` (`LlmExportService`) — puro, sem HTTP. `buildFromCurrent(id,name,nodes,edges)`, `serialize()`.
  - `llm-import.validator.ts` — validação pura → `string[]` de erros (schema, tipos de nó, arestas órfãs, ids duplicados).
  - `llm-import.service.ts` (`LlmImportService`) — `parse(raw): Result<ExportedDiagram[], string[]>`; normaliza (preenche size default, lineStyle 'solid').
  - `shared/result.ts` — `Result<T,E>` + `ok()`/`err()`.
- Frontend `features/export-import/`: `export-dialog.ts` (copiar/baixar JSON), `import-dialog.ts` (colar+validar, mostra erros), `dialog.css` compartilhado.
- Editor: `onExport` usa `adapter.snapshot()` (estado AO VIVO do canvas, não os signals) → monta payload → abre ExportDialog. `onImported` substitui conteúdo do diagrama atual (1º importado) + salva.
- Backend: `Dtos/LlmExportDto.cs` (JsonPropertyName p/ snake_case), `Services/LlmExportBuilder.cs`, `Endpoints/ExportEndpoints.cs` (GET `/export`, GET `/diagrams/{id}/export`, POST `/import` faz upsert por id). Registrado em Program.cs.

### Fluxo E2E do diferencial
Exportar → copiar JSON → LLM modifica → colar em Importar → valida → canvas atualiza + salva.

## Notas / problemas encontrados

- Node 25 emite warning no Angular mas funciona (usar `NG_DISABLE_VERSION_CHECK=1`).
- `diagrams.db` fica travado pelo processo; matar via PowerShell `Stop-Process` antes de remover.
- Angular 21 usa Vitest; specs ainda usam sintaxe `describe/it`/TestBed normalmente.
