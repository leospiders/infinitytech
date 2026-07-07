import os
from datetime import datetime
from io import BytesIO
from typing import Optional
from xml.sax.saxutils import escape as _escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ==========================================================
# CONFIGURACIÓN GENERAL
# ==========================================================

LOGO_PATH = os.path.join(os.path.dirname(__file__), "logo.png")

PAGE_W = 306
PAGE_H = 396
PAGE_SIZE = (PAGE_W, PAGE_H)

LM = RM = 15
CW = PAGE_W - LM - RM

# ==========================================================
# PALETA MODERNA
# ==========================================================

BRAND_DEEP = "#000000"
BRAND_PRIMARY = "#1D4ED8"
BRAND_SECONDARY = "#2563EB"

SUCCESS = "#15803D"
SUCCESS_BG = "#DCFCE7"

WARNING = "#B45309"
WARNING_BG = "#FEF3C7"

DANGER = "#B91C1C"
DANGER_BG = "#FEE2E2"

INFO = "#0369A1"
INFO_BG = "#E0F2FE"

BG_PAGE = "#FFFFFF"
BG_CARD = "#F1F5F9"

TEXT_DARK = "#000000"
TEXT_MUTED = "#1E293B"
TEXT_LIGHT = "#334155"

DIVIDER = "#94A3B8"
BORDER = "#475569"

WHITE = "#FFFFFF"

C = {
    k: colors.HexColor(v)
    for k, v in {
        "deep": BRAND_DEEP,
        "primary": BRAND_PRIMARY,
        "secondary": BRAND_SECONDARY,
        "success": SUCCESS,
        "success_bg": SUCCESS_BG,
        "warning": WARNING,
        "warning_bg": WARNING_BG,
        "danger": DANGER,
        "danger_bg": DANGER_BG,
        "info": INFO,
        "info_bg": INFO_BG,
        "bg_card": BG_CARD,
        "divider": DIVIDER,
        "border": BORDER,
        "dark": TEXT_DARK,
        "muted": TEXT_MUTED,
        "light": TEXT_LIGHT,
    }.items()
}

# ==========================================================
# DATOS EMPRESA
# ==========================================================

COMPANY_NAME = "INFINITY TECHNOLOGY"
COMPANY_LINE1 = "Soporte Técnico de Celulares, computadoras, consolas y videojuegos."
COMPANY_LINE2 = "Calle Comercio Gal. Elegans #850 Oficina 2 y 3"
COMPANY_LINE3 = "Cel: 75818295 / jhonnyquisbert045@gmail.com"

# ==========================================================
# ESTADOS
# ==========================================================

STATUS_COLORS = {
    "entregado": (SUCCESS, SUCCESS_BG),
    "listo": (INFO, INFO_BG),
    "progreso": (WARNING, WARNING_BG),
    "CANCELLED": (DANGER, DANGER_BG),
}

# ==========================================================
# HELPERS
# ==========================================================


def _safe(v):
    if v is None:
        return "—"
    t = str(v).strip()
    return _escape(t) if t else "—"


def _money(v):
    val = float(v) if v is not None else 0.0
    return f"Bs. {val:,.2f}"


def _pay_status(total, paid):
    balance = total - paid
    if balance <= 0:
        return "PAID"
    if paid > 0:
        return "PARTIAL"
    return "PENDING"


# ==========================================================
# ESTILOS
# ==========================================================


class S:
    def __init__(self):
        self.co_name = ParagraphStyle(
            "co_name",
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=15,
            textColor=C["deep"],
            alignment=TA_CENTER,
        )

        self.co_sub = ParagraphStyle(
            "co_sub",
            fontName="Helvetica",
            fontSize=5,
            leading=7,
            textColor=C["muted"],
            alignment=TA_CENTER,
        )

        self.banner_label = ParagraphStyle(
            "banner",
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            alignment=TA_CENTER,
            textColor=WHITE,
        )

        self.card_label = ParagraphStyle(
            "card_label",
            fontName="Helvetica",
            fontSize=5,
            leading=7,
            textColor=C["muted"],
        )

        self.card_val = ParagraphStyle(
            "card_val",
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=C["dark"],
        )

        self.card_val_lg = ParagraphStyle(
            "card_val_lg",
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=13,
            textColor=C["deep"],
        )

        self.base = ParagraphStyle(
            "base",
            fontName="Helvetica",
            fontSize=7,
            leading=10,
            textColor=C["dark"],
        )

        self.right = ParagraphStyle(
            "right",
            fontName="Helvetica",
            fontSize=7,
            leading=10,
            textColor=C["dark"],
            alignment=TA_RIGHT,
        )

        self.th = ParagraphStyle(
            "th",
            fontName="Helvetica-Bold",
            fontSize=6,
            leading=8,
            alignment=TA_CENTER,
            textColor=C["dark"],
        )

        self.td = ParagraphStyle(
            "td",
            fontName="Helvetica",
            fontSize=6.5,
            leading=9,
            textColor=C["dark"],
        )

        self.td_right = ParagraphStyle(
            "td_right",
            fontName="Helvetica",
            fontSize=6.5,
            leading=9,
            alignment=TA_RIGHT,
            textColor=C["dark"],
        )

        self.total_label = ParagraphStyle(
            "total_label",
            fontName="Helvetica",
            fontSize=5,
            leading=7,
            textColor=C["muted"],
        )

        self.total_val = ParagraphStyle(
            "total_val",
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=16,
            textColor=C["primary"],
        )

        self.total_val_sm = ParagraphStyle(
            "total_val_sm",
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=C["dark"],
        )

        self.badge = ParagraphStyle(
            "badge",
            fontName="Helvetica-Bold",
            fontSize=7,
            alignment=TA_CENTER,
        )

        self.footer = ParagraphStyle(
            "footer",
            fontName="Helvetica",
            fontSize=5,
            leading=7,
            alignment=TA_CENTER,
            textColor=C["muted"],
        )

        self.note = ParagraphStyle(
            "note",
            fontName="Helvetica-Oblique",
            fontSize=6,
            leading=8,
            textColor=C["warning"],
        )

        self.fallback = ParagraphStyle(
            "fallback",
            fontName="Helvetica",
            fontSize=7,
            leading=10,
            textColor=C["dark"],
        )


styles = S()

# ==========================================================
# COMPONENTES VISUALES MODERNOS
# ==========================================================


def _card_table(rows, col_widths=None):
    """
    Crea una tarjeta moderna con fondo claro,
    bordes suaves y mayor separación interna.
    """
    cw = col_widths or [CW]
    table = Table(rows, colWidths=cw)
    table.setStyle(
        TableStyle(
            [
                # Fondo de la tarjeta
                ("BACKGROUND", (0, 0), (-1, -1), C["bg_card"]),
                # Borde exterior
                ("BOX", (0, 0), (-1, -1), 0.6, C["border"]),
                # Alineación
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                # Padding horizontal
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                # Padding vertical
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    return table


def _info_card(label, value, large=False, align=TA_LEFT):
    """
    Construye un bloque de información.
    """
    size = 9 if large else 7
    lead = 10 if large else 8
    return Paragraph(
        f'<font color="{TEXT_MUTED}" size="4.5">{_safe(label)}</font><br/>'
        f'<font color="{TEXT_DARK}" size="{size}"><b>{_safe(value)}</b></font>',
        ParagraphStyle(
            "info_card",
            fontName="Helvetica",
            fontSize=size,
            leading=lead,
            alignment=align,
        ),
    )


def _card_divider():
    """
    Línea divisoria utilizada dentro de las tarjetas.
    """
    divider = Table([[""]], colWidths=[CW - 20])
    divider.setStyle(
        TableStyle(
            [
                ("LINEBELOW", (0, 0), (-1, -1), 0.35, C["divider"]),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return divider


def _status_badge(status: str):
    """
    Devuelve una píldora visual indicando el estado de la orden.
    """
    if not status:
        return ""
    fg, bg = STATUS_COLORS.get(
        status.upper(),
        (TEXT_MUTED, "#F1F5F9"),
    )
    text = status.replace("_", " ").title()
    return f'<font color="{fg}" backcolor="{bg}" size="7"><b>&nbsp;&nbsp;● {text}&nbsp;&nbsp;</b></font>'


def _pay_badge(status: str):
    """
    Devuelve el estado financiero.
    """
    if status == "PAID":
        fg = SUCCESS
        bg = SUCCESS_BG
        label = "✓ PAGADO"
    elif status == "PARTIAL":
        fg = WARNING
        bg = WARNING_BG
        label = "PAGO PARCIAL"
    else:
        fg = DANGER
        bg = DANGER_BG
        label = "PENDIENTE"

    return f'<font color="{fg}" backcolor="{bg}" size="7"><b>&nbsp;&nbsp;{label}&nbsp;&nbsp;</b></font>'


def _section_title(text):
    """
    Genera un título de sección elegante.
    """
    return Table(
        [
            [
                Paragraph(
                    f'<font color="{TEXT_MUTED}" size="5"><b>{text.upper()}</b></font>',
                    ParagraphStyle(
                        "section",
                        fontName="Helvetica-Bold",
                        fontSize=5,
                        leading=7,
                    ),
                )
            ]
        ],
        colWidths=[CW],
    )


def _simple_divider():
    """
    Separador horizontal utilizado entre bloques del documento.
    """
    line = Table([[""]], colWidths=[CW])
    line.setStyle(
        TableStyle(
            [
                ("LINEABOVE", (0, 0), (-1, -1), 0.35, C["divider"]),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return line


def _summary_card(title, value):
    """
    Tarjeta utilizada para mostrar importes importantes.
    """
    return Table(
        [
            [
                Paragraph(
                    f'<font color="{TEXT_MUTED}" size="5">{title}</font><br/><br/>'
                    f'<font color="{BRAND_PRIMARY}" size="16"><b>{value}</b></font>',
                    ParagraphStyle(
                        "summary",
                        fontName="Helvetica",
                        fontSize=7,
                        leading=12,
                        alignment=TA_CENTER,
                    ),
                )
            ]
        ],
        colWidths=[CW],
        rowHeights=[55],
    )


def _empty_space(h=4):
    """
    Atajo para insertar espacios entre componentes.
    """
    return Spacer(1, h)


# ==========================================================
# HEADER · WATERMARK · BANNER · FOOTER
# ==========================================================


def _watermark(canvas, doc):
    """
    Dibuja el logo centrado como marca de agua.
    """
    if not os.path.exists(LOGO_PATH):
        return
    try:
        img = ImageReader(LOGO_PATH)
        iw, ih = img.getSize()
        scale = min(PAGE_W / iw, PAGE_H / ih) * 1.26
        dw = iw * scale
        dh = ih * scale

        canvas.saveState()
        canvas.setFillAlpha(0.40)
        canvas.drawImage(
            img,
            (PAGE_W - dw) / 2,
            (PAGE_H - dh) / 2,
            dw,
            dh,
            preserveAspectRatio=True,
            mask="auto",
        )
        canvas.restoreState()
    except Exception:
        pass


def _draw_header_block(canvas, doc):
    """
    Encabezado minimalista.
    """
    y = PAGE_H - 10
    canvas.saveState()

    # LOGO
    if os.path.exists(LOGO_PATH):
        try:
            img = ImageReader(LOGO_PATH)
            iw, ih = img.getSize()
            width = 24
            height = width * (ih / iw)
            canvas.drawImage(
                img,
                (PAGE_W - width) / 2,
                y - height,
                width,
                height,
                preserveAspectRatio=True,
                mask="auto",
            )
        except Exception:
            pass

    # EMPRESA
    canvas.setFont("Helvetica-Bold", 10)
    canvas.setFillColor(C["deep"])
    canvas.drawCentredString(PAGE_W / 2, y - 28, COMPANY_NAME)

    canvas.setFont("Helvetica", 4.5)
    canvas.setFillColor(C["muted"])
    canvas.drawCentredString(PAGE_W / 2, y - 35, COMPANY_LINE1)
    canvas.drawCentredString(PAGE_W / 2, y - 40, COMPANY_LINE2)
    canvas.drawCentredString(PAGE_W / 2, y - 45, COMPANY_LINE3)

    # LÍNEA SEPARADORA
    canvas.setStrokeColor(C["divider"])
    canvas.setLineWidth(0.4)
    canvas.line(LM, y - 50, PAGE_W - LM, y - 50)

    canvas.restoreState()


def _draw_banner(story, title):
    """
    Banner moderno.
    """
    style = ParagraphStyle(
        "banner",
        fontName="Helvetica-Bold",
        fontSize=11,
        alignment=TA_CENTER,
        leading=13,
        textColor=WHITE,
    )
    banner = Table([[Paragraph(title.upper(), style)]], colWidths=[CW])
    banner.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), C["primary"]),
                ("BOX", (0, 0), (-1, -1), 0, C["primary"]),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    story.append(Spacer(1, 1))
    story.append(banner)
    story.append(Spacer(1, 2))


def _draw_footer_block(canvas, doc, is_work_order=False):
    canvas.saveState()

    # 1. Company name + Thank you
    footer_co_style = ParagraphStyle(
        "footer_co",
        fontName="Helvetica",
        fontSize=6,
        leading=7,
        alignment=TA_CENTER,
        textColor=C["dark"],
    )
    co_p = Paragraph(
        f"<b>{COMPANY_NAME}</b><br/>"
        f'<font color="{TEXT_MUTED}" size="4.5">Gracias por confiar en nosotros</font>',
        footer_co_style,
    )
    co_p.wrap(CW, 30)
    co_p.drawOn(canvas, LM, 12)

    # 2. Terms of use
    if is_work_order:
        footer_style = ParagraphStyle(
            "footer_terms",
            fontName="Helvetica",
            fontSize=6.5,
            leading=8.0,
            alignment=TA_LEFT,
            textColor=C["muted"],
        )
        terms = (
            "<b>1. AUTORIZACIÓN:</b> El cliente declara ser el titular legal del equipo y autoriza a Infinity Technology a realizar los procedimientos técnicos indicados en esta orden.<br/>"
            "<b>2. DATOS Y RIESGOS:</b> Se recomienda realizar una copia de seguridad antes de ingresar el equipo. En equipos con daño por líquidos o golpes, existe riesgo de falla total. El cliente acepta este riesgo y libera a Infinity Technology de toda responsabilidad.<br/>"
            "<b>3. RESPONSABILIDAD LEGAL:</b> El cliente asume toda responsabilidad civil y penal derivada del trabajo solicitado (Arts. 171, 172, 331, 332, 353 y Art. 11 — Código Penal Boliviano).<br/>"
            "<b>4. PLAZO DE RETIRO:</b> El equipo debe retirarse dentro de los 60 días desde la fecha de emisión. Pasado ese plazo, Infinity Technology no responde por su custodia.<br/>"
            "<b>5. GARANTÍA:</b> Infinity Technology ofrece garantía sobre el trabajo realizado por un período a determinar según el tipo de servicio, sujeta a evaluación técnica en caso de inconvenientes. No cubre daños externos, mal uso, ni situaciones ajenas a la reparación original."
        )
    else:
        footer_style = ParagraphStyle(
            "footer_terms_sales",
            fontName="Helvetica",
            fontSize=6.5,
            leading=8.0,
            alignment=TA_LEFT,
            textColor=C["muted"],
        )
        terms = (
            "<b>1. GARANTÍA:</b> Los repuestos e instalaciones cuentan con garantía por el período especificado. No cubre daños físicos, humedad, mal uso, rotura de sellos ni manipulación externa.<br/>"
            "<b>2. CAMBIOS Y DEVOLUCIONES:</b> Todo cambio de producto o accesorio debe realizarse dentro de las 48 horas posteriores a la compra, con empaque original intacto y este comprobante. No hay devoluciones de dinero.<br/>"
            "<b>3. RESPONSABILIDAD:</b> El cliente acepta que las partes de desgaste o accesorios comprados no tienen cobertura por daños accidentales o sobrecargas eléctricas posteriores a la entrega.<br/>"
            "<b>4. CUSTODIA DE EQUIPOS:</b> Para equipos o repuestos dejados para pruebas o consignación, el plazo de retiro es de 30 días. Pasado ese tiempo, Infinity Technology no responde por su custodia.<br/>"
            "<b>5. CONFORMIDAD:</b> El cliente declara recibir los productos, repuestos o servicios a entera satisfacción y conformidad, habiendo verificado su correcto funcionamiento en tienda."
        )

    terms_p = Paragraph(terms, footer_style)
    w, h = terms_p.wrap(CW, 100)
    terms_p.drawOn(canvas, LM, 28)

    # 3. Divider line above the terms
    y_line = 28 + h + 4
    canvas.setStrokeColor(C["divider"])
    canvas.setLineWidth(0.4)
    canvas.line(LM, y_line, PAGE_W - LM, y_line)

    canvas.restoreState()


def _page_cb(canvas, doc, is_work_order=False):
    """
    Callback ejecutado en cada página.
    """
    title_str = (
        f"work_order_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}"
        if is_work_order
        else f"sale_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}"
    )
    canvas.setTitle(title_str)
    _watermark(canvas, doc)
    _draw_header_block(canvas, doc)
    _draw_footer_block(canvas, doc, is_work_order)


def _make_doc(path_or_buf, bottom_margin=74):
    """
    Configuración general del documento.
    Acepta string (ruta) o BytesIO para generar en memoria.
    """
    return SimpleDocTemplate(
        path_or_buf,
        pagesize=PAGE_SIZE,
        leftMargin=LM,
        rightMargin=RM,
        topMargin=64,
        bottomMargin=bottom_margin,
    )


# ==========================================================
# FUNCIONES DE GENERACIÓN DE PDF
# ==========================================================


def generate_pdf_receipt(
    sale_id: int,
    customer_name: str,
    date_str: str,
    items: list[dict],
    total: float,
    payment_method: str,
    seller_name: str,
    warranty_info: str = "",
) -> Optional[BytesIO]:
    buf = BytesIO()

    try:
        doc = _make_doc(buf, bottom_margin=74)
        story = []

        # 1. Banner
        _draw_banner(story, "COMPROBANTE DE VENTA")
        story.append(_empty_space(2))

        # 2. Metadatos del Comprobante
        meta_rows = [
            [
                _info_card("ID VENTA", f"#INV-{sale_id}", large=True),
                _info_card("FECHA", date_str, align=TA_RIGHT),
            ],
            [
                _info_card("VENDEDOR", seller_name or "System"),
                _info_card(
                    "CLIENTE", customer_name or "Cliente General", align=TA_RIGHT
                ),
            ],
        ]
        story.append(_card_table(meta_rows, [CW / 2, CW / 2]))
        story.append(_empty_space(1))

        # 3. Detalle de Artículos
        story.append(_section_title("DETALLE DE ARTÍCULOS"))
        story.append(_empty_space(1))

        col_w = [25, CW - 25 - 55 - 60, 55, 60]
        table_data = [
            [
                Paragraph("<b>CANT</b>", styles.th),
                Paragraph("<b>DETALLE</b>", styles.th),
                Paragraph("<b>PRECIO</b>", styles.th),
                Paragraph("<b>SUBTOTAL</b>", styles.th),
            ]
        ]

        for item in items:
            table_data.append(
                [
                    Paragraph(str(item.get("quantity", 1)), styles.td),
                    Paragraph(_safe(item.get("name", "Producto")), styles.td),
                    Paragraph(_money(item.get("price", 0.0)), styles.td_right),
                    Paragraph(_money(item.get("subtotal", 0.0)), styles.td_right),
                ]
            )

        t_items = Table(table_data, colWidths=col_w)
        t_items.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LINEBELOW", (0, 0), (-1, 0), 0.6, C["deep"]),
                    ("LINEBELOW", (0, 1), (-1, -1), 0.4, C["divider"]),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                    ("LEFTPADDING", (0, 0), (-1, -1), 2),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                ]
            )
        )
        story.append(t_items)
        story.append(_empty_space(1))

        # 4. Resumen Financiero
        resumen_rows = [
            [
                _info_card("MÉTODO DE PAGO", payment_method or "Otros", align=TA_LEFT),
                _info_card("ESTADO DE PAGO", "PAGADO", align=TA_RIGHT),
            ],
            [
                Paragraph(
                    f'<font color="{TEXT_MUTED}" size="5">TOTAL PAGADO</font>',
                    styles.base,
                ),
                Paragraph(
                    f'<font color="{BRAND_PRIMARY}" size="11"><b>{_money(total)}</b></font>',
                    styles.right,
                ),
            ],
        ]

        t_res = Table(resumen_rows, colWidths=[CW / 2, CW / 2])
        t_res.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("BACKGROUND", (0, 0), (-1, -1), C["bg_card"]),
                    ("BOX", (0, 0), (-1, -1), 0.6, C["border"]),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LINEBELOW", (0, 0), (-1, 0), 0.35, C["divider"]),
                ]
            )
        )
        story.append(t_res)
        story.append(_empty_space(1))

        # 5. Garantía
        if warranty_info and str(warranty_info).strip():
            story.append(
                Paragraph(
                    f"<b>Nota de Garantía:</b> {_safe(warranty_info)}", styles.note
                )
            )
            story.append(_empty_space(1))

        # 6. Footer is drawn on canvas via callback
        def page_cb(canvas, doc):
            _page_cb(canvas, doc, is_work_order=False)

        doc.build(story, onFirstPage=page_cb, onLaterPages=page_cb)
        buf.seek(0)
        return buf

    except Exception as e:
        print(f"[PDF_GENERATOR_ERROR] Receipt: {str(e)}")
        import traceback

        traceback.print_exc()
        return None


def generate_work_order_pdf(
    work_order_id: Optional[int] = None,
    customer_name: str = "",
    phone_number: str = "",
    brand: str = "",
    model: str = "",
    imei: str = "",
    desperfecto: str = "",
    diagnostico: str = "",
    total_cost: float = 0.0,
    amount_paid: float = 0.0,
    status: str = "",
    date_str: str = "",
    tech_name: str = "",
    tech_phone: str = "",
    items: Optional[list] = None,
    # Argumentos de compatibilidad con main.py:
    wo_id: Optional[int] = None,
    cost: Optional[float] = None,
    note: Optional[str] = None,
) -> Optional[BytesIO]:
    # Normalizar compatibilidad con main.py
    if work_order_id is None and wo_id is not None:
        work_order_id = wo_id
    if cost is not None:
        total_cost = cost
    if not desperfecto and note:
        desperfecto = note

    buf = BytesIO()

    try:
        doc = _make_doc(buf, bottom_margin=74)
        story = []

        # 1. Banner de título
        _draw_banner(story, "ORDEN DE SERVICIO TÉCNICO")
        story.append(_empty_space(1))

        # 2. Información General (Metadatos) y Estado en una tarjeta
        # 2. Información General (Metadatos)
        meta_rows = [
            [
                _info_card("NRO. ORDEN", f"#{work_order_id}", large=True),
                _info_card("FECHA RECEPCIÓN", date_str, align=TA_RIGHT),
            ],
            [
                _info_card("CLIENTE", customer_name or "Walk-in"),
                _info_card("TELÉFONO", phone_number or "—", align=TA_RIGHT),
            ],
            [
                _info_card("TÉCNICO", tech_name or "—"),
                _info_card("TEL. TÉCNICO", tech_phone or "—", align=TA_RIGHT),
            ],
        ]
        story.append(_card_table(meta_rows, [CW / 2, CW / 2]))
        story.append(_empty_space(2))

        # 4. Detalles de Equipos (si hay múltiples items)
        if items and len(items) > 0:
            story.append(_section_title("DETALLE DE EQUIPOS EN ORDEN"))
            story.append(_empty_space(1))

            # Tabla de equipos
            col_w = [CW * 0.20, CW * 0.25, CW * 0.35, CW * 0.20]
            table_data = [
                [
                    Paragraph("<b>EQUIPO</b>", styles.th),
                    Paragraph("<b>IMEI</b>", styles.th),
                    Paragraph("<b>DESCRIPCIÓN / FALLA</b>", styles.th),
                    Paragraph("<b>COSTO</b>", styles.th),
                ]
            ]
            for it in items:
                eq_text = f"{_safe(it.get('brand'))} {_safe(it.get('model'))}"
                desc_text = f"{_safe(it.get('desperfecto'))}"
                if it.get("diagnostico"):
                    desc_text += f"<br/>Diag: {_safe(it.get('diagnostico'))}"
                table_data.append(
                    [
                        Paragraph(eq_text, styles.td),
                        Paragraph(_safe(it.get("imei")), styles.td),
                        Paragraph(desc_text, styles.td),
                        Paragraph(_money(it.get("total_cost", 0.0)), styles.td_right),
                    ]
                )

            t_items = Table(table_data, colWidths=col_w)
            t_items.setStyle(
                TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LINEBELOW", (0, 0), (-1, 0), 0.6, C["deep"]),
                        ("LINEBELOW", (0, 1), (-1, -1), 0.4, C["divider"]),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                        ("TOPPADDING", (0, 0), (-1, -1), 2),
                        ("LEFTPADDING", (0, 0), (-1, -1), 2),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                    ]
                )
            )
            story.append(t_items)
            story.append(_empty_space(2))
        else:
            # Si no hay lista de items, mostramos el equipo único del top-level
            story.append(_section_title("DETALLE DEL EQUIPO"))
            story.append(_empty_space(1))

            eq_rows = [
                [
                    _info_card("EQUIPO", f"{brand} {model}"),
                    _info_card("IMEI", imei or "—", align=TA_RIGHT),
                ],
                [
                    _info_card(
                        "PROBLEMA / DEFECTO REPORTADO", desperfecto, large=False
                    ),
                    _info_card(
                        "DIAGNÓSTICO TÉCNICO", diagnostico, large=False, align=TA_RIGHT
                    )
                    if diagnostico and diagnostico.strip()
                    else "",
                ],
            ]

            t_eq = Table(eq_rows, colWidths=[CW / 2, CW / 2])

            t_eq_style = [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), C["bg_card"]),
                ("BOX", (0, 0), (-1, -1), 0.6, C["border"]),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LINEBELOW", (0, 0), (-1, 0), 0.35, C["divider"]),
            ]
            t_eq.setStyle(TableStyle(t_eq_style))
            story.append(t_eq)
            story.append(_empty_space(2))

        # 5. Resumen Financiero
        balance = total_cost - amount_paid
        pay_badge_text = _pay_badge(_pay_status(total_cost, amount_paid))

        resumen_rows = [
            [
                _info_card("COSTO TOTAL", _money(total_cost)),
                _info_card("PAGO ADELANTADO", _money(amount_paid), align=TA_RIGHT),
            ],
            [
                Paragraph(
                    f'<font color="{DANGER}" size="5"><b>SALDO</b></font><br/>'
                    f'<font color="{DANGER}" size="9"><b>{_money(balance)}</b></font>',
                    ParagraphStyle(
                        "balance_cell",
                        fontName="Helvetica",
                        fontSize=9,
                        leading=10,
                    ),
                ),
                Paragraph(
                    f'<font color="{TEXT_MUTED}" size="4.5">ESTADO PAGO</font><br/>'
                    f"{pay_badge_text}",
                    ParagraphStyle(
                        "pay_status_cell",
                        fontName="Helvetica",
                        fontSize=7,
                        leading=9,
                        alignment=TA_RIGHT,
                    ),
                ),
            ],
        ]

        t_res = Table(resumen_rows, colWidths=[CW / 2, CW / 2])
        t_res.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("BACKGROUND", (0, 0), (-1, -1), C["bg_card"]),
                    ("BOX", (0, 0), (-1, -1), 0.6, C["border"]),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ("LINEBELOW", (0, 0), (-1, 0), 0.35, C["divider"]),
                ]
            )
        )
        story.append(t_res)
        story.append(_empty_space(2))

        # 6. Footer is drawn on canvas via callback
        def page_cb(canvas, doc):
            _page_cb(canvas, doc, is_work_order=True)

        doc.build(story, onFirstPage=page_cb, onLaterPages=page_cb)
        buf.seek(0)
        return buf

    except Exception as e:
        print(f"[PDF_GENERATOR_ERROR] Work Order: {str(e)}")
        import traceback

        traceback.print_exc()
        return None
