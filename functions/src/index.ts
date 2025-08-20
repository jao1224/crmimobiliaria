
import {initializeApp} from "firebase-admin/app";
import {onCall} from "firebase-functions/v2/https";
import {PDFDocument, rgb, StandardFonts, PDFFont} from "pdf-lib";

initializeApp();

interface ContractData {
    clientName: string;
    clientDoc: string;
    clientAddress: string;
    sellerName: string;
    sellerDoc: string;
    sellerAddress: string;
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
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line + (line === "" ? "" : " ") + word;
    const {width} = font.widthOfTextAtSize(testLine, size);
    if (width > maxWidth) {
      page.drawText(line, {x, y: currentY, font, size});
      line = word;
      currentY -= lineHeight;
    } else {
      line = testLine;
    }
  }
  page.drawText(line, {x, y: currentY, font, size});

  // Return the new Y position after drawing the text
  return currentY - lineHeight;
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
  });
  y -= 40;

  // Parties
  page.drawText("VENDEDOR(ES):", {x: margin, y, font: boldFont, size: 12});
  y -= 15;
  const sellerText = `${data.sellerName}, CPF/CNPJ: ${data.sellerDoc}, residente em ${data.sellerAddress}.`;
  y = await drawText(font, sellerText, margin, y, 10, contentWidth, 15, page);
  y -= 10;

  page.drawText("COMPRADOR(A):", {x: margin, y, font: boldFont, size: 12});
  y -= 15;
  const clientText = `${data.clientName}, CPF/CNPJ: ${data.clientDoc}, residente em ${data.clientAddress}.`;
  y = await drawText(font, clientText, margin, y, 10, contentWidth, 15, page);
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
  y = 120;
  const center = width / 2;
  page.drawText("_________________________", {x: center - 100, y, font, size: 12});
  page.drawText(data.clientName, {x: center - 100, y: y - 15, font, size: 10});
  page.drawText("COMPRADOR(A)", {x: center - 100, y: y-30, font: boldFont, size: 10});

  page.drawText("_________________________", {x: center - 100, y: y - 60, font, size: 12});
  page.drawText(data.sellerName, {x: center - 100, y: y - 75, font, size: 10});
  page.drawText("VENDEDOR(ES)", {x: center - 100, y: y - 90, font: boldFont, size: 10});

  const pdfBytes = await pdfDoc.save();
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

  return {pdfBase64};
});
