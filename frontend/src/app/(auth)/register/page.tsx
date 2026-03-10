"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Utensils } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { authApi } from "@/lib/api/auth";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { pageVariants } from "@/lib/utils";

const tipoOptions = [
  { value: "cliente", label: "Cliente" },
  { value: "admin", label: "Administrador" },
];

export default function RegisterPage() {
  const { refresh } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tipo, setTipo] = useState<"cliente" | "admin">("cliente");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre || !email || !password) {
      toast("Completa todos los campos", "error");
      return;
    }
    if (password.length < 6) {
      toast("La contrasena debe tener al menos 6 caracteres", "error");
      return;
    }
    setIsLoading(true);
    try {
      await authApi.register({ nombre, email, password, tipo_usuario: tipo });
      await refresh();
      toast("Cuenta creada exitosamente", "success");
      router.push("/restaurantes");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrarse";
      toast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
              <Utensils size={26} className="text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
                FoodHub
              </h1>
              <p className="text-sm text-gray-400 mt-1">Crea tu cuenta</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre completo"
              type="text"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="name"
              required
            />
            <Input
              label="Correo electronico"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="Contrasena"
              type="password"
              placeholder="Minimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <Select
              label="Tipo de usuario"
              options={tipoOptions}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as "cliente" | "admin")}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Crear cuenta
            </Button>
          </form>

          {/* Login link */}
          <p className="text-sm text-center text-gray-500 mt-6">
            Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-amber-600 font-medium hover:text-amber-700 underline underline-offset-2"
            >
              Inicia sesion
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
