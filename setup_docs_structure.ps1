# RuahNote v1.0 docs 구조 생성 스크립트
# 사용 위치: ruah-note 프로젝트 루트에서 실행
# 실행 예:
# powershell -ExecutionPolicy Bypass -File .\setup_docs_structure.ps1

$ErrorActionPreference = "Stop"

$folders = @(
  "docs\01_기획",
  "docs\02_개발가이드",
  "docs\03_설계",
  "docs\04_DB",
  "docs\05_API",
  "docs\06_UI",
  "docs\07_회의록",
  "docs\08_릴리즈노트",
  "docs\09_운영",
  "docs\99_templates",
  "docs\assets\logo",
  "docs\assets\ui",
  "docs\assets\wireframe",
  "docs\assets\db",
  "docs\assets\screenshots"
)

foreach ($folder in $folders) {
  New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

Write-Host "RuahNote docs folder structure created." -ForegroundColor Green
