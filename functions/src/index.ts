

import {initializeApp} from "firebase-admin/app";
import {onCall} from "firebase-functions/v2/https";
import {beforeUserCreated} from "firebase-functions/v2/identity";
import * as functions from "firebase-functions";
import {PDFDocument, rgb, StandardFonts, PDFFont} from "pdf-lib";
import * as nodemailer from "nodemailer";

initializeApp();


// --- INÍCIO: LÓGICA DE NOTIFICAÇÃO DE EVENTOS ---

// TODO: Para ativar o envio de e-mails de notificação de eventos, siga os passos:
// 1. Escolha um provedor de e-mail (ex: Gmail, SendGrid, Resend).
// 2. Salve as credenciais de e-mail (usuário e senha/chave de API) de forma segura.
//    Execute no seu terminal:
//    firebase functions:secrets:set EMAIL_USER
//    firebase functions:secrets:set EMAIL_PASS
// 3. Descomente a função `sendEventNotification` abaixo.
// 4. Preencha o campo `to` com o e-mail que deve receber as notificações.
// 5. Faça o deploy da função: `firebase deploy --only functions`

/*
import {defineString} from "firebase-functions/params";
const emailUser = defineString("EMAIL_USER");
const emailPass = defineString("EMAIL_PASS");


// Configuração do Nodemailer (exemplo com Gmail, mas funciona com outros provedores)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: emailUser.value(),
        pass: emailPass.value(),
    },
});

// Gatilho: Função que é executada QUANDO um novo evento é criado no Firestore.
export const sendEventNotification = functions.firestore
    .document("eventos/{eventId}")
    .onCreate(async (snap, context) => {
        const eventData = snap.data();

        // Só envia notificação para eventos de agendas compartilhadas
        if (eventData.type === "personal") {
            console.log(`Evento pessoal de ${eventData.title} criado. Nenhuma notificação enviada.`);
            return null;
        }

        const eventId = context.params.eventId;
        const title = eventData.title;
        const eventDate = new Date(eventData.date.seconds * 1000).toLocaleDateString("pt-BR");
        const time = eventData.time;
        const description = eventData.description;
        const typeLabel = eventData.type === "company" ? "Agenda da Imobiliária" : "Visitas da Equipe";

        const mailOptions = {
            from: `Ideal Imóveis <${emailUser.value()}>`,
            to: "email-do-admin-ou-gerente@example.com", // <-- IMPORTANTE: Defina o destinatário aqui
            subject: `Novo Evento na Agenda: ${title}`,
            html: `
                <h1>Novo Evento Agendado</h1>
                <p>Um novo evento foi adicionado na <strong>${typeLabel}</strong>.</p>
                <ul>
                    <li><strong>Título:</strong> ${title}</li>
                    <li><strong>Data:</strong> ${eventDate}</li>
                    <li><strong>Hora:</strong> ${time}</li>
                    <li><strong>Descrição:</strong> ${description || "N/A"}</li>
                </ul>
                <p>ID do Evento: ${eventId}</p>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`E-mail de notificação do evento '${title}' enviado com sucesso.`);
        } catch (error) {
            console.error("Erro ao enviar e-mail de notificação de evento:", error);
        }

        return null;
    });

*/

// --- INÍCIO: LÓGICA DE NOTIFICAÇÃO POR E-MAIL ---

// TODO: Para ativar o envio de e-mails, siga os passos:
// 1. Escolha um provedor de e-mail (ex: SendGrid, Resend, Mailgun).
// 2. Obtenha uma chave de API (API Key) do provedor escolhido.
// 3. Salve a chave de API de forma segura no seu ambiente de Cloud Functions.
//    Execute no seu terminal: firebase functions:secrets:set SENDGRID_API_KEY
//    Cole a chave quando solicitado.
// 4. Instale o pacote do provedor na pasta `functions`: npm install @sendgrid/mail
// 5. Descomente o código abaixo e adicione o e-mail remetente.

/*
// Carrega a chave de API das secrets do Firebase.
import {defineString} from "firebase-functions/params";
import * as sgMail from "@sendgrid/mail";
const sendgridApiKey = defineString("SENDGRID_API_KEY");

// Gatilho: Função que é executada DEPOIS que um usuário é criado no Firebase Auth.
export const sendWelcomeEmail = beforeUserCreated(async (event) => {
    const user = event.data;
    const email = user.email;
    const displayName = user.displayName || "Novo Usuário";

    if (!email) {
        console.log("Usuário criado sem e-mail, não é possível enviar boas-vindas.");
        return;
    }

    // Inicializa o cliente do serviço de e-mail.
    sgMail.setApiKey(sendgridApiKey.value());

    const msg = {
        to: email,
        from: "seu-email@seudominio.com", // <-- IMPORTANTE: Use um e-mail verificado no seu provedor.
        subject: "Bem-vindo(a) à Ideal Imóveis!",
        html: `
            <h1>Olá, ${displayName}!</h1>
            <p>Sua conta na plataforma Ideal Imóveis foi criada com sucesso.</p>
            <p>Agora você pode acessar nosso painel e explorar todas as funcionalidades para otimizar seu negócio imobiliário.</p>
            <p>Se tiver qualquer dúvida, nossa equipe de suporte está à disposição.</p>
            <br>
            <p>Atenciosamente,</p>
            <p>Equipe Ideal Imóveis</p>
        `,
    };

    try {
        await sgMail.send(msg);
        console.log(`E-mail de boas-vindas enviado para ${email}`);
    } catch (error) {
        console.error("Erro ao enviar e-mail de boas-vindas:", error);
    }
});
*/

// --- FIM: LÓGICA DE NOTIFICAÇÃO POR E-MAIL ---


interface Party {
    name: string;
    doc: string;
    address: string;
}

interface ContractData {
    buyers: Party[];
    sellers: Party[];
    realtorName: string;
    realtorCreci: string;
    propertyName: string;
    propertyCode: string;
    propertyAddress: string;
    propertyArea: string;
    propertyRegistration: string;
    propertyRegistryOffice: string;
    negotiationValue: string;
    paymentTerms: string;
    commissionClause: string;
    generalClauses: string;
    additionalClauses: string;
    city: string;
    date: string;
}

interface ReportData {
    title: string;
    filters: {
        startDate: string;
        endDate: string;
    },
    sales: {
        "ID Negociacao": string;
        "Imovel": string;
        "Cliente": string;
        "Vendedor": string;
        "Captador": string;
        "Equipe": string;
        "Valor": number;
        "Data Conclusao": string;
    }[];
    summary: {
        totalRevenue: number;
        totalDeals: number;
    }
}

// Helper function to draw wrapped text
async function drawText(
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size: number,
  maxWidth: number,
  lineHeight: number,
  page: any
): Promise<number> {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line + (line === "" ? "" : " ") + word;
    const {width} = font.widthOfTextAtSize(testLine, size);
    if (width > maxWidth) {
      page.drawText(line, {x, y: currentY, font, size, color: rgb(0, 0, 0)});
      line = word;
      currentY -= lineHeight;
    } else {
      line = testLine;
    }
  }
  page.drawText(line, {x: x, y: currentY, font: font, size: size, color: rgb(0, 0, 0)});

  // Return the new Y position after drawing the text
  return currentY - lineHeight;
}

async function drawPartyInfo(
    title: string,
    parties: Party[],
    font: PDFFont,
    boldFont: PDFFont,
    x: number,
    y: number,
    contentWidth: number,
    page: any
): Promise<number> {
    page.drawText(title, {x, y, font: boldFont, size: 12});
    let currentY = y - 15;

    for (const party of parties) {
        const partyText = `${party.name}, CPF/CNPJ: ${party.doc}, residente em ${party.address}.`;
        currentY = await drawText(font, partyText, x, currentY, 10, contentWidth, 15, page);
        currentY -= 5; // Espaço entre as partes, se houver múltiplas
    }

    return currentY;
}

export const generateReportPdf = onCall<ReportData, Promise<{pdfBase64: string}>>(async (request) => {
    const data = request.data;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const {width, height} = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    const contentWidth = width - 2 * margin;
    let y = height - margin;

    // Title
    page.drawText(data.title, {
        x: margin, y, font: boldFont, size: 18, color: rgb(0, 0, 0),
    });
    y -= 20;
    page.drawText(`Período: ${data.filters.startDate} a ${data.filters.endDate}`, {
        x: margin, y, font, size: 10, color: rgb(0.5, 0.5, 0.5),
    });
    y -= 30;

    // Summary
    page.drawText("Resumo do Período", {x: margin, y, font: boldFont, size: 14});
    y -= 20;
    const revenueText = `Receita Total: ${new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(data.summary.totalRevenue)}`;
    page.drawText(revenueText, {x: margin, y, font, size: 12});
    y -= 20;
    const dealsText = `Total de Negócios Concluídos: ${data.summary.totalDeals}`;
    page.drawText(dealsText, {x: margin, y, font, size: 12});
    y -= 40;

    // Table Header
    page.drawText("Detalhamento das Vendas", {x: margin, y, font: boldFont, size: 14});
    y -= 20;

    const tableTop = y;
    const colWidths = [150, 100, 100, 100, 100];
    const colPositions = [margin, margin + 150, margin + 250, margin + 350, margin + 450];
    const tableHeaders = ["Imóvel", "Cliente", "Vendedor", "Data", "Valor"];

    page.drawText(tableHeaders[0], {x: colPositions[0], y, font: boldFont, size: 10});
    page.drawText(tableHeaders[1], {x: colPositions[1], y, font: boldFont, size: 10});
    page.drawText(tableHeaders[2], {x: colPositions[2], y, font: boldFont, size: 10});
    page.drawText(tableHeaders[3], {x: colPositions[3], y, font: boldFont, size: 10});
    page.drawText(tableHeaders[4], {x: colPositions[4], y, font: boldFont, size: 10});
    y -= 15;

    // Table Rows
    data.sales.forEach(sale => {
        if (y < margin + 20) { // Check for page break
            page = pdfDoc.addPage();
            y = height - margin;
        }
        const valueFormatted = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(sale.Valor);
        page.drawText(sale.Imovel.substring(0, 25), {x: colPositions[0], y, font, size: 9});
        page.drawText(sale.Cliente.substring(0, 15), {x: colPositions[1], y, font, size: 9});
        page.drawText(sale.Vendedor.substring(0, 15), {x: colPositions[2], y, font, size: 9});
        page.drawText(sale["Data Conclusao"], {x: colPositions[3], y, font, size: 9});
        page.drawText(valueFormatted, {x: colPositions[4], y, font, size: 9});
        y -= 12;
    });

    const pdfBytes = await pdfDoc.save();
    return {pdfBase64: Buffer.from(pdfBytes).toString("base64")};
});


export const generateContractPdf = onCall<ContractData, Promise<{pdfBase64: string}>>(async (request) => {
  const data = request.data;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const {width, height} = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const contentWidth = width - 2 * margin;
  let y = height - margin;

  // Title
  page.drawText("CONTRATO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL", {
    x: margin,
    y,
    font: boldFont,
    size: 14,
    color: rgb(0, 0, 0),
  });
  y -= 40;

  // Parties
  y = await drawPartyInfo("VENDEDOR(ES):", data.sellers, font, boldFont, margin, y, contentWidth, page);
  y -= 10;
  y = await drawPartyInfo("COMPRADOR(A/ES):", data.buyers, font, boldFont, margin, y, contentWidth, page);
  y -= 10;

  page.drawText("INTERVENIENTE ANUENTE (IMOBILIÁRIA):", {x: margin, y, font: boldFont, size: 12});
  y -= 15;
  const realtorText = `Ideal Imóveis Ltda., representada por ${data.realtorName}, CRECI: ${data.realtorCreci}.`;
  y = await drawText(font, realtorText, margin, y, 10, contentWidth, 15, page);
  y -= 20;

  // Clauses
  page.drawText("CLÁUSULA PRIMEIRA - DO OBJETO", {x: margin, y, font: boldFont, size: 12});
  y -= 15;
  const objectText = `O presente contrato tem por objeto a promessa de compra e venda do imóvel a seguir descrito: ${data.propertyName} (Cód. ${data.propertyCode}), localizado em ${data.propertyAddress}, com área de ${data.propertyArea}m², matrícula ${data.propertyRegistration} do ${data.propertyRegistryOffice}.`;
  y = await drawText(font, objectText, margin, y, 10, contentWidth, 15, page);
  y -= 10;

  page.drawText("CLÁUSULA SEGUNDA - DO PREÇO E DA FORMA DE PAGAMENTO", {x: margin, y, font: boldFont, size: 12});
  y -= 15;
  const priceText = `O valor total da presente transação é de R$ ${data.negotiationValue}, a ser pago da seguinte forma:`;
  y = await drawText(font, priceText, margin, y, 10, contentWidth, 15, page);
  y = await drawText(font, data.paymentTerms, margin + 10, y, 10, contentWidth - 10, 15, page);
  y -= 10;

  page.drawText("CLÁUSULA TERCEIRA - DA COMISSÃO DE CORRETAGEM", {x: margin, y, font: boldFont, size: 12});
  y -= 15;
  y = await drawText(font, data.commissionClause, margin, y, 10, contentWidth, 15, page);
  y -= 10;

  page.drawText("CLÁUSULA QUARTA - DAS DISPOSIÇÕES GERAIS", {x: margin, y, font: boldFont, size: 12});
  y -= 15;
  y = await drawText(font, data.generalClauses, margin, y, 10, contentWidth, 15, page);
  y -= 10;

  if (data.additionalClauses) {
    page.drawText("CLÁUSULAS ADICIONAIS", {x: margin, y, font: boldFont, size: 12});
    y -= 15;
    y = await drawText(font, data.additionalClauses, margin, y, 10, contentWidth, 15, page);
    y -= 10;
  }

  // Signatures
  y = Math.min(y, 180); // Garante que a seção de assinaturas não saia da página
  const line = "_________________________";

  data.buyers.forEach((buyer) => {
      page.drawText(line, {x: margin, y, font, size: 12});
      y -= 15;
      page.drawText(buyer.name, {x: margin, y, font, size: 10});
      y -= 15;
      page.drawText("COMPRADOR(A)", {x: margin, y, font: boldFont, size: 10});
      y -= 30;
  });

  data.sellers.forEach((seller) => {
      page.drawText(line, {x: margin, y, font, size: 12});
      y -= 15;
      page.drawText(seller.name, {x: margin, y, font, size: 10});
      y -= 15;
      page.drawText("VENDEDOR(A)", {x: margin, y, font: boldFont, size: 10});
      y -= 30;
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

  return {pdfBase64};
});
