'use client'

import { Button } from "@heroui/react";
import axios from "axios";
import { useRouter } from "next/navigation";

export const LogoutButton = () => {
    const router = useRouter();
    const logout = async () => {
        const logout = await axios.get('/api/auth/logout')
        if (logout.status === 200) {
            console.log("Logout successful:", logout.data);
            router.push('/login');
        }
        if (logout.status !== 200) {
            console.error("Logout failed:", logout.data);
        }
    }
    return <Button className='w-full text-left px-3 py-2 rounded transition-colors duration-150 text-black hover:bg-[#ffd166] hover:text-[#08203a] focus:outline-none focus:ring-2 focus:ring-[#ffd166]' onPress={logout}>Logout</Button>;
}

