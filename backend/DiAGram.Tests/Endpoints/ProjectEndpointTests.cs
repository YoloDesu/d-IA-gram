using System.Net;
using System.Net.Http.Json;
using DiAGram.Api.Dtos;
using DiAGram.Tests.Support;

namespace DiAGram.Tests.Endpoints;

public class ProjectEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Post_creates_project_and_returns_201()
    {
        var response = await _client.PostAsJsonAsync("/api/projects",
            new SaveProjectRequest("My Flow", "desc"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<ProjectDto>();
        Assert.Equal("My Flow", created!.Name);
    }

    [Fact]
    public async Task Post_with_blank_name_returns_400()
    {
        var response = await _client.PostAsJsonAsync("/api/projects",
            new SaveProjectRequest("  ", null));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_missing_project_returns_404()
    {
        var response = await _client.GetAsync($"/api/projects/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Created_project_appears_in_list()
    {
        await _client.PostAsJsonAsync("/api/projects", new SaveProjectRequest("Listed", null));

        var projects = await _client.GetFromJsonAsync<List<ProjectDto>>("/api/projects");

        Assert.Contains(projects!, p => p.Name == "Listed");
    }

    [Fact]
    public async Task Delete_then_get_returns_404()
    {
        var created = await CreateProjectAsync("ToDelete");

        var deleteResponse = await _client.DeleteAsync($"/api/projects/{created.Id}");
        var getResponse = await _client.GetAsync($"/api/projects/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    private async Task<ProjectDto> CreateProjectAsync(string name)
    {
        var response = await _client.PostAsJsonAsync("/api/projects", new SaveProjectRequest(name, null));
        return (await response.Content.ReadFromJsonAsync<ProjectDto>())!;
    }
}
