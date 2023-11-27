import React from "react";
interface CustomBrand {
    backgroundImageUrl?: string;
    customerName?: string;
    customerLogoUrl?: string;
}
export declare const Passwordless: ({ brand, children, }?: {
    brand?: CustomBrand | undefined;
    children?: React.ReactNode;
}) => JSX.Element;
export declare function Fido2Toast(): JSX.Element;
export {};
