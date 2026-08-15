const messages: Record<string, string> = {
  AUTHENTICATION_REQUIRED: "Sua sessão expirou. Entre novamente.",
  INVALID_CREDENTIALS: "E-mail ou senha inválidos.",
  EMAIL_ALREADY_REGISTERED: "Este e-mail já está cadastrado.",
  CURRENT_PASSWORD_INVALID: "A senha atual está incorreta.",
  TURNSTILE_FAILED: "Não foi possível confirmar que você não é um robô. Tente novamente.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
  INVALID_REQUEST: "Verifique os dados informados e tente novamente.",
  INVALID_JSON: "Não foi possível enviar os dados. Tente novamente.",
  JSON_REQUIRED: "Não foi possível enviar os dados. Tente novamente.",
  BODY_TOO_LARGE: "Os dados enviados excedem o limite permitido.",
  INVALID_HOST: "Endereço inválido para esta aplicação.",
  INVALID_ORIGIN: "A requisição foi bloqueada por segurança. Recarregue a página.",
  INVALID_RESPONSE: "O servidor retornou uma resposta inesperada. Tente novamente.",
  UNEXPECTED_RESPONSE: "O servidor retornou uma resposta inesperada. Tente novamente.",
  INTERNAL_ERROR: "Algo deu errado. Tente novamente em instantes."
};

export function errorMessage(code: string, requestId?: string | null): string {
  const message = messages[code];
  if (message !== undefined) return message;
  if (requestId !== undefined && requestId !== null) {
    return `Algo deu errado. Informe o código ${requestId} ao suporte.`;
  }
  return messages.INTERNAL_ERROR ?? "Algo deu errado.";
}
