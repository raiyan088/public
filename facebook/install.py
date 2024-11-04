import time
from pywinauto import Desktop
from pywinauto.keyboard import send_keys

time.sleep(1)
dialog = Desktop()['BlueStacks Installer']
dialog.wait('visible', timeout=120)
time.sleep(3)
send_keys('{TAB}')
time.sleep(1)
send_keys('{ENTER}')
time.sleep(2)
send_keys('{TAB}')
time.sleep(1)
send_keys('{TAB}')
time.sleep(1)
send_keys('{ENTER}')
