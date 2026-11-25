export type GeminiOperation = "validateFood" | "analyzeExpiration";

export interface GeminiTokenProvider {
  getIdToken(): Promise<string | null>;
}

export interface GeminiJsonClient {
  generateJson(
    operation: GeminiOperation,
    image: { mimeType: string; data: string },
  ): Promise<unknown>;
}

export class GeminiApiError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "INVALID_REQUEST"
      | "PAYLOAD_TOO_LARGE"
      | "QUOTA"
      | "RATE_LIMIT"
      | "INVALID_RESPONSE"
      | "CONNECTION"
      | "TIMEOUT"
      | "SERVICE_UNAVAILABLE"
      | "UNKNOWN",
  ) {
    super(message);
    this.name = "GeminiApiError";
    console.error(`${this.name}\n
                   ${this.message}\n
                   ${this.code}\n`);
  }
}

function errorForStatus(status: number, message?: string): GeminiApiError {
  if (status === 400)
    return new GeminiApiError(
      message ?? "La solicitud de análisis no es válida.",
      "INVALID_REQUEST",
    );
  if (status === 401)
    return new GeminiApiError(
      "Inicia sesión nuevamente para usar el análisis.",
      "UNAUTHENTICATED",
    );
  if (status === 403)
    return new GeminiApiError(
      "Esta función requiere una cuenta registrada.",
      "FORBIDDEN",
    );
  if (status === 413)
    return new GeminiApiError(
      "La imagen supera el tamaño permitido de 3 MB.",
      "PAYLOAD_TOO_LARGE",
    );
  if (status === 429)
    return new GeminiApiError(
      message ?? "Se alcanzó el límite gratuito o temporal. Intenta más tarde.",
      "QUOTA",
    );
  if (status === 502)
    return new GeminiApiError(
      "El servicio devolvió una respuesta inválida. Intenta nuevamente.",
      "INVALID_RESPONSE",
    );
  if (status === 503)
    return new GeminiApiError(
      "El servicio de análisis no está disponible temporalmente.",
      "SERVICE_UNAVAILABLE",
    );
  if (status === 504)
    return new GeminiApiError(
      "El análisis tardó demasiado. Intenta nuevamente.",
      "TIMEOUT",
    );
  return new GeminiApiError(
    "No pudimos completar el análisis. Intenta nuevamente.",
    "UNKNOWN",
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class GeminiApiClient implements GeminiJsonClient {
  constructor(
    private readonly tokenProvider: GeminiTokenProvider,
    private readonly fetcher: typeof fetch = globalThis.fetch.bind(globalThis),
  ) {}

  private async postRequest(
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let idToken: string | null;
    try {
      idToken = await this.tokenProvider.getIdToken();
    } catch {
      throw new GeminiApiError(
        "No pudimos obtener el token de sesión para el análisis.",
        "UNKNOWN",
      );
    }
    if (!idToken)
      throw new GeminiApiError(
        "Debes iniciar sesión para usar el análisis.",
        "UNAUTHENTICATED",
      );

    try {
      const response = await this.fetcher("/api/gemini", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });

      let responseBody: unknown;
      try {
        responseBody = await response.json();
      } catch (error) {
        console.error(error);
        throw new GeminiApiError(
          "El servidor devolvió una respuesta inválida.",
          "INVALID_RESPONSE",
        );
      }

      if (!response.ok) {
        const errorBody =
          isRecord(responseBody) && isRecord(responseBody.error)
            ? responseBody.error
            : undefined;
        const message =
          typeof errorBody?.message === "string"
            ? errorBody.message
            : undefined;
        throw errorForStatus(response.status, message);
      }

      if (!isRecord(responseBody)) {
        throw new GeminiApiError(
          "El servidor devolvió una respuesta inválida.",
          "INVALID_RESPONSE",
        );
      }
      return responseBody;
    } catch (error) {
      if (error instanceof GeminiApiError) throw error;
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new GeminiApiError(
          "El análisis tardó demasiado. Intenta nuevamente.",
          "TIMEOUT",
        );
      }
      if (error instanceof TypeError) {
        console.error(`Error GeminiApi tipo TypeError ${error}`);
        throw new GeminiApiError(
          "No pudimos conectar con el servicio de análisis. Verifica tu conexión.",
          "CONNECTION",
        );
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        console.error(`Error GeminiApi tipo AbortError ${error}`);
        throw new GeminiApiError(
          "No pudimos conectar con el servicio de análisis. Verifica tu conexión.",
          "CONNECTION",
        );
      }
      throw new GeminiApiError(
        "No pudimos completar el análisis. Intenta nuevamente.",
        "UNKNOWN",
      );
    }
  }

  async generateText(prompt: string): Promise<string> {
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 4_000) {
      throw new GeminiApiError(
        "La instrucción debe tener entre 1 y 4000 caracteres.",
        "INVALID_REQUEST",
      );
    }
    const response = await this.postRequest({ operation: "text", prompt });
    if (typeof response.text !== "string" || !response.text.trim()) {
      throw new GeminiApiError(
        "Gemini devolvió una respuesta vacía.",
        "INVALID_RESPONSE",
      );
    }
    return response.text.trim();
  }

  async generateJson(
    operation: GeminiOperation,
    image: { mimeType: string; data: string },
  ): Promise<unknown> {
    const response = await this.postRequest({ operation, image });
    if (!Object.hasOwn(response, "result")) {
      throw new GeminiApiError(
        "Gemini devolvió una respuesta vacía.",
        "INVALID_RESPONSE",
      );
    }
    return response.result;
  }
}
