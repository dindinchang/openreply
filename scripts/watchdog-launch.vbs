' OpenReply watchdog silent launcher (ASCII-safe path via junction)
Set sh = CreateObject("WScript.Shell")
sh.Run "cmd /c ""D:\LocalAI\openreply\watchdog-junction.bat""", 0, False
