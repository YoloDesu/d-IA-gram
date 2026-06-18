using System.Text.Json.Serialization;

namespace DiAGram.Api.Dtos;

/// <summary>Self-describing export payload. Snake_case keys are part of the public schema.</summary>
public record LlmExportDto(
    [property: JsonPropertyName("$schema")] string Schema,
    [property: JsonPropertyName("format_version")] string FormatVersion,
    [property: JsonPropertyName("instructions_for_llm")] string InstructionsForLlm,
    [property: JsonPropertyName("capabilities")] CapabilitiesDto Capabilities,
    [property: JsonPropertyName("diagrams")] IReadOnlyList<ExportedDiagramDto> Diagrams);

public record ExportedDiagramDto(
    Guid Id,
    string Name,
    IReadOnlyList<NodeDto> Nodes,
    IReadOnlyList<EdgeDto> Edges);

public record CapabilitiesDto(
    [property: JsonPropertyName("node_types")] IReadOnlyList<NodeTypeCapabilityDto> NodeTypes,
    [property: JsonPropertyName("edge_types")] IReadOnlyList<EdgeTypeCapabilityDto> EdgeTypes,
    [property: JsonPropertyName("supported_operations")] IReadOnlyList<string> SupportedOperations,
    [property: JsonPropertyName("position_system")] PositionSystemDto PositionSystem,
    [property: JsonPropertyName("size_defaults")] IReadOnlyDictionary<string, SizeDefaultDto> SizeDefaults);

public record NodeTypeCapabilityDto(string Type, string Shape, string Description);

public record EdgeTypeCapabilityDto(
    string Type,
    [property: JsonPropertyName("line_style")] string LineStyle,
    string Description);

public record PositionSystemDto(
    string Unit,
    string Origin,
    [property: JsonPropertyName("recommended_spacing")] int RecommendedSpacing);

public record SizeDefaultDto(int Width, int Height);
