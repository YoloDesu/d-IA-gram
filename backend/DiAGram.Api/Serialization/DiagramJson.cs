using System.Text.Json;
using DiAGram.Api.Dtos;

namespace DiAGram.Api.Serialization;

/// <summary>
/// Single source of truth for (de)serializing node/edge blobs. Uses camelCase property
/// names; enum values are camelCased by the [CamelCaseEnumConverter] on NodeType/EdgeLineStyle,
/// keeping the stored JSON byte-identical to the API/wire format the frontend consumes.
/// </summary>
public static class DiagramJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static string SerializeNodes(IReadOnlyList<NodeDto> nodes)
        => JsonSerializer.Serialize(nodes, Options);

    public static string SerializeEdges(IReadOnlyList<EdgeDto> edges)
        => JsonSerializer.Serialize(edges, Options);

    public static IReadOnlyList<NodeDto> DeserializeNodes(string json)
        => JsonSerializer.Deserialize<List<NodeDto>>(json, Options) ?? [];

    public static IReadOnlyList<EdgeDto> DeserializeEdges(string json)
        => JsonSerializer.Deserialize<List<EdgeDto>>(json, Options) ?? [];
}
