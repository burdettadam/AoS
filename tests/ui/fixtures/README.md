# Playwright Test Fixtures

This directory contains reusable test fixtures for Playwright tests, making it easier to write maintainable and consistent tests.

## Overview

The fixture system provides common functionality for:
- **Authentication**: Login different user types, multi-user scenarios
- **Navigation**: Go to different pages, wait for loading states
- **Game Management**: Create games, join games, select scripts

## Usage

```typescript
import { test, expect } from './fixtures';

test.describe('My Test Suite', () => {
  test('should login and create game', async ({ loginAsUser, createGame }) => {
    const user = await loginAsUser('testuser');
    const gameId = await createGame({ name: 'My Game', isPublic: false });
    
    expect(user.username).toBe('testuser');
    expect(gameId).toBeTruthy();
  });
});
```

## Available Fixtures

### Authentication Fixtures

- `loginAsUser(username: string)` - Login as any user
- `loginMultipleUsers(count: number)` - Login multiple users in separate contexts
- Returns `AuthenticatedUser` object with username, displayName, email

### Game Fixtures

- `createGame(options?: { name?: string; isPublic?: boolean })` - Create a new game
- `goToLobby(gameId?: string)` - Navigate to lobby (create new or join existing)  
- `selectScript(scriptName: string)` - Select a script in the lobby

### Multi-User Testing

For tests requiring multiple users:

```typescript
test('multi-user scenario', async ({ loginMultipleUsers, browser }) => {
  const { users, cleanup } = await loginMultipleUsers(3);
  
  // Test with multiple authenticated users
  expect(users).toHaveLength(3);
  
  // Always cleanup
  await cleanup();
});
```

For complex scenarios requiring different browser contexts:

```typescript
test('storyteller and players', async ({ browser }) => {
  const storytellerContext = await browser.newContext();
  const playerContext = await browser.newContext();
  
  try {
    // Use separate pages for each user
    const storytellerPage = await storytellerContext.newPage();
    const playerPage = await playerContext.newPage();
    
    // Your test logic here...
    
  } finally {
    await storytellerContext.close();
    await playerContext.close();
  }
});
```

## Benefits

1. **Consistency**: All tests use the same login/setup procedures
2. **Maintainability**: Changes to auth flow only need to be updated in fixtures
3. **Readability**: Tests focus on what they're testing, not setup boilerplate  
4. **Multi-User Support**: Easy to test scenarios with multiple simultaneous users
5. **Reusability**: Common workflows are available across all test suites

## Files

- `base.fixture.ts` - Main fixture definitions and implementations
- `index.ts` - Export interface for importing fixtures
- `types.ts` - TypeScript interfaces for fixture return types
- Example usage in `multi-user.spec.ts` and `lobby-refactored-example.spec.ts`

## Configuration

The fixtures are configured to work with:
- Application running on `http://localhost:3001` 
- Keycloak authentication at `/realms/botct/protocol/openid-connect/auth`
- Default test password: `password`
- Playwright config with workers: 1, retries: 2, timeout: 60000ms

## Next Steps

1. Refactor existing tests to use fixtures for cleaner code
2. Add more specialized fixtures as needed (character selection, game actions, etc.)
3. Extend multi-user capabilities for complex game scenarios
4. Add fixtures for UI testing (screenshot comparisons, element interactions)