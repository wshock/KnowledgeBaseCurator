"use client";

import { Button } from "@/src/components/ui";

interface LogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutModal({ isOpen, onConfirm, onCancel }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    // Fondo oscuro
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel} // click fuera = cancelar
    >
      {/* Tarjeta */}
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()} // evita cerrar al clickar dentro
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Cerrar sesión
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          ¿Estás seguro que deseas cerrar sesión?
        </p>

        <div className="flex flex-col gap-2">
          <Button variant="primary" onClick={onConfirm}>
            Sí, cerrar sesión
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
