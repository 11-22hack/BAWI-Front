# 3D Pathfinding & Auto StreetView Video Generator (Frontend)

Frontend application for generating 3D pathfinding videos with Google StreetView integration.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **Axios** for HTTP requests
- **Google Maps JavaScript API** for maps and places autocomplete

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Google Maps API key to `.env`:
```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
VITE_API_BASE_URL=https://hackathon-back.croksuter.com
```

4. Start development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── api/           # API integration files
├── components/    # Reusable React components
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── types/         # TypeScript type definitions
├── App.tsx        # Main app component with routing
├── main.tsx       # Entry point
└── index.css      # Global styles
```

## Features

- **Home Page**: Input start/end locations with Google Places Autocomplete
- **Preview Page**: Display route on map with path information
- **Status Page**: Real-time progress tracking for video generation
- **Result Page**: Video player with download functionality

## API Endpoints

- `POST /route` - Get route between two points
- `POST /generate` - Request video generation
- `GET /result?id=xxx` - Get generation status and result

