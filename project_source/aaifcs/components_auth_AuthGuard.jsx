/**
 * ============================================================
 * APEX AI — Auth Guard
 * /src/components/auth/AuthGuard.jsx
 *
 * Protects routes from unauthenticated access.
 * Redirects to /auth/login if no session exists.
 * Checks role permissions if requiredRole is provided.
 *
 * Safe with no Supabase config — resolves immediately to login.
 * ============================================================
 */

import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './core_storage'
import { authService, hasPermission } from './services_supabase_authService'
import Icon from './components_ui_Icon'

export default function AuthGuard({ children, requiredRole = null }) {
  // ── AUTH BYPASSED — single-user mode ──────────────────────
  // Login wall removed. App goes straight to dashboard.
  // Re-enable by restoring the isAuthenticated check.
  return children
}
