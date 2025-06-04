const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import routes
const adminRoutes = require('./routes/admin');
const setupRoutes = require('./routes/setup');
const authRoutes = require('./routes/auth');
// Import other routes here...

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Set security headers
app.use(helmet());

// Compress responses
app.use(compression());

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pool Maintenance API',
      version: '1.0.0',
      description: 'API for pool maintenance mobile application'
    },
    servers: [
      {
        url: 'http://localhost:3000'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      {
        name: 'Setup',
        description: 'First-time setup operations'
      },
      {
        name: 'Auth',
        description: 'Authentication endpoints'
      },
      {
        name: 'Admin',
        description: 'Administrative operations'
      }
      // Add other tags as needed
    ]
  },
  apis: ['./routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Mount routes
app.use('/api/admin', adminRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
// Mount other routes here...
app.use('/api/pools', require('./routes/pools'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Pool Maintenance API' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;





