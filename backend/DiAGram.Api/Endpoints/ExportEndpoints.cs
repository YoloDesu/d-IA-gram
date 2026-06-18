using DiAGram.Api.Data;
using DiAGram.Api.Dtos;
using DiAGram.Api.Models;
using DiAGram.Api.Serialization;
using DiAGram.Api.Services;
using DiAGram.Api.Validators;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiAGram.Api.Endpoints;

/// <summary>LLM export/import endpoints: the app's differentiator.</summary>
public static class ExportEndpoints
{
    public static IEndpointRouteBuilder MapExportEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects/{projectId:guid}").WithTags("LLM Export");
        group.MapGet("/export", ExportProject);
        group.MapGet("/diagrams/{id:guid}/export", ExportDiagram);
        group.MapPost("/import", ImportProject);
        return app;
    }

    private static async Task<IResult> ExportProject(
        Guid projectId, AppDbContext db, LlmExportBuilder builder)
    {
        var project = await db.Projects.Include(p => p.Diagrams)
            .FirstOrDefaultAsync(p => p.Id == projectId);
        return project is null ? Results.NotFound() : Results.Ok(builder.BuildProjectExport(project));
    }

    private static async Task<IResult> ExportDiagram(
        Guid projectId, Guid id, AppDbContext db, LlmExportBuilder builder)
    {
        var diagram = await db.Diagrams.FirstOrDefaultAsync(d => d.Id == id && d.ProjectId == projectId);
        return diagram is null ? Results.NotFound() : Results.Ok(builder.BuildDiagramExport(diagram));
    }

    private static async Task<IResult> ImportProject(
        Guid projectId, [FromBody] LlmExportDto payload, AppDbContext db)
    {
        var validationErrors = LlmImportValidator.Validate(payload);
        if (validationErrors.Count > 0)
            return Results.ValidationProblem(validationErrors);
        var project = await db.Projects.Include(p => p.Diagrams)
            .FirstOrDefaultAsync(p => p.Id == projectId);
        if (project is null)
            return Results.NotFound();
        foreach (var imported in payload.Diagrams)
            UpsertDiagram(project, imported);
        await db.SaveChangesAsync();
        return Results.Ok(new ProjectDto(
            project.Id, project.Name, project.Description, project.Diagrams.Count, project.CreatedAt));
    }

    private static void UpsertDiagram(ProjectEntity project, ExportedDiagramDto imported)
    {
        var diagram = project.Diagrams.FirstOrDefault(d => d.Id == imported.Id);
        if (diagram is null)
        {
            diagram = new DiagramEntity { Id = imported.Id, ProjectId = project.Id };
            project.Diagrams.Add(diagram);
        }
        diagram.Name = imported.Name;
        diagram.NodesJson = DiagramJson.SerializeNodes(imported.Nodes);
        diagram.EdgesJson = DiagramJson.SerializeEdges(imported.Edges);
        diagram.UpdatedAt = DateTime.UtcNow;
    }
}
