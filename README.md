# 🚀 Subspace - Subscription Management Platform

<div align="center">

![Subspace Logo](public/subspace-hor_002.svg)

**A modern, feature-rich subscription management and social commerce platform**

[![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8)](https://web.dev/progressive-web-apps/)

[Live Demo](https://subspace.money) • [Report Bug](https://github.com/joeydash/subspacewebv2/issues) • [Request Feature](https://github.com/joeydash/subspacewebv2/issues)

</div>

---

## 📖 About

Subspace is a comprehensive subscription management platform that combines social features, e-commerce capabilities, and utility payment services. Built with Next.js 16 and React 19, it offers a seamless experience for managing subscriptions, chatting with friends, making quick payments, and more.

### ✨ Key Features

- 🔐 **Authentication & Authorization** - Secure phone-based OTP authentication
- 💬 **Real-time Chat** - WebSocket-powered messaging with group chats, file sharing, and emoji reactions
- 📱 **Mobile Recharge** - Quick recharge for mobile, DTH, and FASTag
- 💡 **Electricity Payments** - Easy utility bill payments
- 🎁 **Subscription Sharing** - Share and manage subscriptions with friends
- 🛍️ **Product Rentals** - Browse and rent products from various brands
- 💳 **Wallet Management** - Integrated wallet for quick transactions
- 🎯 **Quick Payments** - Saved payment methods for faster checkouts
- 📊 **Transaction History** - Detailed coin transaction and order tracking
- 🌐 **PWA Support** - Install as a mobile app with offline capabilities
- 🌍 **Multi-language Support** - Internationalization ready
- 🎨 **Modern UI/UX** - Sleek design with Tailwind CSS 4 and Framer Motion animations
- 📱 **Responsive Design** - Optimized for all devices
- ⚡ **Turbopack** - Lightning-fast development with Next.js Turbopack

---

## 🛠️ Tech Stack

### Core
- **Framework:** Next.js 16.0.1 (App Router)
- **React:** 19.2.0
- **TypeScript:** 5.x
- **Styling:** Tailwind CSS 4.x

### State Management & Data Fetching
- **React Query:** @tanstack/react-query 5.90.7
- **Axios:** 1.13.2
- **Zustand:** (via custom stores)

### UI Components & Libraries
- **Radix UI:** Accessible component primitives
- **Lucide React:** Icon library
- **Framer Motion:** Animations and transitions
- **React Hot Toast:** Notification system
- **React Loading Skeleton:** Loading states
- **Emoji Picker React:** Emoji selector

### Real-time & Maps
- **Socket.io Client:** WebSocket communication
- **Google Maps:** @vis.gl/react-google-maps

### Additional Features
- **PWA:** @ducanh2912/next-pwa
- **QR Codes:** qrcode.react
- **Markdown:** react-markdown
- **Animations:** Lottie animations

### Development Tools
- **ESLint:** Code linting
- **PostCSS:** CSS processing
- **Netlify:** Deployment platform

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm, yarn, pnpm, or bun package manager
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/joeydash/subspacewebv2.git
   cd subspacewebv2/nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Add your environment variables here
   NEXT_PUBLIC_API_URL=https://api.superflow.run
   NEXT_PUBLIC_GRAPHQL_URL=https://db.subspace.money/v1/graphql
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### 🏗️ Build for Production

```bash
npm run build
npm start
```

The production build will be optimized and ready for deployment.

---

## 📁 Project Structure

```
nextjs/
├── app/                      # Next.js App Router pages
│   ├── (main)/              # Main authenticated routes
│   │   ├── chat/            # Chat and messaging
│   │   ├── mobile-recharge/ # Mobile recharge
│   │   ├── wallet/          # Wallet management
│   │   ├── profile/         # User profile
│   │   └── ...
│   ├── auth/                # Authentication pages
│   ├── error/               # Error handling
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # Reusable components
│   ├── ui/                  # UI primitives
│   └── ...
├── lib/                     # Utilities and helpers
│   ├── api/                 # API functions
│   ├── store/               # State management stores
│   ├── hooks/               # Custom React hooks
│   ├── context/             # React contexts
│   └── utils/               # Utility functions
├── config/                  # Configuration files
│   ├── axios-client.ts      # Axios setup
│   ├── react-query-client.ts# React Query config
│   └── toast-config.tsx     # Toast notifications
├── skeletons/               # Loading skeleton components
├── public/                  # Static assets
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS config
└── tsconfig.json            # TypeScript configuration
```

---

## 🎨 Features in Detail

### 💬 Chat System
- Real-time messaging with Socket.io
- Group chats with admin controls
- File and image sharing
- Emoji reactions and picker
- User online/offline status
- Message read receipts
- Admin rating system

### 💳 Payment Services
- Mobile recharge (Prepaid/Postpaid)
- DTH recharges
- FASTag recharges
- Electricity bill payments
- UPI and card payments
- Quick payment shortcuts

### 🎁 Subscription Management
- Browse trending subscriptions
- Share subscriptions with friends
- Track active subscriptions
- Manage subscription renewals
- View subscription history

### 🛍️ Product Rentals
- Browse rental products by brand
- Filter by categories
- Product details and specifications
- Rental checkout process
- Order tracking

### 👥 Social Features
- Friend requests and management
- Group creation and management
- Public groups discovery
- User profiles
- Activity feed

---

## 🔧 Configuration

### Next.js Configuration

The project uses Next.js 16 with Turbopack for faster builds. Key configurations:

- **Image Optimization:** Configured for CDN domains
- **API Rewrites:** Proxying to backend API
- **PWA:** Enabled for production builds
- **TypeScript:** Strict mode with build error handling

### Tailwind CSS

Custom Tailwind configuration with:
- Custom color palette
- Extended animations
- Custom utilities
- PostCSS integration

---

## 📦 Deployment

### Netlify Deployment

The project is configured for Netlify deployment with:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**Deploy to Netlify:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### Other Platforms

The project can also be deployed to:
- Vercel
- AWS Amplify
- Azure Static Web Apps
- Self-hosted with Docker

---

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards

- Follow TypeScript best practices
- Use ESLint for code quality
- Write meaningful commit messages
- Add comments for complex logic
- Ensure responsive design

---

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🐛 Known Issues & Troubleshooting

### Common Issues

**Issue:** Build fails with "document is not defined"
- **Solution:** Ensure client-side code is wrapped with `typeof window !== 'undefined'` checks

**Issue:** useSearchParams() Suspense boundary error
- **Solution:** Wrap components using `useSearchParams()` in a `<Suspense>` boundary

**Issue:** Image optimization errors
- **Solution:** Verify remote patterns are configured in `next.config.ts`

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👥 Team

- **Developer:** [joeydash](https://github.com/joeydash)

---

## 📞 Support

For support, email support@subspace.money or open an issue on GitHub.

---

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment tools
- Open source community for the incredible libraries
- All contributors and testers

---

<div align="center">

**Built with ❤️ by the Subspace Team**

[Website](https://subspace.money) • [GitHub](https://github.com/joeydash/subspacewebv2) • [Twitter](https://twitter.com/subspacemoney)

</div>
