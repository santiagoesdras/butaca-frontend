import { Camera, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onAccept: () => void;
  onCancel: () => void;
}

export function CameraPermission({ onAccept, onCancel }: Props) {
  return (
    <div className="surface-card mx-auto max-w-md rounded-2xl p-6 text-center sm:p-8">
      <Camera className="mx-auto mb-4 size-10 text-accent" />
      <h3 className="text-lg font-bold text-foreground">¿Podemos ver tu rostro un instante?</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Butaca usará la cámara solo para detectar tu ánimo. La imagen no se guarda ni se comparte.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        <ShieldCheck className="mr-1 inline size-3" />
        Solo se guarda la emoción detectada, no la foto.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button className="flex-1" onClick={onAccept}>Aceptar</Button>
      </div>
    </div>
  );
}