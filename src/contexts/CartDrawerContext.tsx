import { createContext, useContext, useState, ReactNode } from 'react';

interface CartDrawerContextType {
    isCartDrawerOpen: boolean;
    setIsCartDrawerOpen: (isOpen: boolean) => void;
    openCartDrawer: () => void;
    closeCartDrawer: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextType | undefined>(undefined);

export function CartDrawerProvider({ children }: { children: ReactNode }) {
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

    const openCartDrawer = () => setIsCartDrawerOpen(true);
    const closeCartDrawer = () => setIsCartDrawerOpen(false);

    return (
        <CartDrawerContext.Provider value={{ isCartDrawerOpen, setIsCartDrawerOpen, openCartDrawer, closeCartDrawer }}>
            {children}
        </CartDrawerContext.Provider>
    );
}

export function useCartDrawer() {
    const context = useContext(CartDrawerContext);
    if (context === undefined) {
        throw new Error('useCartDrawer must be used within a CartDrawerProvider');
    }
    return context;
}
