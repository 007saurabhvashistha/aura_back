/** Error carrying an HTTP status code, thrown by services and mapped by the error handler. */
export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, message: string, code = 'error') {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
  }

  static badRequest(message: string, code = 'bad_request'): HttpError {
    return new HttpError(400, message, code);
  }

  static unauthorized(message = 'Unauthorized', code = 'unauthorized'): HttpError {
    return new HttpError(401, message, code);
  }

  static conflict(message: string, code = 'conflict'): HttpError {
    return new HttpError(409, message, code);
  }

  static notFound(message = 'Not found', code = 'not_found'): HttpError {
    return new HttpError(404, message, code);
  }

  static forbidden(message = 'Forbidden', code = 'forbidden'): HttpError {
    return new HttpError(403, message, code);
  }
}
