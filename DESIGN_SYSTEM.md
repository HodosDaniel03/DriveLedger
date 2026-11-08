$folder = "C:\Users\gamep\Desktop\Powerpoint"
$pptApp = New-Object -ComObject PowerPoint.Application

Get-ChildItem -Path $folder -Filter *.ppt | Where-Object { $_.Extension -eq ".ppt" } | ForEach-Object {
    $pres = $pptApp.Presentations.Open($_.FullName, $false, $false, $false)
    $newPath = [System.IO.Path]::ChangeExtension($_.FullName, ".pptx")
    $pres.SaveAs($newPath, 24) # 24 = ppSaveAsOpenXMLPresentation (.pptx formátum)
    $pres.Close()
    Write-Host "Konvertálva: $($_.Name)"
}

$pptApp.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($pptApp) | Out-Null