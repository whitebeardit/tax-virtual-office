import { describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validation.js';

jest.mock('../../utils/logger.js', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({ warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() })),
  },
}));

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  it('should validate body schema and call next on valid data', () => {
    const schema = z.object({
      question: z.string().min(1),
    });
    
    mockRequest.body = { question: 'Test question' };
    
    const middleware = validate({ body: schema });
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 400 on invalid body data', () => {
    const schema = z.object({
      question: z.string().min(1),
    });
    
    mockRequest.body = { question: '' }; // Invalid: empty string
    
    const middleware = validate({ body: schema });
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'validation_error',
        message: 'Invalid request data',
        details: expect.any(Array),
      })
    );
  });

  it('should validate query parameters', () => {
    const schema = z.object({
      page: z.string().optional(),
    });
    
    mockRequest.query = { page: '1' };
    
    const middleware = validate({ query: schema });
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should validate params', () => {
    const schema = z.object({
      id: z.string().uuid(),
    });
    
    mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    
    const middleware = validate({ params: schema });
    middleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
  });
});
