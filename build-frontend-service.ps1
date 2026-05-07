Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$DockerRegistry = "docker.io"
$DockerUsername = "ossethio@gmail.com"
$DockerPassword = "2k/EmX*6)3Ar:?b"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "[1/3] Logging into Docker registry $DockerRegistry as $DockerUsername..."
$DockerPassword | docker login $DockerRegistry -u $DockerUsername --password-stdin

Write-Host "[2/3] Building image(s) from docker-compose.yml with no cache..."
docker compose build --no-cache

Write-Host "[3/3] Pushing image(s) defined in docker-compose.yml..."
docker compose push

Write-Host "Done: docker compose image build and push completed."
