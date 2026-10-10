import type { UserRole } from './api';

/** Abas do painel. Cada uma corresponde a uma rota `/admin/<aba>` da API. */
export type Resource = 'articles' | 'categories' | 'sponsors' | 'campaigns' | 'media' | 'leads' | 'users';

/** Abas de cada perfil, espelhando o que a API permite (ela responde 403 ao resto). */
export const tabsByRole: Record<UserRole, Resource[]> = {
  admin: ['articles', 'categories', 'sponsors', 'campaigns', 'media', 'leads', 'users'],
  editor: ['articles', 'categories', 'media'],
  reporter: ['articles', 'media'],
};

export const roleNames: Record<UserRole, string> = { admin: 'Administrador', editor: 'Editor (redator)', reporter: 'Repórter' };

export const canAccess = (role: UserRole, tab: string): tab is Resource => (tabsByRole[role] as string[]).includes(tab);
