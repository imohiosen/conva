This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment.

### Workflows

- **Continuous Integration (`ci.yml`)**: Runs on all pushes to `main` and `develop` branches and pull requests. Executes tests, lint checks, and builds the application.

- **Dev Deployment (`dev-deploy.yml`)**: Automatically deploys to the development environment when changes are pushed to the `develop` branch.

- **Production Deployment (`prod-deploy.yml`)**: Deploys to production when changes are pushed to the `main` branch or when a new version tag is created.

- **PR Preview (`pr-preview.yml`)**: Creates a temporary preview environment for each pull request to easily test changes.

- **Cleanup Preview (`cleanup-preview.yml`)**: Cleans up preview environments when pull requests are closed.

### Environment Variables

The following secrets need to be set in GitHub:

- `DOCKER_REGISTRY`: URL of your Docker registry
- `DOCKER_USERNAME`: Username for Docker registry
- `DOCKER_PASSWORD`: Password for Docker registry
- `KUBE_CONFIG_DEV`: Kubernetes config for dev environment
- `KUBE_CONFIG_PROD`: Kubernetes config for production environment
- `DEV_API_URL`, `PROD_API_URL`: API URLs for each environment
- `DEV_DATABASE_URL`, `PROD_DATABASE_URL`: Database connection strings
- `DEV_CACHE_HOST`, `PROD_CACHE_HOST`: Redis host addresses
- `DEV_CACHE_PORT`, `PROD_CACHE_PORT`: Redis port numbers
- `SLACK_WEBHOOK`: Webhook for Slack notifications

### Deployment Process

1. Code is pushed to a branch
2. CI runs tests and builds the application
3. For `develop` branch, automatic deployment to dev environment
4. For `main` branch or version tags, automatic deployment to production
5. For PRs, a preview environment is created for testing
