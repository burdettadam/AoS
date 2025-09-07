import jwt from 'jsonwebtoken';
import jwksClient, { SigningKey } from 'jwks-rsa';
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

interface KeycloakToken {
  sub: string;
  preferred_username?: string;
  email?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [clientId: string]: {
      roles: string[];
    };
  };
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: KeycloakToken;
  }
}

export class KeycloakAuth {
  private client: jwksClient.JwksClient;
  private issuer: string;

  constructor() {
    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const realm = process.env.KEYCLOAK_REALM || 'botct';
    
    this.issuer = `${keycloakUrl}/realms/${realm}`;
    this.client = jwksClient({
      jwksUri: `${this.issuer}/protocol/openid-connect/certs`,
      requestHeaders: {}, // Optional headers
      timeout: 30000 // Defaults to 30s
    });
  }

  private getKey = (header: any, callback: (err: Error | null, key?: string) => void) => {
    this.client.getSigningKey(header.kid, (err: Error | null, key?: SigningKey) => {
      if (err) {
        callback(err);
      } else {
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
      }
    });
  };

  public authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Missing or invalid authorization header' });
        return;
      }

      const token = authHeader.substring(7);

      const decoded = await new Promise<KeycloakToken>((resolve, reject) => {
        jwt.verify(token, this.getKey, {
          issuer: this.issuer,
          algorithms: ['RS256']
        }, (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded as KeycloakToken);
          }
        });
      });

      request.user = decoded;
    } catch (error) {
      logger.error('Authentication failed:', error);
      reply.code(401).send({ error: 'Invalid token' });
    }
  };

  public optional = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Continue without authentication
        return;
      }

      const token = authHeader.substring(7);

      const decoded = await new Promise<KeycloakToken>((resolve, reject) => {
        jwt.verify(token, this.getKey, {
          issuer: this.issuer,
          algorithms: ['RS256']
        }, (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded as KeycloakToken);
          }
        });
      });

      request.user = decoded;
    } catch (error) {
      // Log but don't fail the request for optional auth
      logger.debug('Optional authentication failed:', error);
    }
  };
}

export const keycloakAuth = new KeycloakAuth();
