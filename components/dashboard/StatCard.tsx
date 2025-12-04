import React from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: string;
        isPositive: boolean;
        label: string;
    };
    iconBgColor: string;
    iconColor: string;
    subValue?: string;
    alertMessage?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    trend,
    iconBgColor,
    iconColor,
    subValue,
    alertMessage
}) => {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral/10 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-neutral uppercase">{title}</p>
                    <h3 className="text-2xl font-bold text-dark mt-1">
                        {value} {subValue && <span className="text-sm font-normal text-neutral">{subValue}</span>}
                    </h3>
                </div>
                <div className={`p-2 rounded-lg ${iconBgColor} ${iconColor}`}>
                    {icon}
                </div>
            </div>

            {(trend || alertMessage) && (
                <div className={`mt-4 flex items-center text-xs ${alertMessage ? 'text-red-500 font-medium' : ''}`}>
                    {alertMessage ? (
                        alertMessage
                    ) : (
                        <>
                            <span className={`${trend?.isPositive ? 'text-green-600' : 'text-red-500'} font-bold flex items-center gap-1`}>
                                {trend?.isPositive ? '↑' : '↓'} {trend?.value}
                            </span>
                            <span className="text-neutral ml-2">{trend?.label}</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
