"""Add treasury exposures

Revision ID: 002
Revises: 001
Create Date: 2026-06-17

"""
from datetime import date
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


exposure_type = postgresql.ENUM("PAYABLE", "RECEIVABLE", name="exposuretype", create_type=False)
exposure_status = postgresql.ENUM("OPEN", "SETTLED", "CANCELLED", name="exposurestatus", create_type=False)


def upgrade() -> None:
    postgresql.ENUM("PAYABLE", "RECEIVABLE", name="exposuretype").create(op.get_bind(), checkfirst=True)
    postgresql.ENUM("OPEN", "SETTLED", "CANCELLED", name="exposurestatus").create(op.get_bind(), checkfirst=True)

    op.create_table(
        "exposures",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("counterparty", sa.String(length=120), nullable=False),
        sa.Column("exposure_type", exposure_type, nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("business_unit", sa.String(length=80), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", exposure_status, nullable=False, server_default="OPEN"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_exposures_id"), "exposures", ["id"], unique=False)

    exposures = sa.table(
        "exposures",
        sa.column("counterparty", sa.String),
        sa.column("exposure_type", exposure_type),
        sa.column("currency", sa.String),
        sa.column("amount", sa.Float),
        sa.column("due_date", sa.Date),
        sa.column("business_unit", sa.String),
        sa.column("description", sa.Text),
        sa.column("status", exposure_status),
    )
    op.bulk_insert(
        exposures,
        [
            {
                "counterparty": "Cape Components GmbH",
                "exposure_type": "PAYABLE",
                "currency": "EUR",
                "amount": 185000.0,
                "due_date": date(2026, 6, 24),
                "business_unit": "Manufacturing",
                "description": "Imported automation equipment invoice",
                "status": "OPEN",
            },
            {
                "counterparty": "Atlantic Retail Group",
                "exposure_type": "RECEIVABLE",
                "currency": "USD",
                "amount": 98000.0,
                "due_date": date(2026, 7, 3),
                "business_unit": "Export Sales",
                "description": "June export receivable",
                "status": "OPEN",
            },
            {
                "counterparty": "Mizuho Logistics",
                "exposure_type": "PAYABLE",
                "currency": "JPY",
                "amount": 42000000.0,
                "due_date": date(2026, 7, 19),
                "business_unit": "Supply Chain",
                "description": "Freight and logistics payable",
                "status": "OPEN",
            },
            {
                "counterparty": "North Sea Energy Ltd",
                "exposure_type": "PAYABLE",
                "currency": "GBP",
                "amount": 54000.0,
                "due_date": date(2026, 6, 21),
                "business_unit": "Operations",
                "description": "Quarterly energy hedge settlement",
                "status": "OPEN",
            },
            {
                "counterparty": "Zurich Insurance Partners",
                "exposure_type": "PAYABLE",
                "currency": "CHF",
                "amount": 28000.0,
                "due_date": date(2026, 8, 12),
                "business_unit": "Corporate",
                "description": "Insurance premium",
                "status": "OPEN",
            },
            {
                "counterparty": "SADC Distribution Co",
                "exposure_type": "RECEIVABLE",
                "currency": "ZAR",
                "amount": 725000.0,
                "due_date": date(2026, 6, 29),
                "business_unit": "Local Sales",
                "description": "Regional receivable",
                "status": "OPEN",
            },
            {
                "counterparty": "Toronto Mining Services",
                "exposure_type": "RECEIVABLE",
                "currency": "CAD",
                "amount": 61000.0,
                "due_date": date(2026, 7, 27),
                "business_unit": "Export Sales",
                "description": "Consulting receivable",
                "status": "OPEN",
            },
            {
                "counterparty": "Shenzhen Electronics",
                "exposure_type": "PAYABLE",
                "currency": "CNY",
                "amount": 680000.0,
                "due_date": date(2026, 7, 9),
                "business_unit": "Procurement",
                "description": "Component inventory purchase",
                "status": "OPEN",
            },
        ],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_exposures_id"), table_name="exposures")
    op.drop_table("exposures")
    exposure_status.drop(op.get_bind(), checkfirst=True)
    exposure_type.drop(op.get_bind(), checkfirst=True)
