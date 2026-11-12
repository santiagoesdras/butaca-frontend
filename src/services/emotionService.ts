import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL;

export type EmotionCode =
  | "HAPPY"
  | "SAD"
  | "ANGRY"
  | "FEAR"
  | "DISGUSTED"
  | "SURPRISED"
  | "CALM";

export interface AnalyzeResponse {
  suggestedExpression: EmotionCode | null;
  confidence: number | null;
  confirmationRequired: true;
  faces: number;
  reason: string | null;
}

export class AnalysisError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly canRetrySameImage: boolean = false
  ) {
    super(message);
    this.name = "AnalysisError";
  }
}

export async function analyzeEmotion(image: Blob): Promise<AnalyzeResponse> {
  if (!API_URL) {
    throw new Error("No se configuró VITE_API_URL.");
  }

  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error("No se pudo obtener la sesión.");

  const token = data.session?.access_token;
  if (!token) throw new Error("Debes iniciar sesión para analizar tu ánimo.");

  if (image.size > 2 * 1024 * 1024) {
    throw new Error("La imagen no puede superar los 2 MiB.");
  }

  const formData = new FormData();
  formData.append("image", image, "capture.jpg");
  formData.append("consent", "true");

  const url = `${API_URL.replace(/\/$/, "")}/api/v1/emotions/analyze`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch {
    throw new AnalysisError("No se pudo conectar con el servicio de análisis.", 0, true);
  }

  if (!response.ok) {
    if (response.status === 400) {
      throw new AnalysisError("La solicitud de análisis no es válida.", 400, false);
    }
    if (response.status === 401) {
      throw new AnalysisError("Tu sesión ha expirado. Inicia sesión nuevamente.", 401, false);
    }
    if (response.status === 415) {
      throw new AnalysisError("El formato de la imagen no es compatible. Usa JPG o PNG.", 415, false);
    }
    if (response.status === 422) {
      const body = await response.json().catch(() => null);
      let message = "No se pudo detectar un rostro en la imagen.";
      if (body && typeof body === "object" && "error" in body && body.error) {
        message = String(body.error);
      }
      throw new AnalysisError(message, 422, false);
    }
    if (response.status === 429) {
      throw new AnalysisError(
        "Has alcanzado el límite de análisis. Espera un momento antes de volver a intentar.",
        429,
        true
      );
    }
    if (response.status === 502) {
      throw new AnalysisError("El servicio de análisis no está disponible.", 502, true);
    }
    if (response.status === 503) {
      throw new AnalysisError("El servicio de análisis se está configurando.", 503, true);
    }
    if (response.status === 504) {
      throw new AnalysisError("El análisis tardó demasiado. Intenta de nuevo.", 504, true);
    }
    throw new AnalysisError(`Error del servidor: ${response.status}`, response.status, true);
  }

  return (await response.json()) as AnalyzeResponse;
}

/** Convierte un Blob a base64 sin el prefijo "data:image/jpeg;base64,". */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") return reject(new Error("No se pudo leer la imagen."));
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(blob);
  });
}