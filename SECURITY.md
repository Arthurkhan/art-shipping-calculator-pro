# Security Guidelines

## Environment Variables

### ✅ Safe for Public Repositories
These environment variables are safe to use in frontend code:
- `VITE_SUPABASE_URL` - Supabase project URL (public)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (public, rate-limited)
- `VITE_APP_URL` - Application URL
- `VITE_ENABLE_DEBUG` - Debug mode flag

### ❌ NEVER Commit These
These should ONLY be in secure environments (Supabase secrets, server env):
- `SUPABASE_SERVICE_ROLE_KEY` - Full database access
- `FEDEX_ENCRYPTION_SECRET` - Encryption key for FedEx credentials
- Any FedEx API credentials

## Row Level Security (RLS)

Security is enforced through Supabase RLS policies:
- `collections` table: Public read access
- `sizes` table: Public read access  
- `fedex_sessions` table: Service role access only

## FedEx Credential Security

1. **Never stored in frontend**: Credentials are encrypted server-side
2. **Session-based**: Temporary 24-hour sessions
3. **AES-256-GCM encryption**: Military-grade encryption
4. **Auto-expiry**: Sessions automatically expire

## File Security

### Protected Files (never commit)
- `.env.local` - Local environment variables
- `.env.production` - Production environment variables
- Any files containing actual API keys or credentials

### Safe to Commit
- `.env.example` - Template with placeholder values
- Source code with `import.meta.env` references
- Configuration files without hardcoded credentials

## Deployment Security

### GitHub Pages
- Uses public environment variables only
- Secrets stored in GitHub repository secrets
- No sensitive data in build artifacts

### Edge Functions
- Service role key stored in Supabase secrets
- Encryption key stored in Supabase secrets
- No credentials in function code

## Security Checklist

Before committing code:
- [ ] No hardcoded URLs or credentials
- [ ] All sensitive values use environment variables
- [ ] `.env.local` is in `.gitignore`
- [ ] Only public keys in frontend code
- [ ] Service role keys only in backend

## Incident Response

If credentials are accidentally committed:
1. **Immediately rotate** all exposed credentials
2. **Force push** to remove from git history
3. **Update** all affected systems
4. **Review** security practices

## Contact

For security issues, please contact through GitHub Issues with the `security` label.