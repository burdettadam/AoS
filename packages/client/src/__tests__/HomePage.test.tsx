import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProtectedRoute from "../components/ProtectedRoute";
import { KeycloakProvider } from "../context/KeycloakContext";
import HomePage from "../pages/HomePage";

// Mock Keycloak to avoid actual authentication in tests
const mockKeycloak = {
  init: vi.fn(() => Promise.resolve(false)), // Not authenticated
  login: vi.fn(),
  logout: vi.fn(),
  updateToken: vi.fn(() => Promise.resolve(false)),
  loadUserInfo: vi.fn(() => Promise.resolve({})),
  token: null,
};

vi.mock("keycloak-js", () => ({
  default: vi.fn(() => mockKeycloak),
}));

// Test wrapper component that matches the real app structure
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <KeycloakProvider>
    <BrowserRouter>
      <ProtectedRoute>{children}</ProtectedRoute>
    </BrowserRouter>
  </KeycloakProvider>
);

describe("HomePage with ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>,
    );

    // Should show loading state while Keycloak initializes
    expect(
      screen.getByText(/initializing authentication/i),
    ).toBeInTheDocument();
  });

  it("shows authentication redirect after initialization when not authenticated", async () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>,
    );

    // Wait for Keycloak initialization to complete and redirect to be triggered
    await waitFor(
      () => {
        expect(screen.getByText(/redirecting to login/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Verify that login method was called
    expect(mockKeycloak.login).toHaveBeenCalled();
  });
});
