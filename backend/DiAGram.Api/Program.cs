using DiAGram.Api.Data;
using DiAGram.Api.Endpoints;
using DiAGram.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

const string frontendCors = "frontend";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")
        ?? "Data Source=diagrams.db"));

builder.Services.AddScoped<ProjectService>();
builder.Services.AddScoped<DiagramService>();
builder.Services.AddScoped<LlmExportBuilder>();

builder.Services.AddCors(options => options.AddPolicy(frontendCors, policy =>
    policy.WithOrigins("http://localhost:4200")
          .AllowAnyHeader()
          .AllowAnyMethod()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(frontendCors);

app.MapProjectEndpoints();
app.MapDiagramEndpoints();
app.MapExportEndpoints();

// Integration tests swap in their own SQLite connection and create the schema themselves.
if (!app.Environment.IsEnvironment("Testing"))
{
    using var scope = app.Services.CreateScope();
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

app.Run();

public partial class Program; // exposed for WebApplicationFactory integration tests
