using DiAGram.Api.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace DiAGram.Tests.Support;

/// <summary>
/// Creates an isolated SQLite in-memory database per test. The connection is held open
/// for the lifetime of the context (closing it would drop the in-memory schema).
/// Dispose to release. Named fake DB to keep tests fast and independent (F.I.R.S.T).
/// </summary>
public sealed class InMemoryDb : IDisposable
{
    private readonly SqliteConnection _connection;

    public InMemoryDb()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        Context = new AppDbContext(options);
        Context.Database.EnsureCreated();
    }

    public AppDbContext Context { get; }

    public void Dispose()
    {
        Context.Dispose();
        _connection.Dispose();
    }
}
