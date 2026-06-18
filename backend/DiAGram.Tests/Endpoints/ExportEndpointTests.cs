using System.Net;
using System.Net.Http.Json;
using DiAGram.Api.Dtos;
using DiAGram.Tests.Support;

namespace DiAGram.Tests.Endpoints;

public class ExportEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Export_diagram_contains_schema_and_instructions()
    {
        var (projectId, diagramId) = await SeedDiagramWithNodeAsync();

        var json = await _client.GetStringAsync(
            $"/api/projects/{projectId}/diagrams/{diagramId}/export");

        Assert.Contains("\"$schema\":\"d-ia-gram-v1\"", json);
        Assert.Contains("instructions_for_llm", json);
        Assert.Contains("capabilities", json);
        // Regression: node type must be camelCase ("terminal"), not PascalCase, to match the frontend.
        Assert.Contains("\"type\":\"terminal\"", json);
        Assert.DoesNotContain("\"type\":\"Terminal\"", json);
    }

    [Fact]
    public async Task Import_adds_a_node_back_into_the_diagram()
    {
        var (projectId, diagramId) = await SeedDiagramWithNodeAsync();
        var export = await _client.GetFromJsonAsync<LlmExportDto>(
            $"/api/projects/{projectId}/diagrams/{diagramId}/export");
        var modified = AppendNode(export!, diagramId);

        var importResponse = await _client.PostAsJsonAsync($"/api/projects/{projectId}/import", modified);
        var diagram = await _client.GetFromJsonAsync<DiagramDto>(
            $"/api/projects/{projectId}/diagrams/{diagramId}");

        Assert.Equal(HttpStatusCode.OK, importResponse.StatusCode);
        Assert.Equal(2, diagram!.Nodes.Count);
    }

    private static LlmExportDto AppendNode(LlmExportDto export, Guid diagramId)
    {
        var diagram = export.Diagrams.Single(d => d.Id == diagramId);
        var nodes = diagram.Nodes.Append(
            new NodeDto("n2", NodeType.Process, "Novo", new NodePosition(0, 200), new NodeSize(160, 60)))
            .ToList();
        var updated = diagram with { Nodes = nodes };
        return export with { Diagrams = [updated] };
    }

    private async Task<(Guid projectId, Guid diagramId)> SeedDiagramWithNodeAsync()
    {
        var project = await (await _client.PostAsJsonAsync("/api/projects",
            new SaveProjectRequest("P", null))).Content.ReadFromJsonAsync<ProjectDto>();
        var diagram = await (await _client.PostAsJsonAsync(
            $"/api/projects/{project!.Id}/diagrams", new CreateDiagramRequest("Flow")))
            .Content.ReadFromJsonAsync<DiagramDto>();
        await _client.PutAsJsonAsync($"/api/projects/{project.Id}/diagrams/{diagram!.Id}",
            new SaveDiagramRequest("Flow",
                [new NodeDto("n1", NodeType.Terminal, "Início", new NodePosition(0, 0), new NodeSize(140, 50))],
                []));
        return (project.Id, diagram.Id);
    }
}
