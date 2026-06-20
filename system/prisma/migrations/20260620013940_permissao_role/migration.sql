-- CreateTable
CREATE TABLE "PermissaoRole" (
    "role" "Role" NOT NULL,
    "podeAvancarPara" TEXT[],

    CONSTRAINT "PermissaoRole_pkey" PRIMARY KEY ("role")
);
