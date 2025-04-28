# SOPIA Bundle Starter Pack

A starter pack for developing bundles for the SOPIA program. Built with React, TypeScript, and HeroUI.

## 🚀 Key Features

- Modern web application based on React 18 + TypeScript
- Integrated HeroUI component library
- Fast development environment using Vite
- Database management with Prisma
- Express-based backend server
- Worker process support

## 📦 Project Structure

```
apps/
├── background/    # Backend server (Express)
├── views/         # Frontend (React + TypeScript)
└── worker/        # Worker process
```

## 🛠️ Development Environment Setup

### Prerequisites

- Node.js 18 or higher
- pnpm 10.10.0 or higher

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## 🔧 Key Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Generate database migrations
pnpm db:generate

# Run linting
pnpm lint
```

## 📚 Main Technologies Used

- **Frontend**
  - React 18
  - TypeScript
  - HeroUI
  - React Router
  - React Query
  - Zustand (State Management)
  - Tailwind CSS

- **Backend**
  - Express
  - Prisma
  - Winston (Logging)

- **Build Tools**
  - Vite
  - Rspack
  - SWC

## 🔍 Debugging

In development mode, the `debug` option in `package.bundle.json` is enabled for easier debugging.

## 📝 License

MIT License
