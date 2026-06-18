import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface UserProfile {
  user_id: string;
  email: string;
  phone: string;
  role: string;
  kyc_level: number;
  two_fa_enabled: boolean;
  created_at: string;
}

// Global cache to prevent redundant fetches
let cachedUser: UserProfile | null = null;
let fetchPromise: Promise<UserProfile> | null = null;

export function clearUserCache() {
  cachedUser = null;
  fetchPromise = null;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      if (cachedUser) {
        if (mounted) {
          setUser(cachedUser);
          setLoading(false);
        }
        return;
      }

      if (!fetchPromise) {
        fetchPromise = api.get<UserProfile>('/auth/me')
          .then((res) => {
            cachedUser = res;
            return res;
          })
          .catch((err) => {
            fetchPromise = null;
            throw err;
          });
      }

      try {
        const data = await fetchPromise;
        if (mounted) {
          setUser(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    return () => {
      mounted = false;
    };
  }, []);

  // Format initials from email (e.g., alex.morgan@gmail.com -> AM)
  const getInitials = (email: string) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  // Format name from email (e.g., alex.morgan@gmail.com -> Alex Morgan)
  const getName = (email: string) => {
    if (!email) return 'User';
    const parts = email.split('@')[0].split(/[._-]/);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  return { 
    user, 
    loading, 
    error,
    initials: user ? getInitials(user.email) : '',
    name: user ? getName(user.email) : '',
    tier: user ? (user.kyc_level >= 1 ? 'Verified' : 'Unverified') : '',
  };
}
