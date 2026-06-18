using System.Text.Json.Serialization;
using DiAGram.Api.Serialization;

namespace DiAGram.Api.Dtos;

/// <summary>Line rendering of a directed edge. Serialized camelCase ("solid"/"dashed").</summary>
[JsonConverter(typeof(CamelCaseEnumConverter))]
public enum EdgeLineStyle
{
    Solid,
    Dashed
}

/// <summary>
/// A directed connection between two nodes. Stored inside <c>DiagramEntity.EdgesJson</c>.
/// Keep in sync with the frontend <c>DiagramEdge</c> model.
/// </summary>
public record EdgeDto(
    string Id,
    string SourceNodeId,
    string TargetNodeId,
    string? Label,
    EdgeLineStyle LineStyle);
