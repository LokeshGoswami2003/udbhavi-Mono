# Udbhavi Client

React + Vite client for the Udbhavi resume builder MVP.

## Local Setup

```bash
npm install
npm run dev
```

Use `http://localhost:5173` for the local client.

## Auth0 Flow

The client owns the browser login experience:

- `/` renders the landing page.
- `/login` redirects to Auth0 Universal Login.
- `/signup` redirects to Auth0 Universal Login with signup intent.
- `/app` is protected and shows the workspace after login.

Frontend environment:

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_AUTH0_DOMAIN=udbhaviauth.us.auth0.com
VITE_AUTH0_CLIENT_ID=...
VITE_AUTH0_AUDIENCE=https://api.udbhavi.local
```

The client requests an access token for `VITE_AUTH0_AUDIENCE`. The server should later validate the same audience and issuer before syncing the Auth0 user into MongoDB.

Auth0 application settings for local development:

- Allowed Callback URLs: `http://localhost:5173/app`
- Allowed Logout URLs: `http://localhost:5173`
- Allowed Web Origins: `http://localhost:5173`
