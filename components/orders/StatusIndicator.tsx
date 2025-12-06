"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface StatusIndicatorProps {
    isAssigned: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ isAssigned }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-3 rounded-lg border transition-colors duration-300 ${isAssigned
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
        >
            <p className="text-xs font-bold mb-1 uppercase tracking-wide text-gray-500">
                Estado Inicial
            </p>
            <div className="flex items-center gap-2">
                <motion.span
                    animate={{
                        scale: isAssigned ? 1 : [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: isAssigned ? 0 : Infinity,
                    }}
                    className={`w-2.5 h-2.5 rounded-full ${isAssigned ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                />
                <span
                    className={`text-sm font-bold ${isAssigned ? 'text-blue-700' : 'text-yellow-700'
                        }`}
                >
                    {isAssigned ? 'Asignada' : 'Pendiente'}
                </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
                {isAssigned
                    ? 'Técnico seleccionado. La orden se enviará a su móvil.'
                    : 'La orden se creará como pendiente por asignar.'}
            </p>
        </motion.div>
    );
};

export default StatusIndicator;
