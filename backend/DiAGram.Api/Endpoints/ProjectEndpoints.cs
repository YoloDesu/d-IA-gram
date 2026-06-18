using DiAGram.Api.Dtos;
using DiAGram.Api.Services;

namespace DiAGram.Api.Endpoints;

/// <summary>Maps REST endpoints for project CRUD under <c>/api/projects</c>.</summary>
public static class ProjectEndpoints
{
    public static IEndpointRouteBuilder MapProjectEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects").WithTags("Projects");
        group.MapGet("/", ListProjects);
        group.MapGet("/{id:guid}", GetProject);
        group.MapPost("/", CreateProject);
        group.MapPut("/{id:guid}", UpdateProject);
        group.MapDelete("/{id:guid}", DeleteProject);
        return app;
    }

    private static async Task<IResult> ListProjects(ProjectService service)
        => Results.Ok(await service.ListAsync());

    private static async Task<IResult> GetProject(Guid id, ProjectService service)
    {
        var project = await service.GetAsync(id);
        return project is null ? Results.NotFound() : Results.Ok(project);
    }

    private static async Task<IResult> CreateProject(SaveProjectRequest request, ProjectService service)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Results.ValidationProblem(NameRequired());
        var created = await service.CreateAsync(request);
        return Results.Created($"/api/projects/{created.Id}", created);
    }

    private static async Task<IResult> UpdateProject(Guid id, SaveProjectRequest request, ProjectService service)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Results.ValidationProblem(NameRequired());
        var updated = await service.UpdateAsync(id, request);
        return updated is null ? Results.NotFound() : Results.Ok(updated);
    }

    private static async Task<IResult> DeleteProject(Guid id, ProjectService service)
        => await service.DeleteAsync(id) ? Results.NoContent() : Results.NotFound();

    private static Dictionary<string, string[]> NameRequired()
        => new() { ["name"] = ["Project name is required and cannot be empty."] };
}
