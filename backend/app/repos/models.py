from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    uid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    s3_key: Mapped[str] = mapped_column(String(1024))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    user: Mapped[User] = relationship()


class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    job_uuid: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"))
    status: Mapped[str] = mapped_column(String(32), index=True, default="PENDING")
    meta: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    user: Mapped[User] = relationship()
    document: Mapped[Document] = relationship()


class Result(Base):
    __tablename__ = "results"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"))
    probability: Mapped[Optional[float]] = mapped_column(nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    feature_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    latency_ms: Mapped[Optional[int]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    job: Mapped[Job] = relationship()


