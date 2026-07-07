from datetime import datetime, timezone, timedelta

# Bolivia timezone (UTC-4)
BOLIVIA_TZ = timezone(timedelta(hours=-4))


def _fmt_bo(dt_str: str) -> str:
    """Convert ISO datetime string to Bolivia-readable date."""
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        local = dt.astimezone(BOLIVIA_TZ)
        return local.strftime("%d/%m/%Y %H:%M")
    except (ValueError, AttributeError):
        return dt_str or "—"


def _money(v: float) -> str:
    return f"Bs. {v:,.2f}"


def _status_label(status: str) -> str:
    labels = {
        "entregado": "Entregado",
        "progreso": "En progreso",
        "listo": "Listo",
        "CANCELLED": "Cancelado",
        "PENDING": "Pendiente",
    }
    return labels.get(status, status or "—")


def generate_weekly_html(
    period: str,
    generated_at: str,
    total_sales: float,
    total_items: int,
    total_repairs: int,
    total_repairs_revenue: float,
    sales: list[dict],
    repairs: list[dict],
) -> str:
    period_label = period.replace("--", " → ")

    sales_rows = ""
    for s in sales:
        sales_rows += f"""\
            <tr>
              <td>{s.get('product_name', '—')}</td>
              <td class="num">{s.get('quantity', 0)}</td>
              <td class="num">{_money(s.get('price', 0))}</td>
              <td class="num">{_money(s.get('total', 0))}</td>
              <td>{_fmt_bo(s.get('date', ''))}</td>
              <td>{s.get('seller_name', '—')}</td>
            </tr>"""

    repairs_rows = ""
    for r in repairs:
        repairs_rows += f"""\
            <tr>
              <td>{r.get('equipment', '—')}</td>
              <td class="mono">{r.get('imei', '—')}</td>
              <td><span class="status status-{r.get('status', 'PENDING').lower()}">{_status_label(r.get('status'))}</span></td>
              <td class="num">{_money(r.get('cost', 0))}</td>
              <td>{_fmt_bo(r.get('date', ''))}</td>
              <td>{r.get('technician', '—')}</td>
            </tr>"""

    grand_total = total_sales + total_repairs_revenue

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Reporte Semanal — {period_label}</title>
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #0F1115; color: #E5E2E1;
    padding: 16px; line-height: 1.5;
  }}
  .container {{ max-width: 960px; margin: 0 auto; }}
  h1 {{ font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px; }}
  .sub {{ color: #9CA3AF; font-size: 12px; margin-bottom: 24px; }}
  .totals {{ display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }}
  .totals > div {{
    flex: 1; min-width: 120px; background: #171A20; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 12px 16px;
  }}
  .totals .label {{ font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #9CA3AF; }}
  .totals .value {{ font-size: 18px; font-weight: 700; margin-top: 4px; }}
  h2 {{ font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;
         margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); }}
  .section-icon {{ margin-right: 8px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 12px; }}
  th {{ text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase;
        letter-spacing: 0.08em; color: #9CA3AF; border-bottom: 1px solid rgba(255,255,255,0.08); white-space: nowrap; }}
  td {{ padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }}
  tr:hover td {{ background: rgba(255,255,255,0.02); }}
  .num {{ text-align: right; font-variant-numeric: tabular-nums; }}
  .mono {{ font-family: "SF Mono", "Fira Code", monospace; font-size: 11px; color: #9CA3AF; }}
  .status {{ display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }}
  .status-entregado {{ background: rgba(0, 230, 118, 0.12); color: #00E676; }}
  .status-listo {{ background: rgba(0, 217, 255, 0.12); color: #00D9FF; }}
  .status-progreso {{ background: rgba(255, 193, 7, 0.12); color: #FFC107; }}
  .status-cancelled {{ background: rgba(255, 82, 82, 0.12); color: #FF5252; }}
  .grand-total {{ margin-top: 24px; text-align: right; font-size: 16px; font-weight: 700; padding-top: 16px;
                 border-top: 2px solid rgba(0, 217, 255, 0.3); }}
  .grand-total .label {{ font-size: 11px; font-weight: 400; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.1em; }}
  .grand-total .value {{ color: #00D9FF; font-size: 20px; }}
  .footer {{ margin-top: 32px; text-align: center; font-size: 10px; color: rgba(255,255,255,0.3); }}
  @media (max-width: 600px) {{
    body {{ padding: 8px; }}
    .totals > div {{ min-width: calc(50% - 6px); }}
    table {{ font-size: 11px; }}
    th, td {{ padding: 6px 6px; }}
    th:nth-child(5), td:nth-child(5) {{ display: none; }}
  }}
  @media print {{
    body {{ background: #fff; color: #000; }}
    .totals > div {{ background: #f5f5f5; border-color: #ddd; }}
    .status-entregado {{ background: #e8f5e9; color: #2e7d32; }}
    .status-listo {{ background: #e3f2fd; color: #1565c0; }}
    .status-progreso {{ background: #fff8e1; color: #f57f17; }}
    .status-cancelled {{ background: #ffebee; color: #c62828; }}
    .grand-total .value {{ color: #1565c0; }}
    .sub, .footer {{ color: #666; }}
  }}
</style>
</head>
<body>
<div class="container">
  <h1>📊 Reporte Semanal</h1>
  <div class="sub">{period_label} — Generado {_fmt_bo(generated_at)} (hora Bolivia)</div>

  <div class="totals">
    <div><div class="label">Ventas</div><div class="value" style="color:#00E676">{_money(total_sales)}</div></div>
    <div><div class="label">Artículos</div><div class="value" style="color:#FFC107">{total_items}</div></div>
    <div><div class="label">Reparaciones</div><div class="value" style="color:#00D9FF">{total_repairs}</div></div>
    <div><div class="label">Ingreso Rep.</div><div class="value" style="color:#00D9FF">{_money(total_repairs_revenue)}</div></div>
  </div>

  <h2><span class="section-icon">🛒</span>Ventas</h2>
  <table>
    <thead>
      <tr><th>Producto</th><th class="num">Cant</th><th class="num">Precio</th><th class="num">Total</th><th>Fecha</th><th>Vendedor</th></tr>
    </thead>
    <tbody>
{sales_rows}
    </tbody>
  </table>

  <h2 style="margin-top:32px"><span class="section-icon">🔧</span>Reparaciones</h2>
  <table>
    <thead>
      <tr><th>Equipo</th><th>IMEI</th><th>Estado</th><th class="num">Costo</th><th>Fecha</th><th>Técnico</th></tr>
    </thead>
    <tbody>
{repairs_rows}
    </tbody>
  </table>

  <div class="grand-total">
    <div class="label">Total General</div>
    <div class="value">{_money(grand_total)}</div>
  </div>
  <div class="footer">Infinity Technology · Generado automáticamente</div>
</div>
</body>
</html>"""

    return html
