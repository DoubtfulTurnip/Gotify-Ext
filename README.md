# Gotify Notifications

A Firefox/LibreWolf browser extension for [Gotify](https://gotify.net/) with full Markdown rendering support and per-app icons.

Forked from [StewartThomson/Gotify-Ext](https://github.com/StewartThomson/Gotify-Ext) with added Markdown support, per-app icons, and a modernized UI.

## Features

- **Per-app icons** - Message cards display the icon set for each Gotify application
- **Markdown rendering** - Messages sent with `text/markdown` content type are rendered as rich HTML
  - Headings, bold, italic, strikethrough
  - Inline and block images (clickable to open full-size)
  - Links (open in new tab)
  - Code blocks with syntax highlighting classes
  - Blockquotes, ordered/unordered lists
  - Horizontal rules
- **Modernized UI** - Updated card layout with cleaner typography and spacing
- **Firefox / LibreWolf** - Signed and installable as an `.xpi` add-on

## Installation

### 1. Install the extension

Download the latest `gotify-notifications-*.xpi` from the [Releases](../../releases) page.

Install it:

1. Go to `about:addons` (`Ctrl+Shift+A`)
2. Click the gear icon > **Install Add-on From File...**
3. Select the downloaded `.xpi`

Alternatively, load it temporarily for testing:

1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` inside the `dist/gotify-ext` folder

### 2. Find your extension's internal UUID

Firefox assigns each extension a unique internal UUID. You need this for the Gotify server configuration.

1. Go to `about:debugging#/runtime/this-firefox`
2. Find **Gotify Notifications** in the extensions list
3. Copy the **Internal UUID** (e.g. `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 3. Configure your Gotify server

The extension needs CORS and WebSocket origin permissions on your Gotify server.

**Docker Compose (environment variables):**

```yaml
environment:
  GOTIFY_SERVER_CORS_ALLOWORIGINS: "- \"moz-extension://<your-extension-uuid>\""
  GOTIFY_SERVER_CORS_ALLOWHEADERS: "- \"Authorization\"\n- \"content-type\""
  GOTIFY_SERVER_CORS_ALLOWMETHODS: "- \"GET\"\n- \"POST\"\n- \"OPTIONS\"\n- \"DELETE\""
  GOTIFY_SERVER_STREAM_ALLOWEDORIGINS: "- \"<your-extension-uuid>\""
```

Replace `<your-extension-uuid>` with the Internal UUID from step 2.

> **Note:** `CORS_ALLOWORIGINS` requires the full origin string including the `moz-extension://` prefix. `STREAM_ALLOWEDORIGINS` only needs the UUID portion (Gotify matches against the hostname part of the origin).

**config.yml (alternative):**

```yaml
server:
  cors:
    alloworigins:
      - "moz-extension://<your-extension-uuid>"
    allowmethods:
      - "GET"
      - "POST"
      - "OPTIONS"
      - "DELETE"
    allowheaders:
      - "Authorization"
      - "content-type"
  stream:
    allowedorigins:
      - "<your-extension-uuid>"
```

> **Important:** If you're running Gotify via Docker Compose with environment variables, those take precedence over `config.yml`. Make sure you're editing the right configuration source.

### 4. Connect the extension

Click the Gotify Notifications icon in your browser toolbar, enter your Gotify server URL and credentials, and you're set.

## Sending Markdown Messages

To have messages render as Markdown, set the `contentType` extra to `text/markdown` when pushing messages.

Via the Gotify REST API:

```bash
curl -X POST "https://gotify.example.com/message?token=YOUR_APP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "message": "**Bold text** and an image:\n\n![photo](https://example.com/image.jpg)",
    "extras": {
      "client::display": {
        "contentType": "text/markdown"
      }
    }
  }'
```

## Building from Source

See [BUILD.md](BUILD.md) for full build instructions.

### Quick start

```bash
npm install
npm run build:xpi
```

Requires Node.js 22. The `.npmrc` in this repo handles the OpenSSL compatibility flag automatically.

### Development

Start the local Gotify dev server:

```bash
cd gotify_dev && docker-compose up
```

Then run:

```bash
npm start
```

Load the extension temporarily from `about:debugging` pointing to `dist/gotify-ext/manifest.json`. The dev Gotify server runs at `http://localhost:8000` with username `admin` and password `admin`.

## Credits

- Original extension: [StewartThomson/Gotify-Ext](https://github.com/StewartThomson/Gotify-Ext)
- Logo: [gotify/logo](https://github.com/gotify/logo)
- Gotify docs: [gotify.net/docs/config](https://gotify.net/docs/config)
