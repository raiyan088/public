import os

try:
    os.system("sudo dpkg --install chrome-remote-desktop_current_amd64.deb")
except:
    print("Error")
