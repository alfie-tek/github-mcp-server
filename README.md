# GitHub MCP Server for Cursor IDE

A powerful GitHub integration server that allows you to manage your GitHub repositories directly from Cursor IDE. This server provides a RESTful API to interact with GitHub's API, making it easier to create and manage repositories.

## Features

- Create new GitHub repositories
- List existing repositories
- Secure token-based authentication
- Rate limiting protection
- Comprehensive error handling
- Detailed logging
- Webhook support (coming soon)

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A GitHub account with a Personal Access Token
- Cursor IDE

## Setup

1. Clone this repository:
```bash
git clone <your-repo-url>
cd github-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# GitHub Configuration
GITHUB_TOKEN=your_github_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

5. Generate a GitHub Personal Access Token:
   - Go to GitHub.com → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
   - Click "Generate new token" → "Generate new token (classic)"
   - Give your token a descriptive name (e.g., "MCP Server Integration")
   - Select these permissions:
     - `repo` (Full control of private repositories)
     - `read:org` (Read organization data)
     - `admin:repo_hook` (Full control of repository hooks)
   - Copy the generated token and paste it in your `.env` file

6. Start the server:
```bash
npm run dev
```

## Using with Cursor IDE

1. Open Cursor IDE
2. The MCP server will run on `http://localhost:3000` by default
3. You can use the following endpoints:

### Create a New Repository
```bash
curl -X POST http://localhost:3000/api/github/repos \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-new-repo",
    "description": "A new repository created via MCP",
    "private": false,
    "auto_init": true
  }'
```

### List Your Repositories
```bash
curl http://localhost:3000/api/github/repos
```

## API Endpoints

### GET /health
Health check endpoint to verify server status.

### GET /api/github/repos
Lists all repositories accessible to the authenticated user.

### POST /api/github/repos
Creates a new repository.

Request body:
```json
{
  "name": "repository-name",
  "description": "Repository description",
  "private": false,
  "auto_init": true
}
```

## Error Handling

The server includes comprehensive error handling for:
- Invalid GitHub tokens
- Rate limiting
- Validation errors
- GitHub API errors
- Server errors

All errors are logged and returned with appropriate HTTP status codes.

## Security Features

- Token-based authentication
- Rate limiting protection
- Input validation
- Secure environment variable handling
- CORS protection
- Helmet security headers

## Development

To run the server in development mode with auto-reload:
```bash
npm run dev
```

To run tests:
```bash
npm test
```

## Logging

Logs are stored in:
- `error.log`: Error-level logs
- `combined.log`: All logs

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
