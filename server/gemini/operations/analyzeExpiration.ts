import { ANALIZAR_VENCIMIENTO_PROMPT } from "../../../src/GeminiApi/prompts/analizarVencimiento.prompt";
import { vencimientoSchema } from "../../../src/GeminiApi/schema/vencimiento.schema";
import { parseResultadoVencimiento } from "../../../src/GeminiApi/services/analizarVencimiento";
import { getBusinessCalendarDate } from "../../../src/GeminiApi/utils/validarFecha";
import { HttpError } from "../errors";
import type { GeminiInput, GeminiOperationStrategy } from "../types";
import {
  assertAllowedKeys,
  isValidExpirationResult,
  parseProviderJson,
  readImage,
} from "../validation";

function isExpirationInput(
  input: GeminiInput,
): input is Extract<GeminiInput, { operation: "analyzeExpiration" }> {
  return input.operation === "analyzeExpiration";
}

export const analyzeExpirationOperation: GeminiOperationStrategy = {
  parseRequest(body) {
    if (body.operation !== "analyzeExpiration") {
      throw new HttpError(
        400,
        "INVALID_OPERATION",
        "El tipo de análisis no está permitido.",
      );
    }
    assertAllowedKeys(body, ["operation", "image"]);
    return { operation: "analyzeExpiration", image: readImage(body.image) };
  },

  buildProviderRequest(input) {
    if (!isExpirationInput(input))
      throw new Error(
        "Expiration analysis strategy received an incompatible input.",
      );
    return {
      contents: [
        {
          role: "user",
          parts: [
            { text: ANALIZAR_VENCIMIENTO_PROMPT },
            {
              inlineData: {
                mimeType: input.image.mimeType,
                data: input.image.data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: vencimientoSchema,
        temperature: 0,
        maxOutputTokens: 1_024,
      },
    };
  },

  parseProviderResponse(text, now) {
    const result = parseProviderJson(text);
    if (!isValidExpirationResult(result)) {
      throw new HttpError(
        502,
        "INVALID_PROVIDER_RESPONSE",
        "Gemini devolvió datos que no cumplen el formato esperado.",
      );
    }
    const fechaEvaluacion = getBusinessCalendarDate(now);
    return {
      result: {
        ...parseResultadoVencimiento({ ...result, fechaEvaluacion }, now),
        fechaEvaluacion,
      },
    };
  },
};
