# reverseqr Setup and Reverse Proxy Guide

## 1. Install Dependencies

```
npm install
```

## 2. Run the Server

```
npm start
```

The server will start on port 3000 by default. You can change the port and base URL with environment variables:

```
PORT=8080 BASE_URL=https://your.domain.com npm start
```

## 3. Reverse Proxy Setup (Nginx Example)

To serve reverseqr behind a domain (e.g., https://your.domain.com), use Nginx as a reverse proxy:

```
server {
    listen 80;
    server_name your.domain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

- Reload Nginx after editing the config:
  ```
  sudo systemctl reload nginx
  ```

## 4. Changing the Base URL

Set the `BASE_URL` environment variable to match your public URL. This ensures QR codes and links are correct.

Example:
```
BASE_URL=https://your.domain.com npm start
```

## 5. Security Notes
- Use HTTPS in production.
- For large files, chunking and streaming can be improved.
- The connection code is short for demo; increase bytes for more security.

---

For further customization, edit `server/server.js` and `client/client.js`.
