import type { Metadata, Viewport } from "next";
import CenLanding from "@/components/landing/CenLanding";

export const metadata: Metadata = {
    title: "CEN | Tecnología para aprender, crear y transformar",
    description: "CEN, plataforma educativa de tecnología para primaria, secundaria y bachillerato.",
};

export const viewport: Viewport = {
    themeColor: "#061a35",
};

export default function Home() {
    return <CenLanding />;
}
