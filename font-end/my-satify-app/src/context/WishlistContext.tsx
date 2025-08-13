import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface WishlistContextValue {
  ids: string[];
  isFav: (id?: string) => boolean;
  toggle: (id?: string) => void;
  add: (id?: string) => void;
  remove: (id?: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};

const STORAGE_KEY = 'satify_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      setIds(Array.isArray(arr) ? arr : []);
    } catch {
      setIds([]);
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch {}
  }, [ids]);

  const add = useCallback((id?: string) => {
    if (!id) return;
    setIds((prev) => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const remove = useCallback((id?: string) => {
    if (!id) return;
    setIds((prev) => prev.filter(x => x !== id));
  }, []);

  const toggle = useCallback((id?: string) => {
    if (!id) return;
    setIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const isFav = useCallback((id?: string) => !!id && ids.includes(id), [ids]);

  const value = useMemo(() => ({ ids, isFav, toggle, add, remove }), [ids, isFav, toggle, add, remove]);

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
};
