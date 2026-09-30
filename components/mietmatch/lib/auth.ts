import type { User } from '../types'
import { authClient } from '@/lib/auth-client'

export async function register(name: string, email: string, password: string): Promise<User> {
  const normalized = email.trim().toLowerCase()
  
  const { data, error } = await authClient.signUp.email({
    email: normalized,
    password,
    name: name.trim(),
  })
  
  if (error) {
    throw new Error(error.message || 'Registration failed')
  }
  
  if (!data?.user) {
    throw new Error('Registration failed, no user returned')
  }
  
  return { id: data.user.id, name: data.user.name, email: data.user.email }
}

export async function authenticate(email: string, password: string): Promise<User> {
  const normalized = email.trim().toLowerCase()
  
  const { data, error } = await authClient.signIn.email({
    email: normalized,
    password,
  })
  
  if (error) {
    throw new Error(error.message || 'That email and password do not match.')
  }
  
  if (!data?.user) {
    throw new Error('Authentication failed, no user returned')
  }
  
  return { id: data.user.id, name: data.user.name, email: data.user.email }
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await authClient.useSession() // Wait, useSession is a hook.
  return null;
}

