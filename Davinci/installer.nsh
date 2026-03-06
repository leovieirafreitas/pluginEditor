; installer.nsh — Ações extras durante instalação do EditLab Pro

!macro customInstall
  ; Habilitar Workflow Integration no DaVinci Resolve via registro do Windows
  DetailPrint "Configurando integração com DaVinci Resolve..."

  ; Chave do DaVinci Resolve para Workflow Integration
  WriteRegDWORD HKCU "Software\Blackmagic Design\DaVinci Resolve\Preferences" "EnableWorkflowIntegration" 1

  ; Criar atalho na área de trabalho (complementar ao electron-builder)
  DetailPrint "Criando atalho na Área de Trabalho..."

  DetailPrint "Instalação do EditLab Pro concluída com sucesso!"
!macroend

!macro customUnInstall
  ; Limpeza ao desinstalar
  DeleteRegValue HKCU "Software\Blackmagic Design\DaVinci Resolve\Preferences" "EnableWorkflowIntegration"
!macroend
