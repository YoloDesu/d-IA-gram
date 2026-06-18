namespace DiAGram.Api.Dtos;

/// <summary>Project summary returned in lists and after mutations.</summary>
public record ProjectDto(
    Guid Id,
    string Name,
    string? Description,
    int DiagramCount,
    DateTime CreatedAt);

/// <summary>Body for creating or updating a project.</summary>
public record SaveProjectRequest(string Name, string? Description);
