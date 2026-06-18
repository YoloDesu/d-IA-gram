namespace DiAGram.Api.Dtos;

/// <summary>Full diagram payload exchanged with the frontend (read and full-replace write).</summary>
public record DiagramDto(
    Guid Id,
    Guid ProjectId,
    string Name,
    IReadOnlyList<NodeDto> Nodes,
    IReadOnlyList<EdgeDto> Edges,
    DateTime CreatedAt,
    DateTime UpdatedAt);

/// <summary>Body for creating a diagram (POST). Nodes/edges start empty.</summary>
public record CreateDiagramRequest(string Name);

/// <summary>Body for saving a diagram (PUT, full replace of nodes and edges).</summary>
public record SaveDiagramRequest(
    string Name,
    IReadOnlyList<NodeDto> Nodes,
    IReadOnlyList<EdgeDto> Edges);
