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

/// <summary>A routed control point on an edge, in diagram (top-left origin) coordinates.</summary>
public record EdgePoint(double X, double Y);

/// <summary>
/// A directed connection between two nodes. Stored inside <c>DiagramEntity.EdgesJson</c>.
/// Keep in sync with the frontend <c>DiagramEdge</c> model. <see cref="Waypoints"/> holds the
/// dagre-computed route persisted so a reloaded diagram looks identical to the auto-arranged one;
/// it is null for edges drawn manually and is stripped from the LLM export.
/// </summary>
public record EdgeDto(
    string Id,
    string SourceNodeId,
    string TargetNodeId,
    string? Label,
    EdgeLineStyle LineStyle,
    IReadOnlyList<EdgePoint>? Waypoints = null);
