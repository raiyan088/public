import time
from javascript import require
from multiprocessing import Process, Queue
import concurrent.futures

WorkerNumber = 1

Module = require('./worker_cn.js')


def worker(name):
    print('Start:', name)
    started = time.time()*1000
    hash_count = 0
    
    while True:
        hash = Module.cwrap("hash_cn", "string", ["string", "number", "number", "number"])

        hash_count += 1
        elapsed = int(time.time()*1000 - started)
        if elapsed > 2000:
            print('{}: Hashrate: {} H/s'.format(name, int(hash_count/2)))
            started = time.time()*1000
            hash_count = 0

if __name__ == "__main__":

    # for id in range(WorkerNumber):
    #     proc = Process(target=worker, args=("Worker_{}".format(id+1),))
    #     proc.start()
        
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:

        output = []
        loop = WorkerNumber

        future_to_url = { executor.submit(worker, "Worker_{}".format(id+1)) : id for id in range(WorkerNumber) }
        for future in concurrent.futures.as_completed(future_to_url):
            try:
                output.append(future.result())
            except:
                print('error')
                loop -= 1
            else:
                if len(output) == loop:
                    print('Completed')

