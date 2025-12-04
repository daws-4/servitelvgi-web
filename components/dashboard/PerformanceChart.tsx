"use client";
import React from "react";

export const PerformanceChart = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral/10 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-dark">Rendimiento Semanal</h3>
                <button className="text-xs text-primary hover:underline">Ver reporte completo</button>
            </div>
            <div className="relative h-64 w-full flex items-end justify-between px-4 pb-4 bg-gray-50/50 rounded-lg border border-neutral/5">
                {/* Visual Placeholder for Chart - Simple Bar Chart representation */}
                {[40, 65, 50, 60, 80, 45, 30].map((height, index) => (
                    <div key={index} className="w-full mx-1 flex flex-col justify-end h-full group relative">
                        <div
                            className="bg-primary/80 hover:bg-primary transition-all rounded-t-sm w-full"
                            style={{ height: `${height}%` }}
                        ></div>
                        <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-neutral">
                            {['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}
                        </div>
                    </div>
                ))}

                {/* Overlay Line (Simulated) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none p-4" preserveAspectRatio="none">
                    <path
                        d="M0,150 C50,140 100,160 150,155 C200,150 250,130 300,140 C350,150 400,170 450,165"
                        fill="none"
                        stroke="#004ba8"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        className="opacity-50"
                    />
                </svg>
            </div>
        </div>
    );
};
