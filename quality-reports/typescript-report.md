## TypeScript Analysis Results

### Shared Package

> @botc/shared@0.1.0 build
> npm run clean && npm run build:cjs && npm run build:esm && npm run build:types

> @botc/shared@0.1.0 clean
> rm -rf dist

> @botc/shared@0.1.0 build:cjs
> tsc -p tsconfig.cjs.json

> @botc/shared@0.1.0 build:esm
> tsc -p tsconfig.esm.json

> @botc/shared@0.1.0 build:types
> tsc -p tsconfig.types.json

### Server Package

### Client Package

[96msrc/components/ErrorBoundary.tsx[0m:[93m1[0m:[93m8[0m - [91merror[0m[90m TS6133: [0m'React' is declared but its value is never read.

[7m1[0m import React, { Component, ErrorInfo, ReactNode } from 'react';
[7m [0m [91m ~~~~~[0m

[96msrc/test/setup.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS6133: [0m'expect' is declared but its value is never read.

[7m1[0m import { expect, afterEach } from 'vitest';
[7m [0m [91m ~~~~~~[0m

[96msrc/test/setup.ts[0m:[93m45[0m:[93m8[0m - [91merror[0m[90m TS6133: [0m'data' is declared but its value is never read.

[7m45[0m send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
[7m [0m [91m ~~~~[0m

[96msrc/utils/performance.ts[0m:[93m1[0m:[93m57[0m - [91merror[0m[90m TS2307: [0mCannot find module 'web-vitals' or its corresponding type declarations.

[7m1[0m import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
[7m [0m [91m ~~~~~~~~~~~~[0m

[96msrc/utils/performance.ts[0m:[93m69[0m:[93m7[0m - [91merror[0m[90m TS2322: [0mType 'typeof WebSocket' is not assignable to type '{ new (url: string | URL, protocols?: string | string[] | undefined): WebSocket; prototype: WebSocket; readonly CONNECTING: 0; readonly OPEN: 1; readonly CLOSING: 2; readonly CLOSED: 3; }'.
Types of construct signatures are incompatible.
Type 'new (url: string, protocols?: string | string[] | undefined) => WebSocket' is not assignable to type 'new (url: string | URL, protocols?: string | string[] | undefined) => WebSocket'.
Types of parameters 'url' and 'url' are incompatible.
Type 'string | URL' is not assignable to type 'string'.
Type 'URL' is not assignable to type 'string'.

[7m69[0m window.WebSocket = class extends originalWebSocket {
[7m [0m [91m ~~~~~~~~~~~~~~~~[0m

Found 5 errors in 3 files.

Errors Files
1 src/components/ErrorBoundary.tsx[90m:1[0m
2 src/test/setup.ts[90m:1[0m
2 src/utils/performance.ts[90m:1[0m
❌ Client package has type errors
