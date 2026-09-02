import { InjectionToken } from '@angular/core';

// Provided in server.ts with the Express Response object.
// Optional — always null in the browser.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SSR_RESPONSE = new InjectionToken<any>('SSR_RESPONSE');
