export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-white px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-brand-600 tracking-tight">Lofted</h1>
        <p className="text-gray-500 mt-1 text-sm">Professional networking, elevated.</p>
      </div>
      {children}
    </div>
  )
}
