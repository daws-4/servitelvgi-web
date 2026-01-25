"use client";

import { useEffect, useState } from "react";
import { parseDataUsageToMB, getTodayGMTMinus4, getRangeForInterval } from "@/lib/dataUsageHelpers";

export function DataUsageSection({ installerId }: { installerId: string }) {
    // State for filtering
    const [startDate, setStartDate] = useState<string>(getTodayGMTMinus4());
    const [endDate, setEndDate] = useState<string>(getTodayGMTMinus4());

    // State for data
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({ mobile: 0, wifi: 0, total: 0 });
    const [loading, setLoading] = useState(false);

    // Fetch data when filter changes
    useEffect(() => {
        const loadUsage = async () => {
            if (!startDate || !endDate) return;
            setLoading(true);
            try {
                const { startDate: startIso, endDate: endIso } = getRangeForInterval(startDate, endDate);
                const res = await fetch(`/api/web/data-usage?installerId=${installerId}&startDate=${startIso}&endDate=${endIso}`);
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data);
                    calculateStats(data);
                }
            } catch (e) {
                console.error("Error loading usage", e);
            } finally {
                setLoading(false);
            }
        };
        loadUsage();
    }, [startDate, endDate, installerId]);

    const calculateStats = (data: any[]) => {
        let mobile = 0;
        let wifi = 0;

        data.forEach(item => {
            mobile += parseDataUsageToMB(item.MobileData);
            wifi += parseDataUsageToMB(item.WifiData);
        });

        setStats({
            mobile: Number(mobile.toFixed(2)),
            wifi: Number(wifi.toFixed(2)),
            total: Number((mobile + wifi).toFixed(2))
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <i className="fa-solid fa-chart-pie text-primary"></i>
                    Uso de Datos
                </h2>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Desde:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Hasta:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* MOBILE */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                            <i className="fa-solid fa-mobile-screen text-xl"></i>
                        </div>
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Datos Móviles</p>
                            <h3 className="text-2xl font-bold text-blue-900">{stats.mobile} <span className="text-sm font-normal text-blue-700">MB</span></h3>
                        </div>
                    </div>

                    {/* WIFI */}
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <i className="fa-solid fa-wifi text-xl"></i>
                        </div>
                        <div>
                            <p className="text-sm text-indigo-600 font-medium">Datos WiFi</p>
                            <h3 className="text-2xl font-bold text-indigo-900">{stats.wifi} <span className="text-sm font-normal text-indigo-700">MB</span></h3>
                        </div>
                    </div>

                    {/* TOTAL */}
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                            <i className="fa-solid fa-chart-simple text-xl"></i>
                        </div>
                        <div>
                            <p className="text-sm text-green-600 font-medium">Consumo Total</p>
                            <h3 className="text-2xl font-bold text-green-900">{stats.total} <span className="text-sm font-normal text-green-700">MB</span></h3>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Fecha y Hora (Local)</th>
                                    <th className="px-6 py-3">Datos Móviles</th>
                                    <th className="px-6 py-3">Datos WiFi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                            <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Cargando datos...
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                            No hay registros de consumo para esta fecha.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log: any) => (
                                        <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-3 text-gray-900">
                                                {new Date(log.createdAt).toLocaleString('es-BO', {
                                                    timeZone: 'America/La_Paz',
                                                    dateStyle: 'short',
                                                    timeStyle: 'medium'
                                                })}
                                            </td>
                                            <td className="px-6 py-3 font-medium text-blue-600">
                                                {parseDataUsageToMB(log.MobileData).toFixed(2)} MB
                                            </td>
                                            <td className="px-6 py-3 font-medium text-indigo-600">
                                                {parseDataUsageToMB(log.WifiData).toFixed(2)} MB
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {logs.length > 0 && (
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                            <span>Mostrando {logs.length} registros</span>
                            <span>Zona Horaria: GMT-4 (La Paz)</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
