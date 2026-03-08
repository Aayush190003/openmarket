'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { auth as authApi, wallet as walletApi, ApiError } from '@/lib/api';

interface User {
    id: string;
    username: string;
    email: string;
    phone?: string;
    role: 'user' | 'admin';
    kyc_status: string;
}

interface WalletData {
    id: string;
    balance: number;
    locked_balance: number;
    total_deposited: number;
    total_withdrawn: number;
    total_won: number;
    total_lost: number;
    currency: string;
}

interface AuthState {
    user: User | null;
    wallet: WalletData | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string, phone?: string) => Promise<void>;
    logout: () => void;
    refreshWallet: () => Promise<void>;
    isAdmin: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        wallet: null,
        token: typeof window !== 'undefined' ? localStorage.getItem('om_token') : null,
        loading: true,
        error: null,
    });

    // Load user on mount if token exists
    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('om_token');
            if (!token) {
                setState(s => ({ ...s, loading: false }));
                return;
            }
            try {
                const { user } = await authApi.me();
                const { wallet } = await walletApi.balance();
                setState({ user, wallet, token, loading: false, error: null });
            } catch {
                localStorage.removeItem('om_token');
                setState({ user: null, wallet: null, token: null, loading: false, error: null });
            }
        };
        init();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setState(s => ({ ...s, loading: true, error: null }));
        try {
            const { user, token } = await authApi.login({ email, password });
            localStorage.setItem('om_token', token);
            const { wallet } = await walletApi.balance();
            setState({ user, wallet, token, loading: false, error: null });
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Login failed';
            setState(s => ({ ...s, loading: false, error: msg }));
            throw err;
        }
    }, []);

    const register = useCallback(async (username: string, email: string, password: string, phone?: string) => {
        setState(s => ({ ...s, loading: true, error: null }));
        try {
            const { user, token } = await authApi.register({ username, email, password, phone });
            localStorage.setItem('om_token', token);
            const { wallet } = await walletApi.balance();
            setState({ user, wallet, token, loading: false, error: null });
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Registration failed';
            setState(s => ({ ...s, loading: false, error: msg }));
            throw err;
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('om_token');
        setState({ user: null, wallet: null, token: null, loading: false, error: null });
    }, []);

    const refreshWallet = useCallback(async () => {
        try {
            const { wallet } = await walletApi.balance();
            setState(s => ({ ...s, wallet }));
        } catch { /* silent fail */ }
    }, []);

    const value: AuthContextType = {
        ...state,
        login,
        register,
        logout,
        refreshWallet,
        isAdmin: state.user?.role === 'admin',
        isAuthenticated: !!state.user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export default AuthContext;
