import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

LOGO_PATH = os.path.join(os.path.dirname(__file__), "logo.png")

QUARTER_LETTER = (306, 396)

# Paleta de colores ajustada a la estética Fintech / Infinity Technology
BRAND = colors.HexColor("#2F2FE4")  # Azul vibrante
BRAND_DARK = colors.HexColor("#1A1953")  # Azul marino profundo
TEXT_DARK = colors.HexColor("#080616")  # Casi negro para lectura
TEXT_MUTED = colors.HexColor("#8E8E9F")  # Gris para etiquetas
TEXT_DIM = colors.HexColor("#A1A1AA")  # Gris claro para footer
SUCCESS = colors.HexColor("#059669")  # Verde para totales
DANGER = colors.HexColor("#FF7F7F")  # Rojo/Salmón suave para avisos
DIVIDER = colors.HexColor("#E2E8F0")  # Líneas sutiles
BG_SOFT = colors.HexColor("#F8FAFC")  # Fondo zebra para tablas


def _watermark(canvas, doc):
    if not os.path.exists(LOGO_PATH):
        return
    try:
        img = ImageReader(LOGO_PATH)
        iw, ih = img.getSize()
        pw, ph = QUARTER_LETTER
        scale = min(pw / iw, ph / ih) * 0.6  # Un poco más pequeño para no saturar
        dw, dh = iw * scale, ih * scale
        x = (pw - dw) / 2
        y = (ph - dh) / 2
        canvas.saveState()
        canvas.setFillAlpha(0.04)  # Transparencia muy sutil (4%)
        canvas.drawImage(
            img, x, y, width=dw, height=dh, preserveAspectRatio=True, mask="auto"
        )
        canvas.restoreState()
    except Exception:
        pass


def _draw_logo_header(canvas, doc):
    if not os.path.exists(LOGO_PATH):
        return
    try:
        img = ImageReader(LOGO_PATH)
        iw, ih = img.getSize()
        logo_w = 45  # Logo de tamaño refinado
        logo_h = logo_w * (ih / iw)
        x = (QUARTER_LETTER[0] - logo_w) / 2
        # Posicionado en el margen superior reservado
        y = QUARTER_LETTER[1] - doc.topMargin + 10
        canvas.saveState()
        canvas.drawImage(
            img,
            x,
            y,
            width=logo_w,
            height=logo_h,
            preserveAspectRatio=True,
            mask="auto",
        )
        canvas.restoreState()
    except Exception:
        pass


def _get_styles():
    styles = getSampleStyleSheet()

    title = ParagraphStyle(
        "Title",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=14,
        textColor=TEXT_DARK,
        alignment=1,
    )

    subtitle = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=BRAND,
        alignment=1,
        spaceAfter=12,
        textTransform="uppercase",
    )

    base = ParagraphStyle(
        "Base",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK,
    )

    right = ParagraphStyle(
        "Right",
        parent=base,
        alignment=2,
    )

    footer = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=6,
        leading=8,
        textColor=TEXT_DIM,
        alignment=1,
    )

    return title, subtitle, base, right, footer


def _build_header(story, title_style, subtitle_style, label):
    if not os.path.exists(LOGO_PATH):
        # Si no hay logo, mostramos el nombre más grande
        story.append(Paragraph("Infinity Technology", title_style))
        story.append(Spacer(1, 4))
    else:
        # Si hay logo (dibujado por el canvas), dejamos espacio o un título discreto
        story.append(Paragraph("Infinity Technology", title_style))
        story.append(Spacer(1, 2))

    story.append(Paragraph(label, subtitle_style))

    # Línea divisora degradada/suave
    line = Table([[""]], colWidths=[200])
    line.setStyle(
        TableStyle(
            [
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, DIVIDER),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]
        )
    )
    story.append(line)
    story.append(Spacer(1, 12))


def _build_footer(story, footer_style):
    story.append(Spacer(1, 10))
    # Pequeña línea azul centrada
    line = Table([[""]], colWidths=[40])
    line.setStyle(
        TableStyle(
            [
                ("LINEBELOW", (0, 0), (-1, -1), 1.5, colors.HexColor("#D0D0F5")),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]
        )
    )
    story.append(line)
    story.append(Spacer(1, 6))
    story.append(Paragraph("Thank you for choosing Infinity Technology!", footer_style))


def _make_doc(pdf_path):
    return SimpleDocTemplate(
        pdf_path,
        pagesize=QUARTER_LETTER,
        rightMargin=15,
        leftMargin=15,
        topMargin=55,  # Margen aumentado para acomodar el logo sin superposición
        bottomMargin=15,
    )


def generate_pdf_receipt(
    sale_id: int,
    customer_name: str,
    date_str: str,
    items: list[dict],
    total: float,
    payment_method: str,
    seller_name: str,
    warranty_info: str = "",
) -> str:
    os.makedirs("static/pdf", exist_ok=True)
    pdf_filename = f"sale_{sale_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    pdf_path = f"static/pdf/{pdf_filename}"

    try:
        page_callback = lambda c, d: (_watermark(c, d), _draw_logo_header(c, d))
        doc = _make_doc(pdf_path)

        title_style, subtitle_style, base_text, right_text, footer_style = _get_styles()
        story = []

        _build_header(story, title_style, subtitle_style, "TECHNICAL POS RECEIPT")

        # Helpers para jerarquía visual: Etiqueta gris pequeña, Valor oscuro en negrita
        def left(v, label):
            return Paragraph(
                f"<font color='{TEXT_MUTED}' size='6'>{label}</font><br/><b><font size='9' color='{TEXT_DARK}'>{v}</font></b>",
                base_text,
            )

        def right(v, label):
            return Paragraph(
                f"<font color='{TEXT_MUTED}' size='6'>{label}</font><br/><b><font size='9' color='{TEXT_DARK}'>{v}</font></b>",
                right_text,
            )

        meta = [
            [left(f"#INV-{sale_id}", "ID"), right(date_str, "DATE")],
            [left(seller_name, "SELLER"), right(customer_name or "Walk-in", "CLIENT")],
        ]
        t = Table(meta, colWidths=[138, 138])
        t.setStyle(
            TableStyle(
                [
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("LINEBELOW", (0, -1), (-1, -1), 0.5, DIVIDER),
                ]
            )
        )
        story.append(t)
        story.append(Spacer(1, 10))

        col_w = [24, 138, 54, 60]
        table_data = [
            [
                Paragraph(f"<font color='{TEXT_MUTED}' size='6'>QTY</font>", base_text),
                Paragraph(
                    f"<font color='{TEXT_MUTED}' size='6'>ITEM</font>", base_text
                ),
                Paragraph(
                    f"<font color='{TEXT_MUTED}' size='6'>PRICE</font>", right_text
                ),
                Paragraph(
                    f"<font color='{TEXT_MUTED}' size='6'>SUB</font>", right_text
                ),
            ]
        ]
        for item in items:
            table_data.append(
                [
                    Paragraph(f"{item['quantity']}", base_text),
                    Paragraph(item["name"], base_text),
                    Paragraph(f"${item['price']:.2f}", right_text),
                    Paragraph(f"${item['subtotal']:.2f}", right_text),
                ]
            )

        t_items = Table(table_data, colWidths=col_w)
        t_items.setStyle(
            TableStyle(
                [
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("LINEBELOW", (0, 0), (-1, 0), 0.5, DIVIDER),
                    ("LINEBELOW", (0, 1), (-1, -1), 0.25, BG_SOFT),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]
            )
        )
        story.append(t_items)
        story.append(Spacer(1, 14))

        total_data = [
            [
                Paragraph(
                    f"<font color='{TEXT_MUTED}' size='7'>Payment Method</font>",
                    base_text,
                ),
                Paragraph(f"<font size='8'><b>{payment_method}</b></font>", right_text),
            ],
            [
                Paragraph("<font size='10'><b>TOTAL</b></font>", base_text),
                Paragraph(
                    f"<font size='16' color='{SUCCESS}'><b>${total:.2f}</b></font>",
                    right_text,
                ),
            ],
        ]
        t_total = Table(total_data, colWidths=[100, 176])
        t_total.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 1), (-1, 1), 8),
                    ("LINEABOVE", (0, 0), (-1, 0), 0.5, DIVIDER),
                ]
            )
        )
        story.append(t_total)

        if warranty_info:
            story.append(Spacer(1, 12))
            story.append(
                Paragraph(
                    f"<i>Notice: {warranty_info}</i>",
                    ParagraphStyle(
                        "W",
                        parent=base_text,
                        textColor=DANGER,
                        fontSize=6,
                        leading=8,
                        alignment=1,
                    ),
                )
            )

        _build_footer(story, footer_style)
        doc.build(story, onFirstPage=page_callback, onLaterPages=page_callback)
        return pdf_path

    except Exception as e:
        print(f"[PDF_GENERATOR_ERROR] Receipt: {str(e)}")
        return None


def generate_work_order_pdf(
    work_order_id: int,
    customer_name: str,
    phone_number: str,
    brand: str,
    model: str,
    imei: str,
    desperfecto: str,
    diagnostico: str,
    total_cost: float,
    amount_paid: float,
    status: str,
    date_str: str,
    created_by_name: str,
    assigned_tech_name: str = "",
) -> str:
    os.makedirs("static/pdf", exist_ok=True)
    pdf_filename = (
        f"work_order_{work_order_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    )
    pdf_path = f"static/pdf/{pdf_filename}"

    try:
        page_callback = lambda c, d: (_watermark(c, d), _draw_logo_header(c, d))
        doc = _make_doc(pdf_path)

        title_style, subtitle_style, base_text, right_text, footer_style = _get_styles()
        story = []

        _build_header(story, title_style, subtitle_style, "TECHNICAL WORK ORDER")

        def left(v, label):
            return Paragraph(
                f"<font color='{TEXT_MUTED}' size='6'>{label}</font><br/><b><font size='9' color='{TEXT_DARK}'>{v}</font></b>",
                base_text,
            )

        def right(v, label):
            return Paragraph(
                f"<font color='{TEXT_MUTED}' size='6'>{label}</font><br/><b><font size='9' color='{TEXT_DARK}'>{v}</font></b>",
                right_text,
            )

        meta = [
            [left(f"#{work_order_id}", "ORDER ID"), right(date_str, "DATE")],
            [left(customer_name, "CLIENT"), right(phone_number, "PHONE")],
            [left(f"{brand} {model}", "DEVICE"), right(status, "STATUS")],
        ]
        t = Table(meta, colWidths=[138, 138])
        t.setStyle(
            TableStyle(
                [
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("LINEBELOW", (0, -1), (-1, -1), 0.5, DIVIDER),
                ]
            )
        )
        story.append(t)
        story.append(Spacer(1, 10))

        details = []
        if imei:
            details.append(
                [
                    Paragraph(
                        f"<font color='{TEXT_MUTED}' size='6'>IMEI</font>", base_text
                    ),
                    Paragraph(f"<font size='7'>{imei}</font>", right_text),
                ]
            )
        if assigned_tech_name:
            details.append(
                [
                    Paragraph(
                        f"<font color='{TEXT_MUTED}' size='6'>TECH</font>", base_text
                    ),
                    Paragraph(
                        f"<font size='7'>{assigned_tech_name}</font>", right_text
                    ),
                ]
            )
        details.append(
            [
                Paragraph(
                    f"<font color='{TEXT_MUTED}' size='6'>DEFECT</font>", base_text
                ),
                Paragraph(f"<font size='7'>{desperfecto}</font>", right_text),
            ]
        )
        if diagnostico:
            details.append(
                [
                    Paragraph(
                        f"<font color='{TEXT_MUTED}' size='6'>DIAGNOSIS</font>",
                        base_text,
                    ),
                    Paragraph(f"<font size='7'>{diagnostico}</font>", right_text),
                ]
            )

        if details:
            td = Table(details, colWidths=[60, 216])
            td.setStyle(
                TableStyle(
                    [
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                        ("TOPPADDING", (0, 0), (-1, -1), 5),
                        ("BACKGROUND", (0, 0), (-1, -1), BG_SOFT),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ]
                )
            )
            story.append(td)
            story.append(Spacer(1, 12))

        balance = total_cost - amount_paid
        fin = [
            [
                Paragraph(
                    f"<font color='{TEXT_MUTED}' size='8'>Amount Paid</font>", base_text
                ),
                Paragraph(f"<font size='8'>${amount_paid:.2f}</font>", right_text),
            ],
            [
                Paragraph("<font size='9'><b>TOTAL COST</b></font>", base_text),
                Paragraph(
                    f"<font size='11'><b>${total_cost:.2f}</b></font>", right_text
                ),
            ],
            [
                Paragraph(
                    f"<font size='10' color='{DANGER}'><b>BALANCE DUE</b></font>",
                    base_text,
                ),
                Paragraph(
                    f"<font size='14' color='{DANGER}'><b>${balance:.2f}</b></font>",
                    right_text,
                ),
            ],
        ]
        tf = Table(fin, colWidths=[138, 138])
        tf.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 1), (-1, 2), 6),
                    ("LINEABOVE", (0, 0), (-1, 0), 0.5, DIVIDER),
                ]
            )
        )
        story.append(tf)

        _build_footer(story, footer_style)
        doc.build(story, onFirstPage=page_callback, onLaterPages=page_callback)
        return pdf_path

    except Exception as e:
        print(f"[PDF_GENERATOR_ERROR] Work Order: {str(e)}")
        return None
