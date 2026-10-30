import { Page, Request, Response } from '@playwright/test';

interface ApiCall {
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: string;
  requestBody?: string;
  responseBody?: string;
  failed?: boolean;
  failureText?: string;
}

export class ApiMonitor {
  private calls: ApiCall[] = [];
  private attached = false;
  private readonly API_PATTERN = /\/api\//;

  constructor(private page: Page) {}

  async start(): Promise<void> {
    if (this.attached) return;
    this.attached = true;

    this.page.on('request', (request) => {
      if (this.shouldTrack(request)) {
        this.trackRequest(request);
      }
    });

    this.page.on('response', (response) => {
      if (this.shouldTrack(response.request())) {
        this.trackResponse(response);
      }
    });

    this.page.on('requestfailed', (request) => {
      if (this.shouldTrack(request)) {
        this.trackFailed(request);
      }
    });
  }

  private shouldTrack(request: Request): boolean {
    return this.API_PATTERN.test(request.url());
  }

  private trackRequest(request: Request): void {
    const url = request.url();
    const existing = this.calls.find((c) => c.url === url && !c.status);
    if (existing) {
      existing.requestBody = request.postData() || undefined;
      return;
    }
    this.calls.push({
      url,
      method: request.method(),
      status: 0,
      duration: 0,
      timestamp: new Date().toISOString(),
      requestBody: request.postData() || undefined,
    });
  }

  private async trackResponse(response: Response): Promise<void> {
    const url = response.url();
    const call = this.calls.find((c) => c.url === url && c.status === 0);
    if (!call) return;
    call.status = response.status();
    const startTime = new Date(call.timestamp).getTime();
    call.duration = Date.now() - startTime;
    try {
      const body = await response.text();
      call.responseBody = body.slice(0, 5000);
    } catch {
      // ignore body read errors
    }
  }

  private trackFailed(request: Request): void {
    const url = request.url();
    const call = this.calls.find((c) => c.url === url);
    if (!call) return;
    call.failed = true;
    call.failureText = request.failure()?.errorText;
  }

  getAll(): ApiCall[] {
    return [...this.calls];
  }

  getByEndpoint(pattern: string): ApiCall[] {
    return this.calls.filter((c) => c.url.includes(pattern));
  }

  getFailed(): ApiCall[] {
    return this.calls.filter((c) => c.failed || c.status >= 400);
  }

  getSuccessful(): ApiCall[] {
    return this.calls.filter((c) => c.status >= 200 && c.status < 300);
  }

  expectCallMade(endpoint: string, method: string = 'GET'): boolean {
    return this.calls.some(
      (c) => c.url.includes(endpoint) && c.method === method
    );
  }

  expectNoFailures(): void {
    const failed = this.getFailed();
    if (failed.length > 0) {
      throw new Error(
        `Expected no failed API calls, but got ${failed.length}:\n` +
          failed
            .map((c) => `  ${c.method} ${c.url} → ${c.status} ${c.failureText || ''}`)
            .join('\n')
      );
    }
  }

  clear(): void {
    this.calls = [];
  }

  printSummary(): string {
    const total = this.calls.length;
    const success = this.getSuccessful().length;
    const failed = this.getFailed().length;
    return `API 调用统计：总计 ${total}，成功 ${success}，失败 ${failed}`;
  }
}
