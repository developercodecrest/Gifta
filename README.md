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
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
DELHIVERY_MODE=test
DELHIVERY_API_TOKEN_TEST=delhivery_test_token
DELHIVERY_API_TOKEN_LIVE=delhivery_live_token
DELHIVERY_TEST_BASE_URL=https://staging-express.delhivery.com
DELHIVERY_LIVE_BASE_URL=https://staging-express.delhivery.com
DELHIVERY_PINCODE_PATH=/c/api/pin-codes/json/
DELHIVERY_SHIPMENT_CREATE_PATH=/api/cmu/create.json
DELHIVERY_PICKUP_REQUEST_PATH=/fm/request/new/
DELHIVERY_WAYBILL_PATH=/waybill/api/bulk/json/
DELHIVERY_TRACK_PATH=/api/v1/packages/json/
DELHIVERY_WEBHOOK_SECRET=optional_webhook_hmac_secret
DELHIVERY_DEFAULT_WEIGHT_KG=0.5
DELHIVERY_DEFAULT_LENGTH_CM=20
DELHIVERY_DEFAULT_BREADTH_CM=15
DELHIVERY_DEFAULT_HEIGHT_CM=10
DELHIVERY_TRIGGER_ON_VERIFY=false
```

Razorpay notes:

- Local should use test credentials (`rzp_test_*`).
- Production should use live credentials (`rzp_live_*`).
- Server creates orders at `POST /api/checkout/razorpay/order` and verifies signatures at `POST /api/checkout/razorpay/verify`.
- Configure webhook secret in `RAZORPAY_WEBHOOK_SECRET` for `POST /api/checkout/razorpay/webhook`.

Delhivery notes:

- Use `DELHIVERY_MODE=test` for development and `DELHIVERY_MODE=live` for production.
- The codebase is currently pinned to `https://staging-express.delhivery.com` for both modes as a temporary project-wide override.
- Serviceability endpoint used by checkout: `GET /api/shipping/delhivery/serviceability?pinCode=...`
- Tracking endpoint for user apps: `GET /api/shipping/delhivery/track?orderRef=...`
- Shipping webhook endpoint: `POST /api/shipping/delhivery/webhook`
- Shipment retry endpoint for admin ops: `POST /api/admin/orders/:id/shipping/retry`
- Admin diagnostics: `GET /api/admin/integrations/razorpay/health` and `GET /api/admin/integrations/delhivery/test?pinCode=...`
- Optional fallback: set `DELHIVERY_TRIGGER_ON_VERIFY=true` to trigger shipment creation on payment verify in addition to webhook flow.

End-to-end smoke test script:

- Run the script at `scripts/e2e-payment-delivery-smoke.ps1` to test: serviceability → COD order → Razorpay webhook success → Delhivery webhook updates.
- Example (with auth token + webhook secrets):
	- `./scripts/e2e-payment-delivery-smoke.ps1 -BaseUrl "http://localhost:3010" -AuthToken "<bearer-token>" -PinCode "400001" -RazorpayWebhookSecret "<rzp-webhook-secret>" -DelhiveryWebhookSecret "<delhivery-webhook-secret>"`

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
