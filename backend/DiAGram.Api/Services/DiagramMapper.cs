using DiAGram.Api.Dtos;
using DiAGram.Api.Models;
using DiAGram.Api.Serialization;

namespace DiAGram.Api.Services;

/// <summary>Maps between persisted <see cref="DiagramEntity"/> and the wire <see cref="DiagramDto"/>.</summary>
public static class DiagramMapper
{
    public static DiagramDto ToDto(DiagramEntity entity) => new(
        entity.Id,
        entity.ProjectId,
        entity.Name,
        DiagramJson.DeserializeNodes(entity.NodesJson),
        DiagramJson.DeserializeEdges(entity.EdgesJson),
        entity.CreatedAt,
        entity.UpdatedAt);

    /// <summary>Overwrites name, nodes and edges from a save request and stamps UpdatedAt.</summary>
    public static void ApplySave(DiagramEntity entity, SaveDiagramRequest request)
    {
        entity.Name = request.Name;
        entity.NodesJson = DiagramJson.SerializeNodes(request.Nodes);
        entity.EdgesJson = DiagramJson.SerializeEdges(request.Edges);
        entity.UpdatedAt = DateTime.UtcNow;
    }
}
