"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardBody, Form, Input, Button } from '@heroui/react';
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
            router.push('/'); 
        } catch (error) {
            console.error("Login failed:", error);
            const serverMsg = (error as any)?.response?.data?.message || 'Credenciales inválidas';
            setError(serverMsg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='flex items-center justify-center '>
            <Card className='w-1/4 mt-28'>
                <CardHeader className=' flex items-center justify-center p-6'>
                    <h2>Bienvenido</h2>
                </CardHeader>
                <CardBody className='gap-4 p-6'>
                    <Form >
                        <Input name="user" placeholder="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
                        <Input name="password" type={showPassword ? "text" : "password"} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} endContent={
                            <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeCloseIcon /> : <EyeOpenIcon />}
                            </button>
                        } />
                    </Form>

                        <Button onPress={onSubmit} disabled={loading}>
                            {loading ? 'Cargando...' : 'Iniciar sesión'}
                        </Button>
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </CardBody>
            </Card>
        </div>
    );
}