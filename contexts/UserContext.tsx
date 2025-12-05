"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// User interface matching the API response
export interface User {
    _id: string;
    username: string;
    name: string;
    surname: string;
    role: string;
    email: string;
}

// Context value interface
interface UserContextValue {
    user: User | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// Create the context
const UserContext = createContext<UserContextValue | undefined>(undefined);

// Provider component
export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch("/api/auth/me");

            if (!response.ok) {
                throw new Error("Failed to fetch user data");
            }

            const data = await response.json();
            setUser(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, error, refetch: fetchUser }}>
            {children}
        </UserContext.Provider>
    );
}

// Custom hook to use the user context
export function useUser() {
    const context = useContext(UserContext);

    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }

    return context;
}
