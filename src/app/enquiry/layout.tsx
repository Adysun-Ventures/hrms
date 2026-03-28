export default function EnquiryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh min-h-screen bg-white text-gray-900">
      {children}
    </div>
  );
}
