# Smart Shopping List

A Progressive Web App (PWA) for managing your shopping list, built with Next.js and Material-UI (MUI).

## Features

- ✅ Add, complete, and delete shopping items
- 💾 Local storage persistence - your list is saved automatically
- 📱 Progressive Web App - installable on mobile and desktop
- 🎨 Material Design UI with Material-UI components
- 🌐 Offline support with service worker
- 📲 Responsive design for all screen sizes

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: Material-UI (MUI)
- **Language**: TypeScript
- **PWA**: next-pwa
- **Deployment**: GitHub Pages

## Development

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

```bash
npm install
```

### Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for production

```bash
npm run build
```

The built files will be in the `out` directory.

## Deployment

This app is configured to deploy to GitHub Pages automatically when changes are pushed to the main branch.

### Manual Deployment

1. Build the project: `npm run build`
2. The static files in the `out` directory can be deployed to any static hosting service

## Usage

1. **Add Item**: Click the blue '+' button at the bottom right
2. **Complete Item**: Click on an item to mark it as completed
3. **Delete Item**: Click the trash icon next to an item
4. **Clear Completed**: Click the broom icon in the top right to remove all completed items

## License

ISC
