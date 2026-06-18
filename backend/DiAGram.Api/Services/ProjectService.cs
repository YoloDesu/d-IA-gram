using DiAGram.Api.Data;
using DiAGram.Api.Dtos;
using DiAGram.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DiAGram.Api.Services;

/// <summary>CRUD operations for projects. Returns DTOs; never leaks EF entities.</summary>
public class ProjectService(AppDbContext db)
{
    public async Task<IReadOnlyList<ProjectDto>> ListAsync()
    {
        var projects = await db.Projects
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProjectDto(p.Id, p.Name, p.Description, p.Diagrams.Count, p.CreatedAt))
            .ToListAsync();
        return projects;
    }

    public async Task<ProjectDto?> GetAsync(Guid id)
    {
        var project = await db.Projects.Include(p => p.Diagrams)
            .FirstOrDefaultAsync(p => p.Id == id);
        return project is null ? null : ToDto(project);
    }

    public async Task<ProjectDto> CreateAsync(SaveProjectRequest request)
    {
        var project = new ProjectEntity { Name = request.Name, Description = request.Description };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return ToDto(project);
    }

    public async Task<ProjectDto?> UpdateAsync(Guid id, SaveProjectRequest request)
    {
        var project = await db.Projects.Include(p => p.Diagrams)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (project is null)
            return null;
        project.Name = request.Name;
        project.Description = request.Description;
        await db.SaveChangesAsync();
        return ToDto(project);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var project = await db.Projects.FindAsync(id);
        if (project is null)
            return false;
        db.Projects.Remove(project);
        await db.SaveChangesAsync();
        return true;
    }

    private static ProjectDto ToDto(ProjectEntity p)
        => new(p.Id, p.Name, p.Description, p.Diagrams.Count, p.CreatedAt);
}
