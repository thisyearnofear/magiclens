# Database Migrations

This directory contains Alembic database migrations for MagicLens.

## Quick Start

### Apply Migrations
```bash
# Upgrade to latest version
alembic upgrade head

# Upgrade one version
alembic upgrade +1

# Downgrade one version
alembic downgrade -1

# Downgrade to specific version
alembic downgrade 001_initial_schema
```

### Create New Migration
```bash
# Create empty migration
alembic revision -m "description of changes"

# Auto-generate from model changes (requires SQLAlchemy models)
alembic revision --autogenerate -m "description"
```

### Check Migration Status
```bash
# Show current version
alembic current

# Show migration history
alembic history

# Show all versions
alembic heads
```

## Migration Files

### `001_initial_schema.py`
**Created:** 2024-10-24  
**Description:** Initial database schema with all core tables

**Tables Created:**
- `user_profiles` - User profile information
- `videos` - Video uploads and metadata
- `artist_assets` - AR overlay assets
- `collaborations` - Collaboration projects
- `overlays` - Overlay placements in videos
- `renders` - Video render jobs and status

**Indexes Created:**
- Performance indexes on foreign keys
- Search indexes on commonly queried columns
- Unique indexes on NFT IDs

## Configuration

Database connection is configured via environment variables:
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (default: magiclens)
- `DB_USER` - Database user (default: magiclens_user)
- `DB_PASSWORD` - Database password

## Best Practices

1. **Always review migrations** before applying to production
2. **Test migrations** on a staging database first
3. **Backup your database** before running migrations
4. **Never edit existing migrations** - create new ones instead
5. **Keep migrations small and focused** on one change
6. **Write reversible migrations** when possible (provide downgrade)
7. **Document breaking changes** in migration docstrings

## Troubleshooting

### Migration fails with "relation already exists"
The table was created outside of Alembic. Options:
1. Drop the table and rerun migration
2. Mark migration as applied: `alembic stamp 001_initial_schema`

### Migration fails with "column does not exist"
The schema is out of sync. Options:
1. Check which migrations have been applied: `alembic current`
2. Verify database state matches expected migration
3. May need to manually fix schema or create corrective migration

### Cannot find alembic command
Install alembic or use Python module:
```bash
pip install alembic
# OR
python -m alembic upgrade head
```

## Development Workflow

### Adding a New Table
```bash
# 1. Create migration
alembic revision -m "add_notifications_table"

# 2. Edit the migration file in versions/
# Add create_table() in upgrade()
# Add drop_table() in downgrade()

# 3. Test migration
alembic upgrade head

# 4. Test rollback
alembic downgrade -1

# 5. Reapply
alembic upgrade head
```

### Modifying a Column
```bash
# 1. Create migration
alembic revision -m "add_user_email_column"

# 2. Use alter operations
# op.add_column('users', sa.Column('email', sa.String(255)))

# 3. Test thoroughly
```

## Production Deployment

Before deploying:
```bash
# 1. Review pending migrations
alembic history --verbose

# 2. Backup database
pg_dump magiclens > backup_$(date +%Y%m%d).sql

# 3. Apply migrations
alembic upgrade head

# 4. Verify tables
psql -d magiclens -c "\dt"
```

## References

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Core](https://docs.sqlalchemy.org/en/20/core/)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
