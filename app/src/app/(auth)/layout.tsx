/**
 * Layout صفحات المصادقة
 * @description تخطيط بسيط لصفحات تسجيل الدخول والتفعيل
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
