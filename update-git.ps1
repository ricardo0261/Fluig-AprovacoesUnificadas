# Script PowerShell para atualizar o repositório Git do projeto Aprovações Unificadas
# Uso: .\update-git.ps1 "mensagem do commit"

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "🚀 Iniciando atualização do repositório Git..." -ForegroundColor Green

# Verificar se há mudanças
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "✅ Nenhuma mudança detectada." -ForegroundColor Yellow
    exit 0
}

# Adicionar todos os arquivos modificados
Write-Host "📝 Adicionando arquivos modificados..." -ForegroundColor Cyan
git add .

# Fazer commit
Write-Host "💾 Fazendo commit: $CommitMessage" -ForegroundColor Cyan
git commit -m $CommitMessage

# Push para o repositório remoto
Write-Host "⬆️ Enviando para GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Atualização concluída com sucesso!" -ForegroundColor Green
    Write-Host "🔗 Repositório: https://github.com/digital-oncoclinicas/Fluig-AprovacoesUnificadas" -ForegroundColor Blue
} else {
    Write-Host "❌ Erro durante a atualização!" -ForegroundColor Red
    exit 1
}