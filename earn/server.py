import os
import sys
import json
import time
import base64
import socket
import threading
import multiprocessing
from websocket import create_connection


mWorkerNumber = multiprocessing.cpu_count() - 1
mClients = []
mServer = None
mJob = None
mSolved = 0

if mWorkerNumber < 1:
    mWorkerNumber = 1

mSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

def handle_client(client):
    try:
        while True:
            try:
                global mServer
                global mSolved
                line = client.makefile().readline()
                data = base64.b64encode(line.encode('utf-8')).decode('utf-8')
                mSolved += 1
                if mServer != None:
                    mServer.send(data)

            except:
                continue
    except:
        sys.exit(0)


def sendData(msg):
    global mJob
    mJob = msg

    print('Job Received...')

    for i,client in enumerate(mClients):
        try:
            client.sendall(str(msg+'\n').encode('utf-8'))
        except:
            del mClients[i]
            continue


def handle_wss_server(client):
    try:
        while True:
            e_data = client.recv()
            data = base64.b64decode(e_data).decode('utf-8')    
            sendData(data)
            
    except:
        print('Server Connection Failed')
        time.sleep(2)
        connectServer()

def connectServer():
    try:
        global mServer
        print('Server Connecting...')
        mServer = create_connection('wss://raiyan-rx-8080.onrender.com/')
        # mServer = create_connection('ws://localhost:9099/')
        print('Server Connected')
        threading.Thread(target=handle_wss_server, args=(mServer,)).start()
    except:
        print('Server Connection Failed')
        mServer = None
        time.sleep(2)
        connectServer()

def update():
    global mSolved
    prev = 0

    while True:
        if prev != mSolved:
            print('Hash Solved: {}'.format(mSolved))
            prev = mSolved
        time.sleep(5)

def worker(worker):
    os.system(f'python {worker}')


def startWorker():
    for i in range(mWorkerNumber):
        proc = multiprocessing.Process(target=worker, args=('worker.py',))
        proc.start()


if __name__ == '__main__':

    connectServer()

    threading.Thread(target=update).start()

    try:
        mSocket.bind((socket.gethostname(), 9099))
        mSocket.listen(9099)

        startWorker()

        while True:
            mClient, mAdress = mSocket.accept()
            mClients.append(mClient)
            if mJob != None:
                mClient.sendall(str(mJob+'\n').encode('utf-8'))
            threading.Thread(target=handle_client, args=(mClient,)).start()
    except:
        sys.exit(0)