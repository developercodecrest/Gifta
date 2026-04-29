"use client";

import { useEffect, useRef } from "react";

type FlowNode = {
  id: string;
  step: string;
  label: string;
  x: number;
  y: number;
  tone: string;
};

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: FlowNode,
  to: FlowNode,
  controlA: { x: number; y: number },
  controlB: { x: number; y: number },
) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 12]);
  ctx.strokeStyle = "rgba(146, 109, 39, 0.48)";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.bezierCurveTo(controlA.x, controlA.y, controlB.x, controlB.y, to.x, to.y);
  ctx.stroke();
  ctx.restore();

  const angle = Math.atan2(to.y - controlB.y, to.x - controlB.x);
  const arrowSize = 11;

  ctx.save();
  ctx.fillStyle = "rgba(146, 109, 39, 0.9)";
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - arrowSize * Math.cos(angle - Math.PI / 7),
    to.y - arrowSize * Math.sin(angle - Math.PI / 7),
  );
  ctx.lineTo(
    to.x - arrowSize * Math.cos(angle + Math.PI / 7),
    to.y - arrowSize * Math.sin(angle + Math.PI / 7),
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawNode(ctx: CanvasRenderingContext2D, node: FlowNode) {
  ctx.save();
  ctx.shadowColor = "rgba(116, 84, 26, 0.2)";
  ctx.shadowBlur = 28;
  ctx.fillStyle = node.tone;
  ctx.beginPath();
  ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#fff";
  ctx.font = "700 13px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(node.step, node.x, node.y + 0.5);

  const chipWidth = Math.max(148, ctx.measureText(node.label).width + 28);
  const chipX = node.x - chipWidth / 2;
  const chipY = node.y + 36;

  ctx.save();
  drawRoundedRect(ctx, chipX, chipY, chipWidth, 38, 18);
  ctx.fillStyle = "rgba(255, 252, 246, 0.94)";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(222, 198, 144, 0.8)";
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#3b2a1c";
  ctx.font = "600 13px system-ui";
  ctx.fillText(node.label, node.x, chipY + 19);
}

function renderFlow(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#fffdf8");
  background.addColorStop(0.48, "#fbf1dd");
  background.addColorStop(1, "#f4dfb7");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const glowA = ctx.createRadialGradient(width * 0.78, height * 0.14, 0, width * 0.78, height * 0.14, width * 0.34);
  glowA.addColorStop(0, "rgba(205, 153, 51, 0.22)");
  glowA.addColorStop(1, "rgba(205, 153, 51, 0)");
  ctx.fillStyle = glowA;
  ctx.fillRect(0, 0, width, height);

  const nodes: FlowNode[] = [
    { id: "paid", step: "01", label: "Paid order", x: width * 0.12, y: height * 0.28, tone: "#cd9933" },
    { id: "retry", step: "02", label: "Create / Retry", x: width * 0.31, y: height * 0.18, tone: "#b7852d" },
    { id: "awb", step: "03", label: "AWB + pickup auto", x: width * 0.51, y: height * 0.36, tone: "#9a7429" },
    { id: "edit", step: "04", label: "Edit or EWB", x: width * 0.69, y: height * 0.2, tone: "#b88d43" },
    { id: "label", step: "05", label: "Label ready", x: width * 0.86, y: height * 0.46, tone: "#caa25a" },
    { id: "track", step: "06", label: "Track live", x: width * 0.65, y: height * 0.74, tone: "#83914f" },
    { id: "cancel", step: "07", label: "Cancel if needed", x: width * 0.34, y: height * 0.75, tone: "#b56b54" },
  ];

  drawArrow(ctx, nodes[0], nodes[1], { x: width * 0.18, y: height * 0.18 }, { x: width * 0.24, y: height * 0.14 });
  drawArrow(ctx, nodes[1], nodes[2], { x: width * 0.38, y: height * 0.2 }, { x: width * 0.43, y: height * 0.29 });
  drawArrow(ctx, nodes[2], nodes[3], { x: width * 0.56, y: height * 0.24 }, { x: width * 0.63, y: height * 0.16 });
  drawArrow(ctx, nodes[3], nodes[4], { x: width * 0.75, y: height * 0.24 }, { x: width * 0.81, y: height * 0.34 });
  drawArrow(ctx, nodes[4], nodes[5], { x: width * 0.88, y: height * 0.62 }, { x: width * 0.76, y: height * 0.7 });
  drawArrow(ctx, nodes[2], nodes[6], { x: width * 0.48, y: height * 0.56 }, { x: width * 0.4, y: height * 0.7 });

  ctx.save();
  ctx.fillStyle = "rgba(59, 42, 28, 0.62)";
  ctx.font = "600 14px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("Shipment creation already tries the first pickup request.", 28, height - 78);
  ctx.fillText("Use Pickup Again only when Delhivery needs a refreshed slot.", 28, height - 54);
  ctx.restore();

  nodes.forEach((node) => drawNode(ctx, node));
}

export function DelhiveryGuideCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) {
      return;
    }

    const redraw = () => {
      const width = container.clientWidth;
      const height = Math.max(430, Math.min(560, Math.round(width * 0.62)));
      const dpr = window.devicePixelRatio || 1;
      const context = canvas.getContext("2d");

      if (!context || width === 0) {
        return;
      }

      container.style.height = `${height}px`;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
      renderFlow(context, width, height);
    };

    const observer = new ResizeObserver(() => redraw());
    observer.observe(container);
    redraw();

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-[2rem] border border-[#ead8b2] bg-[#fffaf0] shadow-[0_34px_90px_-58px_rgba(116,84,26,0.35)]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap gap-2 border-t border-white/70 bg-white/72 px-4 py-3 text-xs font-medium text-[#6d5a4d] backdrop-blur-sm">
        <span className="rounded-full border border-[#ead8b2] bg-white px-3 py-1">Automatic pickup attempt on shipment create</span>
        <span className="rounded-full border border-[#ead8b2] bg-white px-3 py-1">Manual pickup button for recovery or reschedule</span>
        <span className="rounded-full border border-[#ead8b2] bg-white px-3 py-1">Cancel stays last as the exception path</span>
      </div>
    </div>
  );
}