import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * EditorOnly renders children only when currentUser has the 'editor' role.
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.fallback=null]
 */
export function EditorOnly({ children, fallback = null }) {
  const { userRole } = useAuth();
  const isEditor = userRole && userRole.toString().toLowerCase() === 'editor';

  if (!isEditor) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * CreatorOnly renders children only when currentUser has the 'creator' role.
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.fallback=null]
 */
export function CreatorOnly({ children, fallback = null }) {
  const { userRole } = useAuth();
  const isCreator = userRole && userRole.toString().toLowerCase() === 'creator';

  if (!isCreator) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * General RoleGate component to enforce required roles.
 * @param {Object} props
 * @param {'editor' | 'creator' | Array<'editor' | 'creator'>} props.allow
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.fallback=null]
 */
export function RoleGate({ allow, children, fallback = null }) {
  const { userRole } = useAuth();
  const current = userRole ? userRole.toString().toLowerCase() : '';

  const allowedList = Array.isArray(allow)
    ? allow.map((r) => r.toLowerCase())
    : [allow?.toString().toLowerCase()];

  if (!allowedList.includes(current)) {
    return fallback;
  }

  return <>{children}</>;
}

export default EditorOnly;
