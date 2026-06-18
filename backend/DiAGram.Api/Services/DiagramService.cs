using DiAGram.Api.Data;
using DiAGram.Api.Dtos;
using DiAGram.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DiAGram.Api.Services;

/// <summary>CRUD for diagrams scoped to a project. Diagrams are saved as full replacements.</summary>
public class DiagramService(AppDbContext db)
{
    public async Task<IReadOnlyList<DiagramDto>> ListByProjectAsync(Guid projectId)
    {
        var diagrams = await db.Diagrams
            .Where(d => d.ProjectId == projectId)
            .OrderBy(d => d.CreatedAt)
            .ToListAsync();
        return diagrams.Select(DiagramMapper.ToDto).ToList();
    }

    public async Task<DiagramDto?> GetAsync(Guid projectId, Guid id)
    {
        var diagram = await FindAsync(projectId, id);
        return diagram is null ? null : DiagramMapper.ToDto(diagram);
    }

    /// <summary>Creates an empty diagram. Returns null when the parent project does not exist.</summary>
    public async Task<DiagramDto?> CreateAsync(Guid projectId, CreateDiagramRequest request)
    {
        if (!await db.Projects.AnyAsync(p => p.Id == projectId))
            return null;
        var diagram = new DiagramEntity { Name = request.Name, ProjectId = projectId };
        db.Diagrams.Add(diagram);
        await db.SaveChangesAsync();
        return DiagramMapper.ToDto(diagram);
    }

    public async Task<DiagramDto?> SaveAsync(Guid projectId, Guid id, SaveDiagramRequest request)
    {
        var diagram = await FindAsync(projectId, id);
        if (diagram is null)
            return null;
        DiagramMapper.ApplySave(diagram, request);
        await db.SaveChangesAsync();
        return DiagramMapper.ToDto(diagram);
    }

    public async Task<bool> DeleteAsync(Guid projectId, Guid id)
    {
        var diagram = await FindAsync(projectId, id);
        if (diagram is null)
            return false;
        db.Diagrams.Remove(diagram);
        await db.SaveChangesAsync();
        return true;
    }

    private Task<DiagramEntity?> FindAsync(Guid projectId, Guid id)
        => db.Diagrams.FirstOrDefaultAsync(d => d.Id == id && d.ProjectId == projectId);
}
