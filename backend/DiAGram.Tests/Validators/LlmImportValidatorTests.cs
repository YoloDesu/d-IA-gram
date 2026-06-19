using DiAGram.Api.Dtos;
using DiAGram.Api.Validators;

namespace DiAGram.Tests.Validators;

public class LlmImportValidatorTests
{
    private static NodeDto Node(string id)
        => new(id, NodeType.Process, "x", new NodePosition(0, 0), new NodeSize(10, 10));

    private static LlmExportDto Payload(string schema, ExportedDiagramDto diagram)
        => new(schema, "1.0.0", "i", Capabilities(), [diagram]);

    private static CapabilitiesDto Capabilities()
        => new([], [], [], new PositionSystemDto("px", "top-left", 120),
            new LayoutHintsDto("top-to-bottom", "", "", "", new LayoutSpacingDto(120, 300)),
            new Dictionary<string, SizeDefaultDto>());

    [Fact]
    public void Valid_payload_has_no_errors()
    {
        var diagram = new ExportedDiagramDto(Guid.NewGuid(), "D",
            [Node("a"), Node("b")],
            [new EdgeDto("e1", "a", "b", null, EdgeLineStyle.Solid)]);

        var errors = LlmImportValidator.Validate(Payload("d-ia-gram-v1", diagram));

        Assert.Empty(errors);
    }

    [Fact]
    public void Wrong_schema_is_flagged()
    {
        var diagram = new ExportedDiagramDto(Guid.NewGuid(), "D", [], []);

        var errors = LlmImportValidator.Validate(Payload("nope", diagram));

        Assert.True(errors.ContainsKey("$schema"));
    }

    [Fact]
    public void Orphan_edge_is_flagged()
    {
        var diagram = new ExportedDiagramDto(Guid.NewGuid(), "D",
            [Node("a")],
            [new EdgeDto("e1", "a", "ghost", null, EdgeLineStyle.Solid)]);

        var errors = LlmImportValidator.Validate(Payload("d-ia-gram-v1", diagram));

        Assert.Contains(errors, kv => kv.Key.EndsWith(".edges"));
    }

    [Fact]
    public void Duplicate_node_ids_are_flagged()
    {
        var diagram = new ExportedDiagramDto(Guid.NewGuid(), "D",
            [Node("a"), Node("a")], []);

        var errors = LlmImportValidator.Validate(Payload("d-ia-gram-v1", diagram));

        Assert.Contains(errors, kv => kv.Key.EndsWith(".nodes"));
    }
}
