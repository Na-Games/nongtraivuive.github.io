param([string]$Workspace)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$taskRoot=if($Workspace){(Resolve-Path -LiteralPath $Workspace).Path}else{(Resolve-Path (Join-Path $PSScriptRoot '..')).Path}
$outputDir=Join-Path $taskRoot 'output'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
$archive=Join-Path $outputDir 'Xom-Nong-Trai-PNG.zip'
if(Test-Path -LiteralPath $archive){Remove-Item -LiteralPath $archive}
$zip=[IO.Compression.ZipFile]::Open($archive,[IO.Compression.ZipArchiveMode]::Create)
try {
  foreach($name in @('index.html','thu-vien-anh.html','chuyen-dong.html','style.css','art.css','fishing.css','responsive.css','diorama.css','village.css','progression.js','farming.js','village.js','preferences.js','fishing-core.js','fishing.js','data.js','catalog.js','expanded-catalog.js','decor.js','art.js','wardrobe.js','motion.js','game.js','world.js','ui.js','manifest.webmanifest','README.md')){[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,(Join-Path $taskRoot $name),$name) | Out-Null}
  foreach($file in Get-ChildItem -LiteralPath (Join-Path $taskRoot 'assets') -File -Recurse){$relative=$file.FullName.Substring($taskRoot.Length+1).Replace([IO.Path]::DirectorySeparatorChar,[char]'/');if($relative -like 'assets/diorama/source/*' -or $relative -like 'assets/source/*' -or $relative -like 'assets/motion/source/*'){continue};[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$file.FullName,$relative) | Out-Null}
  foreach($name in @('docs/PHAN-TICH-VA-TICH-HOP.md','docs/CHUYEN-DONG.md','docs/image-prompts.json','docs/motion-prompts.json','docs/motion-sources.json','docs/motion-validation.json','docs/motion-logic-report.json','docs/asset-validation.json','docs/verification/browser-report.json','docs/verification/farm-desktop.png','docs/verification/shop-mobile.png','tools/build-assets.mjs','tools/build-motion.mjs','tools/png-codec.mjs','tools/test-motion.mjs','tools/verify-game.mjs','tools/package-game.ps1')){[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,(Join-Path $taskRoot $name),$name) | Out-Null}
  foreach($name in @('docs/verification/chuyen-dong.webm','docs/verification/motion-preview.png')){[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,(Join-Path $taskRoot $name),$name) | Out-Null}
  foreach($name in @('docs/CAU-CA-VA-CAI-DAT.md','docs/fishing-logic-report.json','docs/verification/fishing-browser-report.json','docs/verification/local-file-report.json','tools/test-fishing.mjs','tools/verify-fishing.mjs','tools/verify-local-file.mjs','tools/build-fishing-rigs.mjs')){[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,(Join-Path $taskRoot $name),$name) | Out-Null}
  foreach($file in Get-ChildItem -LiteralPath (Join-Path $taskRoot 'docs/verification') -File | Where-Object {$_.Name -like 'fishing-*.png' -or $_.Name -like 'settings-vibration-*.png'}){$relative='docs/verification/'+$file.Name;[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$file.FullName,$relative) | Out-Null}
}finally{$zip.Dispose()}
$check=[IO.Compression.ZipFile]::OpenRead($archive)
try {
 $sprites=@($check.Entries | Where-Object { $_.FullName -like 'assets/sprites/*.png' -or $_.FullName -like 'assets/motion/sprites/*.png' })
 $manifest=Get-Content -LiteralPath (Join-Path $taskRoot 'assets/manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
 $motion=Get-Content -LiteralPath (Join-Path $taskRoot 'assets/motion/manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
 $expected=@($manifest.sprites.PSObject.Properties).Count+@($motion.frames.PSObject.Properties).Count+1
 if($sprites.Count -ne $expected){throw "Archive sprite count mismatch: $($sprites.Count)/$expected"}
 [PSCustomObject]@{Archive=$archive;Entries=$check.Entries.Count;Sprites=$sprites.Count;SizeMB=[math]::Round((Get-Item -LiteralPath $archive).Length/1MB,2)}
}finally{$check.Dispose()}
