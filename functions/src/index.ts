

import {initializeApp} from "firebase-admin/app";
import {onCall} from "firebase-functions/v2/https";
import {PDFDocument, rgb, StandardFonts, PDFFont} from "pdf-lib";

initializeApp();

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
  page.drawText(line, {x, y: currentY, font, size, color: rgb(0, 0, 0)});

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
