"use client";

import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { addToast } from "@heroui/toast";

const toast = {
    success: (message: string) => addToast({ title: message, color: "success" }),
    error: (message: string) => addToast({ title: message, color: "danger" }),
};

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncLoading, setSyncLoading] = useState(false);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [editingUser, setEditingUser] = useState<any>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        surname: "",
        username: "",
        email: "",
        phoneNumber: "",
        password: "",
        isActive: true,
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/web/users");
            if (!res.ok) throw new Error("Error fetching users");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            toast.error("Error al cargar administradores");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (user: any = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name || "",
                surname: user.surname || "",
                username: user.username || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || "",
                password: "", // No mostramos la contraseña actual
                isActive: user.isActive !== false,
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: "",
                surname: "",
                username: "",
                email: "",
                phoneNumber: "",
                password: "",
                isActive: true,
            });
        }
        onOpen();
    };

    const handleSave = async (onClose: () => void) => {
        try {
            const url = "/api/web/users";
            const method = editingUser ? "PUT" : "POST";
            
            const payload: any = { ...formData };
            if (editingUser) {
                payload.id = editingUser._id;
                if (!payload.password) delete payload.password; // No actualizar contraseña si está vacía
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Error al guardar");
            }

            toast.success(editingUser ? "Administrador actualizado" : "Administrador creado");
            fetchUsers();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar este administrador?")) return;
        try {
            const res = await fetch(`/api/web/users?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error al eliminar");
            toast.success("Administrador eliminado");
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const setAutopilot = async (userId: string) => {
        const currentUser = users.find(u => u._id === userId);
        const newState = !(currentUser?.isAutopilot);

        // Optimistic UI update
        setUsers(prev => prev.map(user => 
            user._id === userId ? { ...user, isAutopilot: newState } : user
        ));

        try {
            const res = await fetch("/api/web/users/autopilot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId })
            });
            if (!res.ok) {
                throw new Error("Error al cambiar estado del piloto");
            }
            toast.success(newState ? "Piloto Automático activado" : "Piloto Automático desactivado");
            // Silent refresh to ensure sync
            fetchUsersSilently();
        } catch (error: any) {
            // Revert on error
            setUsers(prev => prev.map(user => 
                user._id === userId ? { ...user, isAutopilot: !newState } : user
            ));
            toast.error(error.message);
        }
    };

    const fetchUsersSilently = async () => {
        try {
            const res = await fetch("/api/web/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {}
    };

    const syncBacklog = async () => {
        if (!confirm("¿Deseas enviar todas las órdenes completadas pendientes que no se hayan enviado previamente?")) return;
        setSyncLoading(true);
        try {
            const res = await fetch("/api/web/orders/sync-backlog", {
                method: "POST"
            });
            if (!res.ok) throw new Error("Error al sincronizar");
            const data = await res.json();
            if (data.count === 0) {
                toast.success(data.message || "No hay órdenes pendientes.");
            } else {
                toast.success(`Se enviaron exitosamente ${data.count} de ${data.total} órdenes pendientes.`);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSyncLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50/50 p-6">
            <div className="bg-white shadow-sm flex items-center justify-between px-6 py-4 border-b border-neutral/20 mb-6 rounded-xl">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-primary">Gestión de Administradores</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button color="secondary" variant="flat" onPress={syncBacklog} isLoading={syncLoading}>
                        <i className="fa-solid fa-rotate"></i> Sincronizar Atrasadas
                    </Button>
                    <Button color="primary" onPress={() => handleOpenModal()} className="shadow-md shadow-primary/20">
                        <i className="fa-solid fa-user-plus"></i> Nuevo Administrador
                    </Button>
                </div>
            </div>

            <div className="bg-white flex-1 overflow-auto rounded-xl shadow-sm border border-neutral/10 p-4">
                <Table aria-label="Administradores" className="min-w-full" shadow="none">
                    <TableHeader>
                        <TableColumn>NOMBRE</TableColumn>
                        <TableColumn>USUARIO</TableColumn>
                        <TableColumn>CORREO</TableColumn>
                        <TableColumn>TELÉFONO</TableColumn>
                        <TableColumn>ESTADO</TableColumn>
                        <TableColumn>PILOTO</TableColumn>
                        <TableColumn>ACCIONES</TableColumn>
                    </TableHeader>
                    <TableBody isLoading={loading} items={users}>
                        {(item) => (
                            <TableRow key={item._id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                            {item.name?.charAt(0)}{item.surname?.charAt(0)}
                                        </div>
                                        <span className="font-medium text-gray-800">{item.name} {item.surname}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{item.username}</TableCell>
                                <TableCell>{item.email}</TableCell>
                                <TableCell>{item.phoneNumber || "-"}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                        {item.isActive ? "Activo" : "Inactivo"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {item.isAutopilot ? (
                                        <span onClick={() => setAutopilot(item._id)} className="flex items-center justify-center gap-1 text-yellow-600 font-bold text-xs uppercase tracking-wide cursor-pointer border border-yellow-200 px-2 py-1 rounded bg-yellow-50 hover:bg-yellow-100 transition-colors w-fit">
                                            <i className="fa-solid fa-star"></i> Piloto
                                        </span>
                                    ) : (
                                        <Button size="sm" variant="flat" color="default" onPress={() => setAutopilot(item._id)}>
                                            Activar Piloto
                                        </Button>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="flat" onPress={() => handleOpenModal(item)}>
                                            <i className="fa-solid fa-pen"></i> Editar
                                        </Button>
                                        <Button size="sm" color="danger" variant="flat" onPress={() => handleDelete(item._id)}>
                                            <i className="fa-solid fa-trash"></i> Eliminar
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {editingUser ? "Editar Administrador" : "Nuevo Administrador"}
                            </ModalHeader>
                            <ModalBody>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Nombre"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                    <Input
                                        label="Apellido"
                                        value={formData.surname}
                                        onChange={(e) => setFormData({...formData, surname: e.target.value})}
                                    />
                                </div>
                                <Input
                                    label="Usuario"
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                />
                                <Input
                                    label="Correo Electrónico"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                                <Input
                                    label="Teléfono"
                                    placeholder="Ej: +584141234567"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                />
                                <Input
                                    label={editingUser ? "Nueva Contraseña (opcional)" : "Contraseña"}
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                                <div className="flex items-center gap-2 mt-2">
                                    <Switch
                                        isSelected={formData.isActive}
                                        onValueChange={(val) => setFormData({...formData, isActive: val})}
                                    />
                                    <span className="text-sm font-medium text-gray-700">Usuario Activo</span>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>Cancelar</Button>
                                <Button color="primary" onPress={() => handleSave(onClose)}>Guardar</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
