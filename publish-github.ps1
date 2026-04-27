# 一键：在已登录 gh 的前提下创建 GitHub 仓库并推送 main
# 用法：
#   1) 在「本机 PowerShell 或 Cursor 终端」执行：gh auth login --web
#   2) 浏览器完成授权后，在本脚本所在目录执行：.\publish-github.ps1
# 若要改仓库名，编辑下方 $RepoName

$ErrorActionPreference = 'Stop'
$RepoName = 'chenjie-hongbei'  # 可改成你想要的英文仓库名

$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
Set-Location $PSScriptRoot

gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host '尚未登录 GitHub。请先在本终端执行：gh auth login --web' -ForegroundColor Yellow
  Write-Host '完成浏览器授权后，再运行：.\publish-github.ps1' -ForegroundColor Yellow
  exit 1
}

$hasOrigin = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "已存在 remote origin: $hasOrigin" -ForegroundColor Cyan
  git push -u origin main
  exit $LASTEXITCODE
}

Write-Host "创建仓库 $RepoName 并推送..." -ForegroundColor Cyan
gh repo create $RepoName --public --source=. --remote=origin --push --description '陈姐烘焙 / 小推 AI 广告助手（Next.js）'
