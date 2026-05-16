export const RESOURCES = [
  'user',
  'role',
  'permission',
  'policy',
  'pet',
  'species',
  'breed',
  'pet-image',
  'medical-record',
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'list',
  'assign',
] as const;

export type Action = (typeof ACTIONS)[number];

export type WildcardPermissionKey = `${Resource}:${Action | '*'}` | '*';

export type PermissionKey = `${Resource}:${Action}` | WildcardPermissionKey;
