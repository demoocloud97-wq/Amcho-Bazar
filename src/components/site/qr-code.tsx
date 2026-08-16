import { useMemo, useState } from "react";
import qrcode from "qrcode-generator";
import { Check, Copy, Download, Printer, QrCode as QrIcon } from "lucide-react";
import { toast } from "sonner";

// Brand maroon, hard-coded rather than a CSS token: a QR must keep a high, fixed
// contrast ratio against white in every theme, and the exported PNG/SVG files are
// read outside the app entirely (print, WhatsApp, a poster).
const DARK = "#7A1E3D";
const LIGHT = "#FFFFFF";
const QUIET = 4; // modules of quiet zone — 4 is the spec minimum for reliable scanning

// Builds the module matrix once per URL. Error-correction level M survives a
// printed code getting scuffed or partly covered by a logo/sticker.
function useMatrix(text: string) {
  return useMemo(() => {
    const qr = qrcode(0, "M"); // 0 = auto-pick the smallest type that fits
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const rows: boolean[][] = [];
    for (let r = 0; r < n; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < n; c++) row.push(qr.isDark(r, c));
      rows.push(row);
    }
    return { n, rows };
  }, [text]);
}

// One <path> of all dark modules — far fewer DOM nodes than a rect per module,
// and it scales to any size without seams between cells.
function toPath(rows: boolean[][]): string {
  let d = "";
  rows.forEach((row, r) => row.forEach((on, c) => { if (on) d += `M${c + QUIET} ${r + QUIET}h1v1h-1z`; }));
  return d;
}

function svgString(n: number, rows: boolean[][]): string {
  const size = n + QUIET * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="1024" height="1024" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${LIGHT}"/><path d="${toPath(rows)}" fill="${DARK}"/></svg>`;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function QrCode({ url, filename = "review-qr", className = "" }: { url: string; filename?: string; className?: string }) {
  const { n, rows } = useMatrix(url);
  const size = n + QUIET * 2;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code linking to ${url}`}
      className={className}
    >
      <rect width={size} height={size} fill={LIGHT} />
      <path d={toPath(rows)} fill={DARK} />
    </svg>
  );
}

// The admin QR panel: the code itself plus download / print / copy actions.
export function QrCard({
  url,
  filename = "amcho-review-qr",
  title,
  caption,
}: {
  url: string;
  filename?: string;
  title: string;
  caption: string;
}) {
  const { n, rows } = useMatrix(url);
  const [copied, setCopied] = useState(false);

  function downloadSvg() {
    download(new Blob([svgString(n, rows)], { type: "image/svg+xml;charset=utf-8" }), `${filename}.svg`);
    toast.success("SVG downloaded");
  }

  // Rasterise the same vector at a poster-friendly 1024px.
  function downloadPng() {
    const px = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    if (!ctx) { toast.error("Could not render the PNG."); return; }
    const cell = px / (n + QUIET * 2);
    ctx.fillStyle = LIGHT;
    ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = DARK;
    rows.forEach((row, r) => row.forEach((on, c) => {
      // Math.ceil on the size closes the sub-pixel seams between adjacent modules.
      if (on) ctx.fillRect(Math.floor((c + QUIET) * cell), Math.floor((r + QUIET) * cell), Math.ceil(cell), Math.ceil(cell));
    }));
    canvas.toBlob((blob) => {
      if (!blob) { toast.error("Could not render the PNG."); return; }
      download(blob, `${filename}.png`);
      toast.success("PNG downloaded");
    }, "image/png");
  }

  // A print window carrying only the code, the heading and the URL — nothing from
  // the app's chrome, so it prints cleanly onto a table card or poster.
  function print() {
    const w = window.open("", "_blank", "width=680,height=880");
    if (!w) { toast.error("Allow pop-ups to print the QR code."); return; }
    w.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>` +
      `*{box-sizing:border-box}body{margin:0;padding:48px 32px;font-family:"DM Sans","Segoe UI",system-ui,sans-serif;text-align:center;color:#2B1219}` +
      `h1{font-size:28px;margin:0 0 8px}p{margin:0;color:#6B4A55;font-size:15px}` +
      `.qr{width:min(420px,80vw);margin:32px auto 20px}.qr svg{width:100%;height:auto;display:block}` +
      `code{font-size:13px;word-break:break-all;color:#7A1E3D}` +
      `@media print{body{padding:24px}}</style></head><body>` +
      `<h1>${title}</h1><p>${caption}</p><div class="qr">${svgString(n, rows)}</div><code>${url}</code>` +
      `</body></html>`
    );
    w.document.close();
    w.focus();
    // Let the browser lay the document out before opening the print dialog.
    setTimeout(() => w.print(), 250);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select the link and copy it manually.");
    }
  }

  const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-primary shadow-soft transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card md:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-festive text-white shadow-soft">
          <QrIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{caption}</p>
        </div>
      </div>

      <div className="mx-auto mt-6 w-full max-w-[18rem]">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
          <QrCode url={url} className="block h-auto w-full" />
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Review link</div>
        <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
          <code className="min-w-0 flex-1 truncate text-xs text-primary" title={url}>{url}</code>
          <button
            onClick={copy}
            aria-label="Copy review link"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? <Check className="h-4 w-4 text-teal" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button onClick={downloadPng} className={btn}><Download className="h-4 w-4" /> PNG</button>
        <button onClick={downloadSvg} className={btn}><Download className="h-4 w-4" /> SVG</button>
        <button onClick={print} className={btn}><Printer className="h-4 w-4" /> Print</button>
        <button onClick={copy} className={btn}>{copied ? <Check className="h-4 w-4 text-teal" /> : <Copy className="h-4 w-4" />} Copy</button>
      </div>
    </div>
  );
}
