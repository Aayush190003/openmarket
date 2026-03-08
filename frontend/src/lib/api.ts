const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiError extends Error {
    status: number;
    data: any;
    constructor(message: string, status: number, data?: any) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('om_token') : null;

    const config: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
        ...options,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new ApiError(data.error || 'Request failed', res.status, data);
    }
    return data as T;
}

// ── Auth ──────────────────────────────────────────
export const auth = {
    register: (body: { username: string; email: string; password: string; phone?: string }) =>
        request<{ message: string; user: any; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
        request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    me: () => request<{ user: any }>('/users/me'),
};

// ── Wallet ────────────────────────────────────────
export const wallet = {
    balance: () => request<{ wallet: any }>('/wallet/balance'),

    deposit: (amount: number, paymentMethod?: string) =>
        request<{ wallet: any; transaction: any }>('/wallet/deposit', {
            method: 'POST',
            body: JSON.stringify({ amount, payment_method: paymentMethod || 'razorpay' }),
        }),

    withdraw: (amount: number) =>
        request<{ wallet: any; transaction: any }>('/wallet/withdraw', {
            method: 'POST',
            body: JSON.stringify({ amount }),
        }),
};

// ── Matches ───────────────────────────────────────
export const matches = {
    list: (status?: string) => {
        const params = status ? `?status=${status}` : '';
        return request<{ matches: any[] }>(`/matches${params}`);
    },

    get: (id: string) => request<{ match: any }>(`/matches/${id}`),

    markets: (matchId: string) => request<{ markets: any[] }>(`/matches/${matchId}/markets`),
};

// ── Markets ───────────────────────────────────────
export const markets = {
    get: (id: string) => request<{ market: any }>(`/markets/${id}`),

    trade: (marketId: string, side: 'yes' | 'no', amount: number) =>
        request<{ message: string; order: any; wallet: any; market: any; warnings: string[] }>(
            `/markets/${marketId}/trade`,
            { method: 'POST', body: JSON.stringify({ side, amount }) }
        ),
};

// ── Portfolio ─────────────────────────────────────
export const portfolio = {
    get: () => request<{ positions: any[]; summary: any }>('/portfolio'),
};

// ── Leaderboard ───────────────────────────────────
export const leaderboard = {
    get: () => request<{ leaderboard: any[] }>('/leaderboard'),
};

// ── Transactions ──────────────────────────────────
export const transactions = {
    list: (type?: string) => {
        const params = type ? `?type=${type}` : '';
        return request<{ transactions: any[] }>(`/transactions${params}`);
    },
};

// ── Payments (Razorpay) ───────────────────────────
export const payments = {
    createOrder: (amount: number) =>
        request<{ order_id: string; amount: number; currency: string; key_id: string }>(
            '/payments/create-order',
            { method: 'POST', body: JSON.stringify({ amount }) }
        ),

    verify: (body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
        request<{ success: boolean; wallet: any }>('/payments/verify', {
            method: 'POST',
            body: JSON.stringify(body),
        }),
};

// ── Admin ─────────────────────────────────────────
export const admin = {
    stats: () => request<any>('/admin/stats'),
    users: (page = 1) => request<{ users: any[]; total: number }>(`/admin/users?page=${page}`),
    banUser: (userId: string, reason: string) =>
        request<any>(`/admin/users/${userId}/ban`, { method: 'POST', body: JSON.stringify({ reason }) }),
    antiCheatLogs: () => request<{ logs: any[] }>('/admin/anticheat'),
};

export { ApiError };
export default { auth, wallet, matches, markets, portfolio, leaderboard, transactions, payments, admin };
