namespace DiAGram.Api.Models;

/// <summary>
/// Persisted project. A project groups related diagrams (e.g. all flows of one system).
/// </summary>
public class ProjectEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<DiagramEntity> Diagrams { get; set; } = [];
}
