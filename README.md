# CoomerLabs

<div align="center">
  <img src="https://github.com/user-attachments/assets/c5e3c0fe-122c-424f-8d8d-90d516c80a4f" alt="CoomerLabs Hero" width="800">
  
  [![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Electron](https://img.shields.io/badge/Electron-191970?logo=Electron&logoColor=white)](https://www.electronjs.org/)
  [![TanStack](https://img.shields.io/badge/TanStack-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/)
</div>

## 🌟 Open-Source Media Management Platform

CoomerLabs is a high-performance, open-source desktop application built with modern web technologies. It serves as a comprehensive media management and viewing platform, demonstrating advanced optimization techniques and architectural patterns for resource-intensive applications.

**This project is purely educational and experimental.** We do not host, distribute, or support any content. The application only fetches publicly available data from third-party platforms. Please contact `aiwag@duck.com` for any concerns.

## ✨ Key Features

### 🎯 Multi-Platform Integration
- **CamViewer**: Real-time multi-stream monitoring with advanced layout controls
- **RedGifs Explorer**: High-performance GIF discovery with 4K support
- **Wallheaven**: Ultra-high resolution wallpaper management
- **Creator Archive**: Unified access to creator content platforms
- **Fapello Collections**: Premium content galleries with infinite scroll
- **JavTube**: Advanced video streaming with dynamic URL extraction

### ⚡ Performance Excellence
Our performance optimizations deliver tangible improvements:
- **50-70% reduction** in CPU usage with multiple streams
- **30% reduction** in memory consumption
- **60-70% fewer** component re-renders
- **Advanced memoization** patterns throughout the codebase
- **Throttled webview injection** scripts for efficient resource usage
- **Smart layout calculations** with memoization

### 🏗️ Technical Architecture
- **TypeScript-first** codebase for type safety
- **Electron** for cross-platform desktop deployment
- **TanStack Router** with file-based routing
- **React Query** for intelligent data fetching and caching
- **Zustand** for efficient state management
- **Framer Motion** for smooth animations
- **Radix UI** for accessible components
- **Tailwind CSS** for utility-first styling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/aiwag/coomerlabs.git
cd coomerlabs

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run make
```

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Electron Main Process                        │
│  • Window management                                           │
│  • IPC communication                                           │
│  • Native OS integration                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    React Renderer Process                       │
│  • TanStack Router (file-based routing)                        │
│  • React Query (data fetching & caching)                       │
│  • Zustand (state management)                                  │
│  • Framer Motion (animations)                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Component Modules                           │
│  • CamViewer (multi-stream with webviews)                       │
│  • Content explorers (RedGifs, Fapello, etc.)                   │
│  • Shared UI components (Radix UI + Tailwind)                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Performance Benchmarks

| Metric | Before Optimization | After Optimization | Improvement |
|--------|-------------------|-------------------|-------------|
| 1 Stream CPU | 8-12% | 6-9% | ~25% ↓ |
| 5 Streams CPU | 35-45% | 20-28% | ~40% ↓ |
| 10 Streams CPU | 70-85% | 30-45% | ~50% ↓ |
| Memory (10 streams) | 1.2-1.5GB | 0.8-1.1GB | ~30% ↓ |
| Component Renders | 12-18/sec | 3-6/sec | ~70% ↓ |

## 🧪 Testing & Quality

### Comprehensive Test Suite
- **Unit Tests**: Vitest for component and utility testing
- **E2E Tests**: Playwright for full application testing
- **Type Safety**: Full TypeScript coverage
- **Linting**: ESLint + Prettier for code consistency

### CI/CD Pipeline
- **GitHub Actions** for automated testing
- **Multi-platform builds** (Windows, macOS, Linux)
- **Automated dependency updates** via Dependabot
- **Code quality checks** on every PR

```bash
# Run all tests
npm run test:all

# Run unit tests only
npm run test:unit

# Run E2E tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format:write
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── camviewer/      # Multi-stream viewer
│   ├── redgifs/        # GIF explorer
│   ├── fapello/        # Gallery viewer
│   └── ui/             # Shared UI components
├── services/           # API services
├── hooks/              # Custom React hooks
├── stores/             # Zustand stores
├── routes/             # TanStack Router routes
├── lib/                # Utility libraries
├── styles/             # CSS/Tailwind styles
└── localization/       # i18n configuration
```

## 🔧 Development Environment

### Environment Variables

Create a `.env` file in the root:

```env
# API Configuration
VITE_API_BASE_URL=https://www.chaturbate.com
VITE_CB_BASE_URL=https://www.chaturbate.com
```

### Available Scripts

```json
{
  "start": "electron-forge start",
  "package": "electron-forge package",
  "make": "electron-forge make",
  "publish": "electron-forge publish",
  "lint": "eslint .",
  "format": "prettier --check .",
  "format:write": "prettier --write .",
  "test": "vitest run",
  "test:watch": "vitest watch",
  "test:unit": "vitest",
  "test:e2e": "playwright test",
  "test:all": "vitest run && playwright test"
}
```

## 🎨 UI/UX Features

- **Dark Theme**: Elegant dark mode with smooth transitions
- **Responsive Design**: Optimized for all screen sizes
- **Micro-interactions**: Subtle animations for enhanced UX
- **Keyboard Shortcuts**: Productivity shortcuts for power users
- **Accessibility**: WCAG compliant with screen reader support
- **Performance**: Lazy loading and virtualization for smooth scrolling

## 🌐 Platform Modules

### CamViewer
- Multi-stream viewing with customizable grid layouts
- Stream quality controls and chat integration
- Real-time notifications and status monitoring
- Advanced performance optimizations for 10+ streams

### Content Explorers
- **RedGifs**: Advanced search, 4K support, intelligent caching
- **Fapello**: Infinite scroll galleries, bulk loading
- **Wallheaven**: 8K wallpaper support, smart categorization
- **Creator Archive**: Cross-platform content aggregation
- **JavTube**: Dynamic URL extraction, premium player integration

## 🔮 Performance Engineering

Our performance optimizations are documented in detail:

- [`PERFORMANCE_SUMMARY.md`](PERFORMANCE_SUMMARY.md) - Complete benchmarks
- [`PERFORMANCE_IMPROVEMENTS.md`](PERFORMANCE_IMPROVEMENTS.md) - Technical implementation
- [`ARCHITECTURE_OPTIMIZATION.md`](ARCHITECTURE_OPTIMIZATION.md) - System architecture

Key techniques implemented:
- **React.memo** with custom comparison functions
- **useCallback** and **useMemo** for reference stability
- **Throttled observers** for efficient DOM monitoring
- **Partition isolation** for memory management
- **Canvas optimization** for motion detection

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Quality Standards
- All code must pass TypeScript compilation
- Unit tests required for new features
- Follow existing code style and patterns
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TanStack](https://tanstack.com/) for amazing React libraries
- [Electron](https://www.electronjs.org/) for cross-platform development
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) for beautiful animations
- [Radix UI](https://www.radix-ui.com/) for accessible components
- All content providers for their platforms

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/aiwag/coomerlabs/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aiwag/coomerlabs/discussions)
- **Documentation**: [Wiki](https://github.com/aiwag/coomerlabs/wiki)
- **Email**: aiwag@duck.com

---

<div align="center">
  <p>Made with ❤️ by the CoomerLabs team</p>
  <p><em>Built with passion for open-source and performance excellence</em></p>
</div>