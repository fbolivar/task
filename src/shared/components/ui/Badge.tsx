import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
}

export function Badge({ children, className = '' }: BadgeProps) {
    return (
        <span className={`inline-flex items-center justify-center rounded-full font-bold ${className}`}>
            {children}
        </span>
    );
}
