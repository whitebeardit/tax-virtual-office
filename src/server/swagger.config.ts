import swaggerJsdoc, { type Options } from 'swagger-jsdoc';

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tax Virtual Office API',
      version: '0.1.0',
      description: 'API para Escritório Tributário Virtual com agentes coordenadores e especialistas',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Query',
        description: 'Consultas tributárias via agentes',
      },
      {
        name: 'Admin',
        description: 'Endpoints administrativos',
      },
    ],
  },
  apis: ['./src/server/routes/*.ts'],
};
