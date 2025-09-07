declare module 'jwks-client' {
  export interface SigningKey {
    getPublicKey(): string;
  }

  export interface JwksClient {
    getSigningKey(kid: string, callback: (err: Error | null, key?: SigningKey) => void): void;
  }

  export interface ClientOptions {
    jwksUri: string;
    requestHeaders?: Record<string, string>;
    timeout?: number;
  }

  export default function jwksClient(options: ClientOptions): JwksClient;
}
