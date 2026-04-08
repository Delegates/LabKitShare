using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using LabKitShare.Data;

namespace LabKitShare.Hubs;

public class CodeHub : Hub
{
    private readonly AppDbContext _db;

    public CodeHub(AppDbContext db)
    {
        _db = db;
    }

    public async Task JoinSnippet(string code)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, code);
    }

    public async Task LeaveSnippet(string code)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, code);
    }

    public async Task UpdateContent(string code, string content)
    {
        var snippet = await _db.Snippets.FirstOrDefaultAsync(s => s.Code == code);
        if (snippet is null) return;

        if (content.Length > 100_000) return;

        snippet.Content = content;
        snippet.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await Clients.OthersInGroup(code).SendAsync("ContentUpdated", content);
    }

    public async Task UpdateLanguage(string code, string language)
    {
        var snippet = await _db.Snippets.FirstOrDefaultAsync(s => s.Code == code);
        if (snippet is null) return;

        snippet.Language = language;
        snippet.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await Clients.OthersInGroup(code).SendAsync("LanguageUpdated", language);
    }
}
