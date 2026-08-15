import { escapeHtml, type EmailMessage } from "./sender";

export function welcomeEmail(to: string, name: string, appOrigin: string): EmailMessage {
  const safeName = escapeHtml(name);
  const safeOrigin = escapeHtml(appOrigin);
  return {
    to,
    subject: "Bem-vindo",
    text: `Olá, ${name}. Sua conta foi criada. Acesse ${appOrigin}/dashboard para começar.`,
    html: `<p>Olá, ${safeName}.</p><p>Sua conta foi criada.</p><p><a href="${safeOrigin}/dashboard">Acessar sua conta</a></p>`
  };
}
