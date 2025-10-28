# Implementation Plan

- [x] 1. Set up Next.js project structure and core dependencies
  - Initialize Next.js 15 project with App Router
  - Install and configure essential dependencies (Mapbox GL JS, Supabase, SCSS)
  - Set up project folder structure and configuration files
  - Configure development environment and build scripts
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Implement sun calculation engine
- [x] 2.1 Create sun position calculation module
  - Implement NOAA Solar Position Algorithm for azimuth and elevation calculations
  - Add functions for sunrise, sunset, and solar noon calculations
  - Create utility functions for coordinate validation and date handling
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.5_

- [x] 2.2 Implement sun times calculation service
  - Add golden hour and blue hour timing calculations
  - Implement twilight period calculations (civil, nautical, astronomical)
  - Create sun path generation for full day trajectory
  - _Requirements: 1.3, 1.4, 3.2, 4.2_

- [x] 2.3 Add timezone and DST handling
  - Integrate timezone lookup service for coordinates
  - Implement DST-aware time conversions
  - Add support for manual timezone selection
  - _Requirements: 1.5, 2.5_

- [x] 2.4 Create unit tests for sun calculations
  - Test accuracy against NOAA reference data for various locations
  - Add edge case tests for polar regions and extreme dates
  - Validate DST transition handling
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 3. Set up Supabase and data management
- [ ] 3.1 Configure Supabase project and authentication
  - Set up Supabase project with database and auth
  - Create database tables for users, locations, and notifications
  - Implement Supabase client configuration
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 3.2 Implement geolocation service
  - Add browser geolocation API with permission handling
  - Create manual location input functionality
  - Implement location accuracy validation and fallbacks
  - _Requirements: 3.4, 3.5_

- [ ] 3.3 Create saved locations management
  - Build location storage system with Supabase
  - Implement CRUD operations for saved locations
  - Add offline caching with localStorage
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 3.4 Add location service tests
  - Test browser geolocation API and fallback mechanisms
  - Validate Supabase location storage and retrieval operations
  - Test coordinate validation and offline caching
  - _Requirements: 3.4, 3.5, 6.1, 6.2_

- [ ] 4. Create core UI components and routing
- [ ] 4.1 Set up Next.js routing and layout
  - Configure App Router with main page routes
  - Create layout components and navigation structure
  - Set up SCSS modules and global styles
  - Create responsive design system and components
  - _Requirements: All UI-related requirements_

- [ ] 4.2 Build home screen with sun summary
  - Create current location display component
  - Add today's sun times summary card
  - Implement current sun position display
  - Add quick access to saved locations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_

- [ ] 4.3 Implement time scrubbing component
  - Create interactive time slider with smooth animation
  - Add time display and selection controls
  - Integrate with sun position calculations for real-time updates
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Build interactive map functionality
- [ ] 5.1 Integrate Mapbox GL JS and basic map display
  - Set up Mapbox GL JS and API key configuration
  - Create responsive map component with location markers
  - Add map style selection and touch/mouse controls
  - _Requirements: 3.1, 3.4, 3.5_

- [ ] 5.2 Implement sun path visualization
  - Create sun path overlay rendering on map
  - Add interactive sun path with time markers
  - Implement tap-to-select time functionality on path
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 5.3 Connect map with time scrubber
  - Synchronize map sun position with time scrubber
  - Update sun path visualization when date changes
  - Add smooth transitions for time-based updates
  - _Requirements: 3.2, 3.3, 4.2, 4.5_

- [ ] 6. Implement compass overlay and device orientation
- [ ] 6.1 Set up device orientation API
  - Configure Device Orientation API with HTTPS requirements
  - Create compass component with permission handling
  - Add fallback static compass for unsupported devices
  - _Requirements: 5.1, 5.5_

- [ ] 6.2 Build sun direction compass overlay
  - Implement sun azimuth visualization on digital compass
  - Add sun position indicator with current angle display
  - Create visual indicators for below-horizon sun positions
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 6.3 Add compass calibration system
  - Create calibration instructions and UI flow
  - Implement device orientation tracking and magnetic declination correction
  - Add calibration validation and accuracy indicators
  - _Requirements: 5.2, 5.3_

- [ ] 7. Build web push notification system
- [ ] 7.1 Implement web push notifications
  - Set up Web Push API with service worker
  - Create notification scheduling for golden hour reminders
  - Add support for custom timing intervals and browser permissions
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 7.2 Create notification management UI
  - Build notification settings screen
  - Add per-location notification controls
  - Implement notification preview and testing
  - _Requirements: 7.4, 7.5_

- [ ] 8. Add shadow calculation features
- [ ] 8.1 Implement shadow length calculator
  - Create shadow calculation algorithms based on sun elevation
  - Add object height input with unit conversion
  - Display shadow length and direction visualization
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 8.2 Integrate shadow calculator with main UI
  - Add shadow calculator to home screen
  - Connect with time scrubber for dynamic shadow updates
  - Create shadow visualization overlay for map view
  - _Requirements: 8.1, 8.4, 8.5_

- [ ] 9. Implement settings and preferences
- [ ] 9.1 Create settings screen
  - Build user preferences UI (units, time format, map style)
  - Add notification preferences management
  - Implement data export and import functionality
  - _Requirements: 6.5, 7.3, 7.5, 8.3_

- [ ] 9.2 Add app configuration and help
  - Create about screen with app information
  - Add help documentation and tutorials
  - Implement feedback and support contact options
  - _Requirements: General usability requirements_

- [ ] 10. Polish and optimization
- [ ] 10.1 Implement error handling and edge cases
  - Add comprehensive error handling for all services
  - Create user-friendly error messages and recovery options
  - Handle network connectivity issues and offline mode with localStorage
  - _Requirements: All requirements need proper error handling_

- [ ] 10.2 Performance optimization and PWA features
  - Optimize performance for continuous device orientation tracking
  - Implement service worker for offline functionality
  - Add PWA manifest and install prompts for mobile devices
  - Add loading states and smooth animations
  - _Requirements: Performance aspects of all requirements_

- [ ] 10.3 End-to-end testing and validation
  - Create integration tests for complete user workflows
  - Test app functionality across different devices and OS versions
  - Validate sun calculation accuracy with field testing
  - _Requirements: All requirements validation_

- [ ] 11. Implement 3D visualization with human model
- [ ] 11.1 Set up Three.js and 3D rendering engine
  - Install and configure Three.js for WebGL rendering
  - Create 3D scene setup with camera, renderer, and controls
  - Implement responsive 3D viewport with touch/mouse controls
  - _Requirements: 9.1, 9.5_

- [ ] 11.2 Create and integrate human 3D model
  - Source or create realistic human 3D model in GLTF format
  - Implement model loading and positioning in 3D scene
  - Add model animation capabilities for different poses
  - _Requirements: 9.1, 9.2_

- [ ] 11.3 Implement realistic sun lighting system
  - Create directional light source based on sun position calculations
  - Implement physically-based rendering (PBR) materials for realistic lighting
  - Add dynamic shadow casting from human model based on sun elevation
  - _Requirements: 9.2, 9.3, 9.4_

- [ ] 11.4 Connect 3D visualization with sun calculations
  - Integrate 3D lighting with existing sun position calculations
  - Update 3D scene lighting in real-time when time scrubber changes
  - Synchronize 3D view with map and compass components
  - _Requirements: 9.4, 9.5_

- [ ] 12. Build future sun prediction system
- [ ] 12.1 Implement prediction calculation engine
  - Create service to calculate sun positions for future dates
  - Generate sun path predictions up to one year in advance
  - Implement seasonal variation calculations and trends
  - _Requirements: 10.1, 10.4_

- [ ] 12.2 Create prediction timeline interface
  - Build interactive timeline for selecting future dates
  - Add comparison view between current and future lighting
  - Implement prediction data visualization and charts
  - _Requirements: 10.2, 10.3, 10.5_

- [ ] 12.3 Integrate predictions with 3D visualization
  - Display future lighting conditions in 3D human model
  - Add animation between current and predicted lighting states
  - Create side-by-side comparison mode for different dates
  - _Requirements: 10.2, 10.3, 10.5_

- [ ] 12.4 Add prediction accuracy validation
  - Test prediction accuracy against historical sun data
  - Implement confidence intervals for long-term predictions
  - Add weather integration for more accurate lighting predictions
  - _Requirements: 10.1, 10.4_

- [ ] 13. Final integration and deployment preparation
- [ ] 13.1 Complete web app integration
  - Connect all features including 3D visualization and predictions
  - Implement final UI polish and web accessibility improvements
  - Add PWA icons, manifest, and meta tags for social sharing
  - _Requirements: Complete user experience across all requirements_

- [ ] 13.2 Prepare for web deployment
  - Configure Next.js 15 build settings and environment variables
  - Set up Vercel/Netlify deployment pipeline with 3D asset optimization
  - Configure Supabase production environment
  - Create deployment documentation and release notes
  - _Requirements: Deployment readiness for all implemented features_