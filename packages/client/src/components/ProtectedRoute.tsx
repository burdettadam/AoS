import React, { useEffect } from 'react';
import { useKeycloak } from '../context/KeycloakContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { authenticated, loading, login } = useKeycloak();

  // Automatically redirect to Keycloak login when not authenticated
  useEffect(() => {
    if (!loading && !authenticated) {
      login();
    }
  }, [loading, authenticated, login]);

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
    // Show loading state while redirecting to Keycloak
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-clocktower-accent mx-auto mb-4"></div>
            <p>Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
