import csv
import io
from datetime import datetime, timezone


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def generate_csv(headers: list[str], rows: list[list]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    return output.getvalue()
