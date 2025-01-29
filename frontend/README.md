# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
# Frontend Documentation

## Setup & Installation
```bash
npm install
npm run dev
```

## Project Structure
- `/src/components`: Reusable UI components
- `/src/pages`: Application pages/routes
- `/src/api`: API client and services
- `/src/context`: React context providers
- `/src/styles`: CSS and theme files

## Key Features
1. Real-time order updates
2. Secure authentication
3. Trade history
4. Dispute management
5. Notifications system

## Components
- `Header`: Navigation and user status
- `TradeForm`: Order creation interface
- `NotificationBell`: Real-time alerts
- `ProtectedRoute`: Auth route wrapper

## State Management
Using React Context for:
- User authentication
- Notifications
- Theme preferences

## API Integration
See `src/api/apiClient.js` for API endpoints integration.

## Styling
- Tailwind CSS for utility classes
- Custom theme variables
- Responsive design
