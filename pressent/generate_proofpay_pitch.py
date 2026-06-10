from __future__ import annotations

import datetime as dt
import html
import zipfile
from pathlib import Path


EMU = 914400
SLIDE_W = int(13.333333 * EMU)
SLIDE_H = int(7.5 * EMU)

ROOT = Path(__file__).resolve().parent

COLORS = {
    "ink": "101828",
    "muted": "475467",
    "soft": "F8FAFC",
    "paper": "FFFFFF",
    "line": "D0D5DD",
    "navy": "0B1220",
    "teal": "0F766E",
    "cyan": "06B6D4",
    "green": "16A34A",
    "orange": "EA580C",
    "amber": "D97706",
    "rose": "E11D48",
    "blue": "2563EB",
    "violet": "7C3AED",
}


def inch(value: float) -> int:
    return int(value * EMU)


def esc(value: str) -> str:
    return html.escape(value, quote=False)


def para(
    text: str,
    *,
    size: int,
    color: str,
    bold: bool = False,
    align: str = "left",
    face: str = "Aptos",
) -> str:
    return (
        f'<a:p><a:pPr algn="{align}"/>'
        f'<a:r><a:rPr lang="en-US" sz="{size}" b="{"1" if bold else "0"}" dirty="0">'
        f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
        f'<a:latin typeface="{face}"/><a:ea typeface="{face}"/><a:cs typeface="{face}"/>'
        f'</a:rPr><a:t>{esc(text)}</a:t></a:r>'
        f'<a:endParaRPr lang="en-US" sz="{size}" dirty="0">'
        f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
        f'<a:latin typeface="{face}"/><a:ea typeface="{face}"/><a:cs typeface="{face}"/>'
        f'</a:endParaRPr></a:p>'
    )


def textbox(
    shape_id: int,
    name: str,
    x: int,
    y: int,
    w: int,
    h: int,
    lines: list[str],
    *,
    size: int = 1500,
    color: str = COLORS["ink"],
    bold: bool = False,
    align: str = "left",
    face: str = "Aptos",
) -> str:
    body = "".join(
        para(line, size=size, color=color, bold=bold, align=align, face=face)
        for line in lines
    )
    return (
        '<p:sp>'
        '<p:nvSpPr>'
        f'<p:cNvPr id="{shape_id}" name="{esc(name)}"/>'
        '<p:cNvSpPr txBox="1"/>'
        '<p:nvPr/>'
        '</p:nvSpPr>'
        '<p:spPr>'
        f'<a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
        '<a:noFill/><a:ln><a:noFill/></a:ln>'
        '</p:spPr>'
        '<p:txBody>'
        '<a:bodyPr wrap="square" anchor="t" lIns="91440" tIns="45720" rIns="91440" bIns="45720"/>'
        '<a:lstStyle/>'
        f'{body}'
        '</p:txBody>'
        '</p:sp>'
    )


def rect(
    shape_id: int,
    name: str,
    x: int,
    y: int,
    w: int,
    h: int,
    fill: str,
    *,
    line: str | None = None,
) -> str:
    if line:
        line_xml = f'<a:ln w="9525"><a:solidFill><a:srgbClr val="{line}"/></a:solidFill></a:ln>'
    else:
        line_xml = '<a:ln><a:noFill/></a:ln>'
    return (
        '<p:sp>'
        '<p:nvSpPr>'
        f'<p:cNvPr id="{shape_id}" name="{esc(name)}"/>'
        '<p:cNvSpPr/>'
        '<p:nvPr/>'
        '</p:nvSpPr>'
        '<p:spPr>'
        f'<a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
        f'<a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>'
        f'{line_xml}'
        '</p:spPr>'
        '</p:sp>'
    )


def slide_xml(name: str, shapes: list[str]) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        f'<p:cSld name="{esc(name)}"><p:spTree>'
        '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/>'
        f'<a:ext cx="{SLIDE_W}" cy="{SLIDE_H}"/>'
        '<a:chOff x="0" y="0"/>'
        f'<a:chExt cx="{SLIDE_W}" cy="{SLIDE_H}"/>'
        '</a:xfrm></p:grpSpPr>'
        f'{"".join(shapes)}'
        '</p:spTree></p:cSld>'
        '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>'
        '</p:sld>'
    )


class Slide:
    def __init__(self, name: str, accent: str, dark: bool = False):
        self.name = name
        self.accent = accent
        self.dark = dark
        self.shapes: list[str] = []
        self.next_id = 2

    def sid(self) -> int:
        current = self.next_id
        self.next_id += 1
        return current

    def add_rect(self, name: str, x: float, y: float, w: float, h: float, fill: str, line: str | None = None) -> None:
        self.shapes.append(rect(self.sid(), name, inch(x), inch(y), inch(w), inch(h), fill, line=line))

    def add_text(
        self,
        name: str,
        x: float,
        y: float,
        w: float,
        h: float,
        lines: list[str],
        *,
        size: int,
        color: str,
        bold: bool = False,
        align: str = "left",
        face: str = "Aptos",
    ) -> None:
        self.shapes.append(
            textbox(
                self.sid(),
                name,
                inch(x),
                inch(y),
                inch(w),
                inch(h),
                lines,
                size=size,
                color=color,
                bold=bold,
                align=align,
                face=face,
            )
        )

    def header(self, title: str, kicker: str, index: int) -> None:
        self.add_rect("background", 0, 0, 13.333333, 7.5, COLORS["soft"])
        self.add_rect("top accent", 0, 0, 13.333333, 0.14, self.accent)
        self.add_text("kicker", 0.74, 0.38, 8.0, 0.26, [kicker.upper()], size=900, color=COLORS["muted"], bold=True)
        self.add_text("title", 0.72, 0.68, 9.9, 0.62, [title], size=2700, color=COLORS["ink"], bold=True, face="Aptos Display")
        self.add_rect("number block", 11.65, 0.38, 0.82, 0.42, self.accent)
        self.add_text("number", 11.7, 0.45, 0.72, 0.22, [f"{index:02d}"], size=1050, color="FFFFFF", bold=True, align="center")

    def footer(self, text: str) -> None:
        self.add_text("footer", 0.72, 6.88, 8.5, 0.24, [text], size=850, color=COLORS["muted"])

    def card(self, title: str, body: list[str], x: float, y: float, w: float, h: float, accent: str) -> None:
        self.add_rect(f"card {title}", x, y, w, h, COLORS["paper"], line=COLORS["line"])
        self.add_rect(f"card accent {title}", x, y, 0.08, h, accent)
        self.add_text(f"card title {title}", x + 0.16, y + 0.16, w - 0.28, 0.32, [title], size=1350, color=COLORS["ink"], bold=True)
        self.add_text(f"card body {title}", x + 0.16, y + 0.55, w - 0.28, h - 0.62, body, size=1050, color=COLORS["muted"])

    def build(self) -> str:
        return slide_xml(self.name, self.shapes)


def render_title(spec: dict, index: int, total: int) -> str:
    slide = Slide(spec["title"], spec["accent"], dark=True)
    slide.add_rect("background", 0, 0, 13.333333, 7.5, COLORS["navy"])
    slide.add_rect("left stripe", 0, 0, 0.24, 7.5, spec["accent"])
    slide.add_text("brand", 0.75, 0.58, 5.2, 0.34, ["PROOFPAY / RIALO"], size=950, color="CBD5E1", bold=True)
    slide.add_text("title", 0.72, 1.5, 11.3, 1.18, [spec["title"]], size=4100, color="FFFFFF", bold=True, face="Aptos Display")
    slide.add_text("subtitle", 0.76, 2.75, 10.6, 0.82, [spec["subtitle"]], size=1650, color="E2E8F0")
    slide.add_rect("statement line", 0.78, 4.62, 5.2, 0.1, spec["accent"])
    slide.add_text("statement", 0.76, 4.86, 9.8, 0.76, [spec["statement"]], size=1500, color="F8FAFC")
    slide.add_text("meta", 0.76, 6.52, 10.0, 0.28, [f"{spec['meta']}  |  {index}/{total}"], size=900, color="94A3B8")
    return slide.build()


def render_statement(spec: dict, index: int, total: int) -> str:
    slide = Slide(spec["title"], spec["accent"])
    slide.header(spec["title"], spec["kicker"], index)
    slide.add_rect("hero statement", 0.78, 1.62, 11.78, 1.15, COLORS["navy"])
    slide.add_text("statement", 1.0, 1.86, 11.25, 0.56, [spec["statement"]], size=1750, color="FFFFFF", bold=True)
    cards = spec["cards"]
    positions = [(0.78, 3.18), (3.86, 3.18), (6.94, 3.18), (10.02, 3.18)]
    for card, pos in zip(cards, positions, strict=False):
        slide.card(card["title"], card["body"], pos[0], pos[1], 2.54, 2.5, card["accent"])
    slide.footer(f"{spec['footer']}  |  {index}/{total}")
    return slide.build()


def render_cards(spec: dict, index: int, total: int) -> str:
    slide = Slide(spec["title"], spec["accent"])
    slide.header(spec["title"], spec["kicker"], index)
    positions = [(0.78, 1.65), (4.52, 1.65), (8.26, 1.65), (0.78, 4.16), (4.52, 4.16), (8.26, 4.16)]
    for card, pos in zip(spec["cards"], positions, strict=False):
        slide.card(card["title"], card["body"], pos[0], pos[1], 3.3, 1.8, card["accent"])
    slide.footer(f"{spec['footer']}  |  {index}/{total}")
    return slide.build()


def render_flow(spec: dict, index: int, total: int) -> str:
    slide = Slide(spec["title"], spec["accent"])
    slide.header(spec["title"], spec["kicker"], index)
    x = 0.75
    y = 2.05
    for step_index, step in enumerate(spec["steps"], start=1):
        slide.add_rect(f"step {step_index}", x, y, 1.72, 1.36, COLORS["paper"], line=COLORS["line"])
        slide.add_rect(f"step bar {step_index}", x, y, 1.72, 0.16, step["accent"])
        slide.add_text(f"step title {step_index}", x + 0.1, y + 0.31, 1.52, 0.26, [step["title"]], size=1050, color=COLORS["ink"], bold=True, align="center")
        slide.add_text(f"step body {step_index}", x + 0.12, y + 0.72, 1.48, 0.36, step["body"], size=780, color=COLORS["muted"], align="center")
        if step_index < len(spec["steps"]):
            slide.add_text(f"arrow {step_index}", x + 1.8, y + 0.5, 0.36, 0.24, ["->"], size=1200, color=COLORS["muted"], bold=True, align="center")
        x += 2.07
    slide.add_rect("note", 1.0, 4.65, 11.0, 0.9, "ECFDF3", line="ABEFC6")
    slide.add_text("note text", 1.15, 4.86, 10.65, 0.36, [spec["note"]], size=1300, color=COLORS["ink"], bold=True, align="center")
    slide.footer(f"{spec['footer']}  |  {index}/{total}")
    return slide.build()


def render_matrix(spec: dict, index: int, total: int) -> str:
    slide = Slide(spec["title"], spec["accent"])
    slide.header(spec["title"], spec["kicker"], index)
    slide.add_text("left head", 0.95, 1.55, 4.3, 0.32, [spec["left_head"]], size=1300, color=COLORS["ink"], bold=True)
    slide.add_text("right head", 6.25, 1.55, 4.8, 0.32, [spec["right_head"]], size=1300, color=COLORS["ink"], bold=True)
    y = 2.0
    for row in spec["rows"]:
        slide.add_rect(f"row {row['left']}", 0.82, y, 11.65, 0.64, COLORS["paper"], line=COLORS["line"])
        slide.add_rect(f"row accent {row['left']}", 0.82, y, 0.08, 0.64, row["accent"])
        slide.add_text(f"left {row['left']}", 1.02, y + 0.15, 4.4, 0.23, [row["left"]], size=1120, color=COLORS["ink"], bold=True)
        slide.add_text(f"right {row['left']}", 6.25, y + 0.13, 5.8, 0.25, [row["right"]], size=980, color=COLORS["muted"])
        y += 0.76
    slide.footer(f"{spec['footer']}  |  {index}/{total}")
    return slide.build()


def render_split(spec: dict, index: int, total: int) -> str:
    slide = Slide(spec["title"], spec["accent"])
    slide.header(spec["title"], spec["kicker"], index)
    slide.add_rect("left panel", 0.78, 1.55, 5.35, 4.95, COLORS["paper"], line=COLORS["line"])
    slide.add_rect("left accent", 0.78, 1.55, 0.1, 4.95, spec["accent"])
    slide.add_text("left title", 1.05, 1.85, 4.7, 0.34, [spec["left_title"]], size=1450, color=COLORS["ink"], bold=True)
    slide.add_text("left body", 1.05, 2.35, 4.72, 3.5, spec["left_body"], size=1120, color=COLORS["muted"])
    for card, y in zip(spec["right_cards"], [1.55, 3.2, 4.85], strict=False):
        slide.card(card["title"], card["body"], 6.65, y, 5.75, 1.18, card["accent"])
    slide.footer(f"{spec['footer']}  |  {index}/{total}")
    return slide.build()


def render_architecture(spec: dict, index: int, total: int) -> str:
    slide = Slide(spec["title"], spec["accent"])
    slide.header(spec["title"], spec["kicker"], index)
    y = 1.62
    for layer_index, layer in enumerate(spec["layers"], start=1):
        slide.add_rect(f"layer {layer_index}", 0.95, y, 11.38, 0.76, COLORS["paper"], line=COLORS["line"])
        slide.add_rect(f"layer accent {layer_index}", 0.95, y, 0.1, 0.76, layer["accent"])
        slide.add_text(f"layer title {layer_index}", 1.2, y + 0.16, 2.65, 0.25, [layer["title"]], size=1150, color=COLORS["ink"], bold=True)
        slide.add_text(f"layer body {layer_index}", 4.0, y + 0.14, 7.8, 0.28, [layer["body"]], size=980, color=COLORS["muted"])
        if layer_index < len(spec["layers"]):
            slide.add_text(f"down {layer_index}", 6.08, y + 0.79, 0.55, 0.2, ["v"], size=900, color=COLORS["muted"], bold=True, align="center")
        y += 0.93
    slide.footer(f"{spec['footer']}  |  {index}/{total}")
    return slide.build()


def render_sources(spec: dict, index: int, total: int) -> str:
    slide = Slide(spec["title"], spec["accent"], dark=True)
    slide.add_rect("background", 0, 0, 13.333333, 7.5, COLORS["navy"])
    slide.add_rect("top accent", 0, 0, 13.333333, 0.16, spec["accent"])
    slide.add_text("title", 0.78, 0.76, 10.6, 0.62, [spec["title"]], size=3000, color="FFFFFF", bold=True, face="Aptos Display")
    slide.add_text("closing", 0.82, 1.65, 11.1, 0.9, [spec["closing"]], size=1550, color="E2E8F0", bold=True)
    slide.add_rect("demo box", 0.82, 3.08, 5.7, 2.3, "111827", line="334155")
    slide.add_text("demo title", 1.05, 3.3, 5.1, 0.32, [spec["demo_title"]], size=1250, color="FFFFFF", bold=True)
    slide.add_text("demo body", 1.05, 3.78, 5.15, 1.2, spec["demo"], size=950, color="CBD5E1")
    slide.add_rect("source box", 6.92, 3.08, 5.55, 2.3, "111827", line="334155")
    slide.add_text("source title", 7.14, 3.3, 5.05, 0.32, [spec["source_title"]], size=1250, color="FFFFFF", bold=True)
    slide.add_text("source body", 7.14, 3.78, 5.1, 1.2, spec["sources"], size=850, color="CBD5E1")
    slide.add_text("footer", 0.82, 6.62, 10.5, 0.28, [f"{spec['footer']}  |  {index}/{total}"], size=900, color="94A3B8")
    return slide.build()


RENDERERS = {
    "title": render_title,
    "statement": render_statement,
    "cards": render_cards,
    "flow": render_flow,
    "matrix": render_matrix,
    "split": render_split,
    "architecture": render_architecture,
    "sources": render_sources,
}


COMMON_SOURCES = [
    "learn.rialo.io",
    "learn.rialo.io/tutorials/reactive",
    "learn.rialo.io/tutorials/async",
    "rialo.io/for-devs",
    "Project README and ProofPay DApp Explainer",
]


VI_SLIDES = [
    {
        "type": "title",
        "title": "ProofPay on Rialo",
        "subtitle": "Escrow theo bằng chứng cho thanh toán Web3 có điều kiện",
        "statement": "Khóa tiền trước, xác minh bằng chứng sau, rồi release hoặc refund theo rule có thể audit.",
        "meta": "Báo cáo dự án",
        "accent": COLORS["teal"],
    },
    {
        "type": "statement",
        "title": "Tóm tắt điều hành",
        "kicker": "Executive summary",
        "statement": "ProofPay biến thanh toán freelancer, bounty và milestone thành một workflow có điều kiện thay vì một giao dịch token một chiều.",
        "cards": [
            {"title": "Niềm tin trước khi làm", "body": ["Payer fund escrow để payee thấy tiền đã được khóa."], "accent": COLORS["teal"]},
            {"title": "Proof thay lời hứa", "body": ["GitHub PR merged, deadline và author trở thành điều kiện thanh toán."], "accent": COLORS["blue"]},
            {"title": "Settlement theo rule", "body": ["Verified thì release; fail hoặc quá hạn thì refund/dispute."], "accent": COLORS["green"]},
            {"title": "Fit với Rialo", "body": ["Reactive, async, workflow và Edge là đúng lớp hạ tầng cho mô hình này."], "accent": COLORS["orange"]},
        ],
        "footer": "ProofPay report",
        "accent": COLORS["teal"],
    },
    {
        "type": "cards",
        "title": "Vấn đề cần giải quyết",
        "kicker": "Problem",
        "cards": [
            {"title": "Client không muốn trả trước", "body": ["Rủi ro người làm không giao đúng cam kết."], "accent": COLORS["rose"]},
            {"title": "Developer sợ không được trả", "body": ["Làm xong mới đòi tiền tạo rủi ro cashflow và dispute."], "accent": COLORS["orange"]},
            {"title": "Transfer token quá đơn giản", "body": ["Không gắn payment với điều kiện công việc."], "accent": COLORS["amber"]},
            {"title": "Escrow tập trung chậm", "body": ["Cần bên thứ ba giữ tiền, xử lý thủ công và phí cao."], "accent": COLORS["blue"]},
            {"title": "Private repo khó chứng minh", "body": ["Không thể public source code chỉ để chứng minh công việc."], "accent": COLORS["violet"]},
            {"title": "Thiếu audit trail", "body": ["Ai fund, ai verify, vì sao release/refund phải truy vết được."], "accent": COLORS["green"]},
        ],
        "footer": "Trust gap trong online work",
        "accent": COLORS["rose"],
    },
    {
        "type": "flow",
        "title": "Ý tưởng sản phẩm",
        "kicker": "Proof-based escrow",
        "steps": [
            {"title": "Create", "body": ["Deal + rule"], "accent": COLORS["blue"]},
            {"title": "Fund", "body": ["Lock RIALO"], "accent": COLORS["teal"]},
            {"title": "Verify", "body": ["Check proof"], "accent": COLORS["orange"]},
            {"title": "Anchor", "body": ["Proof hash"], "accent": COLORS["violet"]},
            {"title": "Settle", "body": ["Release / refund"], "accent": COLORS["green"]},
            {"title": "Audit", "body": ["Events + tx"], "accent": COLORS["amber"]},
        ],
        "note": "Câu demo dễ hiểu: trả 100 RIALO nếu GitHub PR #42 được merge trước deadline.",
        "footer": "Core flow",
        "accent": COLORS["blue"],
    },
    {
        "type": "matrix",
        "title": "ProofPay tận dụng Rialo như thế nào",
        "kicker": "Rialo fit",
        "left_head": "Rialo primitive",
        "right_head": "Giá trị cho ProofPay",
        "rows": [
            {"left": "Reactive Transactions", "right": "Đây là kiểu logic mà ProofPay muốn map sang Rialo thật: đủ điều kiện thì tự settle.", "accent": COLORS["teal"]},
            {"left": "Async Transactions", "right": "Phù hợp với verify GitHub/off-chain proof rồi mới tiếp tục release hoặc refund.", "accent": COLORS["blue"]},
            {"left": "Rialo Edge", "right": "Là điểm mạnh để nối GitHub, private repo và API ngoài vào workflow production.", "accent": COLORS["orange"]},
            {"left": "Rialo Workflow", "right": "Chính là mô hình sản phẩm của ProofPay: create, fund, verify, release, refund, dispute.", "accent": COLORS["green"]},
            {"left": "IPC + privacy", "right": "Hợp với case private repo: chỉ ghi proof hash và result, không lộ raw code.", "accent": COLORS["violet"]},
            {"left": "Omni Account / Interop", "right": "Chưa dùng trong prototype, nhưng là hướng mở rộng nếu support multi-network payments.", "accent": COLORS["amber"]},
        ],
        "footer": "Slide này nói về độ phù hợp của Rialo với sản phẩm, chưa phải integration thật",
        "accent": COLORS["teal"],
    },
    {
        "type": "cards",
        "title": "Dự án đang dùng Rialo ở mức nào",
        "kicker": "Now vs later",
        "cards": [
            {"title": "Đang dùng thật", "body": ["Adapter boundary, escrow lifecycle, proof-hash flow và state machine được thiết kế theo mô hình Rialo."], "accent": COLORS["green"]},
            {"title": "Đang mock", "body": ["create escrow, fund, anchor proof, release, refund hiện mới trả mock tx hash qua MockRialoAdapter."], "accent": COLORS["orange"]},
            {"title": "Chưa lên Rialo chain", "body": ["Chưa có custody tài sản thật, chưa có signed transaction, chưa có program/service trên devnet."], "accent": COLORS["rose"]},
            {"title": "Chỗ cắm hiện tại", "body": ["Backend gọi rialoAdapter ở create, fund, verify->submitProofHash, release, refund."], "accent": COLORS["blue"]},
            {"title": "Giá trị hiện tại", "body": ["Cho phép validate UX, API, verifier, audit trail trước khi build chain integration tốn kém."], "accent": COLORS["teal"]},
            {"title": "Bước kế tiếp", "body": ["Thay MockRialoAdapter bằng Rialo Rust microservice hoặc rialo-cdk path như README đã nêu."], "accent": COLORS["violet"]},
        ],
        "footer": "Đây là phần cần nói rõ khi demo để tránh hiểu nhầm",
        "accent": COLORS["orange"],
    },
    {
        "type": "cards",
        "title": "Lợi thế công nghệ Rialo",
        "kicker": "Why Rialo matters",
        "cards": [
            {"title": "Tốc độ settlement", "body": ["Dev Portal nêu finality khoảng 0.13s và block time khoảng 0.05s."], "accent": COLORS["green"]},
            {"title": "Throughput cao", "body": ["Execution TPS được định vị ở mức 1M+ cho workload lớn."], "accent": COLORS["blue"]},
            {"title": "Reaction time cực thấp", "body": ["Reaction time 0.000001s phù hợp conditional automation."], "accent": COLORS["teal"]},
            {"title": "Edge cho Web2 calls", "body": ["Rialo Edge hướng tới bidirectional Web2 interactivity và 100k+ concurrent calls."], "accent": COLORS["orange"]},
            {"title": "Workflow native", "body": ["Native automation giúp escrow nhiều bước gần với logic đời thực."], "accent": COLORS["violet"]},
            {"title": "Gas-less path", "body": ["Rialo Cruise mở đường cho giao dịch low-to-zero fee trong UX production."], "accent": COLORS["amber"]},
        ],
        "footer": "Các điểm này làm ProofPay khác escrow Web3 truyền thống",
        "accent": COLORS["green"],
    },
    {
        "type": "architecture",
        "title": "Kiến trúc hiện tại và đường nâng cấp",
        "kicker": "Technical architecture",
        "layers": [
            {"title": "Static DApp UI", "body": "Dashboard, wallet session simulation, RIALO ledger, escrow actions.", "accent": COLORS["blue"]},
            {"title": "Node.js / Express API", "body": "Deal lifecycle, validation, routes fund / verify / release / refund / dispute.", "accent": COLORS["teal"]},
            {"title": "Storage abstraction", "body": "Local JSON fallback, Vercel KV / Upstash path cho state bền vững.", "accent": COLORS["amber"]},
            {"title": "GitHub verifier", "body": "Kiểm tra owner, repo, PR number, merged status, deadline, expected author.", "accent": COLORS["orange"]},
            {"title": "Mock Rialo adapter", "body": "Trả transaction-shaped response cho create escrow, fund, anchor, release, refund.", "accent": COLORS["violet"]},
            {"title": "Future Rialo service", "body": "Node API -> Rialo Rust microservice -> rialo-cdk -> Rialo devnet/mainnet.", "accent": COLORS["green"]},
        ],
        "footer": "Prototype đã tách rõ product logic và chain adapter",
        "accent": COLORS["blue"],
    },
    {
        "type": "split",
        "title": "Prototype chứng minh được gì",
        "kicker": "Scope and evidence",
        "left_title": "Điều cần nói thẳng",
        "left_body": [
            "- Wallet, faucet, balance và tx hash đang được mô phỏng.",
            "- Chưa custody tài sản thật, chưa phải production-ready.",
            "- Giá trị chính là validate UX, state machine, verifier và chỗ gắn Rialo adapter.",
        ],
        "right_cards": [
            {"title": "Đang real", "body": ["Express API, deal state machine, GitHub public PR verifier, storage layer, tests."], "accent": COLORS["green"]},
            {"title": "Đang mock", "body": ["Wallet session, RIALO balance, escrow custody, Rialo transaction hash."], "accent": COLORS["orange"]},
            {"title": "Đã test", "body": ["Node built-in tests pass; build check pass; endpoint health smoke test pass."], "accent": COLORS["blue"]},
        ],
        "footer": "Demo trung thực và dễ bảo vệ trước câu hỏi kỹ thuật",
        "accent": COLORS["orange"],
    },
    {
        "type": "cards",
        "title": "Điểm mạnh của dự án",
        "kicker": "Strengths",
        "cards": [
            {"title": "Product rõ", "body": ["Một câu đã hiểu: pay if proof is verified."], "accent": COLORS["teal"]},
            {"title": "Proof machine-readable", "body": ["GitHub PR metadata là proof đầu tiên, có API rõ."], "accent": COLORS["blue"]},
            {"title": "State machine chặt", "body": ["DRAFT -> FUNDED -> VERIFIED -> RELEASED / REFUNDED."], "accent": COLORS["green"]},
            {"title": "Audit-first", "body": ["Proof hash, tx hash và event trail phục vụ kiểm toán."], "accent": COLORS["violet"]},
            {"title": "Mở rộng proof type", "body": ["Issue closed, release tag, invoice approved, delivery confirmed."], "accent": COLORS["amber"]},
            {"title": "Rialo-native path", "body": ["Adapter pattern giúp nâng cấp từ mock sang real transaction."], "accent": COLORS["orange"]},
        ],
        "footer": "Tốt cho builder audience và Web3 product review",
        "accent": COLORS["green"],
    },
    {
        "type": "split",
        "title": "Private repo: quyền truy cập và verifier",
        "kicker": "GitHub verification",
        "left_title": "Quyền truy cập phải có trước deal",
        "left_body": [
            "- Bên thuê mời collaborator vào private repo.",
            "- Hoặc thêm người làm vào org/team có quyền repo.",
            "- Hoặc assign task ở nền tảng ngoài rồi cấp access GitHub.",
            "- Sau khi thống nhất scope, amount và điều kiện PR, mới tạo deal ProofPay.",
        ],
        "right_cards": [
            {"title": "ProofPay kiểm tra gì", "body": ["owner, repo, pullNumber, merged_at, expectedAuthor, deadline."], "accent": COLORS["blue"]},
            {"title": "Tín hiệu hoàn thành", "body": ["Không nên chỉ check commit. Điều kiện tốt hơn là PR merged vì thể hiện repo owner đã accept."], "accent": COLORS["green"]},
            {"title": "Private repo production", "body": ["Dùng GitHub App scoped permissions để đọc PR metadata, rồi chỉ publish proofHash/result."], "accent": COLORS["violet"]},
        ],
        "footer": "ProofPay không cấp quyền vào repo; ProofPay chỉ verify bằng chứng sau khi quyền đã được cấp",
        "accent": COLORS["violet"],
    },
    {
        "type": "cards",
        "title": "Hiệu quả và use case",
        "kicker": "Impact",
        "cards": [
            {"title": "Freelancer engineering", "body": ["Thanh toán theo PR merged hoặc milestone đã đạt."], "accent": COLORS["blue"]},
            {"title": "DAO bounty", "body": ["Fund bounty trước, release theo proof công khai."], "accent": COLORS["teal"]},
            {"title": "Private repo work", "body": ["GitHub App đọc metadata, chỉ publish proof hash/result."], "accent": COLORS["violet"]},
            {"title": "Agency milestone", "body": ["Nhiều escrow nhỏ thay vì release toàn bộ ngân sách."], "accent": COLORS["orange"]},
            {"title": "Invoice / delivery proof", "body": ["Mở rộng sang proof ngoài GitHub qua API hoặc oracle."], "accent": COLORS["amber"]},
            {"title": "Enterprise workflow", "body": ["Có audit, policy, deadline và dispute path rõ ràng."], "accent": COLORS["green"]},
        ],
        "footer": "Hiệu quả đến từ giảm dispute và giảm xử lý thủ công",
        "accent": COLORS["amber"],
    },
    {
        "type": "flow",
        "title": "Roadmap production",
        "kicker": "Next steps",
        "steps": [
            {"title": "Wallet", "body": ["Real signing"], "accent": COLORS["blue"]},
            {"title": "Storage", "body": ["KV / DB"], "accent": COLORS["teal"]},
            {"title": "GitHub App", "body": ["Private repo"], "accent": COLORS["violet"]},
            {"title": "Rialo", "body": ["Real adapter"], "accent": COLORS["green"]},
            {"title": "Policy", "body": ["Roles + auth"], "accent": COLORS["orange"]},
            {"title": "Security", "body": ["Audit + dispute"], "accent": COLORS["rose"]},
        ],
        "note": "MVP production nên khóa scope: GitHub PR escrow trước, sau đó mở proof type khác.",
        "footer": "Từ prototype sang Rialo-native escrow",
        "accent": COLORS["violet"],
    },
    {
        "type": "sources",
        "title": "Kết luận",
        "closing": "ProofPay là một use case tự nhiên cho Rialo: real-world proof, payment workflow, privacy-aware verification và settlement có thể tự động hóa.",
        "demo_title": "Demo 5 phút",
        "demo": [
            "1. Connect wallet + faucet",
            "2. Create GitHub escrow",
            "3. Fund RIALO",
            "4. Verify PR proof",
            "5. Release hoặc refund",
        ],
        "source_title": "Nguồn tham chiếu",
        "sources": COMMON_SOURCES,
        "footer": "ProofPay on Rialo",
        "accent": COLORS["teal"],
    },
]


EN_SLIDES = [
    {
        "type": "title",
        "title": "ProofPay on Rialo",
        "subtitle": "Proof-based escrow for conditional Web3 payments",
        "statement": "Lock funds first, verify evidence later, then release or refund through an auditable rule.",
        "meta": "Project report",
        "accent": COLORS["teal"],
    },
    {
        "type": "statement",
        "title": "Executive Summary",
        "kicker": "Overview",
        "statement": "ProofPay turns freelancer, bounty, and milestone payments into conditional workflows instead of one-way token transfers.",
        "cards": [
            {"title": "Trust before work", "body": ["The payer funds escrow so the payee can see committed capital."], "accent": COLORS["teal"]},
            {"title": "Proof over promises", "body": ["Merged PRs, deadlines, and authors become payment conditions."], "accent": COLORS["blue"]},
            {"title": "Rule-based settlement", "body": ["Verified means release; failed or expired means refund or dispute."], "accent": COLORS["green"]},
            {"title": "Strong Rialo fit", "body": ["Reactive, async, workflow, and Edge primitives align with this model."], "accent": COLORS["orange"]},
        ],
        "footer": "ProofPay report",
        "accent": COLORS["teal"],
    },
    {
        "type": "cards",
        "title": "The Problem",
        "kicker": "Trust gap",
        "cards": [
            {"title": "Clients resist prepayment", "body": ["They risk paying before the work is delivered."], "accent": COLORS["rose"]},
            {"title": "Developers fear non-payment", "body": ["Doing the work first creates cashflow and dispute risk."], "accent": COLORS["orange"]},
            {"title": "Token transfers are too simple", "body": ["A transfer does not encode the work condition."], "accent": COLORS["amber"]},
            {"title": "Centralized escrow is slow", "body": ["Third-party custody adds manual operations and fees."], "accent": COLORS["blue"]},
            {"title": "Private repos are sensitive", "body": ["Teams cannot expose source code just to prove delivery."], "accent": COLORS["violet"]},
            {"title": "Audit trails are weak", "body": ["Funding, verification, release, and refund need clear evidence."], "accent": COLORS["green"]},
        ],
        "footer": "Online work needs conditional settlement",
        "accent": COLORS["rose"],
    },
    {
        "type": "flow",
        "title": "Product Concept",
        "kicker": "Proof-based escrow",
        "steps": [
            {"title": "Create", "body": ["Deal + rule"], "accent": COLORS["blue"]},
            {"title": "Fund", "body": ["Lock RIALO"], "accent": COLORS["teal"]},
            {"title": "Verify", "body": ["Check proof"], "accent": COLORS["orange"]},
            {"title": "Anchor", "body": ["Proof hash"], "accent": COLORS["violet"]},
            {"title": "Settle", "body": ["Release / refund"], "accent": COLORS["green"]},
            {"title": "Audit", "body": ["Events + tx"], "accent": COLORS["amber"]},
        ],
        "note": "Simple demo line: pay 100 RIALO if GitHub PR #42 is merged before the deadline.",
        "footer": "Core flow",
        "accent": COLORS["blue"],
    },
    {
        "type": "matrix",
        "title": "How ProofPay Uses Rialo",
        "kicker": "Rialo fit",
        "left_head": "Rialo primitive",
        "right_head": "Value for ProofPay",
        "rows": [
            {"left": "Reactive Transactions", "right": "This is the target model: once conditions are met, settlement can react automatically.", "accent": COLORS["teal"]},
            {"left": "Async Transactions", "right": "It matches the need to wait for GitHub or off-chain proof before continuing.", "accent": COLORS["blue"]},
            {"left": "Rialo Edge", "right": "Useful for production connections to GitHub, private repos, and external APIs.", "accent": COLORS["orange"]},
            {"left": "Rialo Workflow", "right": "This is already the product shape of ProofPay: create, fund, verify, release, refund, dispute.", "accent": COLORS["green"]},
            {"left": "IPC + privacy", "right": "Fits private repo flows where only proof hashes and results should be published.", "accent": COLORS["violet"]},
            {"left": "Omni Account / Interop", "right": "Not used by the prototype yet, but relevant for future multi-network payments.", "accent": COLORS["amber"]},
        ],
        "footer": "This is a product-to-platform fit slide, not a claim of full live integration",
        "accent": COLORS["teal"],
    },
    {
        "type": "cards",
        "title": "What Level of Rialo Is Used Today",
        "kicker": "Now vs later",
        "cards": [
            {"title": "Used today", "body": ["The adapter boundary, escrow lifecycle, proof-hash flow, and state machine are designed around a Rialo-style model."], "accent": COLORS["green"]},
            {"title": "Mocked today", "body": ["create escrow, fund, anchor proof, release, and refund still return mock tx hashes through MockRialoAdapter."], "accent": COLORS["orange"]},
            {"title": "Not live on Rialo yet", "body": ["There is no real asset custody, signed transaction, or devnet program/service yet."], "accent": COLORS["rose"]},
            {"title": "Current integration points", "body": ["The backend calls rialoAdapter in create, fund, verify->submitProofHash, release, and refund."], "accent": COLORS["blue"]},
            {"title": "Current value", "body": ["This validates UX, API design, verifier behavior, and the audit trail before expensive chain integration."], "accent": COLORS["teal"]},
            {"title": "Next step", "body": ["Replace MockRialoAdapter with the Rialo Rust microservice or rialo-cdk path described in the README."], "accent": COLORS["violet"]},
        ],
        "footer": "This is the slide that removes confusion during a demo",
        "accent": COLORS["orange"],
    },
    {
        "type": "cards",
        "title": "Rialo Technology Advantage",
        "kicker": "Why Rialo matters",
        "cards": [
            {"title": "Fast settlement", "body": ["The Dev Portal positions Rialo around 0.13s finality and 0.05s block time."], "accent": COLORS["green"]},
            {"title": "High throughput", "body": ["Execution TPS is positioned at 1M+ for high-volume workloads."], "accent": COLORS["blue"]},
            {"title": "Low reaction time", "body": ["0.000001s reaction time fits conditional automation."], "accent": COLORS["teal"]},
            {"title": "Edge for Web2 calls", "body": ["Rialo Edge targets bidirectional Web2 interactivity and 100k+ concurrent calls."], "accent": COLORS["orange"]},
            {"title": "Native workflow", "body": ["Native automation supports multi-step escrow that mirrors real-world logic."], "accent": COLORS["violet"]},
            {"title": "Gas-less path", "body": ["Rialo Cruise gives a route toward low-to-zero-fee production UX."], "accent": COLORS["amber"]},
        ],
        "footer": "These properties make ProofPay more than a generic Web3 escrow",
        "accent": COLORS["green"],
    },
    {
        "type": "architecture",
        "title": "Current Architecture and Upgrade Path",
        "kicker": "Technical architecture",
        "layers": [
            {"title": "Static DApp UI", "body": "Dashboard, simulated wallet session, RIALO ledger, escrow actions.", "accent": COLORS["blue"]},
            {"title": "Node.js / Express API", "body": "Deal lifecycle, validation, and fund / verify / release / refund / dispute routes.", "accent": COLORS["teal"]},
            {"title": "Storage abstraction", "body": "Local JSON fallback plus Vercel KV / Upstash path for durable state.", "accent": COLORS["amber"]},
            {"title": "GitHub verifier", "body": "Checks owner, repo, PR number, merge status, deadline, and expected author.", "accent": COLORS["orange"]},
            {"title": "Mock Rialo adapter", "body": "Returns transaction-shaped responses for escrow, fund, anchor, release, refund.", "accent": COLORS["violet"]},
            {"title": "Future Rialo service", "body": "Node API -> Rialo Rust microservice -> rialo-cdk -> Rialo devnet/mainnet.", "accent": COLORS["green"]},
        ],
        "footer": "Product logic and chain adapter are deliberately separated",
        "accent": COLORS["blue"],
    },
    {
        "type": "split",
        "title": "What the Prototype Proves",
        "kicker": "Scope and evidence",
        "left_title": "What should be said clearly",
        "left_body": [
            "- Wallets, faucet, balances, and transaction hashes are simulated.",
            "- The app does not custody real assets and is not production-ready.",
            "- The value is validating UX, state machine, verifier, and the Rialo adapter integration point.",
        ],
        "right_cards": [
            {"title": "Real today", "body": ["Express API, deal state machine, public GitHub PR verifier, storage layer, tests."], "accent": COLORS["green"]},
            {"title": "Mocked today", "body": ["Wallet session, RIALO balance, escrow custody, Rialo transaction hash."], "accent": COLORS["orange"]},
            {"title": "Verified", "body": ["Node built-in tests pass; build check pass; endpoint health smoke test pass."], "accent": COLORS["blue"]},
        ],
        "footer": "A defensible demo for technical review",
        "accent": COLORS["orange"],
    },
    {
        "type": "cards",
        "title": "Project Strengths",
        "kicker": "Why it is compelling",
        "cards": [
            {"title": "Clear product wedge", "body": ["One sentence: pay only if the proof is verified."], "accent": COLORS["teal"]},
            {"title": "Machine-readable proof", "body": ["GitHub PR metadata is a focused first proof type."], "accent": COLORS["blue"]},
            {"title": "Strong state machine", "body": ["DRAFT -> FUNDED -> VERIFIED -> RELEASED / REFUNDED."], "accent": COLORS["green"]},
            {"title": "Audit-first model", "body": ["Proof hashes, tx hashes, and event trails support review."], "accent": COLORS["violet"]},
            {"title": "Expandable proof surface", "body": ["Issues, releases, invoices, delivery events, oracle data."], "accent": COLORS["amber"]},
            {"title": "Rialo-native path", "body": ["The adapter pattern makes the on-chain upgrade concrete."], "accent": COLORS["orange"]},
        ],
        "footer": "Built for a Web3 builder and product audience",
        "accent": COLORS["green"],
    },
    {
        "type": "split",
        "title": "Private Repo: Access and Verifier",
        "kicker": "GitHub verification",
        "left_title": "GitHub access happens before the deal",
        "left_body": [
            "- The client invites the worker as a collaborator.",
            "- Or adds the worker to an org/team with repo access.",
            "- Or assigns work elsewhere and grants GitHub access separately.",
            "- After scope, amount, and PR condition are agreed, the ProofPay deal is created.",
        ],
        "right_cards": [
            {"title": "What ProofPay checks", "body": ["owner, repo, pullNumber, merged_at, expectedAuthor, deadline."], "accent": COLORS["blue"]},
            {"title": "Completion signal", "body": ["Do not release on commit alone. PR merged is stronger because it means the repo owner accepted the work."], "accent": COLORS["green"]},
            {"title": "Private repo production", "body": ["Use a GitHub App with scoped permissions to read PR metadata and publish only proofHash/result."], "accent": COLORS["violet"]},
        ],
        "footer": "ProofPay does not grant repo access; it verifies evidence after access has been granted",
        "accent": COLORS["violet"],
    },
    {
        "type": "cards",
        "title": "Impact and Use Cases",
        "kicker": "Where it works",
        "cards": [
            {"title": "Freelance engineering", "body": ["Pay by merged PR or completed milestone."], "accent": COLORS["blue"]},
            {"title": "DAO bounties", "body": ["Fund the bounty upfront, release on public proof."], "accent": COLORS["teal"]},
            {"title": "Private repo work", "body": ["A GitHub App reads metadata and publishes proof hash/result only."], "accent": COLORS["violet"]},
            {"title": "Agency milestones", "body": ["Use multiple smaller escrows instead of releasing the whole budget."], "accent": COLORS["orange"]},
            {"title": "Invoice / delivery proof", "body": ["Extend beyond GitHub through APIs or oracle feeds."], "accent": COLORS["amber"]},
            {"title": "Enterprise workflow", "body": ["Audit, policy, deadlines, and dispute paths become explicit."], "accent": COLORS["green"]},
        ],
        "footer": "Efficiency comes from fewer disputes and less manual settlement",
        "accent": COLORS["amber"],
    },
    {
        "type": "flow",
        "title": "Production Roadmap",
        "kicker": "Next steps",
        "steps": [
            {"title": "Wallet", "body": ["Real signing"], "accent": COLORS["blue"]},
            {"title": "Storage", "body": ["KV / DB"], "accent": COLORS["teal"]},
            {"title": "GitHub App", "body": ["Private repos"], "accent": COLORS["violet"]},
            {"title": "Rialo", "body": ["Real adapter"], "accent": COLORS["green"]},
            {"title": "Policy", "body": ["Roles + auth"], "accent": COLORS["orange"]},
            {"title": "Security", "body": ["Audit + dispute"], "accent": COLORS["rose"]},
        ],
        "note": "The production MVP should stay focused on GitHub PR escrow before adding more proof types.",
        "footer": "From prototype to Rialo-native escrow",
        "accent": COLORS["violet"],
    },
    {
        "type": "sources",
        "title": "Conclusion",
        "closing": "ProofPay is a natural Rialo use case: real-world proof, payment workflow, privacy-aware verification, and automatable settlement.",
        "demo_title": "5-minute demo",
        "demo": [
            "1. Connect wallet + faucet",
            "2. Create GitHub escrow",
            "3. Fund RIALO",
            "4. Verify PR proof",
            "5. Release or refund",
        ],
        "source_title": "References",
        "sources": COMMON_SOURCES,
        "footer": "ProofPay on Rialo",
        "accent": COLORS["teal"],
    },
]


DECKS = [
    {
        "filename": "ProofPay-Rialo-Report-VI.pptx",
        "title": "ProofPay on Rialo - Bao cao tieng Viet",
        "slides": VI_SLIDES,
    },
    {
        "filename": "ProofPay-Rialo-Report-EN.pptx",
        "title": "ProofPay on Rialo - English report",
        "slides": EN_SLIDES,
    },
]


def doc_props_core(title: str) -> str:
    now = dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        f'<dc:title>{esc(title)}</dc:title>'
        '<dc:subject>ProofPay Rialo project report</dc:subject>'
        '<dc:creator>OpenAI Codex</dc:creator>'
        '<cp:keywords>ProofPay,Rialo,escrow,Web3,presentation</cp:keywords>'
        '<dc:description>Project report deck for ProofPay on Rialo.</dc:description>'
        '<cp:lastModifiedBy>OpenAI Codex</cp:lastModifiedBy>'
        f'<dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>'
        f'<dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>'
        '</cp:coreProperties>'
    )


def doc_props_app(slide_titles: list[str]) -> str:
    titles = "".join(f"<vt:lpstr>{esc(title)}</vt:lpstr>" for title in slide_titles)
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
        '<Application>ProofPay Pitch Builder</Application>'
        '<PresentationFormat>Widescreen</PresentationFormat>'
        f'<Slides>{len(slide_titles)}</Slides>'
        '<Notes>0</Notes><HiddenSlides>0</HiddenSlides><MMClips>0</MMClips>'
        '<ScaleCrop>false</ScaleCrop>'
        '<HeadingPairs><vt:vector size="2" baseType="variant">'
        '<vt:variant><vt:lpstr>Slides</vt:lpstr></vt:variant>'
        f'<vt:variant><vt:i4>{len(slide_titles)}</vt:i4></vt:variant>'
        '</vt:vector></HeadingPairs>'
        f'<TitlesOfParts><vt:vector size="{len(slide_titles)}" baseType="lpstr">{titles}</vt:vector></TitlesOfParts>'
        '<Company>OpenAI</Company>'
        '<LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged>'
        '<AppVersion>16.0000</AppVersion>'
        '</Properties>'
    )


def content_types(slide_count: int) -> str:
    overrides = [
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
        '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
        '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
        '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
        '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
    ]
    for idx in range(1, slide_count + 1):
        overrides.append(
            f'<Override PartName="/ppt/slides/slide{idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        f'{"".join(overrides)}'
        '</Types>'
    )


def rels_root() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
        '</Relationships>'
    )


def presentation_xml(slide_count: int) -> str:
    slides = "".join(f'<p:sldId id="{256 + idx}" r:id="rId{idx + 2}"/>' for idx in range(slide_count))
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
        f'<p:sldIdLst>{slides}</p:sldIdLst>'
        f'<p:sldSz cx="{SLIDE_W}" cy="{SLIDE_H}" type="wide"/>'
        '<p:notesSz cx="6858000" cy="9144000"/>'
        '</p:presentation>'
    )


def presentation_rels(slide_count: int) -> str:
    rels = [
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
    ]
    for idx in range(slide_count):
        rels.append(
            f'<Relationship Id="rId{idx + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{idx + 1}.xml"/>'
        )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        f'{"".join(rels)}'
        '</Relationships>'
    )


def slide_master_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        '<p:cSld name="Master"><p:spTree>'
        '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/>'
        f'<a:ext cx="{SLIDE_W}" cy="{SLIDE_H}"/><a:chOff x="0" y="0"/><a:chExt cx="{SLIDE_W}" cy="{SLIDE_H}"/>'
        '</a:xfrm></p:grpSpPr></p:spTree></p:cSld>'
        '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
        '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
        '<p:textStyles><p:titleStyle><a:lvl1pPr algn="ctr"/></p:titleStyle><p:bodyStyle><a:lvl1pPr/></p:bodyStyle><p:otherStyle><a:lvl1pPr/></p:otherStyle></p:textStyles>'
        '</p:sldMaster>'
    )


def slide_master_rels() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
        '</Relationships>'
    )


def slide_layout_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">'
        '<p:cSld name="Blank"><p:spTree>'
        '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/>'
        f'<a:ext cx="{SLIDE_W}" cy="{SLIDE_H}"/><a:chOff x="0" y="0"/><a:chExt cx="{SLIDE_W}" cy="{SLIDE_H}"/>'
        '</a:xfrm></p:grpSpPr></p:spTree></p:cSld>'
        '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>'
        '</p:sldLayout>'
    )


def theme_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="ProofPay Report Theme">'
        '<a:themeElements>'
        '<a:clrScheme name="ProofPay">'
        '<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>'
        '<a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>'
        '<a:dk2><a:srgbClr val="101828"/></a:dk2><a:lt2><a:srgbClr val="F8FAFC"/></a:lt2>'
        '<a:accent1><a:srgbClr val="0F766E"/></a:accent1><a:accent2><a:srgbClr val="2563EB"/></a:accent2>'
        '<a:accent3><a:srgbClr val="16A34A"/></a:accent3><a:accent4><a:srgbClr val="EA580C"/></a:accent4>'
        '<a:accent5><a:srgbClr val="7C3AED"/></a:accent5><a:accent6><a:srgbClr val="D97706"/></a:accent6>'
        '<a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink>'
        '</a:clrScheme>'
        '<a:fontScheme name="Aptos"><a:majorFont><a:latin typeface="Aptos Display"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>'
        '<a:fmtScheme name="ProofPay"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>'
        '<a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="25400"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="38100"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst>'
        '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
        '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>'
        '</a:themeElements></a:theme>'
    )


def slide_rels() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
        '</Relationships>'
    )


def render_deck(deck: dict) -> list[str]:
    slides = deck["slides"]
    total = len(slides)
    rendered = []
    for index, spec in enumerate(slides, start=1):
        renderer = RENDERERS[spec["type"]]
        rendered.append(renderer(spec, index, total))
    return rendered


def write_deck(deck: dict) -> Path:
    output = ROOT / deck["filename"]
    rendered = render_deck(deck)
    slide_titles = [slide["title"] for slide in deck["slides"]]
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types(len(rendered)))
        zf.writestr("_rels/.rels", rels_root())
        zf.writestr("docProps/core.xml", doc_props_core(deck["title"]))
        zf.writestr("docProps/app.xml", doc_props_app(slide_titles))
        zf.writestr("ppt/presentation.xml", presentation_xml(len(rendered)))
        zf.writestr("ppt/_rels/presentation.xml.rels", presentation_rels(len(rendered)))
        zf.writestr("ppt/slideMasters/slideMaster1.xml", slide_master_xml())
        zf.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", slide_master_rels())
        zf.writestr("ppt/slideLayouts/slideLayout1.xml", slide_layout_xml())
        zf.writestr("ppt/theme/theme1.xml", theme_xml())
        for idx, slide in enumerate(rendered, start=1):
            zf.writestr(f"ppt/slides/slide{idx}.xml", slide)
            zf.writestr(f"ppt/slides/_rels/slide{idx}.xml.rels", slide_rels())
    return output


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    for deck in DECKS:
        output = write_deck(deck)
        print(f"Created {output}")


if __name__ == "__main__":
    main()
