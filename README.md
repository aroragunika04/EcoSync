# EcoSync

EcoSync is a real-time e-waste collection and recycler coordination platform that connects communities with recyclers through smart cluster-based pickup systems. The platform enables users to log e-waste contributions, monitor live collection progress, track environmental impact, and participate in a connected recycling ecosystem powered by real-time synchronization.
Residents can contribute e-waste, monitor community collection progress, track environmental impact, and receive live pickup updates. Recyclers can monitor active collection zones, claim pickup requests, manage logistics, and complete verified pickup operations.

The platform focuses on creating a scalable and transparent recycling ecosystem using real-time data synchronization and role-based workflows.

---

# Core Features

## Resident System

* One-tap e-waste logging
* Real-time cluster progress tracking
* Community activity synchronization
* Live pickup status updates
* QR-based pickup verification
* Environmental impact analytics
* Badge and reward progression system
* Interactive Waste Guide

---

## Recycler System

* Recycler marketplace dashboard
* Live cluster monitoring map
* Pickup claim workflow
* Active pickup management
* Arrival scheduling system
* Pickup verification workflow
* Pickup completion and history tracking

---

# Real-Time Workflow

1. Residents contribute e-waste to their local cluster
2. Cluster threshold is monitored in real time
3. Pickup request becomes available in the recycler marketplace
4. Recycler claims the pickup request
5. Residents instantly receive live pickup updates
6. Recycler verifies and completes the pickup process
7. Cluster resets and begins a new recycling cycle

---

# Technology Stack

## Frontend

* React.js
* Vite
* CSS3

## Backend & Infrastructure

* Firebase Authentication
* Firestore Database
* Firestore Real-Time Listeners

## Additional Integrations

* QR Code Generation
* Interactive Map System
* Role-Based Authentication

---

# Real-Time Synchronization

EcoSync uses Firestore `onSnapshot()` listeners to provide instant updates across:

* cluster collection progress
* recycler assignments
* pickup scheduling
* community activity
* logistics workflow states

This creates a synchronized experience where recycler actions instantly update the resident side of the platform.

---

# Authentication System

The platform uses role-based authentication:

* Resident Users
* Recyclers

Each role has its own workflow, dashboard, and operational interface.

---

# Project Goal

EcoSync aims to improve e-waste collection efficiency by creating a scalable bridge between communities and recyclers while promoting sustainable disposal practices and environmental awareness through a connected digital ecosystem.

---
# Installation

```bash id="3q1dls"
git clone <repository-link>
cd ecosync
npm install
npm run dev
```
---

# Environment Variables

Create a `.env` file and add:

```env id="7jlwm5"
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```
---
## Live Deployment

- AWS EC2 Deployment: http://54.196.243.166

