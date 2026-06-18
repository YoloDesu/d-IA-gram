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
        "Retorne o JSON COMPLETO, sem texto fora do JSON.";

    public LlmExportDto BuildProjectExport(ProjectEntity project)
        => Build(project.Diagrams.Select(DiagramMapper.ToDto).Select(ToExported).ToList());

    public LlmExportDto BuildDiagramExport(DiagramEntity diagram)
        => Build([ToExported(DiagramMapper.ToDto(diagram))]);

    private static LlmExportDto Build(IReadOnlyList<ExportedDiagramDto> diagrams)
        => new(SchemaId, Version, Instructions, BuildCapabilities(), diagrams);

    private static ExportedDiagramDto ToExported(DiagramDto diagram)
        => new(diagram.Id, diagram.Name, diagram.Nodes, diagram.Edges);

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
        PositionSystem: new("px", "top-left", 120),
        SizeDefaults: new Dictionary<string, SizeDefaultDto>
        {
            ["process"] = new(160, 60),
            ["decision"] = new(120, 80),
            ["terminal"] = new(140, 50),
            ["io"] = new(160, 60)
        });
}
