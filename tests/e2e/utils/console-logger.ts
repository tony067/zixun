import { Page } from '@playwright/test';

interface ConsoleEntry {
  type: string;
  text: string;
  url?: string;
  lineNumber?: number;
  timestamp: string;
}

export class ConsoleCollector {
  private entries: ConsoleEntry[] = [];
  private attached = false;

  constructor(private page: Page) {}

  async start(): Promise<void> {
    if (this.attached) return;
    this.attached = true;

    this.page.on('console', (msg) => {
      this.entries.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
      });
    });

    this.page.on('pageerror', (err) => {
      this.entries.push({
        type: 'error',
        text: err.message,
        url: err.stack,
        timestamp: new Date().toISOString(),
      });
    });
  }

  getAll(): ConsoleEntry[] {
    return [...this.entries];
  }

  getByType(type: string): ConsoleEntry[] {
    return this.entries.filter((e) => e.type === type);
  }

  getErrors(): ConsoleEntry[] {
    return this.getByType('error');
  }

  getWarnings(): ConsoleEntry[] {
    return this.getByType('warning');
  }

  getApiLogs(): ConsoleEntry[] {
    return this.entries.filter((e) => e.text.includes('[API]'));
  }

  expectNoErrors(): void {
    const errors = this.getErrors();
    if (errors.length > 0) {
      throw new Error(
        `Expected no console errors, but got ${errors.length}:\n` +
          errors.map((e) => `  [${e.timestamp}] ${e.text}`).join('\n')
      );
    }
  }

  expectApiCalled(endpoint: string): boolean {
    return this.getApiLogs().some((e) => e.text.includes(endpoint));
  }

  clear(): void {
    this.entries = [];
  }
}
