param([string]$FFmpegPath = 'ffmpeg')

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$sourceVideo = Join-Path $projectRoot 'public/animate_this_icon_fit_for_load.mp4'
if (-not (Test-Path -LiteralPath $sourceVideo)) { throw 'Loader source video is missing.' }

# The supplied 1280x720 clip has a centered logo; crop its empty margins.
# Increment v1 in the asset names, AppLoader, and next.config when replacing it.
$videoFilter = 'crop=720:720,scale=256:256'
& $FFmpegPath -y -hide_banner -loglevel error -i $sourceVideo -an -vf $videoFilter -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart (Join-Path $projectRoot 'public/loader-v1.mp4')
if ($LASTEXITCODE -ne 0) { throw 'MP4 optimization failed.' }
& $FFmpegPath -y -hide_banner -loglevel error -i $sourceVideo -an -vf $videoFilter -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 (Join-Path $projectRoot 'public/loader-v1.webm')
if ($LASTEXITCODE -ne 0) { throw 'WebM optimization failed.' }
& $FFmpegPath -y -hide_banner -loglevel error -i $sourceVideo -vf $videoFilter -frames:v 1 -update 1 (Join-Path $projectRoot 'public/loader-poster.jpg')
if ($LASTEXITCODE -ne 0) { throw 'Poster creation failed.' }
