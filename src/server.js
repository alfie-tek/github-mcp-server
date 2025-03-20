require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const Joi = require('joi');
const axios = require('axios');

// Initialize express app
const app = express();

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// GitHub API client
const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json'
  }
});

// Validate GitHub token on startup
const validateGitHubToken = async () => {
  try {
    await githubClient.get('/user');
    logger.info('GitHub token validated successfully');
  } catch (error) {
    logger.error('GitHub token validation failed:', error.message);
    if (error.response?.status === 401) {
      logger.error('Invalid or expired GitHub token. Please check your token in .env file');
      process.exit(1);
    }
  }
};

// Call token validation on startup
validateGitHubToken();

// Request validation schema
const webhookSchema = Joi.object({
  repository: Joi.object({
    name: Joi.string().required(),
    owner: Joi.object({
      login: Joi.string().required()
    }).required()
  }).required(),
  action: Joi.string().required()
});

// Repository creation schema
const createRepoSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().max(1000),
  private: Joi.boolean().default(false),
  auto_init: Joi.boolean().default(true)
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GitHub repositories endpoint
app.get('/api/github/repos', async (req, res) => {
  try {
    const response = await githubClient.get('/user/repos', {
      params: {
        sort: 'updated',
        per_page: 100,
        page: 1,
        visibility: 'all' // This will include both public and private repos
      }
    });

    const repos = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      html_url: repo.html_url,
      default_branch: repo.default_branch,
      updated_at: repo.updated_at,
      visibility: repo.visibility,
      language: repo.language,
      stargazers_count: repo.stargazers_count
    }));

    res.json(repos);
  } catch (error) {
    logger.error('Error fetching GitHub repositories:', error);
    if (error.response) {
      if (error.response.status === 401) {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid or expired GitHub token'
        });
      } else if (error.response.status === 403) {
        res.status(403).json({
          error: 'Permission denied',
          message: 'Token does not have required permissions'
        });
      } else {
        res.status(error.response.status).json({
          error: 'GitHub API error',
          message: error.response.data.message
        });
      }
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch repositories'
      });
    }
  }
});

// Create repository endpoint
app.post('/api/github/repos', async (req, res) => {
  try {
    const { error, value } = createRepoSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const response = await githubClient.post('/user/repos', value);
    
    const repo = {
      id: response.data.id,
      name: response.data.name,
      full_name: response.data.full_name,
      description: response.data.description,
      private: response.data.private,
      html_url: response.data.html_url,
      default_branch: response.data.default_branch,
      created_at: response.data.created_at,
      visibility: response.data.visibility
    };

    logger.info(`Repository created successfully: ${repo.full_name}`);
    res.status(201).json(repo);
  } catch (error) {
    logger.error('Error creating repository:', error);
    if (error.response) {
      if (error.response.status === 401) {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid or expired GitHub token'
        });
      } else if (error.response.status === 422) {
        res.status(422).json({
          error: 'Validation failed',
          message: error.response.data.message
        });
      } else {
        res.status(error.response.status).json({
          error: 'GitHub API error',
          message: error.response.data.message
        });
      }
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create repository'
      });
    }
  }
});

// GitHub webhook endpoint
app.post('/api/github/webhook', async (req, res) => {
  try {
    const { error } = webhookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    // TODO: Implement webhook handling
    res.status(200).json({ message: 'Webhook received' });
  } catch (err) {
    logger.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app; 