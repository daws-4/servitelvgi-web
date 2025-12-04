"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { LoginCard } from '@/components/login/LoginCard';
import { LoginBackground } from '@/components/login/LoginBackground';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log("Submitting login form:", { usuario, password });

    try {
      const response = await axios.post('/api/auth/login', { usuario, password });
      console.log("Login successful:", response.data);
      router.push('/dashboard');
    } catch (error) {
      console.error("Login failed:", error);
      const serverMsg = (error as any)?.response?.data?.message || 'Credenciales inválidas';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center relative overflow-hidden bg-gray-100">
      {/* Background decorative elements */}
      <LoginBackground />

      {/* Login Card */}
      <LoginCard
        usuario={usuario}
        setUsuario={setUsuario}
        password={password}
        setPassword={setPassword}
        onSubmit={onSubmit}
        loading={loading}
        error={error}
      />
    </div>
  );
}