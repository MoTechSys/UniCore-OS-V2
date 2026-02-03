/**
 * Logout Server Action
 * 
 * Handles user logout using NextAuth signOut.
 * 
 * @module features/auth/actions/logout
 */

'use server'

import { signOut } from '@/lib/auth'

/**
 * Sign out the current user
 * 
 * @returns Redirects to login page
 */
export async function logout() {
  await signOut({ redirectTo: '/login' })
}
