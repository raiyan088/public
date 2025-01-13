import time
from pywinauto import Desktop
from pywinauto.keyboard import send_keys

time.sleep(3)
mDialog = Desktop()['MuMu Player 12 Setup']
mDialog.wait('visible', timeout=120)

mNext = mDialog.child_window(title='&Next >', class_name='Button')
mNext.wait('visible', timeout=15)
mNext.click()
time.sleep(1)
mInstall = mDialog.child_window(title='&Install', class_name='Button')
mInstall.wait('visible', timeout=15)
mInstall.click()
