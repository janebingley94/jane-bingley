-- CreateTable
CREATE TABLE "GithubToken" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "tokenCiphertext" TEXT NOT NULL,
    "tokenIv" TEXT NOT NULL,
    "tokenTag" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GithubToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GithubToken_isDefault_idx" ON "GithubToken"("isDefault");

