-- Store compartilhado de quota da Sara. Sem conteúdo de conversa ou IP bruto.
CREATE TABLE "SdrUsageBucket" (
    "subjectHash" TEXT NOT NULL,
    "subjectKind" TEXT NOT NULL,
    "windowKind" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "tokenCount" BIGINT NOT NULL DEFAULT 0,
    "costUsd" DECIMAL(14,8) NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SdrUsageBucket_pkey" PRIMARY KEY ("subjectHash", "subjectKind", "windowKind", "windowStart"),
    CONSTRAINT "SdrUsageBucket_subject_kind" CHECK ("subjectKind" IN ('session', 'ip', 'global')),
    CONSTRAINT "SdrUsageBucket_window_kind" CHECK ("windowKind" IN ('minute', 'day', 'month')),
    CONSTRAINT "SdrUsageBucket_nonnegative" CHECK ("requestCount" >= 0 AND "tokenCount" >= 0 AND "costUsd" >= 0)
);

CREATE INDEX "SdrUsageBucket_expiresAt_idx" ON "SdrUsageBucket"("expiresAt");
