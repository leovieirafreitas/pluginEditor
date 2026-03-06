#!/bin/bash
# ══════════════════════════════════════════════════════════
#   EditLab Pro — Instalador para DaVinci Resolve (macOS)
# ══════════════════════════════════════════════════════════

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       EditLab Pro — Instalador DaVinci Resolve (Mac)     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─────────────────────────────────────────────
# VERIFICA NODE.JS
# ─────────────────────────────────────────────
echo "[1/4] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo ""
    echo "[ERRO] Node.js NAO encontrado!"
    echo ""
    echo "Por favor, instale o Node.js antes de continuar:"
    echo "  https://nodejs.org  (escolha a versao LTS)"
    echo ""
    echo "Ou instale via Homebrew:"
    echo "  brew install node"
    echo ""
    read -p "Pressione Enter para sair..."
    exit 1
fi
NODE_VER=$(node -v)
echo "[OK] Node.js $NODE_VER encontrado!"

# ─────────────────────────────────────────────
# DEFINE CAMINHOS
# ─────────────────────────────────────────────
PLUGIN_ID="com.editormaster.premium.v1"
DEST="$HOME/Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins/$PLUGIN_ID"
SOURCE="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "[2/4] Instalando plugin na pasta do DaVinci Resolve..."
echo "      Destino: $DEST"
echo ""

# Cria pasta de destino
mkdir -p "$DEST"
if [ $? -ne 0 ]; then
    echo "[ERRO] Nao foi possivel criar a pasta de instalacao."
    echo "Verifique se o DaVinci Resolve esta instalado corretamente."
    read -p "Pressione Enter para sair..."
    exit 1
fi

# Copia todos os arquivos (exceto dist e node_modules gerados)
rsync -a --exclude='dist/' --exclude='node_modules/' --exclude='Instalar_Plugin.bat' "$SOURCE/" "$DEST/"
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao copiar os arquivos do plugin."
    read -p "Pressione Enter para sair..."
    exit 1
fi

echo "[OK] Arquivos copiados com sucesso!"

# ─────────────────────────────────────────────
# INSTALA DEPENDÊNCIAS
# ─────────────────────────────────────────────
echo ""
echo "[3/4] Instalando dependencias (pode demorar 1-2 minutos)..."
cd "$DEST"
npm install --production --silent
echo "[OK] Dependencias instaladas!"

# ─────────────────────────────────────────────
# PERMISSÃO AO ARQUIVO .node
# ─────────────────────────────────────────────
echo ""
echo "[4/4] Ajustando permissoes..."
chmod +x "$DEST/WorkflowIntegration.node"
xattr -cr "$DEST/" 2>/dev/null  # Remove quarentena do macOS (Gatekeeper)
echo "[OK] Permissoes ajustadas!"

# ─────────────────────────────────────────────
# CONCLUÍDO
# ─────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              INSTALACAO CONCLUIDA!                       ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  Como usar:                                             ║"
echo "║  1. Abra o DaVinci Resolve                              ║"
echo "║  2. Va em:  Workspace > Workflow Integrations           ║"
echo "║  3. Clique em: EditLab Pro                              ║"
echo "║  4. Faca login com seu usuario e senha                  ║"
echo "║  5. Pesquise e importe seus clips!                      ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
read -p "Pressione Enter para fechar..."
