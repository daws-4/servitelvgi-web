"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardBody, Form, Input, Button, addToast } from '@heroui/react';
import { EyeCloseIcon, EyeOpenIcon } from '@/components/icons';
import { useRouter } from 'next/navigation';


export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (ev?: any) => {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    setLoading(true);
    setError(null);
    console.log("Submitting login form:", { usuario, password });

    try {
      const response = await axios.post('/api/auth/login', { usuario, password });
      console.log("Login successful:", response.data);
      addToast({
        title: "Éxito",
        description: "Inicio de sesión exitoso",
        color: 'success',
        onClose: () => router.push('/'),
      })
    } catch (error) {
      console.error("Login failed:", error);
      addToast({
        title: "Error",
        description: "Inicio de sesión fallido",
        color: 'danger',
      })
      const serverMsg = (error as any)?.response?.data?.message || 'Credenciales inválidas';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#7D8CA3]'>
      <Card className='w-full max-w-md mt-12 shadow-lg'>
        <CardHeader className='flex items-center justify-center p-6'>
          <h2 className='text-2xl font-semibold text-[#0f0f0f]'>Bienvenido</h2>
        </CardHeader>
        <CardBody className='gap-6 p-8 '>
          <Form className=''>
            <Input
              name="user"
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className='text-xl py-4 '
            />
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='text-xl py-4'
              endContent={
                <button className='cursor-pointer px-2' type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeCloseIcon className='w-6 h-6' /> : <EyeOpenIcon className='w-6 h-6' />}
                </button>
              }
            />

            <Button
              onPress={onSubmit}
              disabled={loading}
              className='block mx-auto  w-1/2 text-lg bg-[#3e78b2] hover:bg-[#004ba8] text-white rounded'
            >
              {loading ? 'Cargando...' : 'Iniciar sesión'}
            </Button>
          </Form>
          {error && <p className="text-red-500 mt-3 text-base">{error}</p>}
        </CardBody>
      </Card>
    </div>
  );
}