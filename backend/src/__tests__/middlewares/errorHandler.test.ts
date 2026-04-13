import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import multer from 'multer';
import { errorHandler } from '../../presentation/middlewares/errorHandler';
import {
  AppError,
  NotFoundError,
  ValidationError,
} from '../../domain/errors/AppError';

const mockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

const mockReq = () => ({} as Request);
const mockNext = (() => {}) as NextFunction;

describe('errorHandler', () => {
  it('handles AppError with correct statusCode and code', () => {
    const err = new NotFoundError('Tender');
    const res = mockRes();

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'Tender not found' },
    });
  });

  it('handles ValidationError as 400', () => {
    const err = new ValidationError('bad input');
    const res = mockRes();

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'VALIDATION_ERROR', message: 'bad input' },
    });
  });

  it('handles ZodError as 400 with joined messages', () => {
    const issues: ZodIssue[] = [
      { code: 'too_small', minimum: 1, type: 'number', inclusive: true, exact: false, message: 'Required', path: ['amount'] },
      { code: 'too_small', minimum: 20, type: 'string', inclusive: true, exact: false, message: 'Too short', path: ['proposal'] },
    ];
    const err = new ZodError(issues);
    const res = mockRes();

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('amount'),
      },
    });
  });

  it('handles multer LIMIT_FILE_SIZE error', () => {
    const err = new multer.MulterError('LIMIT_FILE_SIZE');
    const res = mockRes();

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UPLOAD_ERROR', message: 'File size must be less than 5 MB' },
    });
  });

  it('handles generic multer error', () => {
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    const res = mockRes();

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UPLOAD_ERROR', message: expect.stringContaining('Upload error') },
    });
  });

  it('handles unknown errors as 500', () => {
    const err = new Error('something broke');
    const res = mockRes();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });

    consoleSpy.mockRestore();
  });
});
