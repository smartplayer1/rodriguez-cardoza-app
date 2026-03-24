"use client"
import React, { useState } from "react";
import { MaterialButton } from "@/components/MaterialButton";
import { MaterialInput } from "@/components/MaterialInput";
import {
  MaterialCard,
  MaterialCardHeader,
  MaterialCardContent,
  MaterialCardActions,
} from "@/components/MaterialCard";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import MainMenu from "@/components/MainMenu";
import { Toaster } from "sonner";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("example@example.com");
  const [password, setPassword] = useState("example123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    const isEmailValid = email.includes("@");
    const isPasswordValid = password.length >= 6;

    setEmailError(!isEmailValid);
    setPasswordError(!isPasswordValid);

    if (isEmailValid && isPasswordValid) {
      console.log("Iniciando sesión...", {
        email,
        password,
        rememberMe,
      });
      setIsLoggedIn(true);
    }
  };

  // Show Main Menu if logged in
  if (isLoggedIn) {
    return (
      <>
        <MainMenu />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  // Show Login screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full opacity-5"
          style={{
            background:
              "radial-gradient(circle, #001B8C 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full opacity-5"
          style={{
            background:
              "radial-gradient(circle, #1976D2 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Login Card */}
      <MaterialCard
        elevation={4}
        className="w-full max-w-lg relative z-10"
      >
        <MaterialCardHeader>
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <h1
              className="text-primary text-center"
              style={{
                fontSize: "2rem",
                letterSpacing: "0.1em",
              }}
            >
              RODRIGUEZ CARDOZA
            </h1>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-foreground mb-2">Bienvenido</h1>
            <p className="text-muted-foreground">
              Inicia sesión en tu cuenta de contabilidad
            </p>
          </div>
        </MaterialCardHeader>

        <MaterialCardContent>
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-6"
          >
            {/* Email Input */}
            <MaterialInput
              label="Correo Electrónico"
              type="email"
              placeholder="tu@email.com"
              content="example@example.com"
              fullWidth
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(false);
              }}
              error={emailError}
              helperText={
                emailError
                  ? "Por favor ingresa un correo válido"
                  : ""
              }
              startIcon={<Mail size={20} />}
            />

            {/* Password Input */}
            <MaterialInput
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              fullWidth
              content="example123"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              error={passwordError}
              helperText={
                passwordError
                  ? "La contraseña debe tener al menos 6 caracteres"
                  : ""
              }
              startIcon={<Lock size={20} />}
              endIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer hover:text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              }
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                  className="w-4 h-4 rounded border-border text-primary 
                           focus:ring-2 focus:ring-primary cursor-pointer"
                />
                <span className="text-sm text-foreground">
                  Recordarme
                </span>
              </label>

              <MaterialButton
                type="button"
                variant="text"
                color="primary"
                className="text-sm"
                onClick={() =>
                  console.log("Recuperar contraseña")
                }
              >
                ¿Olvidaste tu contraseña?
              </MaterialButton>
            </div>

            {/* Login Button */}
            <MaterialButton
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              className="mt-2"
            >
              Iniciar Sesión
            </MaterialButton>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface text-muted-foreground">
                  o
                </span>
              </div>
            </div>

            {/* Alternative Actions */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                ¿No tienes una cuenta?
              </p>
              <MaterialButton
                type="button"
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => console.log("Registrarse")}
              >
                Crear Cuenta Nueva
              </MaterialButton>
            </div>
          </form>
        </MaterialCardContent>

        <MaterialCardActions className="justify-center mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            © 2025 Rodriguez Cardoza Nicaragua. Todos los
            derechos reservados.
          </p>
        </MaterialCardActions>
      </MaterialCard>

      {/* Help Button */}
      <button
        className="fixed bottom-6 right-6 bg-primary text-primary-foreground 
                   w-14 h-14 rounded-full elevation-3 hover:elevation-4 
                   transition-all duration-200 flex items-center justify-center"
        onClick={() => console.log("Ayuda")}
      >
        <span className="text-xl">?</span>
      </button>
    </div>
  );
}