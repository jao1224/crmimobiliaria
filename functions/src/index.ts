
import {initializeApp} from "firebase-admin/app";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {beforeUserCreated} from "firebase-functions/v2/identity";
import * as functions from "firebase-functions";
import {PDFDocument, rgb, StandardFonts, PDFFont} from "pdf-lib";
import * as nodemailer from "nodemailer";
import {defineString} from "firebase-functions/params";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const adminAuth = getAuth();
const adminDb = getFirestore();


// --- INÍCIO: LÓGICA DE NOTIFICAÇÃO DE EVENTOS ---

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

// --- FIM: LÓGICA DE NOTIFICAÇÃO ---

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

export const createUser = onCall(async (request) => {
    // Verifica se o usuário que está chamando a função é um admin de imobiliária ou Super Usuário.
    const isImobiliariaAdmin = !!request.auth?.token.imobiliariaId;
    const isSuperUser = request.auth?.token.role === 'Admin' || request.auth?.token.role === 'Super Usuário';

    if (!isImobiliariaAdmin && !isSuperUser) {
        throw new HttpsError('permission-denied', 'Apenas administradores podem criar usuários.');
    }

    const { email, password, name, role } = request.data;
    
    // Super Usuário pode criar uma imobiliária. Neste caso, o imobiliariaId será o uid do novo usuário.
    // Para outros perfis, usa o imobiliariaId do admin que está chamando.
    let imobiliariaId = request.auth?.token.imobiliariaId;

    try {
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
        });

        // Se um super admin está criando uma imobiliária, o ID dela é o ID do novo usuário
        if (isSuperUser && role === 'Imobiliária') {
            imobiliariaId = userRecord.uid;
        }
        
        // Define as custom claims (role e imobiliariaId) para o novo usuário.
        await adminAuth.setCustomUserClaims(userRecord.uid, { role, imobiliariaId });

        // Salva informações adicionais no Firestore.
        await adminDb.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            name,
            email,
            role,
            imobiliariaId, // Salva o ID da imobiliária no documento do usuário
            createdAt: new Date().toISOString(),
        });

        return { success: true, uid: userRecord.uid };
    } catch (error: any) {
        console.error('Error creating new user:', error);
        throw new HttpsError('internal', error.message, error);
    }
});

// Esta função adiciona custom claims ao criar um usuário diretamente pelo Firebase Auth (ex: no registro).
export const addRoleOnCreate = beforeUserCreated(async (event) => {
    const user = event.data;
    const userDocRef = adminDb.collection('users').doc(user.uid);
    
    try {
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData && userData.role) {
                const claims: { [key: string]: any } = { role: userData.role };
                // Se o usuário for do tipo Imobiliária, seu imobiliariaId é o próprio uid.
                if (userData.role === 'Imobiliária') {
                    claims.imobiliariaId = user.uid;
                    // Atualiza o documento no firestore com o imobiliariaId
                    await userDocRef.update({ imobiliariaId: user.uid });
                }
                 if (userData.imobiliariaId) {
                    claims.imobiliariaId = userData.imobiliariaId;
                }
                
                await adminAuth.setCustomUserClaims(user.uid, claims);
                return;
            }
        }
        // Fallback: se não encontrar o documento a tempo, define um cargo padrão.
        await adminAuth.setCustomUserClaims(user.uid, { role: 'Corretor Autônomo' });

    } catch (error) {
        console.error("Erro ao definir custom claims:", error);
    }
});


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
        currentY -= 5;
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

    page.drawText(data.title, {
        x: margin, y, font: boldFont, size: 18, color: rgb(0, 0, 0),
    });
    y -= 20;
    page.drawText(`Período: ${data.filters.startDate} a ${data.filters.endDate}`, {
        x: margin, y, font, size: 10, color: rgb(0.5, 0.5, 0.5),
    });
    y -= 30;

    page.drawText("Resumo do Período", {x: margin, y, font: boldFont, size: 14});
    y -= 20;
    const revenueText = `Receita Total: ${new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(data.summary.totalRevenue)}`;
    page.drawText(revenueText, {x: margin, y, font, size: 12});
    y -= 20;
    const dealsText = `Total de Negócios Concluídos: ${data.summary.totalDeals}`;
    page.drawText(dealsText, {x: margin, y, font, size: 12});
    y -= 40;

    page.drawText("Detalhamento das Vendas", {x: margin, y, font: boldFont, size: 14});
    y -= 20;

    const tableHeaders = ["Imóvel", "Cliente", "Vendedor", "Data", "Valor"];
    const colPositions = [margin, margin + 150, margin + 250, margin + 350, margin + 450];

    page.drawText(tableHeaders[0], {x: colPositions[0], y, font: boldFont, size: 10});
    page.drawText(tableHeaders[1], {x: colPositions[1], y, font: boldFont, size: 10});
    page.drawText(tableHeaders[2], {x: colPositions[2], y, font: boldFont, size: 10});
    page.drawText(tableHeaders[3], {x: colPositions[3], y, font: boldFont, size: 10});
    page.drawText(tableHeaders[4], {x: colPositions[4], y, font: boldFont, size: 10});
    y -= 15;

    data.sales.forEach(sale => {
        if (y < margin + 20) {
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

  page.drawText("CONTRATO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL", {
    x: margin,
    y,
    font: boldFont,
    size: 14,
    color: rgb(0, 0, 0),
  });
  y -= 40;

  y = await drawPartyInfo("VENDEDOR(ES):", data.sellers, font, boldFont, margin, y, contentWidth, page);
  y -= 10;
  y = await drawPartyInfo("COMPRADOR(A/ES):", data.buyers, font, boldFont, margin, y, contentWidth, page);
  y -= 10;

  page.drawText("INTERVENIENTE ANUENTE (IMOBILIÁRIA):", {x: margin, y, font: boldFont, size: 12});
  y -= 15;
  const realtorText = `Ideal Imóveis Ltda., representada por ${data.realtorName}, CRECI: ${data.realtorCreci}.`;
  y = await drawText(font, realtorText, margin, y, 10, contentWidth, 15, page);
  y -= 20;

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

  y = Math.min(y, 180);
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
      page.drawText(seller.name, {x: margin, y, font: size: 10});
      y -= 15;
      page.drawText("VENDEDOR(A)", {x: margin, y, font: boldFont, size: 10});
      y -= 30;
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

  return {pdfBase64};
});
