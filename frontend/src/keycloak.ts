import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'http://auth.docuprocess.local',
  realm: 'docuprocess-enterprise',
  clientId: 'docuprocess-frontend'
};

export const keycloak = new Keycloak(keycloakConfig);

export interface UserProfile {
  authenticated: boolean;
  username?: string;
  email?: string;
  roles: string[];
  tenantId: string;
  token?: string;
}

export const getMockEnterpriseProfile = (role: 'TENANT_ADMIN' | 'DOCUMENT_OPERATOR' | 'AUDITOR' = 'TENANT_ADMIN'): UserProfile => {
  return {
    authenticated: true,
    username: role === 'AUDITOR' ? 'auditor@docuprocess.com' : role === 'DOCUMENT_OPERATOR' ? 'operator@docuprocess.com' : 'admin@docuprocess.com',
    email: role === 'AUDITOR' ? 'auditor@docuprocess.com' : role === 'DOCUMENT_OPERATOR' ? 'operator@docuprocess.com' : 'admin@docuprocess.com',
    roles: [role],
    tenantId: 'tenant-enterprise-icesi',
    token: 'mock-jwt-token-icesi-demo'
  };
};
