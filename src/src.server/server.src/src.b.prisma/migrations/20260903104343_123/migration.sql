/*
  Warnings:

  - You are about to drop the `AIChat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AIMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AIChat" DROP CONSTRAINT "AIChat_userId_fkey";

-- DropForeignKey
ALTER TABLE "AIMessage" DROP CONSTRAINT "AIMessage_chatId_fkey";

-- DropTable
DROP TABLE "AIChat";

-- DropTable
DROP TABLE "AIMessage";

-- CreateTable
CREATE TABLE "AssistantChat" (
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantChat_pkey" PRIMARY KEY ("chatId")
);

-- CreateTable
CREATE TABLE "AssistantChatMessage" (
    "messageId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantChatMessage_pkey" PRIMARY KEY ("messageId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssistantChat_userId_key" ON "AssistantChat"("userId");

-- CreateIndex
CREATE INDEX "AssistantChatMessage_chatId_createdAt_idx" ON "AssistantChatMessage"("chatId", "createdAt");

-- AddForeignKey
ALTER TABLE "AssistantChat" ADD CONSTRAINT "AssistantChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantChatMessage" ADD CONSTRAINT "AssistantChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AssistantChat"("chatId") ON DELETE CASCADE ON UPDATE CASCADE;
