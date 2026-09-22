import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { CustomLoggerService } from "./logger.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Adicionar ID único à requisição para rastreamento
    request.id = uuidv4();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        this.logger.logRequest(request, response, responseTime);
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;

        // Log do erro
        this.logger.error(
          `Error in ${request.method} ${request.url}`,
          error.stack,
          {
            method: request.method,
            url: request.url,
            statusCode: error.status || 500,
            responseTime,
            ip: request.ip,
            userAgent: request.get("User-Agent"),
            userId: request.user?.id,
            requestId: request.id,
            errorName: error.name,
            errorMessage: error.message,
          },
        );

        throw error;
      }),
    );
  }
}
