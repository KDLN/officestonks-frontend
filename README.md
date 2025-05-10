# Office Stonks Frontend

This repository contains the React frontend for the Office Stonks multiplayer stock market game.

## Getting Started

1. **Install dependencies:**
   ```
   npm install
   ```

2. **Run the development server:**
   ```
   npm start
   ```

3. **Build for production:**
   ```
   npm run build
   ```

## Deployment

### Railway Deployment

This repository is configured for easy deployment on Railway:

1. Create a new project in Railway
2. Connect this repository
3. Railway will automatically build and deploy the frontend
4. The frontend will use the API URL specified in the `.env` file

### Environment Variables

The frontend connects to the backend API using the URL specified in the `.env` file:

```
REACT_APP_API_URL=https://web-copy-production-5b48.up.railway.app
```

Update this URL if your backend API is deployed at a different address.

## Features

- Real-time stock updates via WebSockets
- User authentication
- Stock trading interface
- Portfolio tracking
- Transaction history
- Leaderboard
- Chat system

## Project Structure

- `src/components/`: Reusable UI components
- `src/pages/`: Main application pages
- `src/services/`: API service functions
- `src/contexts/`: React context providers
- `src/hooks/`: Custom React hooks
- `src/utils/`: Utility functions

## Backend API

The backend API is deployed separately. Make sure to update the `REACT_APP_API_URL` in `.env` to point to your backend deployment.