using DiAGram.Api.Dtos;
using DiAGram.Api.Services;

namespace DiAGram.Api.Endpoints;

/// <summary>Maps REST endpoints for diagram CRUD under <c>/api/projects/{projectId}/diagrams</c>.</summary>
public static class DiagramEndpoints
{
    public static IEndpointRouteBuilder MapDiagramEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects/{projectId:guid}/diagrams").WithTags("Diagrams");
        group.MapGet("/", ListDiagrams);
        group.MapGet("/{id:guid}", GetDiagram);
        group.MapPost("/", CreateDiagram);
        group.MapPut("/{id:guid}", SaveDiagram);
        group.MapDelete("/{id:guid}", DeleteDiagram);
        return app;
    }

    private static async Task<IResult> ListDiagrams(Guid projectId, DiagramService service)
        => Results.Ok(await service.ListByProjectAsync(projectId));

    private static async Task<IResult> GetDiagram(Guid projectId, Guid id, DiagramService service)
    {
        var diagram = await service.GetAsync(projectId, id);
        return diagram is null ? Results.NotFound() : Results.Ok(diagram);
    }

    private static async Task<IResult> CreateDiagram(
        Guid projectId, CreateDiagramRequest request, DiagramService service)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Results.ValidationProblem(NameRequired());
        var created = await service.CreateAsync(projectId, request);
        return created is null
            ? Results.NotFound()
            : Results.Created($"/api/projects/{projectId}/diagrams/{created.Id}", created);
    }

    private static async Task<IResult> SaveDiagram(
        Guid projectId, Guid id, SaveDiagramRequest request, DiagramService service)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Results.ValidationProblem(NameRequired());
        var saved = await service.SaveAsync(projectId, id, request);
        return saved is null ? Results.NotFound() : Results.Ok(saved);
    }

    private static async Task<IResult> DeleteDiagram(Guid projectId, Guid id, DiagramService service)
        => await service.DeleteAsync(projectId, id) ? Results.NoContent() : Results.NotFound();

    private static Dictionary<string, string[]> NameRequired()
        => new() { ["name"] = ["Diagram name is required and cannot be empty."] };
}
