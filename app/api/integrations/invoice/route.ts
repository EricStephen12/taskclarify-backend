import { authenticateRequest, unauthorizedResponse } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function POST(req: NextRequest) {
  const { authenticated, user } = await authenticateRequest(req);
  if (!authenticated || !user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { client_name, amount, currency, services, due_date } = body;

    console.log("[Invoice Real] Generating PDF for:", { client_name, amount });

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const primaryColor = rgb(0.02, 0.31, 0.23); 
    
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width: width,
      height: 100,
      color: primaryColor,
    });

    page.drawText("INVOICE", {
      x: 50,
      y: height - 60,
      size: 30,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText("TaskClarify Automated Invoice", {
      x: 350,
      y: height - 40,
      size: 12,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText("BILL TO:", {
      x: 50,
      y: height - 150,
      size: 14,
      font: boldFont,
      color: primaryColor,
    });

    page.drawText(client_name || "Valued Client", {
      x: 50,
      y: height - 175,
      size: 18,
      font: boldFont,
    });

    const invoiceNum = "INV-" + Date.now().toString().slice(-6);
    const date = new Date().toLocaleDateString();
    
    page.drawText("Invoice #: " + invoiceNum, { x: 400, y: height - 150, size: 10, font });
    page.drawText("Date: " + date, { x: 400, y: height - 165, size: 10, font });
    page.drawText("Due Date: " + (due_date || "On Receipt"), { x: 400, y: height - 180, size: 10, font });

    page.drawRectangle({
      x: 50,
      y: height - 250,
      width: width - 100,
      height: 30,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText("Description", { x: 60, y: height - 230, size: 12, font: boldFont });
    page.drawText("Amount", { x: 450, y: height - 230, size: 12, font: boldFont });

    let yOffset = 270;
    if (services && Array.isArray(services)) {
      services.forEach((service) => {
        page.drawText(service.name || "Service", { x: 60, y: height - yOffset, size: 10, font });
        page.drawText((currency || "$") + (service.amount || 0), { x: 450, y: height - yOffset, size: 10, font });
        yOffset += 25;
      });
    } else {
      page.drawText("Business Services", { x: 60, y: height - yOffset, size: 10, font });
      page.drawText((currency || "N") + (amount || 0), { x: 450, y: height - yOffset, size: 10, font });
      yOffset += 25;
    }

    page.drawLine({
      start: { x: 50, y: height - yOffset - 10 },
      end: { x: width - 50, y: height - yOffset - 10 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("TOTAL DUE:", {
      x: 350,
      y: height - yOffset - 40,
      size: 16,
      font: boldFont,
      color: primaryColor,
    });

    page.drawText((currency || "N") + (amount || 0), {
      x: 450,
      y: height - yOffset - 40,
      size: 16,
      font: boldFont,
    });

    page.drawText("Thank you for your business!", {
      x: width / 2 - 80,
      y: 50,
      size: 12,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: true });

    return NextResponse.json({
      success: true,
      message: "Official invoice generated for " + client_name,
      pdf_url: pdfBase64,
      invoice_number: invoiceNum
    });

  } catch (error: any) {
    console.error("[Invoice Error]:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to generate real invoice document.",
      error: error.message
    }, { status: 500 });
  }
}
