using Microsoft.EntityFrameworkCore;
using LabKitShare.Data;
using LabKitShare.Hubs;

var builder = WebApplication.CreateBuilder(args);

var dbPath = Environment.GetEnvironmentVariable("DB_PATH") ?? "share.db";
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite($"Data Source={dbPath}"));

builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseCors();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/api/snippets", async (AppDbContext db) =>
{
    var code = GenerateCode();
    while (await db.Snippets.AnyAsync(s => s.Code == code))
        code = GenerateCode();

    var snippet = new Snippet
    {
        Code = code,
        Content = "",
        Language = "javascript"
    };
    db.Snippets.Add(snippet);
    await db.SaveChangesAsync();

    return Results.Ok(new { code });
});

app.MapGet("/api/snippets/{code}", async (string code, AppDbContext db) =>
{
    if (code.Length > 8) return Results.NotFound();

    var snippet = await db.Snippets.FirstOrDefaultAsync(s => s.Code == code);
    if (snippet is null) return Results.NotFound();

    return Results.Ok(new
    {
        snippet.Code,
        snippet.Content,
        snippet.Language
    });
});

app.MapHub<CodeHub>("/hubs/code");

app.Run();

static string GenerateCode()
{
    const string chars = "abcdefghkmnpqrstuvwxyz23456789";
    var random = Random.Shared;
    return new string(Enumerable.Range(0, 5).Select(_ => chars[random.Next(chars.Length)]).ToArray());
}
