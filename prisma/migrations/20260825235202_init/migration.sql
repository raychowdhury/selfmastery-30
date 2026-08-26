-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Phase" AS ENUM ('CONSISTENCY', 'BUILD', 'DEPTH', 'FINISH');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('GENTLE', 'BALANCED', 'CHALLENGING');

-- CreateEnum
CREATE TYPE "DayFeeling" AS ENUM ('EASY', 'GOOD', 'DIFFICULT');

-- CreateEnum
CREATE TYPE "DifficultyFeedback" AS ENUM ('TOO_EASY', 'ABOUT_RIGHT', 'TOO_DIFFICULT');

-- CreateEnum
CREATE TYPE "PreferredTime" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "AdjustmentSource" AS ENUM ('WEEKLY_REVIEW', 'USER_EDIT', 'AI_COACH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "whyItMatters" TEXT,
    "successDefinition" TEXT,
    "category" TEXT NOT NULL,
    "availableMinutes" INTEGER NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'BALANCED',
    "preferredTime" "PreferredTime" NOT NULL DEFAULT 'FLEXIBLE',
    "obstacles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "lengthDays" INTEGER NOT NULL DEFAULT 30,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pillar" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'target',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeDay" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "phase" "Phase" NOT NULL,
    "isMinimumDay" BOOLEAN NOT NULL DEFAULT false,
    "difficultyFeedback" "DifficultyFeedback",
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAction" (
    "id" TEXT NOT NULL,
    "challengeDayId" TEXT NOT NULL,
    "pillarId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 10,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "minimumVersionTitle" TEXT,
    "minimumVersionMinutes" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPriority" (
    "id" TEXT NOT NULL,
    "challengeDayId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyPriority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReflection" (
    "id" TEXT NOT NULL,
    "challengeDayId" TEXT NOT NULL,
    "dayFeeling" "DayFeeling",
    "note" TEXT,
    "whatHelped" TEXT,
    "whatGotInWay" TEXT,
    "tomorrowAdjustment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReview" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "wentWell" TEXT,
    "struggledWith" TEXT,
    "mainObstacle" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficultyFeedback" "DifficultyFeedback",
    "nextWeekChange" TEXT,
    "completionRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanAdjustment" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "source" "AdjustmentSource" NOT NULL,
    "rationale" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "appliedFromDay" INTEGER NOT NULL,
    "daysAffected" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalReflection" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "reflection" TEXT,
    "biggestChange" TEXT,
    "nextGoal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinalReflection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Challenge_userId_status_idx" ON "Challenge"("userId", "status");

-- CreateIndex
CREATE INDEX "Challenge_userId_createdAt_idx" ON "Challenge"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Pillar_challengeId_sortOrder_idx" ON "Pillar"("challengeId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Pillar_challengeId_name_key" ON "Pillar"("challengeId", "name");

-- CreateIndex
CREATE INDEX "ChallengeDay_challengeId_date_idx" ON "ChallengeDay"("challengeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeDay_challengeId_dayNumber_key" ON "ChallengeDay"("challengeId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeDay_challengeId_date_key" ON "ChallengeDay"("challengeId", "date");

-- CreateIndex
CREATE INDEX "DailyAction_challengeDayId_sortOrder_idx" ON "DailyAction"("challengeDayId", "sortOrder");

-- CreateIndex
CREATE INDEX "DailyAction_pillarId_idx" ON "DailyAction"("pillarId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPriority_challengeDayId_position_key" ON "DailyPriority"("challengeDayId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReflection_challengeDayId_key" ON "DailyReflection"("challengeDayId");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_challengeId_dayNumber_key" ON "Milestone"("challengeId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReview_challengeId_weekNumber_key" ON "WeeklyReview"("challengeId", "weekNumber");

-- CreateIndex
CREATE INDEX "PlanAdjustment_challengeId_createdAt_idx" ON "PlanAdjustment"("challengeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinalReflection_challengeId_key" ON "FinalReflection"("challengeId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pillar" ADD CONSTRAINT "Pillar_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeDay" ADD CONSTRAINT "ChallengeDay_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAction" ADD CONSTRAINT "DailyAction_challengeDayId_fkey" FOREIGN KEY ("challengeDayId") REFERENCES "ChallengeDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAction" ADD CONSTRAINT "DailyAction_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Pillar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPriority" ADD CONSTRAINT "DailyPriority_challengeDayId_fkey" FOREIGN KEY ("challengeDayId") REFERENCES "ChallengeDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReflection" ADD CONSTRAINT "DailyReflection_challengeDayId_fkey" FOREIGN KEY ("challengeDayId") REFERENCES "ChallengeDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReview" ADD CONSTRAINT "WeeklyReview_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanAdjustment" ADD CONSTRAINT "PlanAdjustment_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalReflection" ADD CONSTRAINT "FinalReflection_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
