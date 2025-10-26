# Beneficiary Hub - School Donation Management System

A comprehensive web-based platform connecting donors with schools in need, facilitating transparent and efficient donation management for educational institutions in Zimbabwe.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [System Diagrams](#system-diagrams)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [User Roles](#user-roles)
- [Workflows](#workflows)
- [Security](#security)
- [Deployment](#deployment)

## Overview

Beneficiary Hub is a full-stack web application designed to streamline the process of connecting generous donors with schools in need of resources. The platform provides a transparent, efficient, and secure environment for managing donations, from listing to delivery.

### Key Objectives

- **Transparency**: Track donations from listing through delivery
- **Efficiency**: Streamline the matching process between donors and schools
- **Accountability**: Multi-level approval system with comprehensive audit trails
- **Accessibility**: User-friendly interface for all stakeholders

## Features

### For Donors
✅ Comprehensive donor registration with verification  
✅ Create and manage donation listings  
✅ Upload photos and supporting documents  
✅ Track donation status in real-time  
✅ View donation history and impact  
✅ Specify delivery preferences and radius  
✅ Support for both individual and organizational donors

### For Schools
✅ School registration with detailed information  
✅ Browse available donations  
✅ Submit resource applications  
✅ Track application status  
✅ View allocated resources  
✅ Provide feedback on received donations

### For Administrators
✅ Approve/reject school registrations  
✅ Verify donor credentials  
✅ Review and approve donation listings  
✅ View comprehensive donor information  
✅ Match donations with school needs  
✅ Monitor system activity  
✅ Generate reports and analytics

### For Approvers
✅ Review resource applications  
✅ Approve/reject requests  
✅ Add review notes  
✅ Track approval workflow

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  Next.js 16 + React + TypeScript + Tailwind CSS + shadcn/ui │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                     API/Server Layer                         │
│              Next.js API Routes + Server Actions             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ PostgREST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Database Layer                            │
│              Supabase (PostgreSQL + Auth + Storage)          │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
beneficiary_hub/
├── app/                          # Next.js App Router
│   ├── auth/                     # Authentication routes
│   │   ├── login/
│   │   ├── register-donor/
│   │   └── register-school/
│   ├── admin/                    # Admin dashboard
│   │   ├── donations/            # Donation management
│   │   ├── donors/               # Donor approval
│   │   └── schools/              # School approval
│   ├── donor/                    # Donor portal
│   │   ├── donations/            # Manage donations
│   │   └── pending/              # Pending verification
│   ├── school/                   # School portal
│   │   ├── applications/         # Resource applications
│   │   └── browse/               # Browse donations
│   ├── approver/                 # Approver dashboard
│   └── actions/                  # Server Actions
│       ├── donor-registration.ts
│       ├── manage-donations.ts
│       └── school-registration.ts
├── components/                   # Reusable components
│   ├── admin/                    # Admin-specific components
│   │   ├── donor-details-modal.tsx
│   │   └── donation-approval-actions.tsx
│   ├── ui/                       # shadcn/ui components
│   └── dashboard-layout.tsx      # Shared layout
├── lib/                          # Utilities and helpers
│   └── supabase/
│       └── server.ts             # Supabase clients
└── types/                        # TypeScript type definitions
    └── database.types.ts         # Generated DB types
```

## Database Schema

### Entity-Relationship Diagram (ERD)

```
┌─────────────────────┐
│     auth.users      │
│─────────────────────│
│ id (PK)             │
│ email               │
│ created_at          │
└──────┬──────────────┘
       │
       │ 1:1
       │
┌──────▼──────────────┐
│     profiles        │
│─────────────────────│
│ id (PK, FK)         │──────────┐
│ email               │          │
│ full_name           │          │
│ role (enum)         │          │
│ is_active           │          │
│ created_at          │          │
│ updated_at          │          │
└─────────────────────┘          │
       │                          │
       │ 1:1                     │ verified_by
       │                          │
┌──────▼──────────────┐          │
│      donors         │          │
│─────────────────────│          │
│ id (PK, FK)         │◄─────────┘
│ full_name           │
│ phone_number        │
│ organization_name   │
│ address             │
│ city, state         │
│ id_type, id_number  │
│ verification_status │
│ is_verified         │
│ verified_at         │
│ verified_by (FK)    │
│ created_at          │
└──────┬──────────────┘
       │
       │ 1:N
       │
┌──────▼──────────────┐          ┌─────────────────────┐
│    donations        │          │      schools        │
│─────────────────────│          │─────────────────────│
│ id (PK)             │          │ id (PK, FK)         │
│ donor_id (FK)       │          │ school_name         │
│ title               │          │ head_teacher_name   │
│ description         │          │ physical_address    │
│ donation_type       │          │ district, province  │
│ category[]          │          │ total_students      │
│ condition           │          │ total_teachers      │
│ available_quantity  │          │ approval_status     │
│ approval_status     │          │ is_verified         │
│ status              │          │ verified_at         │
│ city, province      │          │ verified_by (FK)    │
│ delivery_available  │          │ created_at          │
│ items (JSON)        │          └──────┬──────────────┘
│ photos_urls (JSON)  │                 │
│ approved_by (FK)    │                 │ 1:N
│ allocated_to (FK)   │                 │
│ created_at          │          ┌──────▼──────────────┐
│ updated_at          │          │resource_applications│
└─────────────────────┘          │─────────────────────│
                                 │ id (PK)             │
                                 │ school_id (FK)      │
                                 │ application_title   │
                                 │ application_type    │
                                 │ current_situation   │
                                 │ resources_needed    │
                                 │ status              │
                                 │ reviewed_by (FK)    │
                                 │ created_at          │
                                 └─────────────────────┘
```

## System Diagrams

### Use Case Diagram

```
                    Beneficiary Hub System

    ┌─────────────────────────────────────────────────────┐
    │                                                       │
    │   ┌──────────┐                                       │
    │   │  Donor   │                                       │
    │   └────┬─────┘                                       │
    │        │                                              │
    │        ├──► Register as Donor                        │
    │        ├──► Create Donation                          │
    │        ├──► View Donation Status                     │
    │        └──► Update Donation                          │
    │                                                       │
    │   ┌──────────┐                                       │
    │   │  School  │                                       │
    │   └────┬─────┘                                       │
    │        │                                              │
    │        ├──► Register School                          │
    │        ├──► Browse Donations                         │
    │        ├──► Submit Application                       │
    │        └──► View Allocated Resources                 │
    │                                                       │
    │   ┌──────────┐                                       │
    │   │  Admin   │                                       │
    │   └────┬─────┘                                       │
    │        │                                              │
    │        ├──► Approve/Reject Schools                   │
    │        ├──► Verify Donors                            │
    │        ├──► Approve/Reject Donations                 │
    │        ├──► View Donor Details                       │
    │        ├──► Allocate Donations                       │
    │        └──► Generate Reports                         │
    │                                                       │
    │   ┌───────────┐                                      │
    │   │ Approver  │                                      │
    │   └────┬──────┘                                      │
    │        │                                              │
    │        ├──► Review Applications                      │
    │        └──► Approve/Reject Requests                  │
    │                                                       │
    └─────────────────────────────────────────────────────┘
```

### Data Flow Diagram (DFD) - Level 0 (Context Diagram)

```
                      ┌─────────────┐
                      │   Donor     │
                      └──────┬──────┘
                             │
              Donation Info  │  Registration
                             │  Donation Listings
                             │
                      ┌──────▼──────────────────┐
                      │                         │
    ┌──────────┐      │   Beneficiary Hub      │      ┌──────────┐
    │  School  │◄─────┤   System               ├─────►│  Admin   │
    └──────────┘      │                         │      └──────────┘
         │            └──────▲──────────────────┘           │
         │                   │                              │
    Applications              │                      Approvals
    Browse Donations          │ Reviews                Reports
                              │
                       ┌──────┴──────┐
                       │  Approver   │
                       └─────────────┘
```

### Sequence Diagram - Donor Registration & Donation Flow

```
Donor          Frontend       Server Action    Supabase DB      Admin
  │                │               │                │             │
  │  Fill Form     │               │                │             │
  ├───────────────►│               │                │             │
  │                │               │                │             │
  │  Submit        │               │                │             │
  ├───────────────►│  Register     │                │             │
  │                ├──────────────►│                │             │
  │                │               │  Create User   │             │
  │                │               ├───────────────►│             │
  │                │               │                │             │
  │                │               │  Create Profile│             │
  │                │               ├───────────────►│             │
  │                │               │                │             │
  │                │               │  Create Donor  │             │
  │                │               ├───────────────►│             │
  │                │               │                │             │
  │                │  Pending      │                │             │
  │                │◄──────────────┤                │             │
  │  Show Pending  │               │                │             │
  │◄───────────────┤               │                │             │
  │                │               │                │             │
  │                │               │                │  Review     │
  │                │               │                │◄────────────┤
  │                │               │                │             │
  │                │               │                │  Approve    │
  │                │               │  Update Status │◄────────────┤
  │                │               │◄───────────────┤             │
  │                │               │                │             │
  │  Create        │               │                │             │
  │  Donation      │               │                │             │
  ├───────────────►│  Submit       │                │             │
  │                ├──────────────►│                │             │
  │                │               │  Insert        │             │
  │                │               ├───────────────►│             │
  │                │               │                │             │
  │                │  Success      │                │             │
  │                │◄──────────────┤                │             │
  │◄───────────────┤               │                │             │
  │                │               │                │             │
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Component Library**: shadcn/ui
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes & Server Actions
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Supabase Client (PostgREST)
- **Authentication**: Supabase Auth

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/beneficiary_hub.git
cd beneficiary_hub
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Set up the database**

Run the migrations in your Supabase project via the SQL Editor or CLI.

5. **Run the development server**

```bash
npm run dev
```

Visit `http://localhost:3000`

## User Roles

### Administrator
**Responsibilities:**
- Approve/reject school registrations
- Verify donor credentials
- Review and approve donations
- View donor details
- Allocate donations
- Monitor system activity

### Approver
**Responsibilities:**
- Review resource applications
- Approve/reject requests
- Add review notes

### Donor
**Responsibilities:**
- Register and verify account
- Create donation listings
- Track donation status
- View history

### School
**Responsibilities:**
- Register school
- Browse donations
- Submit applications
- View allocations

## Workflows

### Donor Registration
1. Fill comprehensive form
2. Submit with documents
3. Admin reviews
4. Approve/reject
5. Notification sent

### Donation Creation
1. Verified donor logs in
2. Creates donation listing
3. Uploads photos
4. Submits for approval
5. Admin reviews
6. Approve/reject
7. Available for matching

### School Application
1. Browse donations
2. Submit application
3. Approver reviews
4. Approve/reject
5. Admin allocates
6. Delivery arranged

## Security

- **Authentication**: Supabase Auth with JWT
- **Authorization**: Role-Based Access Control (RBAC)
- **RLS Policies**: Row Level Security on all tables
- **Input Validation**: Zod schemas
- **File Upload**: Validated and sanitized

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Database Setup

1. Create Supabase project
2. Run migrations
3. Configure storage buckets
4. Set up RLS policies

---

**Built with ❤️ for Zimbabwe's educational institutions**

Last Updated: 2025-01-26  
Version: 1.0.0
