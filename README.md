🚗 Velocis CRM
A vehicle rental CRM platform built to streamline fleet management, customer tracking, and rental operations.
🔗 Live Demo: ontourrentals.com

🧠 About the Project
Velocis CRM is a full-featured customer relationship and fleet management platform built for vehicle rental businesses. It centralizes rental operations — from inventory tracking and customer management to booking workflows and revenue reporting — replacing fragmented spreadsheets and legacy tools with a modern, unified dashboard.
This project was built as a complete product concept with a live, deployed backend.

✨ Features

🚙 Fleet Inventory Management — Track vehicles, availability, and maintenance status in real time
👥 Customer Management — Maintain customer profiles, rental history, and contact information
📅 Booking & Rental Workflows — Manage reservations from inquiry through return
📊 Revenue & Operations Dashboard — Monitor key metrics across the rental business
🔐 Role-Based Access Control — Admin and team member permissions
📧 Email Notifications — Automated alerts for bookings, returns, and updates via Resend
📱 Responsive Design — Optimized for desktop and mobile use


🛠️ Tech Stack
LayerTechnologyFrontendReact + JavaScriptStylingTailwind CSS + shadcn/uiBackendBase44 (Auth + Database + Functions)EmailResendBuild ToolViteHostingontourrentals.com

🚀 Running Locally
bash# Clone the repository
git clone https://github.com/davidolivo5999/velocis-crm.git

# Navigate into the project
cd velocis-crm

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Add your Base44 credentials:
# VITE_BASE44_APP_ID=your_app_id
# VITE_BASE44_APP_BASE_URL=your_backend_url

# Start the development server
npm run dev

📁 Project Structure
velocis-crm/
├── src/                  # Main application source code
├── base44/               # Base44 backend functions and config
├── components.json       # shadcn/ui component config
├── tailwind.config.js    # Tailwind configuration
└── index.html            # App entry point

📄 Product Documentation
This project was built with a full product management workflow including:

✅ Product Requirements Document (PRD)
✅ Feature Specifications across 8 product areas
✅ MVP Scope Definition
✅ User Personas & Journey Mapping
✅ Roadmap & Prioritization Framework


👤 Author
David Olivo — Product Manager & Builder
📧 davidolivo399@gmail.com
🐙 @davidolivo5999

📜 License
Built on Base44. See Base44 terms for platform usage details.
