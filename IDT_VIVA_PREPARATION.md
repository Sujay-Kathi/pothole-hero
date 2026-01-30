# IDT Project Viva - Written Component Preparation
## Pothole Hero - Final External Examination

---

## 1. Aim of the Project

The aim of Pothole Hero is to develop a citizen-centric mobile and web application that empowers residents of Bangalore to report road potholes directly to civic authorities (BBMP). The application streamlines the complaint process by enabling users to capture pothole images, automatically detect GPS locations, analyze severity using AI, and generate pre-filled complaint emails to municipal authorities. Ultimately, the project aims to improve road safety, increase civic accountability, and create a transparent, data-driven system for tracking pothole repairs across the city.

---

## 2. Introduction – Background and Motivation

Road infrastructure in Indian cities, particularly Bangalore, suffers from a persistent pothole problem that causes vehicle damage, accidents, and commuter inconvenience. Traditional complaint mechanisms are cumbersome, requiring citizens to navigate complex government portals or visit offices in person, leading to underreporting and delayed repairs. This project was motivated by the need to bridge the gap between citizens and civic authorities through technology. By leveraging mobile accessibility, GPS tracking, AI-powered analysis, and real-time data visualization, Pothole Hero transforms passive citizens into active contributors to urban road maintenance, creating a crowdsourced solution to a citywide problem.

---

## 3. Problem Identified and Proposed Solution

### Problem Identified:
- Citizens struggle to report potholes due to complex, time-consuming government reporting processes
- Lack of transparency in pothole repair status and civic accountability
- No centralized database to track pothole hotspots and prioritize repairs
- Authorities lack real-time data to allocate road maintenance resources efficiently

### Proposed Solution:
Pothole Hero provides a simple three-step reporting process: (1) Capture a photo using the in-app camera, (2) Automatically detect location via GPS with reverse geocoding for address details, (3) Submit the report with AI-analyzed severity classification. The app automatically generates pre-filled emails to BBMP authorities, stores reports in a cloud database (Supabase/PostgreSQL), and provides a public dashboard with interactive maps, analytics charts, and status tracking. Community features like upvoting and leaderboards encourage user engagement, while admin tools enable authorities to manage and update report statuses efficiently.

---

## 4. System Architecture / Flowchart / Blueprint

### High-Level Architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         POTHOLE HERO ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│   │ Flutter App  │    │  React Web   │    │   Admin Dashboard    │  │
│   │   (Mobile)   │    │  (Desktop)   │    │   (Management)       │  │
│   └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘  │
│          │                   │                       │              │
│          └───────────────────┼───────────────────────┘              │
│                              │                                      │
│                    ┌─────────▼─────────┐                            │
│                    │   Supabase BaaS   │                            │
│                    │  (Backend-as-a-   │                            │
│                    │     Service)      │                            │
│                    └─────────┬─────────┘                            │
│          ┌───────────────────┼───────────────────┐                  │
│          │                   │                   │                  │
│   ┌──────▼──────┐    ┌───────▼──────┐   ┌───────▼──────────┐        │
│   │ PostgreSQL  │    │    Cloud     │   │  Authentication  │        │
│   │  Database   │    │   Storage    │   │  (Anonymous/     │        │
│   │ (Reports)   │    │  (Images)    │   │   Device-based)  │        │
│   └─────────────┘    └──────────────┘   └──────────────────┘        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                          DATA FLOW                                   │
│  User → Camera → GPS → AI Severity → Supabase → Email → Authority   │
│                              ↓                                       │
│                    Dashboard ← Analytics ← Database                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Components:
- **Frontend:** Flutter (Mobile) + React/Vite (Web) with OpenStreetMap integration
- **Backend:** Supabase providing PostgreSQL database, cloud storage, and authentication
- **AI Layer:** Google ML Kit for on-device pothole severity detection (Low/Medium/High/Critical)
- **Services:** SupabaseService, AISeverityService, AnalyticsService, CommunityService

### Technology Stack Summary:
| Layer | Technology |
|-------|------------|
| Mobile App | Flutter SDK, Dart |
| Web App | React, TypeScript, Vite |
| Database | PostgreSQL (via Supabase) |
| Storage | Supabase Cloud Storage |
| Maps | OpenStreetMap, flutter_map, Leaflet |
| AI/ML | Google ML Kit Image Labeling |
| State Management | flutter_bloc (Mobile), React Query (Web) |

---

## 5. Conclusion – Outcomes and Learning

### Outcomes:
Pothole Hero successfully demonstrates a functional, user-friendly civic engagement platform. The application features a complete pothole reporting workflow with camera integration, GPS-based location detection, AI-powered severity classification, and automated email generation to BBMP. The project includes an analytics dashboard with interactive maps, status tracking, area hotspot identification, and resolution trend analysis. Community features such as upvoting and leaderboards promote sustained user engagement.

### Key Learnings:
- Cross-platform development using Flutter and React for mobile-web code reusability
- Integration of Backend-as-a-Service (Supabase) for rapid, scalable development
- Implementation of on-device machine learning for image analysis
- Database design with Row Level Security (RLS) for data protection
- Importance of user experience (UX) in civic technology adoption
- Real-world application of the BLoC pattern for state management

### Future Scope:
The project can be extended with official government API integration, multi-city deployment, image-based duplicate detection, and real-time notifications when potholes are resolved.

---

## 💡 Viva Tips

1. **Be ready to explain** the tech stack choices (Why Flutter? Why Supabase?)
2. **Practice the flowchart** - be able to draw it on paper if asked
3. **Know your AI integration** - explain how ML Kit analyzes pothole severity
4. **Prepare statistics** - mention number of screens (8), services (6), and key packages used
5. **Highlight unique features** - AI severity detection, automatic email generation, anonymous device-based auth

---

## Quick Reference - Project Statistics

| Metric | Count |
|--------|-------|
| App Screens | 8 (Splash, Home, Report, Dashboard, City Dashboard, Profile, Admin Login, Camera) |
| Services Created | 6 (Supabase, AI Severity, Analytics, Community, Device, Share) |
| Database Tables | pothole_reports, pothole_upvotes, device_users |
| Key Packages | 15+ (flutter_map, geolocator, camera, google_mlkit, flutter_bloc, etc.) |
| Platforms | Android Mobile + Web Dashboard |

---

*Prepared for IDT Final External Viva - January 2026*
