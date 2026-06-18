using System.Text.Json.Serialization;
using DiAGram.Api.Serialization;

namespace DiAGram.Api.Dtos;

/// <summary>
/// Shape category of a flowchart node. Serialized as a camelCase string ("process",
/// "decision", "terminal", "io") to match the frontend NodeType union.
/// </summary>
[JsonConverter(typeof(CamelCaseEnumConverter))]
public enum NodeType
{
    Process,
    Decision,
    Terminal,
    Io
}

public record NodePosition(double X, double Y);

public record NodeSize(double Width, double Height);

/// <summary>
/// A single flowchart node. This record is the exact shape stored inside
/// <c>DiagramEntity.NodesJson</c> and returned to the frontend — keep it in sync
/// with the frontend <c>DiagramNode</c> model.
/// </summary>
public record NodeDto(
    string Id,
    NodeType Type,
    string Label,
    NodePosition Position,
    NodeSize Size);
