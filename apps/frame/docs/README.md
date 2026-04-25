# Journey Through Time Frames Service

This service hosts the Farcaster Frame metadata and actions for the Journey Through Time dApp.

## Local Development

```bash
cd apps/frame
npm install
npm run dev
```

Visit `http://localhost:3000/frame` to view the frame metadata response.

## Environment Variables

- `APP_URL`: The public URL to the frontend dApp.

## Deployment

Deploy with Vercel (or a compatible serverless platform). `vercel.json` maps `/frame` and `/` to the frame handler.
