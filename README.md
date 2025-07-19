# Scavenger Hunt Platform

A comprehensive location-based scavenger hunt gaming platform with AI-powered clues, user management, and progressive gameplay mechanics.

## 🎮 Features

### Core Game Mechanics
- **Location-Based Gameplay**: GPS-powered hunts that adapt to user location
- **AI-Powered Clues**: Intelligent clue generation based on game theme and location
- **Progressive Levels**: 12 levels, each with 4 stages containing 4-5 hunts with multiple clues
- **Scavenger Stone Economy**: Earn and spend scavenger stones to access new stages and levels
- **Multiple Submission Types**: Text answers, photo uploads, or combined challenges

### User Management
- **Role-Based Access**: USER, ADMIN, SUPERADMIN roles
- **User Authentication**: Secure JWT-based authentication
- **Account Status Management**: Active/Banned user states
- **Participant Registration**: Game-specific participant registration

### Game Administration
- **Game Lifecycle Management**: PENDING → UPCOMING → ACTIVE → COMPLETED
- **Launch Date Control**: SuperAdmins can set game launch dates
- **Participant Management**: Monitor and manage game participants
- **User Administration**: Ban/unban users, promote to admin roles

### Progress Tracking
- **Badge System**: Earn badges for completing stages and levels
- **Wallet System**: Track scavenger stone balance and transaction history
- **Progress Monitoring**: Track current level, stage, hunt, and clue progress
- **Completion Analytics**: Monitor user progress and engagement

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- MySQL database (local or AWS RDS)
- MySQL Workbench (optional, for database management)

### Installation

1. **Clone and Install Dependencies**
   ```bash
   yarn install
   ```

2. **Database Setup**
   ```bash
   # Configure your .env file with MySQL connection
   DATABASE_URL="mysql://username:password@host:3306/database"
   
   # Generate Prisma client
   yarn prisma generate
   
   # Push schema to database
   yarn prisma db push
   ```

3. **Start Development Server**
   ```bash
   yarn dev
   ```

Visit http://localhost:3000 to see the application running!
