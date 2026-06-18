using System.Net;
using System.Net.Http.Json;
using DiAGram.Api.Dtos;
using DiAGram.Tests.Support;

namespace DiAGram.Tests.Endpoints;

public class DiagramEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Create_diagram_under_missing_project_returns_404()
    {
        var response = await _client.PostAsJsonAsync(
            $"/api/projects/{Guid.NewGuid()}/diagrams", new CreateDiagramRequest("Flow"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Save_then_get_round_trips_nodes()
    {
        var projectId = await CreateProjectAsync();
        var diagram = await CreateDiagramAsync(projectId, "Flow");
        var save = new SaveDiagramRequest("Flow v2",
            [new NodeDto("n1", NodeType.Process, "Do work", new NodePosition(5, 6), new NodeSize(160, 60))],
            []);

        var saveResponse = await _client.PutAsJsonAsync(
            $"/api/projects/{projectId}/diagrams/{diagram.Id}", save);
        var fetched = await _client.GetFromJsonAsync<DiagramDto>(
            $"/api/projects/{projectId}/diagrams/{diagram.Id}");

        Assert.Equal(HttpStatusCode.OK, saveResponse.StatusCode);
        Assert.Equal("Flow v2", fetched!.Name);
        Assert.Equal("Do work", Assert.Single(fetched.Nodes).Label);
    }

    [Fact]
    public async Task List_returns_diagrams_for_project()
    {
        var projectId = await CreateProjectAsync();
        await CreateDiagramAsync(projectId, "A");

        var diagrams = await _client.GetFromJsonAsync<List<DiagramDto>>(
            $"/api/projects/{projectId}/diagrams");

        Assert.Single(diagrams!);
    }

    private async Task<Guid> CreateProjectAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/projects", new SaveProjectRequest("P", null));
        var project = await response.Content.ReadFromJsonAsync<ProjectDto>();
        return project!.Id;
    }

    private async Task<DiagramDto> CreateDiagramAsync(Guid projectId, string name)
    {
        var response = await _client.PostAsJsonAsync(
            $"/api/projects/{projectId}/diagrams", new CreateDiagramRequest(name));
        return (await response.Content.ReadFromJsonAsync<DiagramDto>())!;
    }
}
