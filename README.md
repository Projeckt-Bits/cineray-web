# Sun Tracking App

A comprehensive solar position calculator and visualization tool built with Next.js, designed for photographers, filmmakers, and outdoor enthusiasts to plan activities around optimal lighting conditions.

## Features

- **Real-time Sun Position Calculations**: Accurate sun azimuth and elevation using NOAA algorithms
- **Interactive Map Visualization**: Mapbox integration with sun path overlays
- **Device Compass Integration**: Use device orientation to show sun direction
- **Golden Hour & Blue Hour Timing**: Precise calculations for optimal photography times
- **Shadow Length Calculator**: Calculate shadow lengths and directions
- **Location Management**: Save and manage multiple locations
- **Push Notifications**: Get notified before golden hour
- **Progressive Web App**: Installable with offline functionality

## Technology Stack

- **Frontend**: Next.js 16 with App Router
- **Styling**: SCSS modules with CSS custom properties
- **Maps**: Mapbox GL JS
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **PWA**: Service Worker with offline caching
- **Notifications**: Web Push API

## Getting Started

### Prerequisites

- Node.js 18+ and npm 8+
- Mapbox account and API key
- Supabase project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sun-tracking-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── solar-calculator.js
│   ├── location-manager.js
│   └── shadow-calculator.js
├── hooks/                 # Custom React hooks
├── styles/                # SCSS modules and variables
│   ├── variables.scss
│   └── mixins.scss
└── utils/                 # Utility functions

public/
├── manifest.json          # PWA manifest
├── sw.js                  # Service worker
└── icons/                 # PWA icons
```

## API Keys Setup

### Mapbox
1. Create account at [mapbox.com](https://mapbox.com)
2. Get your access token from the dashboard
3. Add to `.env.local` as `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

### Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from settings
3. Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Development Guidelines

- Follow the component-based architecture
- Use SCSS modules for styling
- Implement proper error handling
- Write tests for core functionality
- Ensure mobile responsiveness
- Follow accessibility best practices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- NOAA for solar position algorithms
- Mapbox for mapping services
- Supabase for backend services