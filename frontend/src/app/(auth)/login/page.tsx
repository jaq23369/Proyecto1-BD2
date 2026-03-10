"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Utensils } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { pageVariants } from "@/lib/utils";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast("Completa todos los campos", "error");
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast("Bienvenido a FoodHub", "success");
      router.push("/restaurantes");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Credenciales invalidas";
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
              <p className="text-sm text-gray-400 mt-1">Inicia sesion en tu cuenta</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Tu contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Iniciar sesion
            </Button>
          </form>

          {/* Register link */}
          <p className="text-sm text-center text-gray-500 mt-6">
            No tienes cuenta?{" "}
            <Link
              href="/register"
              className="text-amber-600 font-medium hover:text-amber-700 underline underline-offset-2"
            >
              Registrate aqui
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
