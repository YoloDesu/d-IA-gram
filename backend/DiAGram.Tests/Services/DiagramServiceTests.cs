using DiAGram.Api.Dtos;
using DiAGram.Api.Services;
using DiAGram.Tests.Support;

namespace DiAGram.Tests.Services;

public class DiagramServiceTests
{
    private static async Task<Guid> SeedProjectAsync(InMemoryDb db)
    {
        var project = await new ProjectService(db.Context).CreateAsync(new SaveProjectRequest("P", null));
        return project.Id;
    }

    private static SaveDiagramRequest SampleSave() => new(
        "Flow",
        [new NodeDto("n1", NodeType.Terminal, "Start", new NodePosition(10, 20), new NodeSize(140, 50))],
        [new EdgeDto("e1", "n1", "n2", "yes", EdgeLineStyle.Solid)]);

    [Fact]
    public async Task CreateAsync_returns_null_when_project_missing()
    {
        using var db = new InMemoryDb();
        var service = new DiagramService(db.Context);

        var result = await service.CreateAsync(Guid.NewGuid(), new CreateDiagramRequest("Flow"));

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_starts_with_empty_nodes_and_edges()
    {
        using var db = new InMemoryDb();
        var projectId = await SeedProjectAsync(db);
        var service = new DiagramService(db.Context);

        var created = await service.CreateAsync(projectId, new CreateDiagramRequest("Flow"));

        Assert.NotNull(created);
        Assert.Empty(created!.Nodes);
        Assert.Empty(created.Edges);
    }

    [Fact]
    public async Task SaveAsync_round_trips_nodes_and_edges()
    {
        using var db = new InMemoryDb();
        var projectId = await SeedProjectAsync(db);
        var service = new DiagramService(db.Context);
        var created = await service.CreateAsync(projectId, new CreateDiagramRequest("Flow"));

        var saved = await service.SaveAsync(projectId, created!.Id, SampleSave());

        Assert.NotNull(saved);
        var node = Assert.Single(saved!.Nodes);
        Assert.Equal(NodeType.Terminal, node.Type);
        Assert.Equal(10, node.Position.X);
        var edge = Assert.Single(saved.Edges);
        Assert.Equal("yes", edge.Label);
    }

    [Fact]
    public async Task SaveAsync_returns_null_for_wrong_project_scope()
    {
        using var db = new InMemoryDb();
        var projectId = await SeedProjectAsync(db);
        var service = new DiagramService(db.Context);
        var created = await service.CreateAsync(projectId, new CreateDiagramRequest("Flow"));

        var saved = await service.SaveAsync(Guid.NewGuid(), created!.Id, SampleSave());

        Assert.Null(saved);
    }

    [Fact]
    public async Task ListByProjectAsync_returns_only_that_projects_diagrams()
    {
        using var db = new InMemoryDb();
        var projectId = await SeedProjectAsync(db);
        var otherProjectId = await SeedProjectAsync(db);
        var service = new DiagramService(db.Context);
        await service.CreateAsync(projectId, new CreateDiagramRequest("A"));
        await service.CreateAsync(otherProjectId, new CreateDiagramRequest("B"));

        var diagrams = await service.ListByProjectAsync(projectId);

        Assert.Single(diagrams);
    }

    [Fact]
    public async Task DeleteAsync_removes_diagram()
    {
        using var db = new InMemoryDb();
        var projectId = await SeedProjectAsync(db);
        var service = new DiagramService(db.Context);
        var created = await service.CreateAsync(projectId, new CreateDiagramRequest("Flow"));

        var deleted = await service.DeleteAsync(projectId, created!.Id);

        Assert.True(deleted);
        Assert.Null(await service.GetAsync(projectId, created.Id));
    }
}
