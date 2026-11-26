# CampusTrade — UTM Campus Marketplace

CampusTrade is a web-based marketplace developed for the Universiti Teknologi Malaysia (UTM) campus community. It allows students and campus vendors to list products, browse available items, place orders, and manage transactions through a centralised platform.

**Live Website:** https://campus-trade-bqpo.vercel.app

**GitHub Repository:** https://github.com/vdhjdn/campus-trade

---

## 1. Features

- **User Authentication:** User registration and login using Supabase Authentication.
- **Product Browsing:** Browse available products and view product details.
- **Shop Management:** Campus vendors can create and manage shop profiles.
- **Product Management:** Sellers can add, update, and manage product listings.
- **Shopping Cart:** Buyers can add products and manage quantities.
- **Order Management:** Buyers and sellers can track and manage orders.
- **Payment Submission:** Buyers can view DuitNow QR information and upload payment receipts.
- **Payment Verification:** Sellers can review and verify submitted receipts.
- **Refund Management:** Supports refund records and refund proof submission.

## 2. Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend development |
| JavaScript | Application logic |
| Vite | Development server and build tool |
| React Router | Page navigation |
| Supabase Auth | User authentication |
| PostgreSQL | Database management |
| Supabase Storage | File storage |
| CSS | Interface styling |
| Vercel | Application deployment |
| GitHub | Version control |

## 3. Prerequisites

Before running the project, make sure you have installed:

- Node.js (LTS version recommended)
- npm
- Git

You also need access to a configured Supabase project.

## 4. Installation and Setup

### Step 1: Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/vdhjdn/campus-trade.git
```

### Step 2: Navigate to the Project Folder

```bash
cd campus-trade
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

Create a file named `.env` in the project root directory.

Add the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the placeholder values with the URL and public client key from your Supabase project.

**Important:** Do not upload your `.env` file or any secret/service role keys to GitHub.

### Step 5: Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in the terminal, usually:

```text
http://localhost:5173
```

## 5. Build Instructions

To create a production build, run:

```bash
npm run build
```

The generated production files will be stored in the `dist` directory.

To preview the production build locally, run:

```bash
npm run preview
```

## 6. Code Quality Check

To run ESLint and check the project code, use:

```bash
npm run lint
```

## 7. Backend Configuration

CampusTrade uses Supabase for authentication, database operations, and file storage.

The Supabase project must be configured with the required database tables, relationships, Row Level Security (RLS) policies, database triggers, functions, and storage buckets before all application features can operate correctly.

The application uses Supabase environment variables to connect to the backend.

## 8. Deployment

CampusTrade is deployed using Vercel and connected to its GitHub repository.

**Live Application:** https://campus-trade-bqpo.vercel.app

The deployed application can be accessed through a web browser without installing a separate application.

## 9. Payment Information

CampusTrade uses an external DuitNow payment process.

Buyers complete payments outside the application and upload payment receipts for seller verification. The application does not directly process online payments through a payment gateway.
