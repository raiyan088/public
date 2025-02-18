#include <string.h>
#include <iostream>
#include <unistd.h>
#include <fstream>

using namespace std;

int main()
{
	
    pid_t pids = fork();
    cout << "P-Id: " << pids << endl;
    if (pids > 0) {
        exit(0);
    } else if (pids == 0) {
      
    }
	
	int id = 0;
    
	while (true) {
		cout << "Load: " << id << endl;
        ofstream MyFile("filename.txt");
	    MyFile << id;
        MyFile.close();
		sleep(5);
        id++;
	}
	
	cout << "Close: " << id << endl;
    
    return 0;
}