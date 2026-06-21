-- CreateTable
CREATE TABLE "PermissaoUsuario" (
    "usuarioId" TEXT NOT NULL,
    "podeAvancarPara" TEXT[],
    "rotasPermitidas" TEXT[],

    CONSTRAINT "PermissaoUsuario_pkey" PRIMARY KEY ("usuarioId")
);

-- AddForeignKey
ALTER TABLE "PermissaoUsuario" ADD CONSTRAINT "PermissaoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
