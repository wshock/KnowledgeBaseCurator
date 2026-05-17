"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaGoogle, FaApple } from "react-icons/fa";
import { AuthLayout } from "../layout/AuthLayout";
import { Input, Button, Alert, Divider } from "../ui";
import Link from "next/link";
import { useAuthStore } from "@/src/store/auth.store";

type LoginFormData = { email: string; password: string };
const INITIAL_FORM: LoginFormData = { email: "", password: "" };

interface LoginFormProps { showSocialButtons?: boolean }

export default function LoginForm({ showSocialButtons = false }: LoginFormProps) {
  const [form, setForm]               = useState<LoginFormData>(INITIAL_FORM);
  const [errors, setErrors]           = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading]         = useState(false);

  const login       = useAuthStore((s) => s.login);
  const authError   = useAuthStore((s) => s.error);
  const authLoading = useAuthStore((s) => s.loading);
  const router      = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setStatusMessage("");
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof LoginFormData, string>> = {};
    if (!form.email.includes("@"))    newErrors.email    = "Ingresa un correo válido.";
    if (form.password.length < 6)     newErrors.password = "Contraseña muy corta.";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout headerText="" linkText="" loginLink="/register">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-semibold text-blue-900 tracking-tight">Bienvenido de nuevo</h1>
        </div>

        <div className="px-5 sm:px-10 py-8 sm:py-10 bg-white rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {statusMessage && <Alert message={statusMessage} type="success" />}
            {authError      && <Alert message={authError}   type="error"   />}
            <Input name="email"    type="email"    placeholder="nombre@universidad.edu" label="Correo Electrónico" value={form.email}    onChange={handleChange} error={errors.email}    />
            <Input name="password" type="password" placeholder="••••••••"              label="Contraseña"          value={form.password} onChange={handleChange} error={errors.password} />
            <Button type="submit" isLoading={loading || authLoading} variant="primary">
              {loading || authLoading ? "Validando datos..." : "Iniciar sesión"}
            </Button>
          </form>

          {showSocialButtons && (
            <div className="flex flex-col">
              <Divider className="py-3" text="O continuar con" />
              <div className="flex flex-row gap-2">
                <Button variant="secondary" className="flex items-center justify-center gap-2"><FaGoogle className="w-4 h-4" />Google</Button>
                <Button variant="secondary" className="flex items-center justify-center gap-2"><FaApple  className="w-4 h-4" />Apple</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="py-5 flex flex-row items-center justify-center gap-2">
        <h3 className="text-sm font-normal text-gray-600">¿Aún no tienes acceso?</h3>
        <Link className="text-sm font-normal text-blue-950 hover:text-blue-800 transition-colors" href="/register">Únete gratis</Link>
      </div>
    </AuthLayout>
  );
}
