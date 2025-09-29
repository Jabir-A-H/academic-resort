@echo off
setlocal enabledelayedexpansion

REM Prompt for batch number (e.g., 33)
set /p batchnum=Enter batch number (e.g., 28):

REM Prompt for batch suffix (e.g., rd, th, st)
set /p batchsuffix=Enter batch suffix (e.g., st, nd, rd, th):

REM Build batch name
set batchname=%batchnum%%batchsuffix% Batch

REM Set template and new file names
set template=batch-template.json
set newfile=batch-%batchnum%.json

REM Copy template to new file
copy "%template%" "%newfile%" >nul

REM Update batch_name in new file
REM This uses PowerShell for in-place editing
powershell -Command "(Get-Content '%newfile%') -replace '\"batch_name\": \".*\"', '\"batch_name\": \"%batchname%\"' | Set-Content '%newfile%'"

REM Update index.json to include the new batch file (newest first)
powershell -Command "$index = Get-Content 'index.json' | ConvertFrom-Json; if ($index.batches -notcontains '%newfile%') { $index.batches += '%newfile%'; $index.batches = $index.batches | Sort-Object { [int]($_ -replace 'batch-|\.json', '') } -Descending; $index.last_updated = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ssZ'); $index | ConvertTo-Json | Set-Content 'index.json' }"

echo New batch file created: %newfile%
echo Batch name set to: %batchname%
echo Index.json updated automatically
pause