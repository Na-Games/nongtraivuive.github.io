param([string]$Workspace)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskRoot=if($Workspace){(Resolve-Path -LiteralPath $Workspace).Path}else{(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path}
$outputDir=Join-Path $taskRoot 'output'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
$archive=Join-Path $outputDir 'Xom-Nong-Trai-PNG.zip'
if(Test-Path -LiteralPath $archive){Remove-Item -LiteralPath $archive -Force}
$zip=[IO.Compression.ZipFile]::Open($archive,[IO.Compression.ZipArchiveMode]::Create)
try {
  $runtimeFiles=@(Get-ChildItem -LiteralPath $taskRoot -File | Where-Object {$_.Extension -in @('.html','.js','.css','.webmanifest') -or $_.Name -eq 'README.md'})
  $runtimeFiles+=@(Get-ChildItem -LiteralPath (Join-Path $taskRoot 'assets') -File -Recurse | Where-Object {$_.FullName -notlike '*\source\*'})
  $runtimeFiles+=@(Get-Item -LiteralPath (Join-Path $taskRoot 'docs/DIORAMA-VA-CAP-200.md'))
  foreach($guide in @('docs/FARM-3D.md','docs/farm-3d-art.json','docs/PLAYABILITY-REVISION.md','docs/playability-art.json','docs/ACTORS-V3.md','docs/actors-v3-art.json','docs/COUNTRYSIDE-V4.md','docs/ILLUSTRATED-ACTORS.md','docs/illustrated-art-prompts.json')){if(Test-Path -LiteralPath (Join-Path $taskRoot $guide)){$runtimeFiles+=@(Get-Item -LiteralPath (Join-Path $taskRoot $guide))}}
  $localServer=Join-Path $taskRoot 'tools/serve-game.mjs'
  if(Test-Path -LiteralPath $localServer){$runtimeFiles+=@(Get-Item -LiteralPath $localServer)}
  foreach($file in $runtimeFiles){$relative=$file.FullName.Substring($taskRoot.Length+1).Replace('\','/');[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$file.FullName,$relative) | Out-Null}
}finally{$zip.Dispose()}
$check=[IO.Compression.ZipFile]::OpenRead($archive)
try {
  foreach($name in @('assets/manifest.json','assets/motion/manifest.json')){
    $manifest=Get-Content -LiteralPath (Join-Path $taskRoot $name) -Raw -Encoding UTF8 | ConvertFrom-Json
    $collection=if($manifest.sprites){$manifest.sprites}else{$manifest.frames}
    foreach($sprite in $collection.PSObject.Properties){if(-not $check.GetEntry($sprite.Value.file)){throw "Missing packaged sprite: $($sprite.Value.file)"}}
  }
  [PSCustomObject]@{Archive=$archive;Entries=$check.Entries.Count;SizeMB=[math]::Round((Get-Item -LiteralPath $archive).Length/1MB,2)}
}finally{$check.Dispose()}
