param(
  [switch]$RenameRoot
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$oldRootName = Split-Path -Leaf $projectRoot
$parentRoot = Split-Path -Parent $projectRoot

$textRules = @(
  @{ From = "RuahNote"; To = "RuahNote" },
  @{ From = "ruahNote"; To = "ruahNote" },
  @{ From = "RUAHNOTE"; To = "RUAHNOTE" },
  @{ From = "ruahnote"; To = "ruahnote" },
  @{ From = "ruahnote"; To = "ruahnote" },
  @{ From = "ruahnote"; To = "ruahnote" },
  @{ From = "Ruah Note"; To = "Ruah Note" },
  @{ From = "ruah note"; To = "ruah note" },
  @{ From = "RUAH NOTE"; To = "RUAH NOTE" }
)

$nameRules = @(
  @{ From = "RuahNote"; To = "RuahNote" },
  @{ From = "ruahNote"; To = "ruahNote" },
  @{ From = "RUAHNOTE"; To = "RUAHNOTE" },
  @{ From = "ruahnote"; To = "ruahnote" },
  @{ From = "ruahnote"; To = "ruahnote" },
  @{ From = "ruahnote"; To = "ruahnote" },
  @{ From = "Ruah Note"; To = "Ruah Note" },
  @{ From = "ruah note"; To = "ruah note" },
  @{ From = "RUAH NOTE"; To = "RUAH NOTE" }
)

function Convert-TextValue {
  param([string]$Value)

  $result = $Value
  foreach ($rule in $textRules) {
    $result = $result.Replace($rule.From, $rule.To)
  }
  return $result
}

function Convert-NameValue {
  param([string]$Value)

  $result = $Value
  foreach ($rule in $nameRules) {
    $result = $result.Replace($rule.From, $rule.To)
  }
  return $result
}

Write-Host "RuahNote rename started..." -ForegroundColor Green

$docFiles = @()
if (Test-Path -LiteralPath (Join-Path $projectRoot "docs")) {
  $docFiles += Get-ChildItem -LiteralPath (Join-Path $projectRoot "docs") -Recurse -File -Include *.md,*.txt,*.json,*.yml,*.yaml,*.html,*.css,*.js,*.ts,*.tsx
}

$rootTextFiles = Get-ChildItem -LiteralPath $projectRoot -File -Include *.md,*.txt,*.json,*.yml,*.yaml,*.html,*.css,*.js,*.ts,*.tsx
$allTextFiles = @($docFiles + $rootTextFiles) | Sort-Object FullName -Unique

foreach ($file in $allTextFiles) {
  $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
  $updated = Convert-TextValue $content

  if ($updated -ne $content) {
    Set-Content -LiteralPath $file.FullName -Value $updated -Encoding UTF8 -NoNewline
    Write-Host "Updated text: $($file.FullName)"
  }
}

$docsPath = Join-Path $projectRoot "docs"
if (Test-Path -LiteralPath $docsPath) {
  $imageExtensions = @(".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif")
  $imageFiles = Get-ChildItem -LiteralPath $docsPath -Recurse -File |
    Where-Object { $imageExtensions -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object FullName -Descending

  foreach ($image in $imageFiles) {
    $newName = Convert-NameValue $image.Name
    if ($newName -ne $image.Name) {
      $targetPath = Join-Path $image.DirectoryName $newName

      if (Test-Path -LiteralPath $targetPath) {
        Write-Warning "Skipped image rename because target exists: $targetPath"
        continue
      }

      Rename-Item -LiteralPath $image.FullName -NewName $newName
      Write-Host "Renamed image: $($image.Name) -> $newName"
    }
  }
}

if ($RenameRoot) {
  if ($oldRootName -eq "RuahNote") {
    Write-Host "Root folder is already RuahNote."
  } else {
    Set-Location -LiteralPath $parentRoot
    $targetRoot = Join-Path $parentRoot "RuahNote"

    if (Test-Path -LiteralPath $targetRoot) {
      Write-Warning "Root folder rename skipped because target already exists: $targetRoot"
    } else {
      Rename-Item -LiteralPath $projectRoot -NewName "RuahNote"
      Write-Host "Renamed root folder: $oldRootName -> RuahNote"
    }
  }
}

Write-Host "RuahNote rename completed." -ForegroundColor Green
