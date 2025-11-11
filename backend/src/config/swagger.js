// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const deployedServer = process.env.SWAGGER_BASE_URL || process.env.PUBLIC_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://backend-3opn.onrender.com/api' : undefined);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TransDigiSN API',
      version: '1.0.0',
      description: 'API de la plateforme TransDigiSN - Gestion des translataires au Sénégal',
      contact: {
        name: 'Support TransDigiSN',
        email: 'support@transdigisn.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: (
      deployedServer
        ? [
            { url: deployedServer, description: 'Serveur déployé' },
            { url: 'http://localhost:5000/api', description: 'Serveur de développement' }
          ]
        : [
            { url: 'http://localhost:5000/api', description: 'Serveur de développement' }
          ]
    ),
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez votre token JWT (reçu lors de la connexion)'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            nom: {
              type: 'string',
              example: 'Diallo'
            },
            prenom: {
              type: 'string',
              example: 'Moussa'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'moussa@example.com'
            },
            telephone: {
              type: 'string',
              example: '+221771234567'
            },
            adresse: {
              type: 'string',
              example: 'Dakar, Sénégal'
            },
            photo: {
              type: 'string',
              example: 'https://example.com/photo.jpg'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              example: 'user'
            },
            isVerified: {
              type: 'boolean',
              example: true
            },
            isBlocked: {
              type: 'boolean',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Translataire: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            nomEntreprise: {
              type: 'string',
              example: 'Trans Express SARL'
            },
            ninea: {
              type: 'string',
              example: '123456789'
            },
            telephoneEntreprise: {
              type: 'string',
              example: '+221338765432'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'contact@transexpress.sn'
            },
            typeServices: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['maritime', 'routier', 'aerien']
              },
              example: ['maritime', 'routier']
            },
            statut: {
              type: 'string',
              enum: ['en_attente', 'approuve', 'rejete', 'suspendu'],
              example: 'approuve'
            },
            secteurActivite: {
              type: 'string',
              example: 'Transport maritime'
            },
            adresse: {
              type: 'string',
              example: 'Port de Dakar'
            },
            photo: {
              type: 'string',
              example: 'https://example.com/logo.jpg'
            },
            isVerified: {
              type: 'boolean',
              example: true
            },
            isBlocked: {
              type: 'boolean',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Devis: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            client: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            translataire: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            typeService: {
              type: 'string',
              enum: ['maritime', 'routier', 'aerien'],
              example: 'maritime'
            },
            description: {
              type: 'string',
              example: 'Transport de conteneurs'
            },
            statut: {
              type: 'string',
              enum: ['en_attente', 'accepte', 'refuse'],
              example: 'en_attente'
            },
            montant: {
              type: 'number',
              example: 500000
            },
            reponse: {
              type: 'string',
              example: 'Nous pouvons gérer votre demande'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Une erreur est survenue'
            },
            error: {
              type: 'string',
              example: 'Détails de l\'erreur'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentification',
        description: 'Endpoints pour l\'inscription, connexion et gestion des mots de passe'
      },
      {
        name: 'Utilisateurs',
        description: 'Gestion des profils utilisateurs'
      },
      {
        name: 'Translataires',
        description: 'Gestion des profils translataires'
      },
      {
        name: 'Administration',
        description: 'Endpoints réservés aux administrateurs'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;