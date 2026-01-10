#include "mockapi.h"

int helloint() {
	return 123;
}

int helloinc(int v) {
	return v+1;
}

void hellovoid() {

}

std::string concat(std::string a, std::string b) {
	return a+b;
}
