/*
  Warnings:

  - You are about to drop the column `lastSeen` on the `RoomUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RoomUser" DROP COLUMN "lastSeen";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSeen" TEXT;
