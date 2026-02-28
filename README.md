# Gotify Markdown

A Firefox/LibreWolf browser extension for [Gotify](https://gotify.net/) with full Markdown rendering support.

Forked from [StewartThomson/Gotify-Ext](https://github.com/StewartThomson/Gotify-Ext) with added Markdown support and a modernized UI.

## Features

- **Markdown rendering** - Messages sent with `text/markdown` content type are rendered as rich HTML
  - Headings, bold, italic, strikethrough
  - Inline and block images (clickable to open full-size)
  - Links (open in new tab)
  - Code blocks with syntax highlighting classes
  - Blockquotes, ordered/unordered lists
  - Horizontal rules
- **Modernized UI** - Updated card layout with cleaner typography and spacing
- **Firefox / LibreWolf** - Packaged as an installable `.xpi` add-on

## Installation

### 1. Install the extension

Download the latest `gotify-markdown.xpi` from the [Releases](../../releases) page.

> **Note:** This extension is self-signed and not distributed through the official Firefox Add-ons store. Before installing, you must allow unsigned extensions:
> 1. Go to `about:config`
> 2. Set `xpinstall.signatures.required` to `false`

Then install the `.xpi`:

1. Go to `about:addons` (`Ctrl+Shift+A`)
2. Click the gear icon > **Install Add-on From File...**
3. Select `gotify-markdown.xpi`

Alternatively, load it temporarily for testing:

1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` inside the `dist/gotify-ext` folder

### 2. Find your extension's internal UUID

Firefox assigns each extension a unique internal UUID. You need this for the Gotify server configuration.

1. Go to `about:debugging#/runtime/this-firefox`
2. Find **Gotify Markdown** in the extensions list
3. Copy the **Internal UUID** (e.g. `8b005804-f3ae-483c-82de-9c535a402c06`)

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

Click the Gotify Markdown icon in your browser toolbar, enter your Gotify server URL and credentials, and you're set.

## Sending Markdown Messages

To have messages render as Markdown, set the `content-type` extra to `text/markdown` when pushing messages. For example, with a Home Assistant automation:

```yaml
- action: rest_command.gotify_notification
  data:
    title: "Motion Detected"
    message: "![Camera Image](http://your-camera/snapshot.jpg)"
    extras:
      client::display:
        contentType: "text/markdown"
```

Or via the Gotify API directly:

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

### Prerequisites

- Node.js (v18+ recommended; v22 works with compatibility flags)
- npm
- Python 3 (for Windows `.xpi` packaging)

### Install dependencies

```bash
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag is needed because the project uses Angular 11 which has strict peer dependency requirements that conflict with modern npm.

### Build the `.xpi`

```bash
# On Node.js 17+, set the OpenSSL legacy provider flag
set NODE_OPTIONS=--openssl-legacy-provider   # Windows (cmd)
$env:NODE_OPTIONS="--openssl-legacy-provider" # Windows (PowerShell)
export NODE_OPTIONS=--openssl-legacy-provider # Linux/macOS

npm run build:xpi
```

This will:
1. Build the Angular production bundle
2. Copy `manifest.prod.json` into `dist/gotify-ext/` with the version from `package.json`
3. Package everything into `dist/gotify-ext.xpi`

The resulting `.xpi` file can be installed directly in Firefox or LibreWolf.

### Development

Start the local Gotify dev server:

```bash
cd gotify_dev && docker-compose up
```

Build and watch for changes:

```bash
set NODE_OPTIONS=--openssl-legacy-provider
npm start
```

Then load the extension temporarily from `about:debugging` pointing to `dist/gotify-ext/manifest.json`. The dev Gotify server runs at `http://localhost:8000` with username `admin` and password `admin`.

### Versioning

Update the version in `package.json`. The build script reads the version from there and stamps it into the production manifest automatically.

## Credits

- Original extension: [StewartThomson/Gotify-Ext](https://github.com/StewartThomson/Gotify-Ext)
- Logo: [gotify/logo](https://github.com/gotify/logo)
- Gotify docs: [gotify.net/docs/config](https://gotify.net/docs/config)
