/*
  Warnings:

  - You are about to drop the `AssistantChat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AssistantChatMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AssistantChat" DROP CONSTRAINT "AssistantChat_userId_fkey";

-- DropForeignKey
ALTER TABLE "AssistantChatMessage" DROP CONSTRAINT "AssistantChatMessage_chatId_fkey";

-- DropTable
DROP TABLE "AssistantChat";

-- DropTable
DROP TABLE "AssistantChatMessage";

-- CreateTable
CREATE TABLE "AIChat" (
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "messageId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("messageId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIChat_userId_key" ON "AIChat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AIChat_chatId_key" ON "AIChat"("chatId");

-- CreateIndex
CREATE INDEX "AIMessage_chatId_createdAt_idx" ON "AIMessage"("chatId", "createdAt");

-- AddForeignKey
ALTER TABLE "AIChat" ADD CONSTRAINT "AIChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AIChat"("chatId") ON DELETE CASCADE ON UPDATE CASCADE;
