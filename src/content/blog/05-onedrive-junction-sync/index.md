---
title: "I Hacked OneDrive With Junction Links to Sync My PCs"
summary: "Before OneDrive had folder backup, I used Windows junction links and batch scripts to keep my work and home PCs in sync. Here's how it worked."
date: "Apr 15 2026"
tags:
  - Windows
  - Scripting
  - Cloud Sync
draft: false
---

## The Problem

Around 2016, I had two Windows PCs — one at work, one at home. I wanted my project folders synced between them so I could pick up where I left off on either machine. Straightforward, right?

Not really. OneDrive at the time only synced its own folder (`C:\Users\you\OneDrive\`). You couldn't tell it "hey, also sync `D:\Projects\`" — it just wasn't a feature yet. Moving everything into the OneDrive folder wasn't practical either, since some apps expected files in specific locations.

I needed OneDrive to sync folders that lived *outside* of OneDrive.

## The Hack: Junction Links

Windows has a feature called **junction links** (`mklink /J`) — they're like symbolic links but for directories. The key insight: OneDrive doesn't know the difference between a real folder and a junction. If you create a junction inside your OneDrive folder that points to `D:\Projects\MyApp`, OneDrive happily syncs the contents as if they were native OneDrive files.

The setup on my work PC:

```bat
cd C:\Users\ming.z\OneDrive
mklink /J ProjectFolder C:\Users\ming.z\projects\ProjectFolder
```

And on my home PC, the reverse — a junction from OneDrive into wherever I wanted the files to live:

```bat
cd C:\Users\mingz\OneDrive
mklink /J FolderName P:\FolderName
```

That's it. Both machines now had the same files, synced through OneDrive, while the actual folders stayed wherever each machine needed them.

## The Force-Sync Scripts

OneDrive in 2016 was... temperamental. It would randomly stop syncing, get stuck on conflicts, or just sit there with the "processing changes" spinner forever. My fix was brute force: kill OneDrive and restart it.

Here's the batch script version:

```bat
@echo off
taskkill /f /im "Onedrive.exe"
timeout /t 2
if exist "C:\Program Files (x86)\Microsoft OneDrive\OneDrive.exe" (
    Call "C:\Program Files (x86)\Microsoft OneDrive\OneDrive.exe"
) else if exist "%USERPROFILE%\AppData\Local\Microsoft\OneDrive\OneDrive.exe" (
    Call "%USERPROFILE%\AppData\Local\Microsoft\OneDrive\OneDrive.exe"
)
timeout /t 5
exit 0
```

And the VBScript version, which added the `-p1 -c` flags to force an immediate sync cycle:

```vbs
Dim oShell : Set oShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

oShell.Run "taskkill /f /im OneDrive.exe", , True

If (fso.FileExists("C:\Program Files (x86)\Microsoft OneDrive\OneDrive.exe")) Then
  oShell.Run """C:\Program Files (x86)\Microsoft OneDrive\OneDrive.exe"" -p1 -c"
ElseIf (fso.FileExists("%USERPROFILE%\AppData\Local\Microsoft\OneDrive\OneDrive.exe")) Then
  oShell.Run """%USERPROFILE%\AppData\Local\Microsoft\OneDrive\OneDrive.exe"" -p1 -c"
End If
```

I also had a silent launcher (`run.vbs`) that ran the batch file without popping up a command prompt window — useful for scheduling it with Windows Task Scheduler so it ran automatically every few hours:

```vbs
Set oShell = CreateObject("Wscript.Shell")
oShell.Run "cmd /c OneDrive.bat", 0, false
```

The whole system: junction links to trick OneDrive into syncing arbitrary folders, plus a scheduled kill-and-restart to keep it from freezing. Hacky? Absolutely. But it worked every day for years.

## How It's Solved Now (2026)

Microsoft eventually caught up. Here's what makes all of this unnecessary today:

**OneDrive Folder Backup** (added ~2019) — You can now tell OneDrive to back up your Desktop, Documents, and Pictures folders natively. No junctions needed for those.

**Known Folder Move** — Organizations can push folder redirection via Group Policy, so your Documents folder *is* your OneDrive folder transparently.

**Files On-Demand** — Files show up in Explorer but only download when you open them. Saves disk space and means your entire OneDrive is "synced" without actually copying everything.

**OneDrive for Mac/Linux** — Back then, OneDrive barely worked on Windows. Now it runs on macOS, and there are third-party clients for Linux.

**Cross-platform alternatives** — If you're not in the Microsoft ecosystem, Syncthing (open-source, peer-to-peer), Resilio Sync, or even `rsync` over SSH can handle the same use case without any cloud dependency.

If I were solving this same problem today, I wouldn't write a single script. I'd just turn on OneDrive folder backup and call it a day.

## Why I'm Sharing This

Not because anyone needs these scripts in 2026 — they don't. But I keep these old files around because they remind me that the best solutions often come from understanding the tools well enough to misuse them creatively. Junction links weren't designed for cloud sync. But they worked.

The instinct to look at a limitation and think "OK, but what if I just..." — that's the same instinct behind every side project and every hack that eventually becomes a real feature. Microsoft literally built the feature I hacked together. That feels like validation.

Found some old scripts in your codebase that make you laugh? Keep them. They're proof you were solving problems before the tools caught up.
