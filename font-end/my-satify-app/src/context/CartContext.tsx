import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface CartItem { productId?: string; name: string; price: number; image: string; qty: number; }

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
  add: (item: CartItem) => void;
  changeQty: (productId?: string, name?: string, delta?: number) => void;
  remove: (productId?: string, name?: string) => void;
  clear: () => void;
  replace: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem('satify_cart') || '[]'));
    } catch { setItems([]); }
  }, []);

  useEffect(() => {
    localStorage.setItem('satify_cart', JSON.stringify(items));
  }, [items]);

  const add: CartContextValue['add'] = (item) => {
    setItems(prev => {
      const idx = prev.findIndex(i => (item.productId ? i.productId === item.productId : i.name === item.name));
      if (idx >= 0) {
        const copy = prev.slice();
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + (item.qty || 1) };
        return copy;
      }
      return [...prev, { ...item, qty: item.qty || 1 }];
    });
  };

  const changeQty: CartContextValue['changeQty'] = (productId, name, delta = 1) => {
    setItems(prev => prev.map(i => {
      const match = productId ? i.productId === productId : i.name === name;
      return match ? { ...i, qty: Math.max(1, i.qty + delta) } : i;
    }));
  };

  const remove: CartContextValue['remove'] = (productId, name) => {
    setItems(prev => prev.filter(i => (productId ? i.productId !== productId : i.name !== name)));
  };

  const clear = () => setItems([]);
  const replace = (newItems: CartItem[]) => setItems(newItems);

  const totalQuantity = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const totalAmount = useMemo(() => items.reduce((s, i) => s + i.qty * i.price, 0), [items]);

  const value = useMemo(() => ({ items, totalQuantity, totalAmount, add, changeQty, remove, clear, replace }), [items, totalQuantity, totalAmount]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
