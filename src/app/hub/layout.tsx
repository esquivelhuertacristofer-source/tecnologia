export default function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#011126] selection:bg-[#FF8C00] selection:text-[#011126]">
      {children}
    </div>
  );
}
