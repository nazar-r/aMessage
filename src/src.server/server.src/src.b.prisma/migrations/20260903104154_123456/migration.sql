-- CreateTable
CREATE TABLE "AIChat" (
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIChat_pkey" PRIMARY KEY ("chatId")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "messageId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("messageId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIChat_userId_key" ON "AIChat"("userId");

-- CreateIndex
CREATE INDEX "AIMessage_chatId_createdAt_idx" ON "AIMessage"("chatId", "createdAt");

-- AddForeignKey
ALTER TABLE "AIChat" ADD CONSTRAINT "AIChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AIChat"("chatId") ON DELETE CASCADE ON UPDATE CASCADE;
