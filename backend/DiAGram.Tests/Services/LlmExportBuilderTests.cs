using DiAGram.Api.Dtos;
using DiAGram.Api.Models;
using DiAGram.Api.Serialization;
using DiAGram.Api.Services;

namespace DiAGram.Tests.Services;

public class LlmExportBuilderTests
{
    private static DiagramEntity SampleDiagram()
    {
        var nodes = new List<NodeDto>
        {
            new("n1", NodeType.Terminal, "Início", new NodePosition(0, 0), new NodeSize(140, 50))
        };
        return new DiagramEntity
        {
            Name = "Flow",
            NodesJson = DiagramJson.SerializeNodes(nodes),
            EdgesJson = "[]"
        };
    }

    [Fact]
    public void BuildDiagramExport_sets_schema_and_version()
    {
        var export = new LlmExportBuilder().BuildDiagramExport(SampleDiagram());

        Assert.Equal("d-ia-gram-v1", export.Schema);
        Assert.Equal("1.0.0", export.FormatVersion);
    }

    [Fact]
    public void BuildDiagramExport_includes_instructions_and_capabilities()
    {
        var export = new LlmExportBuilder().BuildDiagramExport(SampleDiagram());

        Assert.False(string.IsNullOrWhiteSpace(export.InstructionsForLlm));
        Assert.Equal(4, export.Capabilities.NodeTypes.Count);
        Assert.Contains(export.Capabilities.SupportedOperations, op => op == "add_node");
    }

    [Fact]
    public void BuildDiagramExport_includes_layout_hints()
    {
        var export = new LlmExportBuilder().BuildDiagramExport(SampleDiagram());

        Assert.Equal("top-to-bottom", export.Capabilities.LayoutHints.FlowDirection);
        Assert.Equal(160, export.Capabilities.LayoutHints.Spacing.Vertical);
        Assert.Equal(340, export.Capabilities.LayoutHints.Spacing.Horizontal);
    }

    [Fact]
    public void BuildDiagramExport_instructs_llm_to_avoid_overlaps()
    {
        var export = new LlmExportBuilder().BuildDiagramExport(SampleDiagram());

        Assert.Contains("nenhum nó se sobrepõe", export.InstructionsForLlm);
        Assert.Contains("margem mínima de 40px", export.Capabilities.LayoutHints.MainFlow);
        Assert.Contains("arestas atravessem caixas", export.Capabilities.LayoutHints.Branching);
    }

    [Fact]
    public void BuildDiagramExport_carries_the_diagram_nodes()
    {
        var export = new LlmExportBuilder().BuildDiagramExport(SampleDiagram());

        var diagram = Assert.Single(export.Diagrams);
        Assert.Equal("Início", Assert.Single(diagram.Nodes).Label);
    }

    [Fact]
    public void BuildProjectExport_includes_every_diagram()
    {
        var project = new ProjectEntity { Name = "P", Diagrams = [SampleDiagram(), SampleDiagram()] };

        var export = new LlmExportBuilder().BuildProjectExport(project);

        Assert.Equal(2, export.Diagrams.Count);
    }
}
