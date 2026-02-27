This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Backend API (MongoDB)

Environment files:

- `.env.local` for local development
- `.env.production` for production deploys
- `.env.example` as a safe template

Set the following environment variables:

```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=gifta
AUTH_SECRET=your-long-random-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM="Gifta <no-reply@gifta.com>"
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxx
```

Razorpay notes:

- Local should use test credentials (`rzp_test_*`).
- Production should use live credentials (`rzp_live_*`).
- Server creates orders at `POST /api/checkout/razorpay/order` and verifies signatures at `POST /api/checkout/razorpay/verify`.
- Configure webhook secret in `RAZORPAY_WEBHOOK_SECRET` for `POST /api/checkout/razorpay/webhook`.

Available endpoints:

- `POST /api/dev/seed` - seed demo products, stores, offers, reviews, comments, profile.
- `GET /api/home` - featured and top-rated items for home page.
- `GET /api/profile` - fetch demo profile.
- `PUT /api/profile` - update demo profile.
- `GET /api/items` - search/list items with filters:
	- `q`, `category`, `tag`, `sort`, `stock`, `page`, `pageSize`
	- `minPrice`, `maxPrice`, `storeId`, `minRating`
- `GET /api/items/:slug` - item details with offers, review summary, and suggestions.
- `GET /api/items/:slug/offers` - offers from all stores for a single item.
- `GET /api/items/:slug/reviews` - item reviews (`page`, `pageSize`).
- `GET /api/items/:slug/comments` - item comments (`page`, `pageSize`).

All APIs return an envelope format:

```json
{
	"success": true,
	"data": {},
	"meta": {}
}
```

## Multi-vendor + Admin Panel

- Marketplace supports vendor-level offers per product (`offers` collection) and vendor filtering on store pages.
- Cart and checkout are server-rendered (`/cart`, `/checkout`) with cookie-synced client interactions and vendor-level offer selection.
- Admin panel routes are available under `/admin`.
- Roles implemented:
	- `sadmin` (super admin)
	- `storeOwner`
	- `rider`
	- `user`

## Authentication (Auth.js)

- Auth.js v5 is configured with:
	- Google OAuth login
	- Email OTP login (custom OTP via Nodemailer + MongoDB verification)
- Auth route: `/api/auth/[...nextauth]`
- OTP request route: `POST /api/auth/otp/request`
- Admin pages are session-protected via `proxy.ts` and server-side role checks.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
