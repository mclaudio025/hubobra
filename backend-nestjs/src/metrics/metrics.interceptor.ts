import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { MetricsService } from "./metrics.service";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();

    // Incrementar contador de requests
    this.metricsService.incrementRequestCount();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        this.metricsService.recordRequestTime(responseTime);
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;

        // Registrar erro e tempo de resposta
        this.metricsService.incrementErrorCount();
        this.metricsService.recordRequestTime(responseTime);

        throw error;
      }),
    );
  }
}
