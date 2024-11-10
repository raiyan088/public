import os
import time
import subprocess

try:
    os.system("sudo apt update")
    os.system("wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb")
    os.system("dpkg --install google-chrome-stable_current_amd64.deb")
    os.system('apt install --assume-yes --fix-broken')
except:
    print("Error")
