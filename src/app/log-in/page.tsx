import type { Metadata, Viewport } from "next";
import CenLogin from "@/components/landing/CenLogin";

export const metadata: Metadata = {
    title: "Iniciar sesión | CEN",
    description: "Inicio de sesión de CEN, Campaña Educativa Nacional.",
};

export const viewport: Viewport = {
    themeColor: "#04162c",
};

export default function LoginPage() {
    return <CenLogin />;
}
