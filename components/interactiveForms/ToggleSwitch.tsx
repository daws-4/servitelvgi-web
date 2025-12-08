"use client";

import React from "react";
import { motion } from "framer-motion";

interface ToggleSwitchProps {
    id: string;
    name: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    id,
    name,
    checked,
    onChange,
    label,
    description,
    disabled = false,
}) => {
    return (
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div>
                {label && (
                    <span className="text-sm font-bold text-blue-900 block">
                        {label}
                    </span>
                )}
                {description && (
                    <span className="text-xs text-blue-600">{description}</span>
                )}
            </div>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                    type="checkbox"
                    name={name}
                    id={id}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    className="sr-only"
                />
                <label
                    htmlFor={id}
                    className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${disabled ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                    style={{
                        backgroundColor: checked ? "#3e78b2" : "#d1d5db",
                    }}
                >
                    {/* Toggle Handle with layoutId animation */}
                    {checked ? (
                        <motion.div
                            layoutId={`toggle-handle-${id}`}
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                            transition={{
                                type: "spring",
                                stiffness: 350,
                                damping: 30
                            }}
                        />
                    ) : (
                        <motion.div
                            layoutId={`toggle-handle-${id}`}
                            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                            transition={{
                                type: "spring",
                                stiffness: 350,
                                damping: 30
                            }}
                        />
                    )}
                </label>
            </div>
        </div>
    );
};

export default ToggleSwitch;
