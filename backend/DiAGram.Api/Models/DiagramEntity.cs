namespace DiAGram.Api.Models;

/// <summary>
/// Persisted diagram. Nodes and edges are stored as JSON blobs (NodesJson/EdgesJson)
/// because a diagram is always read and written as a whole — there is no query against
/// individual nodes, so this avoids two join tables and N+1 loads. See handoff.md.
/// </summary>
public class DiagramEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public ProjectEntity Project { get; set; } = null!;
    public string NodesJson { get; set; } = "[]";
    public string EdgesJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
