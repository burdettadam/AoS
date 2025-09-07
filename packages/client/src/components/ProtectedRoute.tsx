import React from 'react';
import { useKeycloak } from '../context/KeycloakContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { authenticated, loading, login } = useKeycloak();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-clocktower-accent mx-auto mb-4"></div>
            <p>Initializing authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="mb-6">You need to log in to access BotC Digital.</p>
            <button
              onClick={login}
              className="btn-primary w-full"
            >
              Login with Keycloak
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
