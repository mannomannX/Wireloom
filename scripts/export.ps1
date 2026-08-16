<#
.SYNOPSIS
    Exports all project files and structure into a single .txt file.
.DESCRIPTION
    Traverses the Wireloom project root, excludes .claude/, dist/, .git/, and node_modules/,
    and writes file hierarchy plus all contents to a single UTF-8 text file.
.PARAMETER OutputFile
    Relative or absolute path for the output file (default: project_export.txt).
#>
[CmdletBinding()]
param (
    [string]$OutputFile = "project_export.txt"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ResolvedOutput = if ([System.IO.Path]::IsPathRooted($OutputFile)) {
    $OutputFile
} else {
    Join-Path $ProjectRoot $OutputFile
}

$DefaultExcludes = @('.claude', 'dist', '.git', 'node_modules')
$BinaryExtensions = @('.jpg', '.jpeg', '.png', '.gif', '.ico', '.webp', '.pdf', '.zip', '.tar', '.gz', '.7z', '.woff', '.woff2', '.ttf', '.eot', '.exe', '.bin', '.dll')

Write-Host "Scanning project at: $ProjectRoot"
Write-Host "Excluding directories: $($DefaultExcludes -join ', ')"

# Collect all files recursively
$AllFiles = Get-ChildItem -Path $ProjectRoot -Recurse -File | Where-Object {
    $item = $_
    $relPath = $item.FullName.Substring($ProjectRoot.Length).TrimStart('\', '/')
    $parts = $relPath.Split([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)

    $isExcluded = $false
    foreach ($part in $parts) {
        if ($DefaultExcludes -contains $part) {
            $isExcluded = $true
            break
        }
    }

    (-not $isExcluded) -and ($item.FullName -ne $ResolvedOutput)
} | Sort-Object FullName

Write-Host "Found $($AllFiles.Count) included files."

$Separator = "=" * 80
$SubSeparator = "-" * 80

$Utf8Encoding = [System.Text.UTF8Encoding]::new($false)
$Writer = [System.IO.StreamWriter]::new($ResolvedOutput, $false, $Utf8Encoding)

try {
    # Header
    $Writer.WriteLine($Separator)
    $Writer.WriteLine("PROJECT EXPORT: Wireloom")
    $Writer.WriteLine("Generated at: " + [System.DateTime]::UtcNow.ToString("o"))
    $Writer.WriteLine("Root directory: " + $ProjectRoot)
    $Writer.WriteLine("Excluded patterns: " + ($DefaultExcludes -join ", "))
    $Writer.WriteLine("Total included files: " + $AllFiles.Count)
    $Writer.WriteLine($Separator)
    $Writer.WriteLine()

    # Directory Structure
    $Writer.WriteLine("DIRECTORY STRUCTURE OVERVIEW:")
    $Writer.WriteLine($SubSeparator)
    foreach ($file in $AllFiles) {
        $rel = $file.FullName.Substring($ProjectRoot.Length).TrimStart('\', '/').Replace('\', '/')
        $Writer.WriteLine("|-- " + $rel)
    }
    $Writer.WriteLine()

    # File Contents
    $Writer.WriteLine($Separator)
    $Writer.WriteLine("FILE CONTENTS")
    $Writer.WriteLine($Separator)
    $Writer.WriteLine()

    foreach ($file in $AllFiles) {
        $relPath = $file.FullName.Substring($ProjectRoot.Length).TrimStart('\', '/').Replace('\', '/')
        $size = $file.Length
        $ext = $file.Extension.ToLower()

        $Writer.WriteLine($Separator)
        $Writer.WriteLine("FILE: " + $relPath + " (" + $size + " bytes)")
        $Writer.WriteLine($Separator)

        if ($BinaryExtensions -contains $ext) {
            $Writer.WriteLine("[Binary file skipped: " + $size + " bytes]")
            $Writer.WriteLine()
        } else {
            try {
                $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
                $Writer.WriteLine($content)
                if (-not $content.EndsWith("`n")) {
                    $Writer.WriteLine()
                }
            } catch {
                $Writer.WriteLine("[Error reading file: " + $_ + "]")
                $Writer.WriteLine()
            }
        }
    }
} finally {
    $Writer.Dispose()
}

$outStat = Get-Item $ResolvedOutput
$outSizeKb = [math]::Round($outStat.Length / 1KB, 2)
Write-Host "Successfully exported $($AllFiles.Count) files."
Write-Host "Output written to: $ResolvedOutput ($outSizeKb KB)"
