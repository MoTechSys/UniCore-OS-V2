/**
 * Session Provider Component
 * 
 * Wraps the application with NextAuth SessionProvider for client-side session access.
 * 
 * @module components/providers/SessionProvider
 */

'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

interface SessionProviderProps {
  children: ReactNode
}

/**
 * Client-side session provider wrapper
 * 
 * This component wraps the NextAuth SessionProvider to provide
 * session data to client components throughout the application.
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  )
}
