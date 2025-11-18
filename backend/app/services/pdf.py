from datetime import datetime
from io import BytesIO
from jinja2 import Template
from weasyprint import HTML
from typing import Dict, Any, List


PDF_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
        }
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
        }
        h2 {
            color: #1e40af;
            margin-top: 30px;
        }
        .header {
            margin-bottom: 30px;
        }
        .info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .score {
            font-size: 48px;
            font-weight: bold;
            color: #2563eb;
            text-align: center;
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #2563eb;
            color: white;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .recommendation {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 10px 0;
        }
        .recommendation-title {
            font-weight: bold;
            color: #92400e;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Poročilo o kibernetski zrelosti</h1>
        <div class="info">
            <p><strong>Organizacija:</strong> {{ org_name }}</p>
            <p><strong>Datum ocene:</strong> {{ assessed_date }}</p>
            <p><strong>Verzija:</strong> {{ version }}</p>
        </div>
    </div>

    <h2>Skupna ocena</h2>
    <div class="score">{{ "%.1f"|format(overall_score) }} / 5.0</div>

    <h2>Ocene po domenah</h2>
    <table>
        <thead>
            <tr>
                <th>Domena</th>
                <th>Ocena</th>
            </tr>
        </thead>
        <tbody>
            {% for domain in domains %}
            <tr>
                <td>{{ domain.name }}</td>
                <td>{{ "%.1f"|format(domain.score) }}</td>
            </tr>
            {% endfor %}
        </tbody>
    </table>

    <h2>Priporočila za izboljšave</h2>
    {% if recommendations %}
        {% for rec in recommendations %}
        <div class="recommendation">
            <div class="recommendation-title">{{ rec.id }}: {{ rec.title }}</div>
            <p>{{ rec.details }}</p>
            <p><small><em>Domena: {{ rec.domain }}</em></small></p>
        </div>
        {% endfor %}
    {% else %}
        <p>Ni priporočil - vaša ocena je odlična!</p>
    {% endif %}

    <div class="footer">
        <p>Generirano: {{ generation_date }}</p>
        <p>Sec-Maturity-Lite | Kibernetska zrelost</p>
    </div>
</body>
</html>
"""


def generate_assessment_pdf(
    org_name: str,
    assessed_date: datetime,
    version: int,
    overall_score: float,
    domains: List[Dict[str, Any]],
    recommendations: List[Dict[str, Any]],
) -> bytes:
    """
    Generate PDF report for an assessment.
    
    Args:
        org_name: Organization name
        assessed_date: Assessment date
        version: Assessment version
        overall_score: Overall score (0-5)
        domains: List of dicts with 'name' and 'score'
        recommendations: List of recommendation dicts
    
    Returns:
        PDF content as bytes
    """
    template = Template(PDF_TEMPLATE)
    
    html_content = template.render(
        org_name=org_name,
        assessed_date=assessed_date.strftime("%d.%m.%Y %H:%M"),
        version=version,
        overall_score=overall_score,
        domains=domains,
        recommendations=recommendations,
        generation_date=datetime.utcnow().strftime("%d.%m.%Y %H:%M"),
    )
    
    pdf_file = BytesIO()
    HTML(string=html_content).write_pdf(pdf_file)
    pdf_file.seek(0)
    
    return pdf_file.read()
