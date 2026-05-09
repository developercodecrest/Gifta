import { badRequest, serverError, unauthorized } from "@/lib/api-response";
import { authorizeAdminRequest } from "@/lib/server/admin-auth";
import { respondWithDelhiveryError } from "@/lib/server/delhivery-error-response";
import {
  DelhiveryApiError,
  DelhiveryDocumentType,
  downloadDelhiveryPackageDocument,
  isDelhiveryConfigured,
  recordDelhiveryOrderEvent,
} from "@/lib/server/delhivery-service";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";

export const runtime = "nodejs";

const allowedDocumentTypes: DelhiveryDocumentType[] = ["SIGNATURE_URL", "RVP_QC_IMAGE", "EPOD", "SELLER_RETURN_IMAGE"];

function resolveDocumentLabel(docType: DelhiveryDocumentType) {
  switch (docType) {
    case "SIGNATURE_URL":
      return "signature";
    case "RVP_QC_IMAGE":
      return "qc-images";
    case "EPOD":
      return "epod";
    case "SELLER_RETURN_IMAGE":
      return "seller-return";
  }
}

function inferFileExtension(contentType: string | undefined, fallback: string) {
  const normalized = contentType?.toLowerCase() || "";
  if (normalized.includes("pdf")) {
    return ".pdf";
  }
  if (normalized.includes("png")) {
    return ".png";
  }
  if (normalized.includes("jpeg") || normalized.includes("jpg")) {
    return ".jpg";
  }
  if (normalized.includes("gif")) {
    return ".gif";
  }
  if (normalized.includes("webp")) {
    return ".webp";
  }
  return fallback;
}

function buildGalleryHtml(input: { title: string; waybill: string; urls: string[] }) {
  const items = input.urls.map((url, index) => {
    const safeUrl = url.replace(/"/g, "&quot;");
    return `
      <article class="card">
        <header>
          <p class="eyebrow">Document ${index + 1}</p>
          <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Open original</a>
        </header>
        <div class="preview">
          <img src="${safeUrl}" alt="${input.title} ${index + 1}" loading="lazy" />
        </div>
      </article>
    `;
  }).join("");

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${input.title} - ${input.waybill}</title>
      <style>
        :root {
          color-scheme: light;
          --bg: #f8f2e4;
          --card: #fffdf8;
          --line: #ead8b2;
          --ink: #2f2217;
          --muted: #6d5a4d;
          --accent: #cd9933;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          background: radial-gradient(circle at top right, rgba(205,153,51,0.18), transparent 38%), var(--bg);
          color: var(--ink);
        }
        main {
          width: min(1100px, calc(100vw - 32px));
          margin: 0 auto;
          padding: 28px 0 40px;
        }
        .hero {
          display: grid;
          gap: 10px;
          margin-bottom: 20px;
          padding: 22px;
          border: 1px solid var(--line);
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,234,0.95));
        }
        .eyebrow {
          margin: 0;
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
          font-weight: 700;
        }
        h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 44px);
          line-height: 1;
        }
        .sub {
          margin: 0;
          color: var(--muted);
          line-height: 1.6;
        }
        .grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }
        .card {
          display: grid;
          gap: 12px;
          padding: 16px;
          border: 1px solid var(--line);
          border-radius: 20px;
          background: var(--card);
          box-shadow: 0 22px 55px -48px rgba(116,84,26,0.3);
        }
        .card header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: baseline;
        }
        .card a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 700;
        }
        .preview {
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid var(--line);
          background: white;
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .preview img {
          display: block;
          max-width: 100%;
          max-height: 520px;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      <main>
        <section class="hero">
          <p class="eyebrow">Delhivery package documents</p>
          <h1>${input.title}</h1>
          <p class="sub">Waybill ${input.waybill}. Delhivery returned ${input.urls.length} document URL${input.urls.length === 1 ? "" : "s"} for this request.</p>
        </section>
        <section class="grid">${items}</section>
      </main>
    </body>
  </html>`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let target: Awaited<ReturnType<typeof getAdminOrdersScoped>>[number] | undefined;
  let docType: DelhiveryDocumentType = "EPOD";

  try {
    const identity = await authorizeAdminRequest(request, "orders");
    if (!identity) {
      return unauthorized("Not allowed");
    }

    if (!isDelhiveryConfigured()) {
      return serverError("Delhivery is not configured.", { code: "DELHIVERY_CONFIG_MISSING" });
    }

    const requestedType = new URL(request.url).searchParams.get("docType")?.trim().toUpperCase();
    if (!requestedType || !allowedDocumentTypes.includes(requestedType as DelhiveryDocumentType)) {
      return badRequest("docType must be one of SIGNATURE_URL, RVP_QC_IMAGE, EPOD, SELLER_RETURN_IMAGE.");
    }

    docType = requestedType as DelhiveryDocumentType;

    const { id } = await context.params;
    const orders = await getAdminOrdersScoped(identity);
    target = orders.find((entry) => entry.id === id);

    if (!target) {
      return unauthorized("Not allowed");
    }

    if (!target.shippingAwb?.trim()) {
      return badRequest("AWB is missing for this order row.");
    }

    const download = await downloadDelhiveryPackageDocument({
      waybill: target.shippingAwb,
      docType,
    });

    await recordDelhiveryOrderEvent({
      waybill: target.shippingAwb,
      orderRef: target.orderRef,
      operation: "document-download",
      status: "document-downloaded",
      description: `${resolveDocumentLabel(docType)} document opened from Delhivery`,
      request: {
        waybill: target.shippingAwb,
        docType,
      },
      response: {
        primaryUrl: download.primaryUrl,
        urlCount: download.urls.length,
        contentType: download.primaryContentType,
      },
      raw: download.raw,
    });

    if (download.primaryBytes && download.urls.length === 1) {
      const extension = inferFileExtension(download.primaryContentType, ".bin");
      const fileName = `delhivery-${resolveDocumentLabel(docType)}-${download.waybill}${extension}`;

      return new Response(download.primaryBytes, {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition": `inline; filename="${fileName}"`,
          "Content-Length": String(download.primaryBytes.byteLength),
          "Content-Type": download.primaryContentType || "application/octet-stream",
        },
      });
    }

    const title = `${resolveDocumentLabel(docType).replace(/-/g, " ")}`.replace(/\b\w/g, (char) => char.toUpperCase());
    return new Response(buildGalleryHtml({
      title,
      waybill: download.waybill,
      urls: download.urls,
    }), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    if (target?.shippingAwb) {
      await recordDelhiveryOrderEvent({
        waybill: target.shippingAwb,
        orderRef: target.orderRef,
        operation: "document-download",
        status: "document-download-failed",
        description: error instanceof Error ? error.message : "Unable to download Delhivery package document.",
        request: {
          waybill: target.shippingAwb,
          docType,
        },
        response: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        raw: error instanceof DelhiveryApiError ? error.body : { message: error instanceof Error ? error.message : "Unknown error" },
        ...(error instanceof DelhiveryApiError ? { statusCode: error.status, errorCode: error.code } : {}),
      }).catch(() => undefined);
    }

    if (error instanceof DelhiveryApiError) {
      return respondWithDelhiveryError(error, "Unable to download Delhivery package document.");
    }

    return serverError("Unable to download Delhivery package document.", error);
  }
}