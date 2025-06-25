# 🎨 Art Collection Shipping Calculator Pro

A secure, enterprise-grade shipping calculator for art collections with real-time FedEx integration. Built with security-first architecture for safe deployment on public repositories.

[![Deploy to GitHub Pages](https://github.com/Arthurkhan/art-shipping-calculator-pro/actions/workflows/deploy.yml/badge.svg)](https://github.com/Arthurkhan/art-shipping-calculator-pro/actions/workflows/deploy.yml)

## 🔐 Security Features

- **Zero Client-Side Credentials**: FedEx API credentials are never stored in the browser
- **Server-Side Encryption**: All sensitive data encrypted using AES-256-GCM
- **Session-Based Authentication**: Temporary secure sessions for API access
- **Input Sanitization**: Comprehensive XSS and injection protection
- **Row Level Security**: Supabase RLS policies enforce data access rules
- **CSP Headers**: Content Security Policy prevents unauthorized scripts
- **HTTPS Only**: All API communications over secure channels

## 🚀 Features

- **Real-time FedEx Rates**: Get instant shipping quotes directly from FedEx API
- **Multi-Currency Support**: Automatic currency detection based on destination
- **Collection Management**: Pre-configured art collection sizes and weights
- **Custom Dimensions**: Override mode for non-standard shipments
- **Service Availability**: Smart routing suggestions for unsupported routes
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Session-based with encryption
- **Deployment**: GitHub Pages + GitHub Actions

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- FedEx Developer account
- GitHub account (for deployment)

## 🏃‍♂️ Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Arthurkhan/art-shipping-calculator-pro.git
   cd art-shipping-calculator-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables**
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_APP_URL=http://localhost:5173
   VITE_ENABLE_DEBUG=true
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Supabase Setup

1. **Create a new Supabase project**

2. **Run database migrations** (if needed)
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
   ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
   
   -- Create read-only policies
   CREATE POLICY "Enable read access for all users" ON collections
       FOR SELECT USING (true);
   CREATE POLICY "Enable read access for all users" ON sizes
       FOR SELECT USING (true);
   ```

3. **Deploy Edge Functions**
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   supabase secrets set FEDEX_ENCRYPTION_SECRET="your-strong-secret"
   supabase functions deploy calculate-shipping
   supabase functions deploy fedex-config
   ```

## 🚀 Deployment

### GitHub Pages Deployment

1. **Fork this repository**

2. **Set up GitHub Secrets**
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_APP_URL` (your GitHub Pages URL)

3. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages`

4. **Push to main branch**
   - The GitHub Action will automatically build and deploy

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [Security Checklist](./SECURITY_CHECKLIST.md) - Security audit checklist
- [Update Logs](./UPDATE_LOGS/) - Development history

## 🔒 Security Considerations

This application is designed to be safely hosted on public repositories:

1. **No hardcoded credentials** - All sensitive data in environment variables
2. **Server-side API calls** - FedEx API never exposed to frontend
3. **Encrypted storage** - Credentials encrypted at rest
4. **Session management** - Temporary sessions with automatic expiry
5. **Input validation** - All user inputs sanitized
6. **Least privilege** - RLS policies restrict data access

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- FedEx Developer Portal for API access
- Supabase for backend infrastructure
- shadcn/ui for beautiful components
- The open-source community

## ⚠️ Important Notes

- **Never commit API keys** to the repository
- **Always use environment variables** for configuration
- **Review security checklist** before deployment
- **Monitor API usage** to avoid unexpected charges

## 📞 Support

For issues and questions:
- Check the [Issues](https://github.com/Arthurkhan/art-shipping-calculator-pro/issues) page
- Review the deployment guide
- Contact support through the repository

---

Built with ❤️ for the art shipping community
