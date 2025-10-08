# AIC CRM v5

Advanced Customer Relationship Management System built with Next.js 15.5.4, featuring comprehensive CRM functionality, AI-powered features, and enterprise integrations.

## 🚀 Features

### Core CRM
- **Companies & Contacts** - Complete customer management
- **Leads & Opportunities** - Sales pipeline tracking
- **Tickets & Projects** - Support and project management
- **Quotes & Orders** - Sales workflow automation
- **Email & Calendar** - Unified communication hub

### AI Integration
- **DeepSeek AI** - Primary AI for content generation
- **OpenAI Embeddings** - RAG (Retrieval Augmented Generation)
- **Product Copy Generation** - Greek & English descriptions

### Enterprise Integrations
- **SoftOne ERP** - Optional ERP integration with ANSI-1253 streaming
- **Microsoft Graph** - Email, Calendar, OneDrive integration
- **Google Workspace** - Gmail, Calendar, Drive integration
- **BunnyCDN** - File storage and backup system
- **Fonoster** - Telephony and call recording

### Technical Features
- **Role-Based Access Control** - ADMIN, MANAGER, USER, B2B roles
- **Multi-language Support** - Greek & English UI and PDFs
- **Redis & BullMQ** - Queues, cron jobs, and caching
- **MySQL Database** - Prisma ORM with full schema
- **Responsive Design** - Modern shadcn/ui components

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: Better-Auth
- **UI**: shadcn/ui + Tailwind CSS v4
- **State**: Redis + BullMQ
- **File Storage**: BunnyCDN
- **AI**: DeepSeek + OpenAI
- **Testing**: Vitest + Playwright

## 📋 Prerequisites

- Node.js 18.17.0+
- MySQL database
- Redis server
- BunnyCDN account
- (Optional) Microsoft Entra ID app
- (Optional) Google Cloud project
- (Optional) SoftOne ERP access

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd aic-crm-v5
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Database Setup**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. **Development**
   ```bash
   npm run dev
   ```

5. **Access Application**
   - Open http://localhost:3000
   - Login: admin@aic-crm.com / admin123

## 🔧 Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/database
DIRECT_URL=mysql://user:password@host:3306/database

# Redis
REDIS_URL=redis://default:password@host:6379

# Authentication
NEXTAUTH_SECRET=your-secret-key
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://localhost:3000

# BunnyCDN
BUNNY_STORAGE_ZONE=your-zone
BUNNY_ACCESS_KEY=your-access-key
BUNNY_CDN_PULL_ZONE=your-cdn-domain
```

### Optional Integrations

#### Microsoft Graph
```env
TENANT_ID=your-tenant-id
AUTH_MICROSOFT_ENTRA_ID_ID=your-client-id
AUTH_MICROSOFT_ENTRA_ID_SECRET=your-client-secret
GRAPH_TENANT_ID=${TENANT_ID}
GRAPH_CLIENT_ID=${AUTH_MICROSOFT_ENTRA_ID_ID}
GRAPH_CLIENT_SECRET=${AUTH_MICROSOFT_ENTRA_ID_SECRET}
```

#### Google OAuth
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### AI Services
```env
DEEPSEEK_API_KEY=your-deepseek-key
OPENAI_API_KEY=your-openai-key
```

#### SoftOne ERP
```env
SOFTONE_BASE_URL=https://your-softone-instance/s1services/JS
SOFTONE_USERNAME=your-username
SOFTONE_PASSWORD=your-password
```

## 📊 Database Schema

The application uses a comprehensive Prisma schema with the following main entities:

- **Users & Organizations** - User management, departments, work positions
- **CRM Core** - Companies, contacts, leads, opportunities
- **Products & Inventory** - Product catalog, branches, stock management
- **Sales** - Orders, quotes, order items
- **Support** - Tickets, ticket messages
- **Projects** - Project management, tasks
- **Communication** - Email threads, messages
- **Surveys** - Dynamic site surveys with multi-image support
- **Files** - File references with multiple storage providers
- **Configuration** - SoftOne endpoints, VAT rates, categories, brands

## 🔐 Authentication & Authorization

### Roles
- **ADMIN** - Full system access
- **MANAGER** - CRM and team management
- **USER** - Standard user access
- **B2B** - Customer portal access

### Authentication Methods
- Local email/password (bcrypt)
- Microsoft Entra ID (OIDC)
- Google OAuth

## 🔄 Background Jobs

The system uses BullMQ for background processing:

- **SLA Monitoring** - Ticket SLA checks every 5 minutes
- **SoftOne Sync** - Delta synchronization every 10 minutes
- **Email Reminders** - Automated email notifications
- **Calendar Reminders** - Meeting and deadline reminders
- **Backups** - Nightly database backups to BunnyCDN
- **Fonoster Events** - Call recording processing

## 📁 Project Structure

```
/app
  /(auth)           # Authentication pages
  /dashboard        # Role-aware dashboards
  /companies        # Company management
  /contacts         # Contact management
  /leads            # Lead management
  /opportunities    # Opportunity tracking
  /products         # Product catalog
  /orders           # Order management
  /quotes           # Quote generation
  /tickets          # Support tickets
  /projects         # Project management
  /emails           # Email client
  /calendar         # Calendar management
  /surveys          # Site surveys
  /settings         # System configuration
  /print            # PDF generation routes
  /api              # API routes

/components
  /ui               # shadcn/ui components
  /auth             # Authentication components
  /layout           # Layout components
  /dashboard        # Dashboard components

/lib
  /auth             # Authentication logic
  /db               # Database connection
  /redis            # Redis client and queues
  /bunny            # BunnyCDN integration
  /ai               # AI services
  /softone          # SoftOne ERP integration
  /graph            # Microsoft Graph
  /google           # Google services
  /jobs             # Background job processors
  /exports          # Export utilities

/prisma
  schema.prisma     # Database schema

/scripts
  seed.ts           # Database seeding
  ingest-kb.ts      # Knowledge base ingestion
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run e2e
```

### Test Coverage
The test suite covers:
- Authentication flows
- Core CRUD operations
- AI integrations
- Export functionality
- Role-based access control

## 📦 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Considerations
- Use connection pooling for MySQL
- Configure Redis for production
- Set up proper CORS policies
- Enable HTTPS in production
- Configure rate limiting
- Set up monitoring and logging

## 🔧 Maintenance

### Database Backups
- Automated nightly backups to BunnyCDN
- Manual backup trigger via admin interface
- Backup restoration guide in `/docs/backup-restore.md`

### SoftOne Integration
- Configure endpoints via admin interface
- Monitor sync status and errors
- Handle ANSI-1253 encoding properly

### Performance Optimization
- Enable Redis caching
- Optimize database queries
- Use CDN for static assets
- Implement proper indexing

## 📚 Documentation

- **API Documentation** - Available at `/api/docs` (when implemented)
- **User Guide** - In-app help system
- **Admin Guide** - System administration documentation
- **Integration Guides** - External service setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ using Next.js, Prisma, and modern web technologies.**
