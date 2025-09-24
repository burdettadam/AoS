# Testing Guide

## 🧪 Testing Philosophy

This project follows a comprehensive testing strategy to ensure reliability, maintainability, and confidence in deployments.

## 🏗️ Testing Architecture

### **Testing Pyramid**

```
    /\     E2E Tests (Playwright)
   /  \    - Full user workflows
  /____\   - Cross-browser testing
 /      \
/________\  Integration Tests
           - API endpoints
           - Component integration
           - Database interactions

Unit Tests
- Business logic
- Pure functions
- Component behavior
```

## 🔧 Testing Stack

### **Unit Testing**

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW**: API mocking for isolated tests

### **Integration Testing**

- **Supertest**: HTTP endpoint testing
- **Test Database**: PostgreSQL test instance
- **Redis Mock**: In-memory Redis for tests

### **End-to-End Testing**

- **Playwright**: Cross-browser automation
- **Docker Compose**: Full environment setup
- **Visual Regression**: Screenshot comparison

## 📁 Test Organization

```
packages/
├── client/
│   ├── src/
│   │   ├── __tests__/           # Unit tests
│   │   ├── components/
│   │   │   └── __tests__/       # Component tests
│   │   └── utils/
│   │       └── __tests__/       # Utility tests
│   └── integration/             # Integration tests
├── server/
│   ├── __tests__/               # Unit tests
│   ├── src/
│   │   └── **/__tests__/        # Inline tests
│   └── integration/             # API tests
└── shared/
    └── src/
        └── __tests__/           # Shared utility tests

tests/
├── e2e/                         # End-to-end tests
├── fixtures/                    # Test data
└── utils/                       # Test utilities
```

## 🧪 Writing Tests

### **Unit Test Example**

```typescript
// packages/shared/src/utils/__tests__/gameLogic.test.ts
import { calculateScore } from "../gameLogic";

describe("calculateScore", () => {
  it("should calculate correct score for good team victory", () => {
    const gameState = {
      phase: "ended",
      winner: "good",
      players: 7,
      rounds: 3,
    };

    const score = calculateScore(gameState);

    expect(score.goodTeam).toBe(100);
    expect(score.evilTeam).toBe(0);
  });

  it("should handle edge case with no players", () => {
    const gameState = {
      phase: "ended",
      winner: "good",
      players: 0,
      rounds: 1,
    };

    expect(() => calculateScore(gameState)).toThrow("Invalid player count");
  });
});
```

### **Component Test Example**

```typescript
// packages/client/src/components/__tests__/PlayerCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerCard } from '../PlayerCard';

describe('PlayerCard', () => {
  const mockPlayer = {
    id: '1',
    name: 'Alice',
    character: 'Fortune Teller',
    isDead: false
  };

  it('should display player information', () => {
    render(<PlayerCard player={mockPlayer} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Fortune Teller')).toBeInTheDocument();
    expect(screen.queryByText('💀')).not.toBeInTheDocument();
  });

  it('should show death indicator for dead players', () => {
    const deadPlayer = { ...mockPlayer, isDead: true };
    render(<PlayerCard player={deadPlayer} />);

    expect(screen.getByText('💀')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const mockOnClick = jest.fn();
    render(<PlayerCard player={mockPlayer} onClick={mockOnClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(mockOnClick).toHaveBeenCalledWith(mockPlayer);
  });
});
```

### **API Test Example**

```typescript
// packages/server/__tests__/api/games.test.ts
import request from "supertest";
import { app } from "../../src/app";
import { setupTestDatabase, cleanupTestDatabase } from "../utils/database";

describe("Games API", () => {
  beforeAll(setupTestDatabase);
  afterAll(cleanupTestDatabase);

  describe("POST /api/games", () => {
    it("should create a new game", async () => {
      const gameData = {
        name: "Test Game",
        script: "trouble-brewing",
        maxPlayers: 8,
      };

      const response = await request(app)
        .post("/api/games")
        .send(gameData)
        .expect(201);

      expect(response.body.game).toMatchObject({
        name: "Test Game",
        script: "trouble-brewing",
        status: "waiting",
      });
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/games")
        .send({})
        .expect(400);

      expect(response.body.errors).toContain("name is required");
    });
  });
});
```

### **E2E Test Example**

```typescript
// tests/e2e/game-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Game Flow", () => {
  test("should complete a full game workflow", async ({ page }) => {
    // Create game
    await page.goto("/");
    await page.click('[data-testid="create-game"]');
    await page.fill('[data-testid="game-name"]', "E2E Test Game");
    await page.click('[data-testid="submit"]');

    // Join game
    await expect(page.locator('[data-testid="game-lobby"]')).toBeVisible();
    await page.click('[data-testid="join-game"]');

    // Verify player joined
    await expect(page.locator('[data-testid="player-list"]')).toContainText(
      "Player 1",
    );

    // Start game (as storyteller)
    await page.click('[data-testid="start-game"]');
    await expect(page.locator('[data-testid="game-board"]')).toBeVisible();
  });
});
```

## 🚀 Running Tests

### **Development Commands**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testPathPattern=games

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed
```

### **Package-Specific Tests**

```bash
# Client tests only
cd packages/client && npm test

# Server tests only
cd packages/server && npm test

# Shared tests only
cd packages/shared && npm test
```

### **CI/CD Test Commands**

```bash
# Full test suite (used in CI)
npm run test:ci

# Coverage report generation
npm run test:coverage:report

# E2E tests with Docker setup
npm run test:e2e:ci
```

## 📊 Coverage Requirements

### **Minimum Coverage Thresholds**

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### **Coverage Exclusions**

- Configuration files
- Test utilities
- Mock files
- Development scripts

### **Coverage Reporting**

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html

# Check coverage thresholds
npm run test:coverage:check
```

## 🔧 Test Configuration

### **Jest Configuration**

```javascript
// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/test/**/*",
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
};
```

### **Playwright Configuration**

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
```

## 🧪 Testing Best Practices

### **Unit Tests**

- **Test Behavior, Not Implementation**: Focus on what the code does, not how
- **One Assertion Per Test**: Keep tests focused and simple
- **Descriptive Names**: Test names should explain the scenario
- **Use Arrange-Act-Assert**: Structure tests clearly

### **Integration Tests**

- **Test Real Scenarios**: Use realistic data and workflows
- **Mock External Dependencies**: Keep tests fast and reliable
- **Test Error Conditions**: Verify error handling works correctly
- **Clean Up After Tests**: Ensure tests don't affect each other

### **E2E Tests**

- **Test Critical User Journeys**: Focus on the most important workflows
- **Use Data Attributes**: Target elements with `data-testid` attributes
- **Wait for Elements**: Use proper waits instead of hard delays
- **Parallel-Safe**: Design tests to run independently

### **Test Data Management**

- **Use Factories**: Create test data programmatically
- **Seed Minimal Data**: Only create data needed for the test
- **Clean State**: Start each test with a clean state
- **Realistic Data**: Use data that matches production patterns

## 🔍 Debugging Tests

### **Debug Unit Tests**

```bash
# Run tests in debug mode
npm test -- --runInBand --detectOpenHandles

# Debug specific test
npm test -- --testNamePattern="should calculate score"

# Debug with VS Code
# Set breakpoints and use "Debug Jest Tests" configuration
```

### **Debug E2E Tests**

```bash
# Run with browser visible
npm run test:e2e:headed

# Debug mode with devtools
npm run test:e2e:debug

# Step through tests
npx playwright test --debug
```

### **Common Issues**

- **Async/Await**: Make sure to await async operations
- **Test Isolation**: Tests failing when run together but passing individually
- **Timing Issues**: Race conditions in async tests
- **Memory Leaks**: Tests not cleaning up properly

## 📈 Continuous Testing

### **Pre-Commit Hooks**

- Run affected tests before commit
- Lint test files for quality
- Validate test coverage thresholds

### **CI/CD Integration**

- Run full test suite on every PR
- Generate coverage reports
- Fail builds on test failures
- Parallel test execution for speed

### **Quality Gates**

- Minimum coverage requirements
- No skipped tests in CI
- All tests must pass
- E2E tests for critical paths

---

**Remember**: Good tests are an investment in code quality and team productivity. Write tests that would help you debug issues six months from now! 🧪
