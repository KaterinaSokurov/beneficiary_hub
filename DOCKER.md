# Docker Deployment Guide

This guide explains how to deploy the Beneficiary Hub application using Docker and Docker Compose. The application is optimized for deployment on Coolify or similar platforms.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd beneficiary_hub
```

### 2. Configure Environment Variables

Copy the example environment file and update with your actual values:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase and Google Maps credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 3. Run with Docker Compose

#### Production Mode

```bash
# Build and start the production container
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The application will be available at `http://localhost:3000`

### 4. Deploying to Coolify

Coolify will automatically detect the Dockerfile and docker-compose.yml. Simply:

1. Connect your Git repository to Coolify
2. Set the environment variables in Coolify dashboard
3. Deploy the application

Coolify will handle:
- Building the Docker image
- Running the container
- SSL/TLS certificates
- Domain configuration
- Load balancing
- Health checks

## Docker Commands

### Build Images

```bash
# Build production image
docker-compose build app
```

### Start/Stop Containers

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs

```bash
# View all logs
docker-compose logs

# View logs for specific service
docker-compose logs app

# Follow logs in real-time
docker-compose logs -f app
```

### Execute Commands in Container

```bash
# Access container shell
docker-compose exec app sh

# Check application status
docker-compose exec app ps
```

### Rebuild Container

```bash
# Rebuild without cache
docker-compose build --no-cache app

# Rebuild and restart
docker-compose up -d --build app
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `NEXT_PUBLIC_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGc...` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | `AIzaSy...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `PORT` | Application port | `3000` |
| `HOSTNAME` | Server hostname | `0.0.0.0` |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | `1` |

## Multi-Stage Dockerfile

The Dockerfile uses multi-stage builds for optimization:

1. **base**: Base Node.js Alpine image
2. **deps**: Installs dependencies
3. **builder**: Builds the production application
4. **production**: Minimal production runtime with non-root user

## Production Optimization

The production build includes:

- Multi-stage build for smaller image size
- Non-root user for security
- Health checks for container monitoring
- Standalone output for minimal dependencies
- Optimized caching layers

## Container Details

- **Port**: 3000
- **User**: nextjs (non-root)
- **Base Image**: node:20-alpine
- **Health Check**: Enabled with 30s interval

## Health Checks

The production container includes a health check that:

- Checks every 30 seconds
- Times out after 10 seconds
- Retries 3 times before marking unhealthy
- Waits 40 seconds before first check

## Security Best Practices

1. **Never commit `.env.local`** - Contains sensitive credentials
2. **Use service role key server-side only** - Never expose to client
3. **Run as non-root user** - Production container uses `nextjs` user
4. **Keep dependencies updated** - Regularly update Docker base images
5. **Use `.dockerignore`** - Exclude unnecessary files from build

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
lsof -ti:3000 | xargs kill -9

# Or change port in docker-compose.yml
ports:
  - "3001:3000"
```

### Container Won't Start

```bash
# Check container logs
docker-compose logs app

# Check container status
docker-compose ps

# Restart container
docker-compose restart app
```

### Changes Not Reflected

```bash
# Rebuild the container
docker-compose up -d --build app
```

### Out of Disk Space

```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a --volumes
```

## Coolify Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production Supabase credentials
- [ ] Configure environment variables in Coolify
- [ ] Set up custom domain in Coolify
- [ ] Enable SSL/TLS (automatic with Coolify)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for Supabase
- [ ] Review resource limits in Coolify
- [ ] Test health checks
- [ ] Review security settings

## Production Deployment on Coolify

### Step-by-Step Guide

1. **Connect Repository**
   - Login to Coolify dashboard
   - Add new resource > Git Repository
   - Connect your GitHub/GitLab repository

2. **Configure Build Settings**
   - Coolify will auto-detect Dockerfile
   - Build pack: Docker
   - Port: 3000

3. **Set Environment Variables**
   In Coolify dashboard, add all required environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   NEXT_PUBLIC_SERVICE_ROLE_KEY=eyJhbGc...
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

4. **Configure Domain**
   - Add your custom domain
   - Coolify will automatically provision SSL

5. **Deploy**
   - Click Deploy
   - Monitor build logs
   - Check health status

6. **Post-Deployment**
   - Test all features
   - Monitor application logs
   - Set up auto-deploy on push (optional)

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker-compose build app

      - name: Run tests
        run: docker-compose run app npm test

      - name: Push to registry
        run: |
          docker tag beneficiary-hub:latest registry.example.com/beneficiary-hub:latest
          docker push registry.example.com/beneficiary-hub:latest
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Supabase Documentation](https://supabase.com/docs)

## Support

For issues related to Docker deployment, please check:

1. Container logs: `docker-compose logs`
2. Docker status: `docker-compose ps`
3. System resources: `docker stats`
4. Network connectivity: `docker network inspect beneficiary-hub-network`

---

Last Updated: 2025-01-26
Version: 1.0.0
