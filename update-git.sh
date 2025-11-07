#!/bin/bash

# Script para atualizar o repositório Git do projeto Aprovações Unificadas
# Uso: ./update-git.sh "mensagem do commit"

echo "🚀 Iniciando atualização do repositório Git..."

# Verificar se há mudanças
if [ -z "$(git status --porcelain)" ]; then
  echo "✅ Nenhuma mudança detectada."
  exit 0
fi

# Adicionar todos os arquivos modificados
echo "📝 Adicionando arquivos modificados..."
git add .

# Verificar se foi fornecida uma mensagem de commit
if [ -z "$1" ]; then
  echo "❌ Erro: Forneça uma mensagem de commit."
  echo "Uso: $0 \"sua mensagem de commit\""
  exit 1
fi

# Fazer commit
echo "💾 Fazendo commit: $1"
git commit -m "$1"

# Push para o repositório remoto
echo "⬆️ Enviando para GitHub..."
git push origin main

echo "✅ Atualização concluída com sucesso!"
echo "🔗 Repositório: https://github.com/digital-oncoclinicas/Fluig-AprovacoesUnificadas"