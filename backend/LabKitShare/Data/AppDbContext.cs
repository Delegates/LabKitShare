using Microsoft.EntityFrameworkCore;

namespace LabKitShare.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Snippet> Snippets => Set<Snippet>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Snippet>(e =>
        {
            e.HasIndex(s => s.Code).IsUnique();
            e.Property(s => s.Code).HasMaxLength(8);
            e.Property(s => s.Content).HasMaxLength(100_000);
            e.Property(s => s.Language).HasMaxLength(30);
        });
    }
}
