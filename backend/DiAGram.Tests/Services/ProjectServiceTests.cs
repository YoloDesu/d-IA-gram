using DiAGram.Api.Dtos;
using DiAGram.Api.Services;
using DiAGram.Tests.Support;

namespace DiAGram.Tests.Services;

public class ProjectServiceTests
{
    private static SaveProjectRequest SampleRequest()
        => new("Login Flow", "Auth diagrams");

    [Fact]
    public async Task CreateAsync_persists_and_returns_dto()
    {
        using var db = new InMemoryDb();
        var service = new ProjectService(db.Context);

        var created = await service.CreateAsync(SampleRequest());

        Assert.Equal("Login Flow", created.Name);
        Assert.Equal(0, created.DiagramCount);
        Assert.NotEqual(Guid.Empty, created.Id);
    }

    [Fact]
    public async Task ListAsync_returns_created_projects()
    {
        using var db = new InMemoryDb();
        var service = new ProjectService(db.Context);
        await service.CreateAsync(SampleRequest());

        var projects = await service.ListAsync();

        Assert.Single(projects);
    }

    [Fact]
    public async Task GetAsync_returns_null_for_missing_project()
    {
        using var db = new InMemoryDb();
        var service = new ProjectService(db.Context);

        var result = await service.GetAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_changes_name_and_description()
    {
        using var db = new InMemoryDb();
        var service = new ProjectService(db.Context);
        var created = await service.CreateAsync(SampleRequest());

        var updated = await service.UpdateAsync(created.Id, new SaveProjectRequest("Renamed", null));

        Assert.NotNull(updated);
        Assert.Equal("Renamed", updated!.Name);
        Assert.Null(updated.Description);
    }

    [Fact]
    public async Task DeleteAsync_returns_false_for_missing_project()
    {
        using var db = new InMemoryDb();
        var service = new ProjectService(db.Context);

        var deleted = await service.DeleteAsync(Guid.NewGuid());

        Assert.False(deleted);
    }

    [Fact]
    public async Task DeleteAsync_removes_existing_project()
    {
        using var db = new InMemoryDb();
        var service = new ProjectService(db.Context);
        var created = await service.CreateAsync(SampleRequest());

        var deleted = await service.DeleteAsync(created.Id);

        Assert.True(deleted);
        Assert.Null(await service.GetAsync(created.Id));
    }
}
