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
  'adoption-request',
  'pet-post',
  'pet-post-comment',
  'blog',
  'blog-comment',
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
