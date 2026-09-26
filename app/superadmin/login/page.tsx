import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SuperadminLoginForm } from "@/components/shared/superadmin-login-form";

export default function SuperadminLoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Swimma Platform</CardTitle>
          <CardDescription>Masuk sebagai admin platform</CardDescription>
        </CardHeader>
        <CardContent>
          <SuperadminLoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
