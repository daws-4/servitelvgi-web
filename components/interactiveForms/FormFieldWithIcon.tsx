import React, { useState } from "react";
import { FormInput } from "./Input";

interface FormFieldWithIconProps {
    label: string;
    name: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    leftIcon?: React.ReactNode;
    rightButton?: React.ReactNode;
    className?: string;
}

/**
 * FormFieldWithIcon - Reusable form field component with icon support
 * Wraps FormInput with consistent styling matching the HTML template design
 */
export const FormFieldWithIcon: React.FC<FormFieldWithIconProps> = ({
    label,
    name,
    type = "text",
    placeholder,
    required = false,
    value,
    onChange,
    leftIcon,
    rightButton,
    className = "",
}) => {
    return (
        <div className={`relative group ${className}`}>
            <label className="block text-xs font-bold text-neutral uppercase mb-1.5 ml-1">
                {label}
            </label>
            <div className="relative">
                {leftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 transition-colors group-focus-within:text-primary">
                        {leftIcon}
                    </div>
                )}
                <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    required={required}
                    value={value}
                    onChange={onChange}
                    className={`w-full ${leftIcon ? 'pl-10' : 'pl-4'} ${rightButton ? 'pr-12' : 'pr-4'} py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-dark focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder-gray-300`}
                />
                {rightButton && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {rightButton}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * PasswordFieldWithToggle - Specialized password field with visibility toggle
 */
export const PasswordFieldWithToggle: React.FC<Omit<FormFieldWithIconProps, 'leftIcon' | 'rightButton' | 'type'>> = (props) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <FormFieldWithIcon
            {...props}
            type={showPassword ? "text" : "password"}
            leftIcon={<i className="fa-solid fa-key" />}
            rightButton={
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-primary cursor-pointer focus:outline-none transition-colors"
                >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
            }
        />
    );
};

export default FormFieldWithIcon;
