using DiAGram.Api.Dtos;
using DiAGram.Api.Models;

namespace DiAGram.Api.Services;

/// <summary>
/// Builds the self-describing LLM export payload. The capabilities block is the canonical
/// definition of what the app can do — the frontend mirrors it in llm-capabilities.ts.
/// </summary>
public class LlmExportBuilder
{
    private const string SchemaId = "d-ia-gram-v1";
    private const string Version = "1.0.0";

    private const string Instructions =
        "Você recebeu um arquivo de exportação do d-IA-gram (editor de fluxogramas). " +
        "Modifique APENAS o array \"diagrams\" seguindo as regras em \"capabilities\". " +
        "Use somente os node_types (campo type) e line_style de edge_types listados. " +
        "Preserve o id de cada nó/aresta existente; para novos elementos gere um UUID v4. " +
        "Toda aresta deve referenciar sourceNodeId e targetNodeId de nós existentes. " +
        "O LAYOUT É AUTOMÁTICO: o app reposiciona os nós e roteia as arestas ao importar, então as " +
        "posições x/y que você enviar são apenas aproximadas e podem ser quaisquer valores válidos. " +
        "Foque na estrutura e siga layout_hints.branching — prefira ramos paralelos (largura) a " +
        "cadeias verticais longas, e dê a cada decision 2+ saídas rotuladas. " +
        "Retorne o JSON COMPLETO, sem texto fora do JSON.";

    public LlmExportDto BuildProjectExport(ProjectEntity project)
        => Build(project.Diagrams.Select(DiagramMapper.ToDto).Select(ToExported).ToList());

    public LlmExportDto BuildDiagramExport(DiagramEntity diagram)
        => Build([ToExported(DiagramMapper.ToDto(diagram))]);

    private static LlmExportDto Build(IReadOnlyList<ExportedDiagramDto> diagrams)
        => new(SchemaId, Version, Instructions, BuildCapabilities(), diagrams);

    private static ExportedDiagramDto ToExported(DiagramDto diagram)
        => new(diagram.Id, diagram.Name, diagram.Nodes, diagram.Edges.Select(WithoutWaypoints).ToList());

    /// <summary>The LLM works on structure; pixel routes are recomputed by dagre on import.</summary>
    private static EdgeDto WithoutWaypoints(EdgeDto edge) => edge with { Waypoints = null };

    private static CapabilitiesDto BuildCapabilities() => new(
        NodeTypes:
        [
            new("process", "rectangle", "Passo de processamento / ação."),
            new("decision", "diamond", "Ponto de decisão; normalmente tem duas saídas."),
            new("terminal", "rounded_rectangle", "Início ou fim do fluxo."),
            new("io", "parallelogram", "Entrada ou saída de dados.")
        ],
        EdgeTypes:
        [
            new("directed_solid", "solid", "Fluxo de controle padrão."),
            new("directed_dashed", "dashed", "Fluxo opcional ou de exceção.")
        ],
        SupportedOperations:
        [
            "add_node", "remove_node", "update_node_label", "update_node_position",
            "add_edge", "remove_edge", "update_edge_label"
        ],
        PositionSystem: new("px", "top-left", 160),
        LayoutHints: new LayoutHintsDto(
            FlowDirection: "top-to-bottom",
            MainFlow: "O posicionamento é AUTOMÁTICO: ao importar, o app re-organiza os nós e roteia as " +
                "arestas com um motor de layout (dagre). Você NÃO precisa acertar pixels — use x/y apenas " +
                "aproximados (qualquer valor válido). Concentre-se na ESTRUTURA: nós, conexões e rótulos corretos.",
            Branching: "Para um bom resultado, prefira LARGURA a profundidade: quando passos são independentes " +
                "ou são ramos de uma decision, modele-os como ramos paralelos (vários filhos do mesmo nó) em vez " +
                "de uma única cadeia vertical longa. Cada decision deve ter 2+ arestas de saída rotuladas " +
                "(ex.: sim/não). Rótulos de aresta curtos (1–3 palavras).",
            Columns: "Evite uma torre vertical de muitos nós em sequência: agrupe etapas relacionadas e " +
                "distribua ramos lado a lado para o layout aproveitar o espaço horizontal. Reúna ramos que " +
                "convergem em um nó comum a jusante (use um mesmo targetNodeId) em vez de duplicar caminhos.",
            Spacing: new LayoutSpacingDto(160, 340)),
        SizeDefaults: new Dictionary<string, SizeDefaultDto>
        {
            ["process"] = new(160, 60),
            ["decision"] = new(120, 80),
            ["terminal"] = new(140, 50),
            ["io"] = new(160, 60)
        });
}
