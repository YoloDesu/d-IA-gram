using DiAGram.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DiAGram.Api.Data;

/// <summary>EF Core context for projects and their diagrams (SQLite).</summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ProjectEntity> Projects => Set<ProjectEntity>();
    public DbSet<DiagramEntity> Diagrams => Set<DiagramEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectEntity>(project =>
        {
            project.HasKey(p => p.Id);
            project.Property(p => p.Name).IsRequired().HasMaxLength(200);
            project.HasMany(p => p.Diagrams)
                   .WithOne(d => d.Project)
                   .HasForeignKey(d => d.ProjectId)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DiagramEntity>(diagram =>
        {
            diagram.HasKey(d => d.Id);
            diagram.Property(d => d.Name).IsRequired().HasMaxLength(200);
            diagram.Property(d => d.NodesJson).IsRequired();
            diagram.Property(d => d.EdgesJson).IsRequired();
        });
    }
}
